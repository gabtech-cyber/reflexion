import { getTranslations, type Language } from '../ui/i18n';

export interface HudMetrics {
  fps: number;
  frameTimeMs: number;
  particleCount: number;
  capacity: number;
  meanKineticEnergyEv: number;
  spaceChargeEnabled: boolean;
  chamberLabel: string;
  speciesLabel: string;
  rfInfo?: {
    voltage: number;
    frequencyHz: number;
  };
  visible?: boolean;
}

export class HudOverlay {
  /**
   * Randează un Heads-Up Display vectorial de mare precizie direct pe Canvas.
   */
  public render(
    ctx: CanvasRenderingContext2D,
    _width: number,
    height: number,
    dpr: number,
    metrics: HudMetrics,
    lang: Language = 'ro',
  ): void {
    if (metrics.visible === false) {
      return;
    }

    const tr = getTranslations(lang);

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // ==========================================
    // 1. TOP-LEFT DIAGNOSTIC BOX
    // ==========================================
    const boxX = 14 * dpr;
    const boxY = 14 * dpr;
    const boxW = 270 * dpr;
    const hasRf = !!metrics.rfInfo;
    const boxH = (hasRf ? 134 : 114) * dpr;
    const r = 6 * dpr;

    // Fundal semi-transparent cu bordură cyan neon discretă
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, r);
    ctx.fillStyle = 'rgba(7, 9, 15, 0.82)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.28)';
    ctx.lineWidth = 1 * dpr;
    ctx.stroke();

    // Linie accent neon sus
    ctx.beginPath();
    ctx.moveTo(boxX + r, boxY);
    ctx.lineTo(boxX + boxW - r, boxY);
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.7)';
    ctx.lineWidth = 1.5 * dpr;
    ctx.stroke();

    let curY = boxY + 16 * dpr;
    const textX = boxX + 12 * dpr;

    // Header: REFLEXION DYNAMICS & FPS Badge
    ctx.font = `600 ${10.5 * dpr}px "Segoe UI", Roboto, monospace`;
    ctx.fillStyle = '#00e5ff';
    ctx.fillText(tr.hud.diagnosticsTitle, textX, curY);

    // FPS Counter cu culoare dinamică (verde/cyan dacă >= 55, amber dacă scade)
    const fpsText = `${Math.round(metrics.fps)} ${tr.hud.fps}`;
    const fpsColor = metrics.fps >= 55 ? '#00e676' : metrics.fps >= 30 ? '#ffea00' : '#ff1744';
    ctx.font = `700 ${11 * dpr}px monospace`;
    ctx.fillStyle = fpsColor;
    const fpsW = ctx.measureText(fpsText).width;
    ctx.fillText(fpsText, boxX + boxW - fpsW - 12 * dpr, curY);

    curY += 18 * dpr;

    // Metrica 1: Particule active / Capacitate
    ctx.font = `400 ${11 * dpr}px "Segoe UI", sans-serif`;
    ctx.fillStyle = '#a0aec0';
    ctx.fillText(`${tr.hud.particles}:`, textX, curY);

    ctx.font = `600 ${11 * dpr}px monospace`;
    ctx.fillStyle = '#f7fafc';
    const countVal = `${metrics.particleCount} / ${metrics.capacity}`;
    const countW = ctx.measureText(countVal).width;
    ctx.fillText(countVal, boxX + boxW - countW - 12 * dpr, curY);

    curY += 18 * dpr;

    // Metrica 2: Energie Cinetică Medie (eV)
    ctx.font = `400 ${11 * dpr}px "Segoe UI", sans-serif`;
    ctx.fillStyle = '#a0aec0';
    ctx.fillText(`${tr.hud.meanKineticEnergy}:`, textX, curY);

    ctx.font = `600 ${11 * dpr}px monospace`;
    ctx.fillStyle = '#ffb300';
    const energyVal = `${metrics.meanKineticEnergyEv.toFixed(1)} eV`;
    const energyW = ctx.measureText(energyVal).width;
    ctx.fillText(energyVal, boxX + boxW - energyW - 12 * dpr, curY);

    curY += 18 * dpr;

    // Metrica 3: Stare Sarcină Spațială (Coulomb tag)
    ctx.font = `400 ${11 * dpr}px "Segoe UI", sans-serif`;
    ctx.fillStyle = '#a0aec0';
    ctx.fillText(`${tr.hud.spaceChargeTag}:`, textX, curY);

    const isScOn = metrics.spaceChargeEnabled;
    const scText = isScOn ? `● ${tr.hud.statusOn}` : `○ ${tr.hud.statusOff}`;
    const scColor = isScOn ? '#00e5ff' : '#718096';
    ctx.font = `700 ${10.5 * dpr}px monospace`;
    ctx.fillStyle = scColor;
    const scW = ctx.measureText(scText).width;
    ctx.fillText(scText, boxX + boxW - scW - 12 * dpr, curY);

    // Opțional: Info Cuadrupol RF dacă este activ
    if (hasRf && metrics.rfInfo) {
      curY += 18 * dpr;
      ctx.font = `400 ${11 * dpr}px "Segoe UI", sans-serif`;
      ctx.fillStyle = '#a0aec0';
      ctx.fillText(`${tr.hud.paulTrapRf}:`, textX, curY);

      const rfText = `${Math.round(metrics.rfInfo.voltage)}V @ ${Math.round(metrics.rfInfo.frequencyHz)}Hz`;
      ctx.font = `600 ${10.5 * dpr}px monospace`;
      ctx.fillStyle = '#d500f9';
      const rfW = ctx.measureText(rfText).width;
      ctx.fillText(rfText, boxX + boxW - rfW - 12 * dpr, curY);
    }

    // ==========================================
    // 2. BOTTOM-LEFT KEYBOARD & MOUSE LEGEND
    // ==========================================
    const legendH = 28 * dpr;
    const legendY = height - legendH - 14 * dpr;
    const sc = tr.hud.shortcuts;
    const shortcutText = `${sc.pause}   ${sc.clear}   ${sc.reset}   ${sc.dragAim}   ${sc.toggleUi}   ${sc.screenshot}`;

    ctx.font = `500 ${10.5 * dpr}px "Segoe UI", monospace`;
    const legendW = ctx.measureText(shortcutText).width + 24 * dpr;

    ctx.beginPath();
    ctx.roundRect(boxX, legendY, legendW, legendH, 5 * dpr);
    ctx.fillStyle = 'rgba(7, 9, 15, 0.78)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1 * dpr;
    ctx.stroke();

    ctx.fillStyle = '#cbd5e0';
    ctx.fillText(shortcutText, boxX + 12 * dpr, legendY + 18 * dpr);

    ctx.restore();
  }
}
