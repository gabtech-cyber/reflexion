# ReflexIon ⚡

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Canvas 2D](https://img.shields.io/badge/Rendering-Canvas_2D_High--DPI-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
[![License: MIT](https://img.shields.io/badge/License-MIT-00E5FF?style=for-the-badge)](LICENSE)

> **High-precision ion reflection, electrostatic levitation, and plasma dynamics simulator in the browser.**

ReflexIon is an interactive, browser-based plasma and charged particle physics simulator built in pure TypeScript. It models real-time ion beam dynamics, collective space-charge Coulomb interactions, electrostatic sheath reflection, and dynamic radiofrequency (RF) quadrupole confinement (Paul trap), with a pool of 8,000 particles and a cell-list Coulomb solver once a few hundred are in flight.

---

## 🌟 Key Features

- **Symplectic Boris-Buneman Integrator**: Energy-conserving step integration decoupled into electrostatic half-accelerations and a pure rotation under uniform transverse magnetic fields ($B_z$), preventing artificial energy drift in cyclotron orbits.
- **Space-Charge Coulomb Repulsion**: True inter-particle electrostatics ($N$-body collective plasma effects) accelerated via a 2D cell-list once more than 400 particles are active. Pairs farther than a few cells are skipped at that size; smaller beams use the full pair loop.
- **Electrostatic Wall Cushion & Inelastic Scattering**: Particles decelerate and reflect smoothly before physical electrode contact whenever their kinetic energy is lower than the potential barrier ($q V_0$). A particle that still reaches the wall bounces inelastically (restitution 0.85) when the wall repels it, and neutralizes with a flash when the wall does not.
- **Radiofrequency (RF) Paul Trap Confinement**: Dynamic alternating quadrupole fields creating an effective pseudopotential well $\Phi_\text{eff}$, overcoming Earnshaw's theorem to stably trap charged species in vacuum.
- **1-Click Scientific Presets**:
  - 🧲 **Levitation**: Stable electrostatic anti-gravity balance for micro-dust in static fields.
  - 🪞 **Electrostatic Mirror**: High-velocity Ar+ ion beam reflecting off positively biased walls.
  - ⚛️ **Paul Trap**: RF quadrupole confinement at resonance frequency.
  - 💥 **Coulomb Explosion**: Dense cluster instantaneous radial blast driven purely by space-charge repulsion.
- **High-DPI Phosphor Trails & Plasma Color Ramp**: Sub-pixel canvas rendering with persistence decay and speed-mapped color ramp (cyan `rgb(0, 240, 255)` $\to$ magenta $\to$ amber `rgb(255, 170, 0)`).
- **Comprehensive Bilingual Support (RO / EN)**: Real-time language switching across the entire UI, including HUD diagnostics, parameter controls, and the embedded physics theory modal.
- **Interactive In-Canvas HUD & Theory Modal**: Live telemetry displaying FPS, active particle count, mean kinetic energy in electronvolts (eV), RF frequency/amplitude, and an in-depth physics documentation overlay.
- **Built-in HD Screenshot Exporter**: Export high-resolution, uncompressed PNG snapshots of the current simulation state with a single keystroke.

---

## 📐 Mathematical Formulation

### 1. Lorentz Force & The Boris Algorithm

The equation of motion for a particle with charge $q$ and mass $m$ subjected to an electric field $\mathbf{E}$ and a magnetic field $\mathbf{B} = (0, 0, B_z)$ is:

$$\mathbf{F} = m \frac{d\mathbf{v}}{dt} = q \left(\mathbf{E} + \mathbf{v} \times \mathbf{B}\right) + m \mathbf{g}$$

The Boris method splits the velocity update across time step $\Delta t$ into three distinct geometric steps:

1. **First electrostatic half-kick**:
   $$\mathbf{v}^- = \mathbf{v}_n + \frac{q \mathbf{E} + m \mathbf{g}}{2m} \Delta t$$

2. **Magnetic rotation** via vectors $\mathbf{t}$ and $\mathbf{s}$:
   $$\mathbf{t} = \frac{q \mathbf{B}}{2m} \Delta t$$
   $$\mathbf{v}' = \mathbf{v}^- + \mathbf{v}^- \times \mathbf{t}$$
   $$\mathbf{s} = \frac{2 \mathbf{t}}{1 + |\mathbf{t}|^2}$$
   $$\mathbf{v}^+ = \mathbf{v}^- + \mathbf{v}' \times \mathbf{s}$$

3. **Second electrostatic half-kick**:
   $$\mathbf{v}_{n+1} = \mathbf{v}^+ + \frac{q \mathbf{E} + m \mathbf{g}}{2m} \Delta t$$

4. **Position leapfrog**:
   $$\mathbf{x}_{n+1} = \mathbf{x}_n + \mathbf{v}_{n+1} \Delta t$$

### 2. Space-Charge Coulomb Repulsion with Softening

Collective inter-particle forces between particles $i$ and $j$ are calculated using Coulomb's law regularized with a Plummer-style softening parameter $\varepsilon$ (default: $0.5\text{ mm}$):

$$\mathbf{F}_{ij} = \frac{1}{4\pi\varepsilon_0} \frac{q_i q_j}{\left(r_{ij}^2 + \varepsilon^2\right)^{3/2}} \mathbf{r}_{ij}$$

where $\mathbf{r}_{ij} = \mathbf{r}_i - \mathbf{r}_j$ and $r_{ij} = |\mathbf{r}_{ij}|$. The softening length $\varepsilon$ prevents numerical singularities during close Coulomb encounters while preserving macro-scale collective plasma oscillations.

### 3. Paul Trap Quadrupole Pseudopotential

With alternating electrode potentials $V(t) = V_0 \cos(\Omega t)$, the time-averaged effective potential (pseudopotential) confining ions in the center is given by:

$$\Phi_\text{eff}(r) = \frac{q V_0^2}{4 m \Omega^2 r_0^4} r^2$$

where $r_0$ is the characteristic radius of the trap and $\Omega = 2\pi f$ is the angular RF drive frequency.

---

## 🚀 Quickstart & Local Development

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0 or higher recommended)
- `npm` or `pnpm`

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/reflexion.git
cd reflexion

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

Open your browser at `http://localhost:5173/` to interact with the simulation.

### Production Build

```bash
# Typecheck and build optimized static assets
npm run build

# Preview the production build locally
npm run preview
```

The compiled static assets are located in the `dist/` directory.

---

## 🎮 Controls & Keyboard Shortcuts

| Shortcut / Action | Function | Descriere (RO) |
| :--- | :--- | :--- |
| **`[Space]`** | Pause / Resume simulation | Pune pauză sau reia simularea |
| **`[C]`** | Clear all particles | Șterge instantaneu toți particulele |
| **`[R]`** | Reset defaults & chamber | Resetează starea și parametrii camerei |
| **`[S]`** | Capture HD Screenshot (`.png`) | Exportă o captură de ecran la rezoluție maximă |
| **`[H]`** | Toggle Zen / Presentation Mode | Ascunde / afișează panoul de control și HUD-ul |
| **`[Esc]`** | Close Theory & Guide Modal | Închide fereastra modală cu ghidul teoretic |
| **Click & Drag (Mouse/Touch)** | Directed Ion Gun Aiming | Tun de ioni direcționat activ spre poziția cursorului |

---

## 🌐 Deployment Guide

Because ReflexIon compiles into completely self-contained static assets (`HTML`, `CSS`, and vanilla `JS`), it can be hosted instantly on any static edge provider:

### Vercel
```bash
npx vercel deploy --prod
```
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Netlify
```bash
npx netlify deploy --prod --dir=dist
```
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`

### Cloudflare Pages
1. Connect your repository in the Cloudflare Dashboard.
2. Set **Framework preset** to `Vite`.
3. Set **Build command** to `npm run build`.
4. Set **Build output directory** to `dist`.

---

## 📄 License

This project is open-source under the terms of the [MIT License](LICENSE).
