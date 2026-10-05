import { ParticlePool } from './ParticlePool';

export const COULOMB_KE = 8.9875517923e9; // N·m²/C²
export const DEFAULT_SOFTENING_M = 0.0005; // 0.5 mm softening parameter

/**
 * Calculează accelerațiile inter-particulă datorate repulsiei Coulomb (efectul sarcinii spațiale).
 * F_ij = k_e * (q_i * q_j) / (r_ij^2 + eps^2) * (r_i - r_j) / sqrt(r_ij^2 + eps^2)
 *
 * Utilizează calcul simetric Newton III (N*(N-1)/2) cu buclă optimizată Float32Array
 * și un grid spațial când numărul de particule depășește 400.
 */
export class SpaceChargeSolver {
  private axBuffer: Float32Array = new Float32Array(8000);
  private ayBuffer: Float32Array = new Float32Array(8000);

  // Buffer-e pre-alocate pentru Spatial Hash / Cell-List
  private cellHead: Int32Array = new Int32Array(32 * 32);
  private cellNext: Int32Array = new Int32Array(8000);

  public computeAccelerations(
    pool: ParticlePool,
    softeningM: number = DEFAULT_SOFTENING_M,
    chamberHalfSize: number = 0.015
  ): { ax: Float32Array; ay: Float32Array } {
    const count = pool.count;
    if (this.axBuffer.length < count) {
      const newCap = Math.max(count * 2, 8000);
      this.axBuffer = new Float32Array(newCap);
      this.ayBuffer = new Float32Array(newCap);
      this.cellNext = new Int32Array(newCap);
    }

    const ax = this.axBuffer;
    const ay = this.ayBuffer;
    ax.fill(0, 0, count);
    ay.fill(0, 0, count);

    if (count < 2) return { ax, ay };

    const epsSq = softeningM * softeningM;
    const px = pool.x;
    const py = pool.y;
    const q = pool.q;
    const m = pool.m;

    // Pentru colecții mici/medii (sub 400 particule), bucla directă N(N-1)/2 este mai rapidă
    // fără overhead de grid.
    if (count <= 400) {
      for (let i = 0; i < count; i++) {
        const xi = px[i];
        const yi = py[i];
        const qi = q[i];
        const mi = m[i];
        if (mi <= 0 || qi === 0) continue;

        let axi = 0;
        let ayi = 0;

        for (let j = i + 1; j < count; j++) {
          const qj = q[j];
          const mj = m[j];
          if (mj <= 0 || qj === 0) continue;

          const dx = xi - px[j];
          const dy = yi - py[j];
          const rSq = dx * dx + dy * dy;
          const denom = Math.pow(rSq + epsSq, 1.5);
          if (denom < 1e-24) continue;

          // Forța F_ij pe i datorată lui j:
          const factor = (COULOMB_KE * qi * qj) / denom;
          const fx = dx * factor;
          const fy = dy * factor;

          axi += fx / mi;
          ayi += fy / mi;

          ax[j] -= fx / mj;
          ay[j] -= fy / mj;
        }

        ax[i] += axi;
        ay[i] += ayi;
      }
      return { ax, ay };
    }

    // Pentru N > 400, cell-list 32×32. Perechile mai depărtate de 3 celule sunt omise.
    const GRID_DIM = 32;
    const head = this.cellHead;
    const next = this.cellNext;
    head.fill(-1, 0, GRID_DIM * GRID_DIM);

    const worldSpan = chamberHalfSize * 2.2;
    const cellSize = worldSpan / GRID_DIM;
    const invCellSize = 1.0 / cellSize;
    const offset = chamberHalfSize * 1.1;

    for (let i = 0; i < count; i++) {
      const cx = Math.max(0, Math.min(GRID_DIM - 1, Math.floor((px[i] + offset) * invCellSize)));
      const cy = Math.max(0, Math.min(GRID_DIM - 1, Math.floor((py[i] + offset) * invCellSize)));
      const cellIdx = cy * GRID_DIM + cx;
      next[i] = head[cellIdx];
      head[cellIdx] = i;
    }

    // Iterație pe celule vecine (rază de căutare de 3 celule pentru forța electrostatică locală)
    const SEARCH_RADIUS = 3;
    for (let cy = 0; cy < GRID_DIM; cy++) {
      for (let cx = 0; cx < GRID_DIM; cx++) {
        let i = head[cy * GRID_DIM + cx];
        while (i !== -1) {
          const xi = px[i];
          const yi = py[i];
          const qi = q[i];
          const mi = m[i];

          if (mi > 0 && qi !== 0) {
            const minX = Math.max(0, cx - SEARCH_RADIUS);
            const maxX = Math.min(GRID_DIM - 1, cx + SEARCH_RADIUS);
            const minY = Math.max(0, cy - SEARCH_RADIUS);
            const maxY = Math.min(GRID_DIM - 1, cy + SEARCH_RADIUS);

            for (let ncy = minY; ncy <= maxY; ncy++) {
              for (let ncx = minX; ncx <= maxX; ncx++) {
                let j = head[ncy * GRID_DIM + ncx];
                while (j !== -1) {
                  if (j > i) {
                    const qj = q[j];
                    const mj = m[j];
                    if (mj > 0 && qj !== 0) {
                      const dx = xi - px[j];
                      const dy = yi - py[j];
                      const rSq = dx * dx + dy * dy;
                      const denom = Math.pow(rSq + epsSq, 1.5);
                      if (denom >= 1e-24) {
                        const factor = (COULOMB_KE * qi * qj) / denom;
                        const fx = dx * factor;
                        const fy = dy * factor;

                        ax[i] += fx / mi;
                        ay[i] += fy / mi;
                        ax[j] -= fx / mj;
                        ay[j] -= fy / mj;
                      }
                    }
                  }
                  j = next[j];
                }
              }
            }
          }
          i = next[i];
        }
      }
    }

    return { ax, ay };
  }
}
