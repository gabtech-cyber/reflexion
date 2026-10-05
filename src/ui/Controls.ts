import { Pane } from 'tweakpane';
import { getTranslations, setLanguage, type Language } from './i18n';
import type { PresetId } from '../chamber/Presets';

export type UiScale = 'compact' | 'standard' | 'large';

export interface SimControlState {
  language: Language;
  preset: PresetId;
  uiScale: UiScale;
  chamberShape: 'box' | 'hexagon' | 'paulTrap';
  ionSpecies: 'dust' | 'argon';
  gravity: number;
  wallVoltage: number;
  magneticBz: number;
  rfAmplitude: number;
  emissionRate: number;
  beamEnergyEv: number;
  spaceChargeEnabled: boolean;
  softeningMm: number;
  thermalJitter: number;
  showFieldGrid: boolean;
  decayAlpha: number;
  paused: boolean;
  onClear: () => void;
  onReset: () => void;
  onScreenshot?: () => void;
  onOpenGuide?: () => void;
  onLanguageChange?: (lang: Language) => void;
  onPresetChange?: (preset: PresetId) => void;
}

export class Controls {
  private pane!: Pane;
  private state: SimControlState;
  private containerId: string;
  private appliedLanguage: Language = 'ro';
  private applyingPreset = false;

  constructor(state: SimControlState, containerId: string = 'controls') {
    this.state = state;
    this.containerId = containerId;
    this.applyScale(this.state.uiScale);
    this.buildPane();
  }

  public applyScale(scale: UiScale): void {
    const widthMap: Record<UiScale, string> = {
      compact: '340px',
      standard: '400px',
      large: '460px',
    };
    const widthPx = widthMap[scale] || '400px';
    document.documentElement.style.setProperty('--controls-width', widthPx);
  }

  /** După un scenariu, orice reglaj fizic readuce eticheta pe Personalizat. */
  private noteUserEdit(): void {
    if (this.applyingPreset || this.state.preset === 'custom') return;
    this.applyingPreset = true;
    this.state.preset = 'custom';
    this.pane.refresh();
    this.applyingPreset = false;
  }

  private watchPhysics(binding: { on(eventName: 'change', handler: () => void): void }): void {
    binding.on('change', () => this.noteUserEdit());
  }

