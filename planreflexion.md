# ReflexIon — specificație de integrare

> Stare, octombrie 2026: aplicația din `src/` este asamblată. Textul de mai jos este contractul inițial (renderer, panou, hexagon, capcană Paul). Bucla live este `src/main.ts`. Nu mai trata pașii „de făcut” de aici ca pe o listă deschisă.

Simulator 2D în browser: reflexie electrostatică, levitație și capcană Paul. Vite, TypeScript, Canvas 2D, Tweakpane 4.

Documentul acesta este contractul dintre nucleul fizic (deja în `src/`) și cele trei piese care încă lipsesc. Prompturile de la final se copiază una câte una.

## 1. Cum lucrăm

| Piesă | Unde | Cine |
| --- | --- | --- |
| Tipuri, constante, Boris, câmp, pool, sursă, cutie, bucla | `src/core`, `src/physics`, `src/chamber`, `src/main.ts` | scris |
| Renderer neon / plasmă | `src/render/CanvasRenderer.ts` | Gemini |
| Panou Tweakpane | `src/ui/Controls.ts` | Gemini |
| Hexagon și capcană Paul | `src/chamber/shapes.ts` | Gemini |

Gemini creează doar cele trei fișiere. Nu modifică `src/core`, `src/physics`, `src/main.ts` sau `src/chamber/buildChamber.ts`. După ce fișierele sunt pe disc, bucla se leagă de ele: `debugDraw` iese, `mountControls` intră pe `#controls`, iar `buildChamber` primește hexagonul și capcana.

`tweakpane@4.0.5` și `@tweakpane/core@2.0.5` sunt deja în `package.json`. Stilul panoului este injectat de pachet. Nu se adaugă un import de CSS.

## 2. Convenții

Coordonate în metri. Originea este centrul camerei. +x spre dreapta, +y în sus.

`size` este diametrul de încadrare:

- cutie: latura pătratului
- hexagon: distanța dintre vârfuri opuse (2R), cu vârful din dreapta la unghi 0, deci latura de sus este plată
- capcană Paul: distanța dintre centrele tijelor opuse este `2 * size * PAUL_R0_FACTOR`

Gravitația din panou este pozitivă în jos. `9.8` trage spre −y. Integratorul primește această valoare ca `gravityDown`.

Două specii, comutabile:

- **Praf încărcat** (implicit): 1e−12 kg, 1e−15 C. Ceasul fizic urmărește cadrul video, așa că gravitația și reflexia se văd. Viteza de lansare este în m/s.
- **Ion Ar+**: masă 40 u, sarcină +e. Fiecare cadru înaintează 2 µs de timp fizic, în 400 de subpași. Energia de lansare este în eV. Gravitația rămâne în model și este neglijabilă la scara asta, ceea ce e corect pentru un ion.

Pereții resping printr-o pernă gaussiană: `E = (V / L) exp(−d / L)`, cu `L = size * FIELD_DECAY_FACTOR` (`0.03`). Un perete pozitiv împinge o sarcină pozitivă dinspre perete spre interior. Valorile implicite (200 V, praf, 0.35 m/s) au fost verificate numeric: particula lansată din stânga se întoarce, iar una lăsată în centru cade și rămâne deasupra podelei.

Capcana Paul nu folosește perna pentru tijele RF. Câmpul este cuadrupolul

```
V(t) = Vrf cos(ωt)
Ex = −V(t) / r0² · x
Ey = +V(t) / r0² · y
```

cu `r0 = size * PAUL_R0_FACTOR`. Tijele sunt doar geometria desenată. Fazele +1 (est, vest) și −1 (nord, sud) trebuie să folosească aceeași constantă, altfel tijele nu stau pe câmp.

## 3. Fișiere

```text
reflexion/
├── index.html
├── package.json
├── src/
│   ├── main.ts                      # bucla, taste Spațiu / C / R
│   ├── core/Types.ts                # contractul comun
│   ├── core/Constants.ts            # specii, tensiuni, PAUL_R0_FACTOR
│   ├── physics/BorisIntegrator.ts
│   ├── physics/ElectricFieldSolver.ts
│   ├── physics/ParticlePool.ts
│   ├── chamber/box.ts
│   ├── chamber/buildChamber.ts      # hexagon și paul se leagă aici
│   ├── chamber/shapes.ts            # LIPSEȘTE
│   ├── render/debugDraw.ts          # desen temporar, va fi înlocuit
│   ├── render/CanvasRenderer.ts     # LIPSEȘTE
│   └── ui/Controls.ts               # LIPSEȘTE
```

Starea panoului este obiectul `SimControlState` din `src/core/Types.ts`. Bucla îl mută deja. Panoul îl leagă pe loc, fără copie.

## 4. Pachet pentru Gemini

Fiecare bloc de mai jos este un prompt întreg. Se trimite separat. Răspunsul așteptat este un singur fișier, salvat la calea din titlu.

### 4.1 `src/render/CanvasRenderer.ts`

