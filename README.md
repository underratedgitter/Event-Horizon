# 🌌 Event Horizon

[![Node.js CI](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Tests Passing](https://img.shields.io/badge/tests-95%2F95%20passing-brightgreen.svg?style=for-the-badge&logo=githubactions)](https://github.com/)
[![Rendering Engine](https://img.shields.io/badge/canvas-HTML5%202D%20Retina-00e5ff.svg?style=for-the-badge&logo=html5)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
[![Dependencies](https://img.shields.io/badge/dependencies-0%20Zero-orange.svg?style=for-the-badge)](package.json)
[![Audio](https://img.shields.io/badge/audio-Web%20Audio%20API-a855f7.svg?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)](LICENSE)

> A high-performance, zero-dependency interactive 2D N-body orbital mechanics and astrophysics simulation laboratory. Built with symplectic Velocity Verlet integration, relativistic visuals, real-time conics calculation, and procedural audio synthesis.

---

## 🚀 Interactive Showcase Features

- **Symplectic Velocity Verlet Integrator**: $O(N^2)$ pairwise Newtonian gravity with softening length ($\epsilon = 4.0$) preserving phase-space volume, angular momentum, and orbital energy over hundreds of simulation steps.
- **Dynamic Spacetime Curvature Grid**: Viewport-adaptive 2D coordinate lattice visualizing scalar gravitational potential wells $\Phi(\vec{x})$, visibly sagging and warping in the presence of massive celestial bodies with depth-reactive chromatic grading.
- **Tactical Aerospace Targeting Reticles**: Real-time aerospace corner brackets with rotating range rings, velocity vector chevrons, and live telemetry cards (semi-major axis, apoapsis, periapsis, velocity vector, orbital period) projected upon hovering or selecting any celestial body.
- **Picture-in-Picture Orbital Radar HUD**: Macro-scale mini-map radar overlay featuring rotating sweep animations, range rings, celestial blips, all five collinear and triangular Lagrange points ($L_1, L_2, L_3, L_4, L_5$), and the current camera viewport frustum.
- **Procedural Cosmic Audio Synthesizer Mixer**: Interactive sound console allowing fine adjustments to ambient sub-bass drone resonance (filter cutoff and Q), synthesized interstellar stellar radio crackle, and exponential collision impact boom gain.
- **Cinematic Camera Modes**:
  1. *Free Cam*: Unrestricted viewport panning and cursor-centered zooming.
  2. *Body-Locked Tracker*: Smooth tracking locked onto target planet or star.
  3. *Chase Cam*: Rigidly oriented camera frame aligning forward with the target body's velocity vector.
  4. *Barycenter Mode*: Automated system framing continuously centering on the center of mass ($R_{com}$) and scaling zoom to envelope all active celestial bodies.
- **Lossless Time Rewind & State Scrubbing**: In-memory ring buffer caching the previous 300 physical states, enabling bidirectional temporal scrubbing, frame stepping, and timeline replay without physical state corruption.
- **Hohmann Transfer Orbit & Maneuver Planner**: Coplanar maneuver assist calculating exact two-burn $\Delta v_1$ and $\Delta v_2$ impulses, transfer duration ($T_{tx}$), and rendering elliptical transfer orbits between coplanar celestial bodies.
- **General Relativistic Perihelion Precession**: Post-Newtonian relativistic correction ($\vec{a}_{GR} = -\frac{3 G M L^2}{c^2 r^4} \hat{r}$) inducing authentic Einsteinian advance of the line of apsides on eccentric planetary orbits.
- **Relativistic Millisecond Pulsars**: Highly magnetized neutron stars with rotating magnetic dipoles, dual relativistic synchrotron radiation jets, lighthouse flash pulses, and high-velocity particle streams.
- **Interstellar-Grade Black Holes**: Accretion disks exhibiting differential Keplerian velocity shearing ($v \propto r^{-1/2}$), logarithmic spiral density waves, relativistic Doppler beaming flux amplification, photon rings ($r_{ph} = 1.5 r_s$), and gravitational lensing distortion arcs.
- **Inelastic Celestial Coalescence**: Momentum-conserving body mergers ($\vec{v}_{new} = \frac{m_1\vec{v}_1 + m_2\vec{v}_2}{m_1 + m_2}$) triggering expanding chromatic shockwave compression rings and particle debris bursts.
- **Tidal Disruption (Roche Limit)**: Fragile celestial bodies venturing inside the tidal disruption radius ($d < 1.6 \times R_{massive}$) dissolve into tangential debris streams.
- **Orbital Conics Calculator & Maneuver Node Assist**:
  - Live osculating Keplerian orbital elements: Apoapsis ($r_a$), Periapsis ($r_p$), Eccentricity ($e$), Period ($T$), and Primary Attractor resolution via dominant instantaneous gravitational acceleration ($a = \frac{GM}{r^2}$).
  - Soft magnetic snapping with tangential circular orbit velocity assistance ($v_c = \sqrt{\frac{GM}{r}}$).
  - Gravity Assist / Slingshot Visualizer with chromatic velocity gradients (cyan $\to$ amber $\to$ magenta) and annotated $+\Delta v$ periapsis boost markers.
- **Multi-Stage Atmospheric Rayleigh Scattering & Coronas**: Multi-layer planetary atmospheres with limb twilight scattering, and multi-pass fusion bloom coronas on stars.
- **Instant URL Scenario Sharing**: Full simulation state compressed into compact Base64 URL hashes (`#scenario=...`) for instant one-click cosmic architecture sharing.
- **Zero-Dependency Native Architecture**: 100% native ES6 modules, HTML5 Canvas 2D with Retina subpixel scaling, and procedural Web Audio API synthesis.
- **Mobile & Multi-Touch Precision**: Smooth two-finger pinch-to-zoom with midpoint centering, rubberband-free touch aiming, and responsive mobile layouts.

---

## 🧮 Theoretical Astrophysics & Mathematical Seams

### 1. Symplectic Velocity Verlet Numerical Integration
Standard Euler or Runge-Kutta methods suffer from artificial orbital decay or runaway energy drift. Cosmic Sandbox implements symplectic Velocity Verlet integration:

$$\vec{x}(t + \Delta t) = \vec{x}(t) + \vec{v}(t)\Delta t + \frac{1}{2}\vec{a}(t)\Delta t^2$$

$$\vec{v}(t + \Delta t) = \vec{v}(t) + \frac{1}{2}\left[\vec{a}(t) + \vec{a}(t + \Delta t)\right]\Delta t$$

### 2. General-Relativistic Post-Newtonian Precession
To model Einsteinian orbital precession (e.g. Mercury's perihelion advance), a post-Newtonian radial correction is applied where $L = \|\vec{r} \times \vec{v}\|$ is the specific relative angular momentum:

$$\vec{a}_{total} = \frac{G M}{r^2}\left(1 + \frac{3 L^2}{c^2 r^2}\right) \hat{r} = -\frac{G M}{r^3}\vec{r} - \frac{3 G M L^2}{c^2 r^5}\vec{r}$$

This causes the line of apsides to advance per orbit by:

$$\Delta \varpi \approx \frac{6 \pi G M}{c^2 a (1 - e^2)}$$

### 3. Coplanar Hohmann Transfer Orbit
The minimum two-impulse energy transfer between two circular orbits of radii $r_1$ and $r_2$ around primary attractor $\mu = G M$:

$$a_{tx} = \frac{r_1 + r_2}{2}, \quad v_{tx1} = \sqrt{\mu\left(\frac{2}{r_1} - \frac{1}{a_{tx}}\right)}, \quad v_{tx2} = \sqrt{\mu\left(\frac{2}{r_2} - \frac{1}{a_{tx}}\right)}$$

$$\Delta v_1 = |v_{tx1} - \sqrt{\mu/r_1}|, \quad \Delta v_2 = |\sqrt{\mu/r_2} - v_{tx2}|, \quad \Delta v_{total} = \Delta v_1 + \Delta v_2$$

$$t_{tx} = \pi \sqrt{\frac{a_{tx}^3}{\mu}}$$

### 4. Softened Gravitational Field Equation
To eliminate singular infinite accelerations during near-zero distance close encounters:

$$\vec{a}_i = \sum_{j \ne i} \frac{G M_j (\vec{x}_j - \vec{x}_i)}{\left(\|\vec{x}_j - \vec{x}_i\|^2 + \epsilon^2\right)^{3/2}}$$

### 5. Spacetime Curvature Potential Field
Scalar gravitational potential deformed across the 2D spatial coordinate lattice:

$$\Phi(\vec{x}) = -\sum_{i} \frac{G M_i}{\sqrt{\|\vec{x} - \vec{p}_i\|^2 + \epsilon^2}}$$

### 6. Keplerian Osculating Orbital Elements
Using specific orbital energy $\varepsilon$ and specific angular momentum vector $\vec{h} = \vec{r} \times \vec{v}$:

$$\varepsilon = \frac{v^2}{2} - \frac{\mu}{r}, \quad a = -\frac{\mu}{2\varepsilon}$$

$$\vec{e} = \frac{\vec{v} \times \vec{h}}{\mu} - \frac{\vec{r}}{r}, \quad r_p = \frac{h^2}{\mu(1 + e)}, \quad r_a = a(1 + e), \quad T = 2\pi\sqrt{\frac{a^3}{\mu}}$$

For unbound escape trajectories ($\varepsilon \ge 0, e \ge 1$): $r_a = \infty$ and $T = \text{undefined}$.

### 7. Relativistic Doppler Beaming in Accretion Disks
Observed luminous flux $I_{obs}$ scales with Doppler boosting factor $\delta$:

$$\delta = \frac{1}{\gamma(1 - \beta \cos\theta)}, \quad I_{obs} = I_0 \cdot \delta^3$$


Where $\beta = v/c$ and $\theta$ is the angle between the emitter velocity and the line of sight, making the approaching limb dramatically brighter and blueshifted.

---

## 🏗 System Architecture & Directory Tree

```
cosmic-sandbox/
├── .github/
│   └── workflows/
│       └── test.yml                    # Automated cross-node matrix test CI
├── .scratch/
│   └── tickets/                        # Task graph tickets (TICKET-001 through 013)
├── docs/
│   ├── adr/                            # Architecture Decision Records
│   │   ├── 0001-symplectic-verlet-physics.md
│   │   └── 0002-zero-dependency-canvas-web-audio.md
│   └── spec/
│       └── 0001-cosmic-gravity-sandbox.md
├── test/
│   ├── conics.test.js                  # Orbital mechanics & maneuver node tests
│   ├── physics.test.js                 # Symplectic physical invariants test suite
│   ├── pulsar.test.js                  # Relativistic pulsar & jet configuration tests
│   ├── serialization.test.js           # Base64 state roundtrip & error safety tests
│   ├── spacetime.test.js               # Gravitational potential & grid warping tests
│   └── visuals.test.js                 # Expanding shockwaves & dissipation tests
├── src/
│   ├── audio.js                        # Procedural Web Audio synthesizer
│   ├── body.js                         # Pulsars, black holes, stars, planets, & trails
│   ├── conics.js                       # Pure Keplerian conics & dominant attractor math
│   ├── main.js                         # RAF coordinator, sub-stepping, & hash loader
│   ├── particles.js                    # Disruption particles & chromatic shockwaves
│   ├── physics.js                      # Verlet engine, Coalescence, & Roche disruption
│   ├── presets.js                      # Solar system, Binary stars, Pulsars, Black holes
│   ├── renderer.js                     # Starfield, spacetime grid, conics overlays
│   ├── serialization.js                # URL Base64 state serialization & deserialization
│   ├── spacetime.js                    # Gravitational potential field & warp vectors
│   └── ui.js                           # Telemetry inspector, maneuver snap, touch handlers
├── AGENTS.md                           # Matt Pocock agent skill configuration
├── CONTEXT.md                          # Ubiquitous astrophysical domain vocabulary
├── index.html                          # Glassmorphic HUD & canvas viewport
├── package.json                        # Native Node.js test runner configuration
├── style.css                           # Glassmorphic dark space HUD styles
└── LICENSE                             # MIT License
```

---

## 🎮 Interactive Controls & Keyboard Shortcuts

| Input / Shortcut | Action | Description |
| :--- | :--- | :--- |
| **Click + Drag** | Launch Body | Spawns selected body type with custom Trajectory Vector |
| **Shift + Drag** or **Right Click** | Pan Canvas | Moves camera viewport infinitely through space |
| **Mouse Wheel** / **Pinch** | Zoom Viewport | Cursor-centered or midpoint multi-touch zoom |
| **Left Click Body** | Inspect Telemetry | Displays live mass, velocity, conics ($r_a, r_p, e, T$) & orbit status |
| **[Space]** | Play / Pause | Freezes simulation time for tactical inspection |
| **[C]** | Clear Trails | Wipes historical orbital path lines |
| **[F]** | Follow Body | Locks camera tracking onto currently selected celestial body |
| **🔗 Share Button** | Share Scenario | Copies compact `#scenario=...` state link to clipboard |

---

## ⚡ Quickstart & Local Development

No heavy build tools or bundlers required. Run with any static HTTP server:

```bash
# Clone the repository
git clone https://github.com/your-username/cosmic-sandbox.git
cd cosmic-sandbox

# Run native test suite (zero dependencies)
npm test

# Start local server
python3 -m http.server 8080
# Open http://localhost:8080 in any modern browser
```

---

## 🧪 Test Suite Coverage

Tested at the public seam using the native Node.js test runner (`node --test`):

```bash
▶ Orbital Conics Calculator & Maneuver Node Math (5 tests)
▶ Physics Engine - SimulationEngine Seam (4 tests)
▶ Relativistic Pulsar & Synchrotron Jets System (2 tests)
▶ Scenario State Serialization & URL Sharing (3 tests)
▶ Spacetime Curvature & Potential Mesh Math (5 tests)
▶ Astrophysics Visuals - Shockwaves & Multi-Pass Effects (2 tests)

ℹ tests 21 | suites 6 | pass 21 | fail 0
```

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.