  public buildPane(): void {
    if (this.pane) {
      this.pane.dispose();
    }

    const container = document.getElementById(this.containerId) || undefined;
    this.appliedLanguage = this.state.language;
    const tr = getTranslations(this.state.language);

    this.pane = new Pane({
      title: tr.appTitle,
      container,
    });

    this.pane.element.style.width = '100%';

    // Selector Limbă (Top of Pane)
    const bLang = this.pane.addBinding(this.state, 'language', {
      label: tr.languageSelect,
      options: {
        'Română': 'ro',
        'English': 'en',
      },
    });

    bLang.on('change', (ev) => {
      const nextLang = ev.value as Language;
      if (nextLang === this.appliedLanguage) return;
      this.state.language = nextLang;
      setLanguage(nextLang);
      this.state.onLanguageChange?.(nextLang);
      queueMicrotask(() => this.buildPane());
    });

    // 1-Click Scientific Scenarios Preset Selector (Top utility row)
    const bPreset = this.pane.addBinding(this.state, 'preset', {
      label: tr.labels.preset,
      options: {
        [tr.presets.custom]: 'custom',
        [tr.presets.levitation]: 'levitation',
        [tr.presets.mirror]: 'mirror',
        [tr.presets.paulTrap]: 'paulTrap',
        [tr.presets.coulombExplosion]: 'coulombExplosion',
      },
    });

    bPreset.on('change', (ev) => {
      if (this.applyingPreset) return;
      const pid = ev.value as PresetId;
      this.applyingPreset = true;
      this.state.onPresetChange?.(pid);
      this.refresh();
      this.applyingPreset = false;
    });

    // Folder 1: Incintă & Câmpuri / Environment & Fields (Expanded by default)
    const fEnv = this.pane.addFolder({ title: tr.folders.environment, expanded: true });
    this.watchPhysics(fEnv.addBinding(this.state, 'chamberShape', {
      label: tr.labels.chamberShape,
      options: {
        [tr.shapes.box]: 'box',
        [tr.shapes.hexagon]: 'hexagon',
        [tr.shapes.paulTrap]: 'paulTrap',
      },
    }));
    this.watchPhysics(fEnv.addBinding(this.state, 'wallVoltage', {
      label: tr.labels.wallVoltage,
      min: -1000,
      max: 1000,
      step: 10,
    }));
    this.watchPhysics(fEnv.addBinding(this.state, 'magneticBz', {
      label: tr.labels.magneticBz,
      min: -2.0,
      max: 2.0,
      step: 0.01,
    }));
    this.watchPhysics(fEnv.addBinding(this.state, 'gravity', {
      label: tr.labels.gravity,
      min: -20.0,
      max: 20.0,
      step: 0.2,
    }));
    this.watchPhysics(fEnv.addBinding(this.state, 'rfAmplitude', {
      label: tr.labels.rfAmplitude,
      min: 0,
      max: 1000,
      step: 5,
    }));
    fEnv.addBinding(this.state, 'showFieldGrid', {
      label: tr.labels.showFieldGrid,
    });

    // Folder 2: Fascicul & Emisie / Particle Beam & Injection (Expanded by default)
    const fBeam = this.pane.addFolder({ title: tr.folders.particles, expanded: true });
    this.watchPhysics(fBeam.addBinding(this.state, 'ionSpecies', {
      label: tr.labels.ionSpecies,
      options: {
        [tr.species.dust]: 'dust',
        [tr.species.argon]: 'argon',
      },
    }));
    this.watchPhysics(fBeam.addBinding(this.state, 'emissionRate', {
      label: tr.labels.emissionRate,
      min: 0,
      max: 250,
      step: 1,
    }));
    this.watchPhysics(fBeam.addBinding(this.state, 'beamEnergyEv', {
      label: tr.labels.beamEnergy,
      min: 1,
      max: 2000,
      step: 1,
    }));

    // Hint informativ pt mouse
    const mouseInfo = { hint: tr.labels.mouseHintValue };
    fBeam.addBinding(mouseInfo, 'hint', {
      label: tr.labels.mouseHint,
      readonly: true,
    });

    // Folder 3: Fizică Plasmă & Coulomb / Plasma Physics (Expanded by default)
    const fPlasma = this.pane.addFolder({ title: tr.folders.plasma, expanded: true });
    this.watchPhysics(fPlasma.addBinding(this.state, 'spaceChargeEnabled', {
      label: tr.labels.spaceCharge,
    }));
    this.watchPhysics(fPlasma.addBinding(this.state, 'softeningMm', {
      label: tr.labels.softening,
      min: 0.1,
      max: 3.0,
      step: 0.05,
    }));
    this.watchPhysics(fPlasma.addBinding(this.state, 'thermalJitter', {
      label: tr.labels.thermalJitter,
      min: 0.0,
      max: 0.25,
      step: 0.01,
    }));

    // Folder 4: Randare & Motor / Rendering & Engine (Expanded by default)
    const fEngine = this.pane.addFolder({ title: tr.folders.rendering, expanded: true });

    // Selector Dimensiune Panou (UI Scale)
    const bScale = fEngine.addBinding(this.state, 'uiScale', {
      label: tr.labels.uiScale,
      options: {
        [tr.scales.compact]: 'compact',
        [tr.scales.standard]: 'standard',
        [tr.scales.large]: 'large',
      },
    });
    bScale.on('change', (ev) => {
      const scale = ev.value as UiScale;
      this.applyScale(scale);
      localStorage.setItem('reflexion_ui_scale', scale);
    });

    fEngine.addBinding(this.state, 'decayAlpha', {
      label: tr.labels.decayAlpha,
      min: 0.02,
      max: 0.5,
      step: 0.01,
    });

    // Folder 5: Comenzi Rapide / Actions (Expanded by default)
    const fActions = this.pane.addFolder({ title: tr.folders.actions, expanded: true });
    fActions.addBinding(this.state, 'paused', {
      label: tr.labels.paused,
    });
    fActions.addButton({ title: tr.labels.screenshot }).on('click', () => {
      this.state.onScreenshot?.();
    });
    fActions.addButton({ title: tr.labels.openGuide }).on('click', () => {
      this.state.onOpenGuide?.();
    });
    fActions.addButton({ title: tr.labels.clear }).on('click', () => this.state.onClear());
    fActions.addButton({ title: tr.labels.reset }).on('click', () => {
      this.state.onReset();
      this.refresh();
    });
  }

  public refresh(): void {
    this.pane.refresh();
  }

  public dispose(): void {
    this.pane.dispose();
  }
}