```markdown
Scrie un singur fișier, `src/render/CanvasRenderer.ts`, pentru proiectul ReflexIon (Vite + TypeScript). Nu modifica alte fișiere. Nu adăuga dependențe. Nu folosi WebGL.

Importă doar tipuri:

import type { Electrode, FrameInput, Viewport } from '../core/Types';

Exportă clasa `CanvasRenderer` cu metodele:

- constructor(host: HTMLElement)
- setViewport(viewport: Viewport): void
- frame(input: FrameInput): void
- dispose(): void

Clasa nu pornește requestAnimationFrame și nu scrie text.

### Canvas

- Creează un canvas vizibil și dă-i appendChild în host. Nu goli host: există deja un div `#hud`.
- Creează un al doilea canvas, neatașat, pentru urma fosforescentă.
- canvas-ul vizibil are style width/height 100%. Backing store-ul este cssWidth × min(devicePixelRatio, 2). La fel trail-ul.
- Un ResizeObserver pe host reface backing store-ul. Setarea width/height golește ambele canvasuri.
- setViewport păstrează dreptunghiul în metri și golește trail-ul, ca urmele vechi să nu rămână întinse. Viewport implicit: min/max ±0.0144 pe ambele axe.

### Mapare

+y este în sus.

sx = (x - minX) / (maxX - minX) * width
sy = (maxY - y) / (maxY - minY) * height

### Ordinea unui cadru

1. Pe trail, `globalCompositeOperation = 'destination-out'` și un fillRect pe toată suprafața cu `rgba(0,0,0, trailDecay)`.
2. Pe trail, `globalCompositeOperation = 'lighter'`. Desenează particulele. Nu le desena pe canvasul vizibil.
3. Pe canvasul vizibil: umple `#07060b`, apoi drawImage cu trail-ul.
4. Dacă `style.showWalls`, desenează electrozii pe canvasul vizibil.
5. Dacă `style.showVectors` și `input.field` există, desenează vectorii tot pe canvasul vizibil.

Vectorii și pereții nu intră în trail. Altfel rămân aprinși după ce utilizatorul îi închide.

### Particule

Fără `shadowBlur` și fără obiecte noi în bucla de particule. Construiește o singură dată o paletă de 24 de culori.

Viteza normalizată t = min(1, hypot(vx, vy) / style.speedScale). Indexul din paletă este t * 23.

Rampa, t = 0 → 1: cyan `#3ee0ff`, magenta `#ff3ec8` la 0.5, amber `#ffb020`. Pentru q < 0, cyan și amber sunt inversate.

Două treceri aditive pe trail:

- rază mare, circa 4.5 px înmulțit cu (0.45 + 0.55 * glow), alpha 0.16
- rază mică, circa 1.6 px, alpha 0.92

### Electrozi

Pereții (`kind === 'wall'`) sunt linii de 2 px. Culoarea după tensiune: ≤ −1 V albastru `#3aa0ff`, între −1 și 1 gri `#5c5670`, ≥ 1 V roșu `#ff4d6a`. `shadowBlur` este permis aici, circa 16 * glow, pentru că sunt puțini.

Tijele (`kind === 'rod'`) sunt cercuri cu centrul (x1, y1). Raza în pixeli este `radius / (maxX - minX) * width`, minim 3 px.

Culoarea tijei după `rfPhase`: +1 magenta `#ff3ec8`, −1 cyan `#3ee0ff`, 0 aceeași mapare de tensiune ca la pereți.

Pulsul vizual, doar dacă rfPhase ≠ 0 și rfAmplitude ≥ 1:

visualHz = min(rfFrequencyHz, 2)
wave = cos(2π * visualHz * timeSec)
alpha = 0.35 + 0.65 * (0.5 + 0.5 * rfPhase * wave)

Frecvența fizică poate fi de sute de hertzi sau megahertzi. Pulsul desenat este plafonat la 2 Hz ca perechile de tije să se vadă. Nu folosi frecvența reală în cosinusul desenat.

### Vectori

Grilă `style.vectorGrid` × `style.vectorGrid` (dacă lipsește sau e 0, folosește 18), cu o margine de 8% în interiorul viewport-ului. Sari peste eșantioane cu magnitudine sub 1e-3. Lungimea este `cellPx * 0.45 * tanh(magnitudine / 5000)`, direcția lui E. Linie de 1 px, `rgba(180, 190, 220, 0.45)`.

dispose deconectează observer-ul și scoate canvasul vizibil din host.
```

### 4.2 `src/ui/Controls.ts`

```markdown
Scrie un singur fișier, `src/ui/Controls.ts`. Nu modifica alte fișiere. Nu adăuga dependențe. Nu importa CSS: Tweakpane 4.0.5 își injectează stilul din JavaScript.

import { Pane } from 'tweakpane';
import type {
  ControlHooks,
  ControlsHandle,
  ElectrodeControl,
  SimControlState,
  SpeciesSliderRange,
} from '../core/Types';

Exportă:

export function mountControls(
  container: HTMLElement,
  state: SimControlState,
  hooks: ControlHooks,
): ControlsHandle

Obiectul `state` vine deja umplut. Nu îi reseta valorile. Tweakpane scrie direct în el. La fiecare schimbare de binding apelează `hooks.onChange(cheie)` cu cheia din `SimControlState`. Butoanele apelează `hooks.onReset` și `hooks.onClearParticles`. Nu reconstrui camera și nu atinge particulele: asta o face bucla, în onChange.

