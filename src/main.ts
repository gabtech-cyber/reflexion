import { buildChamber } from './chamber/buildChamber';
import { emitOne, speedFor } from './chamber/IonSource';
import { applyPreset, type PresetId } from './chamber/Presets';
import {
  FIELD_DECAY_FACTOR,
  PAUL_R0_FACTOR,
  Q_E,
  SPECIES,
  createInitialState,
} from './core/Constants';
import type { ChamberId, Electrode } from './core/Types';
import { ParticlePool, type PoolStep } from './physics/ParticlePool';
import { CanvasRenderer, type ChamberVisualData } from './render/CanvasRenderer';
import './style.css';
import { Controls, type SimControlState as UiState, type UiScale } from './ui/Controls';
import { InfoModal } from './ui/InfoModal';
import { getTranslations, setLanguage, type Language } from './ui/i18n';

const viewportHost = document.querySelector<HTMLElement>('#viewport');
const controlsHost = document.querySelector<HTMLElement>('#controls');
const appElement = document.querySelector<HTMLElement>('#app');
if (!viewportHost || !controlsHost || !appElement) {
  throw new Error('Markup-ul aplicației lipsește.');
}

const canvas = document.createElement('canvas');
viewportHost.appendChild(canvas);
const renderer = new CanvasRenderer(canvas);

const state = createInitialState();
const pool = new ParticlePool();
let electrodes: Electrode[] = [];
let emitAcc = 0;
let physicsTime = 0;
let lastFrame = performance.now();
let appliedShape: UiState['chamberShape'] = 'box';
let appliedSpecies: UiState['ionSpecies'] = 'dust';
let isUiVisible = true; // Zen / Presentation Mode toggle cu [H]

let controls: Controls | null = null;

// Citire limbă și scală UI din localStorage
const initialLang = (localStorage.getItem('reflexion_language') as Language) || 'ro';
const validLang: Language = initialLang === 'en' ? 'en' : 'ro';
setLanguage(validLang);
document.documentElement.lang = validLang;

const initialScale = (localStorage.getItem('reflexion_ui_scale') as UiScale) || 'standard';
const validScale: UiScale =
  initialScale === 'compact' || initialScale === 'large' ? initialScale : 'standard';

const infoModal = new InfoModal(validLang);

const ui: UiState = {
  language: validLang,
  preset: 'custom',
  uiScale: validScale,
  chamberShape: 'box',
  ionSpecies: 'dust',
  gravity: state.gravity,
  wallVoltage: 200,
  magneticBz: state.magneticField,
  rfAmplitude: state.rfAmplitude,
  decayAlpha: 0.16,
  paused: false,
  emissionRate: state.emissionRate,
  beamEnergyEv: 40,
  spaceChargeEnabled: true,
  softeningMm: 0.5,
  thermalJitter: 0.05,
  showFieldGrid: false,
  onScreenshot: () => renderer.exportScreenshot(),
  onOpenGuide: () => infoModal.open(),
  onLanguageChange: (lang: Language) => {
    localStorage.setItem('reflexion_language', lang);
    document.documentElement.lang = lang;
  },
  onPresetChange: (pid: PresetId) => {
    applyPreset(pid, ui, pool, state.chamberSizeM);
    controls?.refresh();
  },
  onClear: () => {
    pool.clear();
    emitAcc = 0;
  },
  onReset: () => {
    pool.clear();
    emitAcc = 0;
    physicsTime = 0;
    ui.preset = 'custom';
    ui.chamberShape = 'box';
    ui.ionSpecies = 'dust';
    ui.gravity = 9.8;
    ui.wallVoltage = 200;
    ui.magneticBz = 0;
    ui.rfAmplitude = 150;
    ui.decayAlpha = 0.16;
    ui.paused = false;
    ui.emissionRate = 70;
    ui.beamEnergyEv = 40;
    ui.spaceChargeEnabled = true;
    ui.softeningMm = 0.5;
    ui.thermalJitter = 0.05;
    ui.showFieldGrid = false;
    ui.uiScale = 'standard';
    localStorage.setItem('reflexion_ui_scale', 'standard');
    controls?.applyScale('standard');
    controls?.refresh();
  },
};

controls = new Controls(ui, 'controls');

function chamberIdOf(shape: UiState['chamberShape']): ChamberId {
  if (shape === 'paulTrap') return 'paul-trap';
  return shape;
}

function rebuildChamber(): void {
  electrodes = buildChamber(state.chamberId, state.chamberSizeM);
}

function applyWallVoltage(): void {
  for (let i = 0; i < electrodes.length; i++) {
    if (electrodes[i].kind === 'wall') electrodes[i].voltage = ui.wallVoltage;
  }
}

