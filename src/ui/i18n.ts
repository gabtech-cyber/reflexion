export type Language = 'ro' | 'en';

export interface Translations {
  appTitle: string;
  languageSelect: string;
  folders: {
    environment: string;
    particles: string;
    plasma: string;
    rendering: string;
    actions: string;
  };
  shapes: {
    box: string;
    hexagon: string;
    paulTrap: string;
  };
  species: {
    dust: string;
    argon: string;
  };
  presets: {
    title: string;
    custom: string;
    levitation: string;
    mirror: string;
    paulTrap: string;
    coulombExplosion: string;
  };
  labels: {
    preset: string;
    chamberShape: string;
    wallVoltage: string;
    magneticBz: string;
    gravity: string;
    rfAmplitude: string;
    ionSpecies: string;
    emissionRate: string;
    beamEnergy: string;
    mouseHint: string;
    mouseHintValue: string;
    spaceCharge: string;
    softening: string;
    thermalJitter: string;
    uiScale: string;
    showFieldGrid: string;
    decayAlpha: string;
    paused: string;
    clear: string;
    reset: string;
    screenshot: string;
    openGuide: string;
  };
  scales: {
    compact: string;
    standard: string;
    large: string;
  };
  hud: {
    diagnosticsTitle: string;
    fps: string;
    particles: string;
    capacity: string;
    meanKineticEnergy: string;
    spaceChargeTag: string;
    statusOn: string;
    statusOff: string;
    paulTrapRf: string;
    shortcuts: {
      pause: string;
      clear: string;
      reset: string;
      dragAim: string;
      toggleUi: string;
      screenshot: string;
    };
  };
  guide: {
    modalTitle: string;
    closeBtn: string;
    gotItBtn: string;
    sections: {
      reflectionTitle: string;
      reflectionText: string;
      paulTrapTitle: string;
      paulTrapText: string;
      spaceChargeTitle: string;
      spaceChargeText: string;
      controlsTitle: string;
      controlsText: string;
    };
  };
}

