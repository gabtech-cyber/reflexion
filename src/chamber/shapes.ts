import { PAUL_R0_FACTOR } from '../core/Constants';
import type { RodVisual, WallSegment } from '../render/CanvasRenderer';

export { PAUL_R0_FACTOR };

export interface ShapeBuildResult {
  halfWidth: number;
  halfHeight: number;
  electrodes: WallSegment[];
  rods?: RodVisual[];
}

/** `radius` este distanța de la centru până la un vârf. Vârful din dreapta stă la unghi 0. */
export function buildHexagon(radius: number = 0.01, defaultVoltage: number = 200): ShapeBuildResult {
  const electrodes: WallSegment[] = [];
  const vertices: Array<{ x: number; y: number }> = [];

  for (let k = 0; k < 6; k++) {
    const angle = (k * Math.PI) / 3;
    vertices.push({
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
    });
  }

  for (let i = 0; i < 6; i++) {
    const next = (i + 1) % 6;
    electrodes.push({
      id: `hex_wall_${i}`,
      x1: vertices[i].x,
      y1: vertices[i].y,
      x2: vertices[next].x,
      y2: vertices[next].y,
      voltage: defaultVoltage,
    });
  }

  return {
    halfWidth: radius,
    halfHeight: radius,
    electrodes,
  };
}

/** `size` este latura scutului. Tijele opuse stau la `size * PAUL_R0_FACTOR` de centru. */
export function buildPaulTrap(size: number = 0.02, defaultVoltage: number = 0): ShapeBuildResult {
  const half = size * 0.5;
  const r0 = size * PAUL_R0_FACTOR;
  // Rază doar pentru desen. Coliziunea și cuadrupolul folosesc centrele, nu grosimea tijei.
  const rodRadius = r0 * 0.35;

  const electrodes: WallSegment[] = [
    { id: 'shield_s', x1: -half, y1: -half, x2: half, y2: -half, voltage: defaultVoltage },
    { id: 'shield_e', x1: half, y1: -half, x2: half, y2: half, voltage: defaultVoltage },
    { id: 'shield_n', x1: half, y1: half, x2: -half, y2: half, voltage: defaultVoltage },
    { id: 'shield_w', x1: -half, y1: half, x2: -half, y2: -half, voltage: defaultVoltage },
  ];

  const rods: RodVisual[] = [
    { x: r0, y: 0, r: rodRadius, phase: 1 },
    { x: -r0, y: 0, r: rodRadius, phase: 1 },
    { x: 0, y: r0, r: rodRadius, phase: -1 },
    { x: 0, y: -r0, r: rodRadius, phase: -1 },
  ];

  return {
    halfWidth: half,
    halfHeight: half,
    electrodes,
    rods,
  };
}
