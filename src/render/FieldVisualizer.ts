import { electricField, type FieldQuery } from '../physics/ElectricFieldSolver';

export class FieldVisualizer {
  /**
   * Randează o grilă de vectori ai câmpului electric E = (Ex, Ey) peste incintă.
   * Direcția săgeților indică orientarea câmpului, iar intensitatea culorii
   * este proporțională cu mărimea câmpului |E|.
   */
  public render(
    ctx: CanvasRenderingContext2D,
    scale: number,
    cx: number,
    cy: number,
    halfWidth: number,
    halfHeight: number,
    query: FieldQuery,
    gridSize: number = 22,
  ): void {
    const stepX = (halfWidth * 1.9) / gridSize;
    const stepY = (halfHeight * 1.9) / gridSize;
    const maxArrowPx = Math.min(stepX, stepY) * scale * 0.45;

    ctx.save();
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';

    const startX = -halfWidth * 0.95;
    const startY = -halfHeight * 0.95;

    for (let iy = 0; iy < gridSize; iy++) {
      const my = startY + iy * stepY;
      for (let ix = 0; ix < gridSize; ix++) {
        const mx = startX + ix * stepX;

        const { ex, ey } = electricField(mx, my, query);
        const mag = Math.sqrt(ex * ex + ey * ey);
        if (mag < 1e-4) continue;

        // Scalare cvasilogaritmică a intensității pt contrast bun între câmpuri slabe și intense
        const logVal = Math.log10(mag + 1.0);
        const norm = Math.min(1.0, Math.max(0.1, logVal / 6.0));
        const len = maxArrowPx * (0.35 + 0.65 * norm);

        // Coordonate pe Canvas (inversare pe axa Y deoarece +y e sus în fizică, dar jos în Canvas)
        const sx = cx + mx * scale;
        const sy = cy - my * scale;

        const angle = Math.atan2(-ey, ex);
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        const halfLen = len * 0.5;
        const x1 = sx - cosA * halfLen;
        const y1 = sy - sinA * halfLen;
        const x2 = sx + cosA * halfLen;
        const y2 = sy + sinA * halfLen;

        const alpha = (0.08 + 0.35 * norm).toFixed(3);
        ctx.strokeStyle = `rgba(0, 220, 255, ${alpha})`;
        ctx.fillStyle = `rgba(0, 220, 255, ${alpha})`;

        // Corpul săgeții
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Vârful săgeții
        const headLen = Math.max(2.5, len * 0.3);
        const headAngle = 0.48; // ~27 grade
        const hx1 = x2 - headLen * Math.cos(angle - headAngle);
        const hy1 = y2 - headLen * Math.sin(angle - headAngle);
        const hx2 = x2 - headLen * Math.cos(angle + headAngle);
        const hy2 = y2 - headLen * Math.sin(angle + headAngle);

        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(hx1, hy1);
        ctx.lineTo(hx2, hy2);
        ctx.closePath();
        ctx.fill();
      }
    }

    ctx.restore();
  }
}