export const DICTIONARY: Record<Language, Translations> = {
  ro: {
    appTitle: 'ReflexIon — Panou Control',
    languageSelect: 'Limbă / Language',
    folders: {
      environment: 'Incintă & Câmpuri',
      particles: 'Fascicul & Emisie',
      plasma: 'Fizică Plasmă & Coulomb',
      rendering: 'Randare & Motor',
      actions: 'Comenzi Rapide',
    },
    shapes: {
      box: 'Cameră Dreptunghiulară',
      hexagon: 'Cavitate Hexagonală',
      paulTrap: 'Capcană Paul (Cuadrupol)',
    },
    species: {
      dust: 'Praf Încărcat (Levitație)',
      argon: 'Ion Argon (Ar+)',
    },
    presets: {
      title: 'Scenariu Științific',
      custom: '— Personalizat —',
      levitation: 'Levitație Electrostatică (Praf)',
      mirror: 'Oglindă Electrostatică (Ion Ar+)',
      paulTrap: 'Capcană Paul (Cuadrupol RF)',
      coulombExplosion: 'Explozie Coulomb (Sarcină Spațială)',
    },
    labels: {
      preset: 'Scenariu Preset',
      chamberShape: 'Geometrie Incintă',
      wallVoltage: 'Tensiune Pereți (V)',
      magneticBz: 'Câmp Magnetic Bz (T)',
      gravity: 'Gravitație (+jos, -sus)',
      rfAmplitude: 'Amplitudine RF (V)',
      ionSpecies: 'Specie Particule',
      emissionRate: 'Rată Emisie (part/s)',
      beamEnergy: 'Energie Fascicul (eV)',
      mouseHint: 'Control Cursor',
      mouseHintValue: 'Click/Trage pt Fascicul',
      spaceCharge: 'Sarcină Spațială (Coulomb)',
      softening: 'Amortizare Coulomb (mm)',
      thermalJitter: 'Agitație Termică (m/s)',
      uiScale: 'Dimensiune Panou UI',
      showFieldGrid: 'Vectori Câmp Electric (E)',
      decayAlpha: 'Persistență Fosfor',
      paused: 'Pauză (Spațiu)',
      clear: 'Curăță Particule (C)',
      reset: 'Resetează Tot (R)',
      screenshot: 'Capturează Imagine HD (S)',
      openGuide: 'Ghid & Fizică',
    },
    scales: {
      compact: 'Compact (340px)',
      standard: 'Standard (400px)',
      large: 'Mare (460px)',
    },
    hud: {
      diagnosticsTitle: 'REFLEXION DYNAMICS',
      fps: 'FPS',
      particles: 'Ioni Activi',
      capacity: 'Capacitate',
      meanKineticEnergy: 'Energie Cinetică Medie',
      spaceChargeTag: 'SARCINĂ SPAȚIALĂ',
      statusOn: 'ACTIV',
      statusOff: 'OPRIT',
      paulTrapRf: 'Cuadrupol RF',
      shortcuts: {
        pause: '[Spațiu] Pauză',
        clear: '[C] Curățare',
        reset: '[R] Reset',
        dragAim: '[Click/Trage] Tun Ioni',
        toggleUi: '[H] Ascunde UI',
        screenshot: '[S] Captură HD',
      },
    },
    guide: {
      modalTitle: 'ReflexIon — Ghid Teoretic & Manual Fizic',
      closeBtn: 'Închide (ESC)',
      gotItBtn: 'Am înțeles, revin la simulare',
      sections: {
        reflectionTitle: '1. Reflexia Electrostatică & Bariera de Potențial',
        reflectionText:
          'Câmpul electric creat de electrozii polarizați generează o pernă de potențial la marginea incintei. Ionii pozitivi cu energie cinetică sub q·Vwall sunt respinși conservativ (E_total = const). Dacă energia cinetică depășește bariera, particula străpunge perna și lovește peretele mecanic: unde suferă împrăștiere inelastică cu pierdere parțială de energie (e = 0.85) sau se neutralizează cu o scânteie luminoasă.',
        paulTrapTitle: '2. Capcana Paul & Confinarea Cuadrupolară RF',
        paulTrapText:
          'Teorema lui Earnshaw demonstrează că o sarcină nu poate fi menținută stabil în 3D doar prin câmpuri electrostatice statice (Laplacian(V) = 0). Capcana Paul depășește această limită aplicând o tensiune radio-frecvență alternantă V(t) = V0·cos(Ωt) pe 4 tije cilindrice. Rezultă un pseudopotențial efectiv care forțează ionii spre centrul geometric printr-o mișcare micrometrică rapidă (micromotion) și o oscilație seculară stabilă.',
        spaceChargeTitle: '3. Efectul Sarcinii Spațiale (Repulsia Coulomb)',
        spaceChargeText:
          'Fiecare particulă interacționează electrostatic cu toate celelalte prin forța Coulomb: F_ij = k_e·(q_i·q_j) / (r_ij^2 + ε^2). Parametrul de amortizare (softening ε = 0.5 mm) previne forțele infinite la coliziuni directe. Peste 400 de particule, forța se calculează doar față de vecinii din grila spațială. La densități mari, repulsia provoacă expansiunea radială a fasciculelor și explozii coulombiene.',
        controlsTitle: '4. Interacțiune, Mouse & Comenzi Rapide',
        controlsText:
          '• Click / Drag pe ecran: Lansează un fascicul colimat de ioni direcționat spre cursor cu energia setată în panou.\n• [Spațiu]: Pune pauză / Reia simularea.\n• [C]: Curăță particulele active din incintă.\n• [R]: Resetează toți parametrii fizici.\n• [H]: Mod Zen (ascunde/afișează interfața și HUD-ul).\n• [S]: Capturează o imagine HD a simulării curente.',
      },
    },
  },
  en: {
    appTitle: 'ReflexIon — Control Panel',
    languageSelect: 'Language / Limbă',
    folders: {
      environment: 'Environment & Fields',
      particles: 'Particle Beam & Injection',
      plasma: 'Plasma Physics & Coulomb',
      rendering: 'Rendering & Engine',
      actions: 'Quick Actions',
    },
    shapes: {
      box: 'Rectangular Chamber',
      hexagon: 'Hexagonal Cavity',
      paulTrap: 'Paul Trap (Quadrupole)',
    },
    species: {
      dust: 'Charged Dust (Levitation)',
      argon: 'Argon Ion (Ar+)',
    },
    presets: {
      title: 'Scientific Preset',
      custom: '— Custom —',
      levitation: 'Electrostatic Levitation (Dust)',
      mirror: 'Electrostatic Mirror (Ar+ Ion)',
      paulTrap: 'Paul Trap (Quadrupole RF)',
      coulombExplosion: 'Coulomb Explosion (Space-Charge)',
    },
    labels: {
      preset: 'Preset Scenario',
      chamberShape: 'Chamber Geometry',
      wallVoltage: 'Wall Potential (V)',
      magneticBz: 'Magnetic Field Bz (T)',
      gravity: 'Gravity (+down, -up)',
      rfAmplitude: 'RF Amplitude (V)',
      ionSpecies: 'Particle Species',
      emissionRate: 'Emission Rate (part/s)',
      beamEnergy: 'Beam Energy (eV)',
      mouseHint: 'Cursor Control',
      mouseHintValue: 'Click/Drag to Fire',
      spaceCharge: 'Space-Charge (Coulomb)',
      softening: 'Coulomb Softening (mm)',
      thermalJitter: 'Thermal Jitter (m/s)',
      uiScale: 'UI Panel Scale',
      showFieldGrid: 'Electric Field Vectors (E)',
      decayAlpha: 'Phosphor Decay',
      paused: 'Pause (Space)',
      clear: 'Clear Particles (C)',
      reset: 'Reset All (R)',
      screenshot: 'Export HD Screenshot (S)',
      openGuide: 'Guide & Physics',
    },
    scales: {
      compact: 'Compact (340px)',
      standard: 'Standard (400px)',
      large: 'Large (460px)',
    },
    hud: {
      diagnosticsTitle: 'REFLEXION DYNAMICS',
      fps: 'FPS',
      particles: 'Active Ions',
      capacity: 'Capacity',
      meanKineticEnergy: 'Mean Kinetic Energy',
      spaceChargeTag: 'SPACE-CHARGE',
      statusOn: 'ON',
      statusOff: 'OFF',
      paulTrapRf: 'Quadrupole RF',
      shortcuts: {
        pause: '[Space] Pause',
        clear: '[C] Clear',
        reset: '[R] Reset',
        dragAim: '[Click/Drag] Aim Gun',
        toggleUi: '[H] Hide UI',
        screenshot: '[S] Screenshot',
      },
    },
    guide: {
      modalTitle: 'ReflexIon — Physics Theory & User Manual',
      closeBtn: 'Close (ESC)',
      gotItBtn: 'Understood, back to simulation',
      sections: {
        reflectionTitle: '1. Electrostatic Reflection & Potential Barrier',
        reflectionText:
          'Biased wall electrodes set up a continuous exponential potential cushion. Positive ions possessing kinetic energy lower than q·Vwall are specularly deflected due to total energy conservation (E_kin + q·V = const). If particle kinetic energy exceeds the barrier, ions breach the cushion and collide with the wall, undergoing inelastic scattering (restitution e = 0.85) or surface neutralization with an optical burst flash.',
        paulTrapTitle: '2. Paul Trap & Quadrupole RF Confinement',
        paulTrapText:
          'Earnshaw theorem dictates that static electric charges cannot be trapped in a stable 3D equilibrium solely via electrostatic fields (Laplacian(V) = 0). The Paul Trap resolves this by applying a high-frequency alternating radio-frequency potential V(t) = V0·cos(Ωt) to four hyperbolic/cylindrical rods. This generates a dynamic effective pseudopotential that traps ions along the central axis through rapid micromotion and secular oscillations.',
        spaceChargeTitle: '3. Space-Charge Effect (Coulomb Repulsion)',
        spaceChargeText:
          'Every active ion electrostatically repels its peers under Coulomb\'s law: F_ij = k_e·(q_i·q_j) / (r_ij^2 + ε^2). The softening parameter (ε = 0.5 mm) prevents a singularity on a close flyby. Above 400 particles the force is computed only against neighbors in the spatial grid. At high density the repulsion spreads the beam and can drive a Coulomb explosion.',
        controlsTitle: '4. Mouse Gestures & Keyboard Shortcuts',
        controlsText:
          '• Click / Drag on Canvas: Fire a collimated ion beam oriented toward the cursor with calibrated kinetic energy.\n• [Space]: Pause / Resume the simulation engine.\n• [C]: Clear all particles from the chamber.\n• [R]: Reset all parameters to initial calibration.\n• [H]: Zen Presentation Mode (toggle UI and HUD visibility).\n• [S]: Export crisp HD PNG screenshot.',
      },
    },
  },
};

let currentLanguage: Language = 'ro';
const listeners: Array<(lang: Language) => void> = [];

export function getLanguage(): Language {
  return currentLanguage;
}

export function getTranslations(lang: Language = currentLanguage): Translations {
  return DICTIONARY[lang] || DICTIONARY.ro;
}

export function setLanguage(lang: Language): void {
  if (currentLanguage !== lang) {
    currentLanguage = lang;
    for (let i = 0; i < listeners.length; i++) {
      listeners[i](lang);
    }
  }
}

export function onLanguageChange(callback: (lang: Language) => void): () => void {
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}
