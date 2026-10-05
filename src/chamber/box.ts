import { DEFAULT_VOLTAGE } from '../core/Constants';
import type { Electrode } from '../core/Types';

export function buildBox(size: number): Electrode[] {
  const half = size / 2;
  const voltage = DEFAULT_VOLTAGE.box;
  const wall = (
    id: string,
    label: string,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    volts: number,
  ): Electrode => ({
    id,
    label,
    kind: 'wall',
    x1,
    y1,
    x2,
    y2,
    radius: 0,
    voltage: volts,
    rfPhase: 0,
  });

  return [
    wall('wall-top', 'Sus', -half, half, half, half, voltage.top),
    wall('wall-right', 'Dreapta', half, half, half, -half, voltage.right),
    wall('wall-bottom', 'Jos', half, -half, -half, -half, voltage.bottom),
    wall('wall-left', 'Stânga', -half, -half, -half, half, voltage.left),
  ];
}