const pane = new Pane({ container, expanded: true });
pane.element.style.width = '100%';

Foldere, în ordinea asta, titluri în română:

Simulare
- paused, label „Pauză”
- buton „Reset” → hooks.onReset
- buton „Șterge” → hooks.onClearParticles

Sursă
- speciesId, label „Specie”, options: „Praf încărcat” = dust, „Ion Ar+” = ar-ion
- emissionRate, „Rată”, min 0, max 2000, step 1
- launchSpeed, „Viteză”, min 0.05, max 4, step 0.01
- energyEv, „Energie eV”, min 1, max 2000, step 1, hidden: true
- angularSpreadDeg, „Dispersie”, min 0, max 60, step 0.5
- lifetimeSec, „Viață”, min 0.2, max 20, step 0.1
- emitterOrigin, „Origine”, options: „Stânga” = left, „Centru” = center
- emitterAngleDeg, „Unghi”, min -180, max 180, step 1

Cameră
- chamberId, „Formă”, options: „Cutie” = box, „Hexagon” = hexagon, „Capcană Paul” = paul-trap
- chamberSizeM, „Latură”, min 0.008, max 0.08, step 0.001
- un subfolder „Electrozi”

Câmp
- gravity, „Gravitație”, min -20, max 20, step 0.1
- magneticField, „Câmp B”, min -0.5, max 0.5, step 0.001
- rfAmplitude, „Amplitudine RF”, min 0, max 1000, step 1
- rfFrequencyHz, „Frecvență RF”, min 5, max 2000, step 1

Imagine
- trailDecay, „Persistență”, min 0.02, max 0.35, step 0.005
- glow, „Strălucire”, min 0, max 1, step 0.01
- showVectors, „Vectori de câmp”
- showWalls, „Pereți”

Păstrează referințe la binding-urile launchSpeed, energyEv și rfFrequencyHz, și la folderul de electrozi.

refreshElectrodes(list):
- dispose pe folderul de electrozi și creează-l din nou, titlu „Electrozi”, în același loc logic (sub Cameră).
- pentru fiecare element din list, addBinding pe obiectul primit, cheia `voltage`, label = element.label, min -1000, max 1000, step 1.
- la change: hooks.onChange('electrodes').
- leagă obiectele din list, nu copii. Lista este chiar state.electrodes.

refreshSpecies(ranges: SpeciesSliderRange):
- dispose pe cele trei binding-uri și recreează-le în folderul Sursă (viteză, energie) și în folderul Câmp (frecvența), cu min, max, step și hidden din ranges.
- valorile numerice rămân cele deja scrise în state. Nu le modifica.
- relaunch binding-ul tot cu hooks.onChange pe cheia lui.

La mount, construiește electrozii din state.electrodes dacă lista are elemente.

dispose pe handle apelează pane.dispose().

API Tweakpane 4: addFolder({ title }), addBinding(obj, key, params), addButton({ title }), binding.on('change', ...), button.on('click', ...), blade.dispose(). Parametrul de interval este `min` / `max` / `step`, nu range. Opțiunile de listă sunt `{ Label: 'value' }`.
```

### 4.3 `src/chamber/shapes.ts`

```markdown
Scrie un singur fișier, `src/chamber/shapes.ts`. Nu modifica alte fișiere. Nu calcula forțe și nu importa solverul. Geometria este în metri, originea în centru, +x dreapta, +y sus.

import {
  DEFAULT_VOLTAGE,
  PAUL_R0_FACTOR,
  PAUL_ROD_RADIUS_FACTOR,
} from '../core/Constants';
import type { Electrode } from '../core/Types';

Exportă `buildHexagon(size: number): Electrode[]` și `buildPaulTrap(size: number): Electrode[]`.

Hexagon regulat, vârf la dreapta (unghi 0), deci latura de sus este plată. R = size / 2. Șase segmente, i de la 0 la 5:

a0 = i * π / 3
a1 = (i + 1) * π / 3
x1, y1 = R cos a0, R sin a0
x2, y2 = R cos a1, R sin a1

id `wall-0` … `wall-5`, label `Latura 1` … `Latura 6`, kind `wall`, radius 0, voltage `DEFAULT_VOLTAGE.hexagon`, rfPhase 0.

Capcană Paul, patru tije:

r0 = size * PAUL_R0_FACTOR
rodRadius = size * PAUL_ROD_RADIUS_FACTOR

- rod-e, Est, centru (r0, 0), rfPhase +1
- rod-w, Vest, centru (−r0, 0), rfPhase +1
- rod-n, Nord, centru (0, r0), rfPhase −1
- rod-s, Sud, centru (0, −r0), rfPhase −1

kind `rod`. x1, y1 și x2, y2 sunt centrul. radius este rodRadius. voltage este `DEFAULT_VOLTAGE.paulDc`.

rfPhase este numărul -1 | 0 | 1, nu un string. Folosește factorii importați: distanța dintre tije trebuie să coincidă cu r0-ul din solver.
```
