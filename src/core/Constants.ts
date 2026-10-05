import type { SimControlState, SpeciesId, SpeciesSliderRange } from './Types';

export const Q_E = 1.602176634e-19;
export const AMU = 1.6605390666e-27;

/** Distanța de la centru până la o tijă = size * PAUL_R0_FACTOR. Tijele opuse sunt la dublu. */
export const PAUL_R0_FACTOR = 0.32;

/** Grosimea pernei de reflexie, ca fracție din latura camerei. */
export const FIELD_DECAY_FACTOR = 0.03;

export const DEFAULT_VOLTAGE = {
  box: { top: 200, right: 200, bottom: 200, left: 200 },
  hexagon: 200,
  paulDc: 0,
} as const;

export interface SpeciesDef {
  id: SpeciesId;
  label: string;
  massKg: number;
  chargeC: number;
  /** Ceasul fizic urmărește cadrul video. */
  realtime: boolean;
  /** Pas maxim când realtime este true. */
  substepDt: number;
  /** Durată fizică înaintată la fiecare cadru când realtime este false. */
  physicsDtPerFrame: number;
  /** Număr de subpași când realtime este false. */
  substeps: number;
  launchUsesEnergyEv: boolean;
  speedScale: number;
  rfFrequencyDefault: number;
  sliders: SpeciesSliderRange;
}

export const SPECIES: Record<SpeciesId, SpeciesDef> = {
  dust: {
    id: 'dust',
    label: 'Praf încărcat',
    massKg: 1e-12,
    chargeC: 1e-15,
    realtime: true,
    substepDt: 1 / 4000,
    physicsDtPerFrame: 0,
    substeps: 0,
    launchUsesEnergyEv: false,
    speedScale: 1.5,
    rfFrequencyDefault: 180,
    sliders: {
      launchSpeed: { min: 0.05, max: 4, step: 0.01, hidden: false },
      energyEv: { min: 1, max: 2000, step: 1, hidden: true },
      rfFrequencyHz: { min: 5, max: 2000, step: 1, hidden: false },
    },
  },
  'ar-ion': {
    id: 'ar-ion',
    label: 'Ion Ar+',
    massKg: 40 * AMU,
    chargeC: Q_E,
    realtime: false,
    substepDt: 0,
    physicsDtPerFrame: 2e-6,
    substeps: 400,
    launchUsesEnergyEv: true,
    speedScale: 20000,
    rfFrequencyDefault: 1_000_000,
    sliders: {
      launchSpeed: { min: 0.05, max: 4, step: 0.01, hidden: true },
      energyEv: { min: 1, max: 2000, step: 1, hidden: false },
      rfFrequencyHz: { min: 10_000, max: 5_000_000, step: 10_000, hidden: false },
    },
  },
};

export function createInitialState(): SimControlState {
  return {
    paused: false,
    speciesId: 'dust',
    chamberId: 'box',
    chamberSizeM: 0.02,
    gravity: 9.8,
    magneticField: 0,
    emissionRate: 70,
    launchSpeed: 0.35,
    energyEv: 40,
    angularSpreadDeg: 7,
    lifetimeSec: 8,
    trailDecay: 0.08,
    glow: 0.75,
    showVectors: false,
    showWalls: true,
    rfAmplitude: 150,
    rfFrequencyHz: SPECIES.dust.rfFrequencyDefault,
    emitterAngleDeg: 0,
    emitterOrigin: 'left',
    electrodes: [],
  };
}
