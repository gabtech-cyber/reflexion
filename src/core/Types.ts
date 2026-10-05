/** Metri. Originea este centrul camerei. +x spre dreapta, +y în sus. */

export type ChamberId = 'box' | 'hexagon' | 'paul-trap';

export type SpeciesId = 'dust' | 'ar-ion';

export type ElectrodeKind = 'wall' | 'rod';

export interface Electrode {
  id: string;
  label: string;
  kind: ElectrodeKind;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Centrul tijei când kind === 'rod'. 0 pentru pereți. */
  radius: number;
  /** Offset de curent continuu, volți. */
  voltage: number;
  /** 0 = doar curent continuu. +1 și -1 = faze RF opuse, pentru capcana Paul. */
  rfPhase: -1 | 0 | 1;
}

export interface Viewport {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface ParticleView {
  count: number;
  x: Float32Array;
  y: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  q: Float32Array;
}

export interface FieldSample {
  sample(x: number, y: number): { ex: number; ey: number };
}

export interface RenderStyle {
  /** Fracție ștearsă din urmă la fiecare cadru. 0.02 persistă, 0.35 se stinge repede. */
  trailDecay: number;
  /** 0..1 */
  glow: number;
  showVectors: boolean;
  showWalls: boolean;
  /** Celule pe latură pentru grila de vectori. */
  vectorGrid: number;
  /** Viteza în m/s care ajunge la capătul rampei de culoare. */
  speedScale: number;
}

export interface FrameInput {
  timeSec: number;
  particles: ParticleView;
  electrodes: readonly Electrode[];
  style: RenderStyle;
  rfFrequencyHz: number;
  rfAmplitude: number;
  field?: FieldSample;
}

export interface IonRenderer {
  setViewport(viewport: Viewport): void;
  frame(input: FrameInput): void;
  dispose(): void;
}

export interface ElectrodeControl {
  id: string;
  label: string;
  voltage: number;
}

export interface SimControlState {
  paused: boolean;
  speciesId: SpeciesId;
  chamberId: ChamberId;
  chamberSizeM: number;
  /** Pozitiv trage în jos. 9.8 este gravitația terestră. */
  gravity: number;
  magneticField: number;
  emissionRate: number;
  /** m/s. Regimul praf. */
  launchSpeed: number;
  /** eV. Regimul ion. */
  energyEv: number;
  angularSpreadDeg: number;
  lifetimeSec: number;
  trailDecay: number;
  glow: number;
  showVectors: boolean;
  showWalls: boolean;
  rfAmplitude: number;
  rfFrequencyHz: number;
  /** 0 înseamnă +x. */
  emitterAngleDeg: number;
  emitterOrigin: 'left' | 'center';
  electrodes: ElectrodeControl[];
}

export interface SliderRange {
  min: number;
  max: number;
  step: number;
  hidden: boolean;
}

export interface SpeciesSliderRange {
  launchSpeed: SliderRange;
  energyEv: SliderRange;
  rfFrequencyHz: SliderRange;
}

export interface ControlHooks {
  onChange: (key: keyof SimControlState) => void;
  onReset: () => void;
  onClearParticles: () => void;
}

export interface ControlsHandle {
  /** Reconstruiește folderul de electrozi după schimbarea camerei. */
  refreshElectrodes(list: ElectrodeControl[]): void;
  /** Reconstruiește limitele slider-elor pentru specia curentă. */
  refreshSpecies(ranges: SpeciesSliderRange): void;
  dispose(): void;
}
