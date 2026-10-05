import { getTranslations, onLanguageChange, type Language } from './i18n';

export class InfoModal {
  private backdropEl: HTMLElement;
  private cardEl: HTMLElement;
  private isOpen = false;
  private currentLang: Language;

  constructor(initialLang: Language = 'ro') {
    this.currentLang = initialLang;

    // Creare elemente în DOM dacă nu există
    this.backdropEl = document.createElement('div');
    this.backdropEl.id = 'info-modal-backdrop';
    this.backdropEl.className = 'info-modal-backdrop';

    this.cardEl = document.createElement('div');
    this.cardEl.className = 'info-modal-card';
    this.backdropEl.appendChild(this.cardEl);

    document.body.appendChild(this.backdropEl);

    this.renderContent();

    // Ascultători evenimente de închidere
    this.backdropEl.addEventListener('click', (e) => {
      if (e.target === this.backdropEl) {
        this.close();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Actualizare automată când se schimbă limba
    onLanguageChange((newLang) => {
      this.currentLang = newLang;
      this.renderContent();
    });
  }

  public open(): void {
    this.isOpen = true;
    this.backdropEl.classList.add('active');
  }

  public close(): void {
    this.isOpen = false;
    this.backdropEl.classList.remove('active');
  }

  public modalOpen(): boolean {
    return this.isOpen;
  }

  public toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  private renderContent(): void {
    const tr = getTranslations(this.currentLang);
    const g = tr.guide;

    this.cardEl.innerHTML = `
      <div class="modal-header">
        <div class="modal-title-group">
          <div class="modal-badge">PHYSICS MANUAL</div>
          <h2>${g.modalTitle}</h2>
        </div>
        <button class="modal-close-btn" aria-label="Close" title="${g.closeBtn}">&times;</button>
      </div>

      <div class="modal-body">
        <section class="modal-section">
          <h3>
            <span class="sec-num">01</span>
            ${g.sections.reflectionTitle}
          </h3>
          <p>${g.sections.reflectionText}</p>
        </section>

        <section class="modal-section">
          <h3>
            <span class="sec-num">02</span>
            ${g.sections.paulTrapTitle}
          </h3>
          <p>${g.sections.paulTrapText}</p>
        </section>

        <section class="modal-section">
          <h3>
            <span class="sec-num">03</span>
            ${g.sections.spaceChargeTitle}
          </h3>
          <p>${g.sections.spaceChargeText}</p>
        </section>

        <section class="modal-section">
          <h3>
            <span class="sec-num">04</span>
            ${g.sections.controlsTitle}
          </h3>
          <p style="white-space: pre-line;">${g.sections.controlsText}</p>
        </section>
      </div>

      <div class="modal-footer">
        <button class="modal-action-btn">${g.gotItBtn}</button>
      </div>
    `;

    // Re-legare butoane
    const closeBtn = this.cardEl.querySelector('.modal-close-btn');
    closeBtn?.addEventListener('click', () => this.close());

    const actionBtn = this.cardEl.querySelector('.modal-action-btn');
    actionBtn?.addEventListener('click', () => this.close());
  }
}
