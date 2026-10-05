import type { SimControlState } from '../ui/Controls';
import type { ParticlePool } from '../physics/ParticlePool';

export type PresetId = 'custom' | 'levitation' | 'mirror' | 'paulTrap' | 'coulombExplosion';

export interface PresetDef {
  id: PresetId;
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
  onApply?: (pool: ParticlePool, chamberSize: number) => void;
}

export const PRESETS: Record<Exclude<PresetId, 'custom'>, PresetDef> = {
  levitation: {
    id: 'levitation',
    chamberShape: 'box',
    ionSpecies: 'dust',
    gravity: 9.8,
    wallVoltage: 350,
    magneticBz: 0,
    rfAmplitude: 150,
    emissionRate: 50,
    beamEnergyEv: 40,
    spaceChargeEnabled: true,
    softeningMm: 0.5,
    thermalJitter: 0.05,
    onApply: (pool, chamberSize) => {
      pool.clear();
      for (let i = 0; i < 60; i++) {
        const x = (Math.random() - 0.5) * chamberSize * 0.4;
        const y = -chamberSize * 0.1 + (Math.random() - 0.5) * chamberSize * 0.1;
        pool.emit(
          x,
          y,
          (Math.random() - 0.5) * 0.05,
          (Math.random() - 0.5) * 0.05,
          1e-15,
          1e-12,
          12,
        );
      }
    },
  },
  mirror: {
    id: 'mirror',
    chamberShape: 'box',
    ionSpecies: 'argon',
    gravity: 0,
    wallVoltage: 500,
    magneticBz: 0,
    rfAmplitude: 150,
    emissionRate: 80,
    beamEnergyEv: 60,
    spaceChargeEnabled: false,
    softeningMm: 0.5,
    thermalJitter: 0,
    onApply: (pool) => {
      pool.clear();
    },
  },
  paulTrap: {
    id: 'paulTrap',
    chamberShape: 'paulTrap',
    ionSpecies: 'argon',
    gravity: 0,
    wallVoltage: 0,
    magneticBz: 0,
    rfAmplitude: 250,
    emissionRate: 40,
    beamEnergyEv: 25,
    spaceChargeEnabled: false,
    softeningMm: 0.5,
    thermalJitter: 0,
    onApply: (pool) => {
      pool.clear();
      for (let i = 0; i < 35; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2000 + 400;
        pool.emit(
          (Math.random() - 0.5) * 0.001,
          (Math.random() - 0.5) * 0.001,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          1.602176634e-19,
          40 * 1.6605390666e-27,
          10,
        );
      }
    },
  },
  coulombExplosion: {
    id: 'coulombExplosion',
    chamberShape: 'hexagon',
    ionSpecies: 'dust',
    gravity: 0,
    wallVoltage: 400,
    magneticBz: 0,
    rfAmplitude: 150,
    emissionRate: 0,
    beamEnergyEv: 40,
    spaceChargeEnabled: true,
    softeningMm: 0.2, // 0.2 mm softening pt forță de respingere explozivă intensă
    thermalJitter: 0.02,
    onApply: (pool, chamberSize) => {
      pool.clear();
      const clusterRadius = chamberSize * 0.04;
      for (let i = 0; i < 160; i++) {
        const r = Math.sqrt(Math.random()) * clusterRadius;
        const theta = Math.random() * Math.PI * 2;
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        pool.emit(x, y, 0, 0, 1e-15, 1e-12, 10);
      }
    },
  },
};

export function applyPreset(
  presetId: PresetId,
  state: SimControlState,
  pool?: ParticlePool,
  chamberSize: number = 0.02,
): void {
  if (presetId === 'custom') return;
  const def = PRESETS[presetId];
  if (!def) return;

  state.chamberShape = def.chamberShape;
  state.ionSpecies = def.ionSpecies;
  state.gravity = def.gravity;
  state.wallVoltage = def.wallVoltage;
  state.magneticBz = def.magneticBz;
  state.rfAmplitude = def.rfAmplitude;
  state.emissionRate = def.emissionRate;
  state.beamEnergyEv = def.beamEnergyEv;
  state.spaceChargeEnabled = def.spaceChargeEnabled;
  state.softeningMm = def.softeningMm;
  state.thermalJitter = def.thermalJitter;

  if (pool && def.onApply) {
    def.onApply(pool, chamberSize);
  }
}
