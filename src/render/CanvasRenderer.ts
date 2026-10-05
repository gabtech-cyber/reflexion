import type { ParticlePool } from '../physics/ParticlePool';
import type { FieldQuery } from '../physics/ElectricFieldSolver';
import { HudOverlay, type HudMetrics } from './HudOverlay';
import { FieldVisualizer } from './FieldVisualizer';
import type { Language } from '../ui/i18n';

export interface WallSegment {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  voltage: number;
}

export interface RodVisual {
  x: number;
  y: number;
  r: number;
  phase: number;
}

export interface ChamberVisualData {
  halfWidth: number;
  halfHeight: number;
  electrodes: WallSegment[];
  rods?: RodVisual[];
}

export interface ImpactFlash {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  color: string;
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private decayAlpha: number = 0.18;
  private hudOverlay: HudOverlay = new HudOverlay();
  private fieldVisualizer: FieldVisualizer = new FieldVisualizer();
  private impacts: ImpactFlash[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) {
      throw new Error('Nu s-a putut inițializa contextul 2D al canvasului.');
    }
    this.ctx = ctx;
  }

  public setDecay(alpha: number): void {
    this.decayAlpha = Math.max(0.01, Math.min(1.0, alpha));
  }

  public addImpactFlash(x: number, y: number, neutralized: boolean = false): void {
    if (this.impacts.length > 60) {
      this.impacts.shift(); // Evităm acumularea excesivă
    }
    this.impacts.push({
      x,
      y,
      life: 0.22, // secunde
      maxLife: 0.22,
      color: neutralized ? '#ff1744' : '#00e5ff',
    });
  }

  public exportScreenshot(filenamePrefix: string = 'ReflexIon-capture'): void {
    const dataUrl = this.canvas.toDataURL('image/png');
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const filename = `${filenamePrefix}_${timestamp}.png`;

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  public resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    const w = Math.floor(rect.width * dpr);
    const h = Math.floor(rect.height * dpr);

    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.clearBackground();
    }
  }

  public clearBackground(): void {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillStyle = '#06070a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  }

  public render(
    pool: ParticlePool,
    chamber: ChamberVisualData,
    maxSpeedRef: number = 0.5,
    fieldQuery?: FieldQuery,
    showFieldGrid: boolean = false,
    frameDt: number = 1 / 60,
  ): void {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = `rgba(6, 7, 10, ${this.decayAlpha})`;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    const scaleX = (w * 0.88) / (chamber.halfWidth * 2);
    const scaleY = (h * 0.88) / (chamber.halfHeight * 2);
    const scale = Math.min(scaleX, scaleY);
    const cx = w * 0.5;
    const cy = h * 0.5;

    const toScreenX = (x: number): number => cx + x * scale;
    const toScreenY = (y: number): number => cy - y * scale;

    // 1. Randare opțională a grilei de vectori ai câmpului electric
    if (showFieldGrid && fieldQuery) {
      this.fieldVisualizer.render(
        ctx,
        scale,
        cx,
        cy,
        chamber.halfWidth,
        chamber.halfHeight,
        fieldQuery,
        22,
      );
    }

    // 2. Randare pereți / electrozi
    ctx.lineCap = 'round';
    for (let i = 0; i < chamber.electrodes.length; i++) {
      const el = chamber.electrodes[i];
      const sx1 = toScreenX(el.x1);
      const sy1 = toScreenY(el.y1);
      const sx2 = toScreenX(el.x2);
      const sy2 = toScreenY(el.y2);

      const isPositive = el.voltage > 0;
      const isNeutral = Math.abs(el.voltage) < 1e-3;

      const strokeColor = isNeutral
        ? '#3a4454'
        : isPositive
        ? '#00e5ff'
        : '#ff1744';

      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = strokeColor;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(sx1, sy1);
      ctx.lineTo(sx2, sy2);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Randare tije Capcană Paul
    if (chamber.rods && chamber.rods.length > 0) {
      for (let i = 0; i < chamber.rods.length; i++) {
        const rod = chamber.rods[i];
        const rx = toScreenX(rod.x);
        const ry = toScreenY(rod.y);
        const radiusPx = Math.max(3, rod.r * scale);
        const isPhasePos = rod.phase > 0;
        const rodColor = isPhasePos ? '#00e5ff' : '#d500f9';

        ctx.save();
        ctx.shadowBlur = 12;
        ctx.shadowColor = rodColor;
        ctx.fillStyle = rodColor;
        ctx.beginPath();
        ctx.arc(rx, ry, radiusPx, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(rx, ry, radiusPx * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // 4. Randare străfulgerări de impact pe pereți (Wall Impact Flashes)
    if (this.impacts.length > 0) {
      for (let i = this.impacts.length - 1; i >= 0; i--) {
        const imp = this.impacts[i];
        const sx = toScreenX(imp.x);
        const sy = toScreenY(imp.y);
        const progress = Math.max(0, imp.life / imp.maxLife);
        const radius = Math.max(3, 3.0 + (1.0 - progress) * 8.0);

        ctx.save();
        ctx.shadowBlur = 16;
        ctx.shadowColor = imp.color;
        ctx.fillStyle = imp.color;
        ctx.globalAlpha = progress;
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fill();

        // Miez intens alb
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = progress * 0.8;
        ctx.beginPath();
        ctx.arc(sx, sy, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        imp.life -= frameDt;
        if (imp.life <= 0) {
          this.impacts.splice(i, 1);
        }
      }
    }

    // 5. Randare particule (ioni / praf)
    for (let i = 0; i < pool.count; i++) {
      const px = toScreenX(pool.x[i]);
      const py = toScreenY(pool.y[i]);

      const vx = pool.vx[i];
      const vy = pool.vy[i];
      const speed = Math.sqrt(vx * vx + vy * vy);
      const t = Math.min(1.0, speed / (maxSpeedRef || 1.0));

      const col = this.getSpeedColor(t);

      ctx.save();
      ctx.shadowBlur = 8;
      ctx.shadowColor = col;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(px, py, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  public renderHud(metrics: HudMetrics, lang: Language): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.hudOverlay.render(this.ctx, this.canvas.width, this.canvas.height, dpr, metrics, lang);
  }

  private getSpeedColor(t: number): string {
    let r = 0, g = 0, b = 0;
    if (t < 0.5) {
      const f = t * 2.0;
      r = Math.round(0 + 220 * f);
      g = Math.round(240 * (1.0 - f) + 30 * f);
      b = Math.round(255 * (1.0 - f) + 240 * f);
    } else {
      const f = (t - 0.5) * 2.0;
      r = Math.round(220 * (1.0 - f) + 255 * f);
      g = Math.round(30 * (1.0 - f) + 170 * f);
      b = Math.round(240 * (1.0 - f) + 0 * f);
    }
    return `rgb(${r},${g},${b})`;
  }
}
