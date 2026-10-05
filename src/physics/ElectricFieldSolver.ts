import type { Electrode } from '../core/Types';

export interface FieldQuery {
  electrodes: readonly Electrode[];
  decayLength: number;
  /** 0 oprește termenul de cuadrupol. */
  paulR0: number;
  rfAmplitude: number;
  /** rad/s */
  rfOmega: number;
  timeSec: number;
}

export interface WallInteractionResult {
  x: number;
  y: number;
  vx: number;
  vy: number;
  neutralized: boolean;
  collided: boolean;
  contactX?: number;
  contactY?: number;
}

const SOFTENING_SQ = 1e-8;
export const WALL_RESTITUTION_COEFF = 0.85;

/**
 * Perna gaussiană a pereților, plus cuadrupolul RF al capcanei Paul.
 * Tijele cu rfPhase ≠ 0 nu mai contribuie și prin pernă: forța lor este cuadrupolul.
 */
export function electricField(px: number, py: number, query: FieldQuery): { ex: number; ey: number } {
  let ex = 0;
  let ey = 0;
  const decay = query.decayLength;

  for (let i = 0; i < query.electrodes.length; i++) {
    const electrode = query.electrodes[i];
    if (electrode.rfPhase !== 0 && query.paulR0 > 0) continue;
    if (Math.abs(electrode.voltage) < 1e-6) continue;

    let rx: number;
    let ry: number;

    if (electrode.kind === 'rod') {
      rx = px - electrode.x1;
      ry = py - electrode.y1;
    } else {
      const lx = electrode.x2 - electrode.x1;
      const ly = electrode.y2 - electrode.y1;
      const lengthSq = lx * lx + ly * ly;
      if (lengthSq < 1e-18) continue;
      const rawT = ((px - electrode.x1) * lx + (py - electrode.y1) * ly) / lengthSq;
      const t = rawT < 0 ? 0 : rawT > 1 ? 1 : rawT;
      rx = px - (electrode.x1 + t * lx);
      ry = py - (electrode.y1 + t * ly);
    }

    const effectiveDist = Math.sqrt(rx * rx + ry * ry + SOFTENING_SQ);
    const magnitude = (electrode.voltage / decay) * Math.exp(-effectiveDist / decay);
    ex += (rx / effectiveDist) * magnitude;
    ey += (ry / effectiveDist) * magnitude;
  }

  if (query.paulR0 > 0 && query.rfAmplitude !== 0) {
    const volts = query.rfAmplitude * Math.cos(query.rfOmega * query.timeSec);
    const scale = volts / (query.paulR0 * query.paulR0);
    ex += -scale * px;
    ey += scale * py;
  }

  return { ex, ey };
}

/**
 * Rezolvă interacțiunea la limita pereților pentru particulele cu energie cinetică mare
 * care străpung perna gaussiană electrostatică.
 * - Împrăștiere inelastică cu coeficient de restituire e = 0.85 când peretele respinge.
 * - Neutralizare și captură la suprafață dacă potențialul peretelui este opus sarcinii particulei sau neutru.
 */
export function resolveWallCollisions(
  px: number,
  py: number,
  vx: number,
  vy: number,
  charge: number,
  electrodes: readonly Electrode[],
  restitution: number = WALL_RESTITUTION_COEFF
): WallInteractionResult {
  let currX = px;
  let currY = py;
  let currVx = vx;
  let currVy = vy;
  let collided = false;
  let contactX: number | undefined;
  let contactY: number | undefined;

  for (let i = 0; i < electrodes.length; i++) {
    const el = electrodes[i];
    if (el.kind !== 'wall') continue;

    const lx = el.x2 - el.x1;
    const ly = el.y2 - el.y1;
    const lenSq = lx * lx + ly * ly;
    if (lenSq < 1e-12) continue;
    const len = Math.sqrt(lenSq);

    // Vectorul normal orientat spre interiorul camerei (spre origine 0,0)
    let nx = -ly / len;
    let ny = lx / len;
    const midX = (el.x1 + el.x2) * 0.5;
    const midY = (el.y1 + el.y2) * 0.5;
    if (nx * (-midX) + ny * (-midY) < 0) {
      nx = -nx;
      ny = -ny;
    }

    // Proiecție pe segment
    const rawT = ((currX - el.x1) * lx + (currY - el.y1) * ly) / lenSq;
    if (rawT < -0.05 || rawT > 1.05) continue;
    const t = Math.max(0, Math.min(1, rawT));

    const cx = el.x1 + t * lx;
    const cy = el.y1 + t * ly;

    const rx = currX - cx;
    const ry = currY - cy;

    // Distanța față de perete pe normala spre interior
    const distNormal = rx * nx + ry * ny;
    const COLLISION_THRESHOLD = 0.0003; // 0.3 mm

    if (distNormal < COLLISION_THRESHOLD) {
      const vNormal = currVx * nx + currVy * ny;

      // Particula se deplasează în direcția peretelui
      if (vNormal < 0) {
        contactX = cx;
        contactY = cy;
        collided = true;

        // Dacă peretele este neutru sau are polaritate atractivă (q * V <= 0),
        // ionul se descarcă / neutralizează la suprafața electrodului
        if (charge * el.voltage <= 0) {
          return {
            x: cx,
            y: cy,
            vx: 0,
            vy: 0,
            neutralized: true,
            collided: true,
            contactX,
            contactY,
          };
        }

        // Altfel: reflexie / împrăștiere inelastică cu pierdere parțială de energie (e = 0.85)
        const tx = -ny;
        const ty = nx;
        const vTangential = currVx * tx + currVy * ty;

        const newVNormal = -vNormal * restitution;
        const newVTangential = vTangential * 0.95; // ușoară frecare tangențială

        currVx = newVTangential * tx + newVNormal * nx;
        currVy = newVTangential * ty + newVNormal * ny;

        // Repoziționare pe partea interioară a peretelui
        currX = cx + nx * COLLISION_THRESHOLD;
        currY = cy + ny * COLLISION_THRESHOLD;
      }
    }
  }

  return {
    x: currX,
    y: currY,
    vx: currVx,
    vy: currVy,
    neutralized: false,
    collided,
    contactX,
    contactY,
  };
}
