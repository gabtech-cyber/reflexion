import { DEFAULT_VOLTAGE } from '../core/Constants';
import type { ChamberId, Electrode } from '../core/Types';
import { buildBox } from './box';
import { buildHexagon, buildPaulTrap } from './shapes';

function wall(
  id: string,
  label: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  voltage: number,
): Electrode {
  return {
    id,
    label,
    kind: 'wall',
    x1,
    y1,
    x2,
    y2,
    radius: 0,
    voltage,
    rfPhase: 0,
  };
}

export function buildChamber(id: ChamberId, size: number): Electrode[] {
  switch (id) {
    case 'box':
      return buildBox(size);
    case 'hexagon': {
      const shape = buildHexagon(size / 2, DEFAULT_VOLTAGE.hexagon);
      return shape.electrodes.map((segment, index) =>
        wall(segment.id, `Latura ${index + 1}`, segment.x1, segment.y1, segment.x2, segment.y2, segment.voltage),
      );
    }
    case 'paul-trap': {
      const shape = buildPaulTrap(size, DEFAULT_VOLTAGE.paulDc);
      const shields = shape.electrodes.map((segment) =>
        wall(segment.id, segment.id, segment.x1, segment.y1, segment.x2, segment.y2, segment.voltage),
      );
      const names = [
        ['rod-e', 'Est'],
        ['rod-w', 'Vest'],
        ['rod-n', 'Nord'],
        ['rod-s', 'Sud'],
      ] as const;
      const rods: Electrode[] = (shape.rods ?? []).map((rod, index) => {
        const [id, label] = names[index] ?? [`rod-${index}`, `Tijă ${index + 1}`];
        const phase: -1 | 1 = rod.phase >= 0 ? 1 : -1;
        return {
          id,
          label,
          kind: 'rod',
          x1: rod.x,
          y1: rod.y,
          x2: rod.x,
          y2: rod.y,
          radius: rod.r,
          voltage: 0,
          rfPhase: phase,
        };
      });
      return [...shields, ...rods];
    }
    default: {
      const unreachable: never = id;
      return unreachable;
    }
  }
}
