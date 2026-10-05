import { Q_E, type SpeciesDef } from '../core/Constants';
import type { ParticlePool } from '../physics/ParticlePool';

export interface EmitConfig {
  size: number;
  origin: 'left' | 'center';
  angleDeg: number;
  spreadDeg: number;
  speed: number;
  chargeC: number;
  massKg: number;
  lifetimeSec: number;
  thermalSpeed?: number;
}

export function speedFor(species: SpeciesDef, launchSpeed: number, energyEv: number): number {
  if (!species.launchUsesEnergyEv) return launchSpeed;
  const joules = energyEv * Q_E;
  return Math.sqrt((2 * joules) / species.massKg);
}

/**
 * Generează o valoare dintr-o distribuție Gaussiană normală N(0, 1) prin transformarea Box-Muller.
 */
function gaussianRandom(): number {
  const u1 = Math.max(1e-10, Math.random());
  const u2 = Math.random();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

export function emitOne(pool: ParticlePool, config: EmitConfig): boolean {
  const spread = (Math.random() - 0.5) * 2 * config.spreadDeg;
  const angle = ((config.angleDeg + spread) * Math.PI) / 180;
  const inset = config.size * 0.18;
  const x = config.origin === 'center' ? 0 : -config.size / 2 + inset;
  const y = config.origin === 'center' ? 0 : (Math.random() - 0.5) * config.size * 0.25;

  let vx = Math.cos(angle) * config.speed;
  let vy = Math.sin(angle) * config.speed;

  // Injecție termică Maxwell-Boltzmann (agitație termică 2D pentru prevenirea sedimentării rigide)
  if (config.thermalSpeed && config.thermalSpeed > 0) {
    vx += gaussianRandom() * config.thermalSpeed;
    vy += gaussianRandom() * config.thermalSpeed;
  }

  return pool.emit(
    x,
    y,
    vx,
    vy,
    config.chargeC,
    config.massKg,
    config.lifetimeSec,
  );
}
