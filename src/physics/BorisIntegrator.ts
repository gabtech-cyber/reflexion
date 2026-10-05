export interface BorisState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/**
 * Un pas Boris-Buneman în plan, cu B pe axa Z.
 * `gravityDown` este accelerația în jos (m/s²): +9.8 trage spre -y.
 */
export function borisStep(
  state: BorisState,
  charge: number,
  mass: number,
  ex: number,
  ey: number,
  bz: number,
  gravityDown: number,
  dt: number,
): BorisState {
  const qOverM = charge / mass;
  const ax = qOverM * ex;
  const ay = qOverM * ey - gravityDown;
  const half = dt * 0.5;

  const vxMinus = state.vx + ax * half;
  const vyMinus = state.vy + ay * half;

  const tz = qOverM * bz * half;
  const sz = (2 * tz) / (1 + tz * tz);

  const vxPrime = vxMinus + vyMinus * tz;
  const vyPrime = vyMinus - vxMinus * tz;

  const vxPlus = vxMinus + vyPrime * sz;
  const vyPlus = vyMinus - vxPrime * sz;

  const vx = vxPlus + ax * half;
  const vy = vyPlus + ay * half;

  return {
    x: state.x + vx * dt,
    y: state.y + vy * dt,
    vx,
    vy,
  };
}