function syncFromUi(): void {
  state.gravity = ui.gravity;
  state.magneticField = ui.magneticBz;
  state.emissionRate = ui.emissionRate;
  state.energyEv = ui.beamEnergyEv;
  state.rfAmplitude = ui.rfAmplitude;
  state.paused = ui.paused;
  renderer.setDecay(ui.decayAlpha);

  const nextSpecies = ui.ionSpecies === 'argon' ? 'ar-ion' : 'dust';
  if (ui.ionSpecies !== appliedSpecies) {
    appliedSpecies = ui.ionSpecies;
    state.speciesId = nextSpecies;
    state.rfFrequencyHz = SPECIES[nextSpecies].rfFrequencyDefault;
  }

  if (ui.chamberShape !== appliedShape) {
    appliedShape = ui.chamberShape;
    state.chamberId = chamberIdOf(ui.chamberShape);
    state.emitterOrigin = state.chamberId === 'paul-trap' ? 'center' : 'left';
    rebuildChamber();
  }

  applyWallVoltage();
}

function toVisual(list: readonly Electrode[], size: number): ChamberVisualData {
  const rods = list.filter((electrode) => electrode.kind === 'rod');
  return {
    halfWidth: size / 2,
    halfHeight: size / 2,
    electrodes: list
      .filter((electrode) => electrode.kind === 'wall')
      .map((electrode) => ({
        id: electrode.id,
        x1: electrode.x1,
        y1: electrode.y1,
        x2: electrode.x2,
        y2: electrode.y2,
        voltage: electrode.voltage,
      })),
    rods: rods.length
      ? rods.map((electrode) => ({
          x: electrode.x1,
          y: electrode.y1,
          r: electrode.radius,
          phase: electrode.rfPhase,
        }))
      : undefined,
  };
}

function substepCount(frameDt: number): { physicsDt: number; substeps: number } {
  const species = SPECIES[state.speciesId];
  if (!species.realtime) {
    return { physicsDt: species.physicsDtPerFrame, substeps: species.substeps };
  }
  const substeps = Math.min(240, Math.max(1, Math.round(frameDt / species.substepDt)));
  return { physicsDt: frameDt, substeps };
}

rebuildChamber();
applyWallVoltage();

// --- Interacțiune cu mouse-ul (Tun de ioni direcționat) ---
let isPointerDown = false;
let pointerWorld = { x: 0, y: 0 };

function getPointerWorld(clientX: number, clientY: number): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const px = (clientX - rect.left) * dpr;
  const py = (clientY - rect.top) * dpr;

  const w = canvas.width;
  const h = canvas.height;
  const scaleX = (w * 0.88) / state.chamberSizeM;
  const scaleY = (h * 0.88) / state.chamberSizeM;
  const scale = Math.min(scaleX, scaleY);
  const cx = w * 0.5;
  const cy = h * 0.5;

  return {
    x: (px - cx) / scale,
    y: (cy - py) / scale, // Inversare axa Y (+y în sus)
  };
}

canvas.addEventListener('mousedown', (e: MouseEvent) => {
  isPointerDown = true;
  pointerWorld = getPointerWorld(e.clientX, e.clientY);
});

window.addEventListener('mousemove', (e: MouseEvent) => {
  if (isPointerDown) {
    pointerWorld = getPointerWorld(e.clientX, e.clientY);
  }
});

window.addEventListener('mouseup', () => {
  isPointerDown = false;
});

canvas.addEventListener(
  'touchstart',
  (e: TouchEvent) => {
    if (e.touches.length > 0) {
      isPointerDown = true;
      pointerWorld = getPointerWorld(e.touches[0].clientX, e.touches[0].clientY);
    }
  },
  { passive: true },
);

window.addEventListener(
  'touchmove',
  (e: TouchEvent) => {
    if (isPointerDown && e.touches.length > 0) {
      pointerWorld = getPointerWorld(e.touches[0].clientX, e.touches[0].clientY);
    }
  },
  { passive: true },
);

window.addEventListener('touchend', () => {
  isPointerDown = false;
});

// Comenzi rapide tastatură
window.addEventListener('keydown', (event) => {
  if (infoModal.modalOpen()) return;
  const target = event.target;
  if (target instanceof HTMLElement) {
    const tag = target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) return;
  }
  if (event.code === 'Space') {
    event.preventDefault();
    ui.paused = !ui.paused;
    controls?.refresh();
  } else if (event.code === 'KeyC') {
    ui.onClear();
  } else if (event.code === 'KeyR') {
    ui.onReset();
  } else if (event.code === 'KeyH') {
    // Comută modul Zen / Prezentare (ascunde panoul Tweakpane și HUD-ul)
    isUiVisible = !isUiVisible;
    appElement.classList.toggle('zen-mode', !isUiVisible);
  } else if (event.code === 'KeyS') {
    renderer.exportScreenshot();
  }
});

// Metrici pentru HUD
let smoothedFps = 60;
let meanKineticEnergyEv = 0;
let energySampleCounter = 0;

