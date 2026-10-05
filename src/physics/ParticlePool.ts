import { Q_E, AMU } from '../core/Constants';
import type { ParticleView } from '../core/Types';
import { borisStep } from './BorisIntegrator';
import { electricField, resolveWallCollisions, type FieldQuery } from './ElectricFieldSolver';
import { SpaceChargeSolver, DEFAULT_SOFTENING_M } from './SpaceCharge';

export interface PoolStep {
  frameDt: number;
  physicsDt: number;
  substeps: number;
  field: FieldQuery;
  bz: number;
  gravityDown: number;
  bounds: number;
  timeStart: number;
  spaceChargeEnabled?: boolean;
  softeningM?: number;
  onWallImpact?: (x: number, y: number, neutralized: boolean) => void;
}

export class ParticlePool {
  readonly capacity: number;
  count = 0;

  readonly x: Float32Array;
  readonly y: Float32Array;
  readonly vx: Float32Array;
  readonly vy: Float32Array;
  readonly q: Float32Array;
  readonly m: Float32Array;
  readonly life: Float32Array;

  private readonly spaceChargeSolver = new SpaceChargeSolver();

  constructor(capacity = 8000) {
    this.capacity = capacity;
    this.x = new Float32Array(capacity);
    this.y = new Float32Array(capacity);
    this.vx = new Float32Array(capacity);
    this.vy = new Float32Array(capacity);
    this.q = new Float32Array(capacity);
    this.m = new Float32Array(capacity);
    this.life = new Float32Array(capacity);
  }

  emit(
    px: number,
    py: number,
    vx: number,
    vy: number,
    charge: number,
    mass: number,
    lifetime: number,
  ): boolean {
    if (this.count >= this.capacity || mass <= 0) return false;
    const index = this.count;
    this.x[index] = px;
    this.y[index] = py;
    this.vx[index] = vx;
    this.vy[index] = vy;
    this.q[index] = charge;
    this.m[index] = mass;
    this.life[index] = lifetime;
    this.count++;
    return true;
  }

  /**
   * Tun de ioni. v = sqrt(2 * |q| * V / m), cu V din glisor.
   * Pentru Ar+ (|q| = e) V este și energia în eV. Pentru praf, același număr
   * este tensiune de accelerare: 40 eV pe 1e-15 C ar lăsa grăuntele aproape pe loc.
   */
  emitBeam(
    x: number,
    y: number,
    angleRad: number,
    spreadRad: number,
    energyEv: number,
    count: number,
    charge: number = Q_E,
    mass: number = 40 * AMU,
    lifetime: number = 8,
  ): number {
    if (count <= 0 || mass <= 0) return 0;
    const chargeForEnergy = Math.abs(charge) > 0 ? Math.abs(charge) : Q_E;
    const joules = Math.max(0.01, energyEv) * chargeForEnergy;
    const speed = Math.sqrt((2 * joules) / mass);
    let emitted = 0;

    for (let c = 0; c < count; c++) {
      if (this.count >= this.capacity) break;

      // Transformarea Box-Muller pentru distribuție Gaussiană a unghiului
      const u1 = Math.max(1e-10, Math.random());
      const u2 = Math.random();
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      const angle = angleRad + z0 * spreadRad;

      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      if (this.emit(x, y, vx, vy, charge, mass, lifetime)) {
        emitted++;
      } else {
        break;
      }
    }

    return emitted;
  }

  clear(): void {
    this.count = 0;
  }

  view(): ParticleView {
    return {
      count: this.count,
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
      q: this.q,
    };
  }

  /** Întoarce timpul fizic de la finalul cadrului. */
  update(step: PoolStep): number {
    const substeps = Math.max(1, Math.min(500, Math.floor(step.substeps)));
    const subDt = step.physicsDt / substeps;

    const SC_UPDATE_INTERVAL = Math.max(1, Math.min(8, Math.floor(substeps / 8)));
    let scAx: Float32Array | null = null;
    let scAy: Float32Array | null = null;

    for (let s = 0; s < substeps; s++) {
      step.field.timeSec = step.timeStart + (s + 0.5) * subDt;

      if (step.spaceChargeEnabled && this.count > 1 && (s % SC_UPDATE_INTERVAL === 0 || !scAx)) {
        const sc = this.spaceChargeSolver.computeAccelerations(
          this,
          step.softeningM ?? DEFAULT_SOFTENING_M,
          step.bounds,
        );
        scAx = sc.ax;
        scAy = sc.ay;
      }

      let i = 0;
      while (i < this.count) {
        const { ex, ey } = electricField(this.x[i], this.y[i], step.field);

        let totalEx = ex;
        let totalEy = ey;
        if (scAx && scAy && this.q[i] !== 0) {
          const mOverQ = this.m[i] / this.q[i];
          totalEx += scAx[i] * mOverQ;
          totalEy += scAy[i] * mOverQ;
        }

        const next = borisStep(
          { x: this.x[i], y: this.y[i], vx: this.vx[i], vy: this.vy[i] },
          this.q[i],
          this.m[i],
          totalEx,
          totalEy,
          step.bz,
          step.gravityDown,
          subDt,
        );

        if (
          !Number.isFinite(next.x) ||
          !Number.isFinite(next.y) ||
          !Number.isFinite(next.vx) ||
          !Number.isFinite(next.vy)
        ) {
          this.removeAt(i);
          continue;
        }

        // Răspuns la coliziunea cu pereții (împrăștiere inelastică sau neutralizare)
        const wallResponse = resolveWallCollisions(
          next.x,
          next.y,
          next.vx,
          next.vy,
          this.q[i],
          step.field.electrodes,
        );

        if (wallResponse.collided && step.onWallImpact) {
          step.onWallImpact(
            wallResponse.contactX ?? wallResponse.x,
            wallResponse.contactY ?? wallResponse.y,
            wallResponse.neutralized,
          );
        }

        if (wallResponse.neutralized) {
          this.removeAt(i);
          continue;
        }

        this.x[i] = wallResponse.x;
        this.y[i] = wallResponse.y;
        this.vx[i] = wallResponse.vx;
        this.vy[i] = wallResponse.vy;
        i++;
      }
    }

    let i = 0;
    while (i < this.count) {
      this.life[i] -= step.frameDt;
      const outside = Math.abs(this.x[i]) > step.bounds || Math.abs(this.y[i]) > step.bounds;
      if (this.life[i] <= 0 || outside) {
        this.removeAt(i);
        continue;
      }
      i++;
    }

    return step.timeStart + step.physicsDt;
  }

  private removeAt(index: number): void {
    const last = this.count - 1;
    if (index !== last) {
      this.x[index] = this.x[last];
      this.y[index] = this.y[last];
      this.vx[index] = this.vx[last];
      this.vy[index] = this.vy[last];
      this.q[index] = this.q[last];
      this.m[index] = this.m[last];
      this.life[index] = this.life[last];
    }
    this.count--;
  }
}