function tick(now: number): void {
  const deltaMs = Math.max(1, now - lastFrame);
  const frameDt = Math.min(0.05, deltaMs / 1000);
  lastFrame = now;

  // Calcul FPS netezit
  const instantFps = 1000 / deltaMs;
  smoothedFps = smoothedFps * 0.92 + instantFps * 0.08;

  syncFromUi();
  const species = SPECIES[state.speciesId];

  // Calcul parametru câmp pentru simulare & vizualizator
  const currentFieldQuery = {
    electrodes,
    decayLength: state.chamberSizeM * FIELD_DECAY_FACTOR,
    paulR0: state.chamberId === 'paul-trap' ? state.chamberSizeM * PAUL_R0_FACTOR : 0,
    rfAmplitude: state.rfAmplitude,
    rfOmega: Math.PI * 2 * state.rfFrequencyHz,
    timeSec: physicsTime,
  };

  if (!state.paused) {
    // 1. Emisie continuă standard cu jitter termic Maxwell-Boltzmann
    emitAcc += state.emissionRate * frameDt;
    const speed = speedFor(species, state.launchSpeed, state.energyEv);
    const isDust = state.speciesId === 'dust';
    const thermalSpeed = isDust ? ui.thermalJitter : 0;

    const emitConfig = {
      size: state.chamberSizeM,
      origin: state.emitterOrigin,
      angleDeg: state.emitterAngleDeg,
      spreadDeg: state.angularSpreadDeg,
      speed,
      chargeC: species.chargeC,
      massKg: species.massKg,
      lifetimeSec: state.lifetimeSec,
      thermalSpeed,
    };

    while (emitAcc >= 1) {
      emitAcc -= 1;
      if (!emitOne(pool, emitConfig)) break;
    }

    // 2. Fascicul focalizat la click/drag (Ion Gun direcționat spre cursor)
    if (isPointerDown) {
      const originX = state.emitterOrigin === 'center' ? 0 : -state.chamberSizeM * 0.38;
      const originY = 0;
      const dx = pointerWorld.x - originX;
      const dy = pointerWorld.y - originY;
      const beamAngleRad = Math.atan2(dy, dx);

      pool.emitBeam(
        originX,
        originY,
        beamAngleRad,
        0.025, // Împrăștiere focalizată (~1.4 grade)
        ui.beamEnergyEv,
        4, // 4 ioni per cadru
        species.chargeC,
        species.massKg,
        state.lifetimeSec,
      );
    }

    // 3. Integrare fizică (cu repulsie Coulomb / Space-Charge și detectare impact pereți)
    const timing = substepCount(frameDt);
    const step: PoolStep = {
      frameDt,
      physicsDt: timing.physicsDt,
      substeps: timing.substeps,
      bz: state.magneticField,
      gravityDown: state.gravity,
      bounds: state.chamberSizeM * 0.52,
      timeStart: physicsTime,
      spaceChargeEnabled: ui.spaceChargeEnabled,
      softeningM: ui.softeningMm * 1e-3, // Convertit în metri
      field: currentFieldQuery,
      onWallImpact: (x, y, neutralized) => {
        renderer.addImpactFlash(x, y, neutralized);
      },
    };
    physicsTime = pool.update(step);
  }

  // Calcul eșantionat al energiei cinetice medii (la fiecare 6 cadre pentru 60 FPS constant)
  energySampleCounter++;
  if (energySampleCounter >= 6) {
    energySampleCounter = 0;
    if (pool.count > 0) {
      let sumEv = 0;
      const sampleStep = pool.count > 200 ? Math.ceil(pool.count / 150) : 1;
      let sampleCount = 0;
      for (let i = 0; i < pool.count; i += sampleStep) {
        const vSq = pool.vx[i] * pool.vx[i] + pool.vy[i] * pool.vy[i];
        const joules = 0.5 * pool.m[i] * vSq;
        sumEv += joules / Q_E;
        sampleCount++;
      }
      meanKineticEnergyEv = sumEv / Math.max(1, sampleCount);
    } else {
      meanKineticEnergyEv = 0;
    }
  }

  // Randare cadru grafic (incluzând grila de vectori E și străfulgerările de impact)
  renderer.resize();
  renderer.render(
    pool,
    toVisual(electrodes, state.chamberSizeM),
    species.speedScale,
    currentFieldQuery,
    ui.showFieldGrid,
    frameDt,
  );

  // Randare Heads-Up Display vectorial (High-DPI)
  const tr = getTranslations(ui.language);
  renderer.renderHud(
    {
      fps: smoothedFps,
      frameTimeMs: deltaMs,
      particleCount: pool.count,
      capacity: pool.capacity,
      meanKineticEnergyEv,
      spaceChargeEnabled: ui.spaceChargeEnabled,
      chamberLabel: tr.shapes[ui.chamberShape],
      speciesLabel: tr.species[ui.ionSpecies],
      rfInfo:
        state.chamberId === 'paul-trap'
          ? {
              voltage: state.rfAmplitude,
              frequencyHz: state.rfFrequencyHz,
            }
          : undefined,
      visible: isUiVisible,
    },
    ui.language,
  );

  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
