<div align="center">

<a href="#-key-capabilities">
  <img src="docs/assets/event-horizon-banner.svg" alt="Event Horizon Aerospace Banner" width="100%" style="border-radius: 12px; box-shadow: 0 20px 50px rgba(0,0,0,0.8);" />
</a>

<br/><br/>

[![Node.js CI](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Tests Passing](https://img.shields.io/badge/Tests-95%2F95%20Passing-00e5ff?style=for-the-badge&logo=vitest&logoColor=white)](test/)
[![Throughput](https://img.shields.io/badge/Throughput-8%2C032%20RPS-f59e0b?style=for-the-badge&logo=speedtest&logoColor=white)](#-production-benchmarks--load-test)
[![Runtime Dependencies](https://img.shields.io/badge/Dependencies-0%20Zero-10b981?style=for-the-badge)](package.json)
[![Canvas Engine](https://img.shields.io/badge/Canvas%202D-60%20FPS%20Retina-ec4899?style=for-the-badge&logo=html5&logoColor=white)](#)
[![Web Audio](https://img.shields.io/badge/Audio-Web%20Audio%20API-a855f7?style=for-the-badge&logo=audacity&logoColor=white)](#)
[![License](https://img.shields.io/badge/License-MIT-3b82f6?style=for-the-badge)](LICENSE)

<br/>

<a href="#-interactive-simulation-interface">
  <img src="docs/assets/event-horizon-hero.png" alt="Event Horizon Interface Preview" width="100%" style="border-radius: 12px; box-shadow: 0 24px 64px rgba(0,0,0,0.85); border: 1px solid rgba(0,229,255,0.35);" />
</a>

<p align="center">
  <b><a href="#-key-capabilities">Key Capabilities</a></b> •
  <b><a href="#-flight-simulator--keyboard-controls">Flight Controls</a></b> •
  <b><a href="#-theoretical-astrophysics--mathematics">Theoretical Physics</a></b> •
  <b><a href="#-system-architecture">Architecture</a></b> •
  <b><a href="#-production-benchmarks--load-test">Benchmarks</a></b> •
  <b><a href="#-quickstart">Quickstart</a></b>
</p>

</div>

---

## 🔭 Executive Overview

**Event Horizon** is an ultra-performant, zero-dependency browser-native astrophysics simulation laboratory and aerospace flight simulator. Engineered with mathematical rigor and Matt Pocock software engineering discipline, it fuses:

- **Symplectic Velocity Verlet N-Body Gravitational Physics** ($O(N^2)$ pairwise gravity with momentum-conserving inelastic mergers and tidal Roche disruption).
- **General Relativistic Mechanics**: Post-Newtonian orbital perihelion precession, millisecond pulsars with relativistic synchrotron jets, and Schwarzschild black holes with differential Doppler-beamed accretion disks.
- **Odyssey Spacecraft Simulator**: Player-pilotable probe with real-time $\Delta v$ propellant budgets, forward predictive N-body trajectory propagation, and gravitational slingshot visualizers.
- **Circumstellar Habitable Zones**: Stellar luminosity flux equations calculating Goldilocks boundaries, atmospheric Rayleigh twilight scattering, and planetary climate classifications.
- **Swiss Horology Telemetry HUD**: Aerospace optical reticle corner brackets, vector telemetry cards, picture-in-picture orbital radar with all five Lagrange points ($L_1-L_5$), and a lossless 300-state temporal scrubbing ring buffer.
- **Production-Hardened Static Server**: Built-in Node.js server pushing **8,032 requests/second** with zero-disk I/O RAM caching, pre-compressed gzip streams, ETag validation, and comprehensive CSP security headers.

> [!TIP]
> **Zero External Runtime Dependencies**: Built entirely with native ES6+ modules, HTML5 Canvas 2D with Retina DPR scaling, and the procedural Web Audio API.

---

## 🌟 Key Capabilities

### 🚀 1. Spacecraft Flight Simulator & Gravitational Slingshots
```text
ENGINE: Thrust Vector Propagator | METRIC: Tsiolkovsky Delta-v | PREDICTOR: 320 Forward Steps
```
- **Propellant Economics**: Real-time Delta-v ($\Delta v$) expenditure based on the Tsiolkovsky rocket equation with in-flight refuel seams.
- **Forward Predictive Trajectory**: Multi-step forward symplectic propagator forecasting planetary gravitational assists, periapsis speed boosts, and escape trajectories.
- **Flight Director HUD**: Real-time altitude, orbital eccentricity, velocity vector heading, and refuel controls.

### 💥 2. Supernova Core-Collapse & Stellar Remnants
```text
TRIGGER: Mass Accretion > Critical Limit | BLAST: Radiation Pressure Wave | REMNANT: Pulsar / Black Hole
```
- **Catastrophic Core-Collapse**: Initiated automatically when a star accretes critical mass or coalesce via collisions.
- **Relativistic Shockwave**: Rapidly expanding plasma wavefront exerting radiation pressure ($P_{rad} \propto r^{-2}$) that pushes bodies and vaporizes micro-debris.
- **Dynamic Remnant Formation**: Collapses progenitor cores into spinning **Pulsars** (intermediate mass) or **Schwarzschild Black Holes** (supermassive).

### 🕳️ 3. Relativistic Black Holes & Doppler Accretion Disks
```text
VELOCITY: Keplerian Shearing (v ~ r^-0.5) | BOOST: Relativistic Doppler Beaming | PHOTON RING: 1.5 r_s
```
- **Keplerian Velocity Shearing**: Differential rotation speed across logarithmic spiral density wave perturbations.
- **Relativistic Doppler Beaming**: Intense flux amplification on the approaching limb and dimming on the receding limb ($\delta = \gamma^{-1}(1 - \beta \cos\theta)^{-1}$).
- **Photon Sphere Ring**: Exact visual rendering of the relativistic photon instability ring at $r_{ph} = 1.5 r_s$.

### 🌱 4. Circumstellar Habitable Zones & Astrobiology Corridors
```text
CORRIDOR: Runaway Greenhouse to Maximum Greenhouse | FLUX: L = M^3.5 | CLASSIFICATION: Infernal/Temperate/Cryogenic
```
- **Luminosity Scaling**: Dynamically computes runaway greenhouse limits, optimal Earth-flux midlines, and maximum greenhouse boundaries based on stellar luminosity ($L = M^{3.5}$).
- **Planetary Climate Classification**: Real-time astrobiological scoring categorizing bodies as *Infernal*, *Temperate* (water-supporting Goldilocks), or *Cryogenic*.

### ⏱️ 5. Temporal Rewind & Lossless State Scrubbing
```text
BUFFER: 300-State High-Precision Ring | STATE DRIFT: 0.00% | PLAYBACK: Bidirectional & Frame-Stepping
```
- **300-Frame Ring Buffer**: Continuous circular buffer recording high-precision position, velocity, and mass vectors.
- **Bidirectional Time Travel**: Scrub backwards in time, step frame-by-frame, or replay cosmic collisions with 100% numerical fidelity.

### 🎛️ 6. Procedural Web Audio Synthesizer Console
```text
SUB-BASS: Dual-Oscillator Ambient Resonance | STATIC: Cosmic Microwave Background | DETONATION: Frequency-Decay Booms
```
- **Dual-Oscillator Ambient Resonance**: Sub-bass cosmic drone with adjustable cutoff frequencies and resonance Q-factors.
- **Stellar Radio Crackle**: Procedural white-noise generator simulating interstellar cosmic microwave background radiation.
- **Impact Detonations**: Exponential frequency-decay oscillators synthesizing deep physical collision booms.

---

## 🧮 Theoretical Astrophysics & Mathematics

### 1. Symplectic Velocity Verlet Integration
Standard explicit Euler integration suffers from artificial energy drift and orbital decay. Event Horizon implements symplectic Velocity Verlet integration:

$$\vec{x}(t + \Delta t) = \vec{x}(t) + \vec{v}(t)\Delta t + \frac{1}{2}\vec{a}(t)\Delta t^2$$

$$\vec{v}(t + \Delta t) = \vec{v}(t) + \frac{1}{2}\left[\vec{a}(t) + \vec{a}(t + \Delta t)\right]\Delta t$$

Paired with a Plummer softening length ($\epsilon = 2.0$) to eliminate numerical singularities during close encounters:

$$\vec{a}_i = \sum_{j \ne i} \frac{G M_j (\vec{x}_j - \vec{x}_i)}{\left(\|\vec{x}_j - \vec{x}_i\|^2 + \epsilon^2\right)^{3/2}}$$

### 2. General-Relativistic Post-Newtonian Precession
To model Einsteinian orbital precession (e.g., Mercury's perihelion advance), a post-Newtonian radial perturbation is applied where $L = \|\vec{r} \times \vec{v}\|$ is the specific relative angular momentum:

$$\vec{a}_{total} = -\frac{G M}{r^3}\vec{r} - \frac{3 G M L^2}{c^2 r^5}\vec{r}$$

This induces an authentic advance of the line of apsides per orbital period:

$$\Delta \varpi \approx \frac{6 \pi G M}{c^2 a (1 - e^2)}$$

### 3. Circumstellar Habitable Zone Boundaries
Habitable zone orbital boundaries scale with stellar luminosity $L = M^{3.5}$ (for main-sequence stars):

$$r_{\text{inner}} = \sqrt{\frac{L}{1.1}} \text{ AU (Runaway Greenhouse Limit)}$$

$$r_{\text{mid}} = \sqrt{L} \text{ AU (Optimum Earth-Equivalent Flux)}$$

$$r_{\text{outer}} = \sqrt{\frac{L}{0.53}} \text{ AU (Maximum Greenhouse Limit)}$$

### 4. Coplanar Hohmann Transfer Orbits
Calculates the minimum two-impulse semi-major axis $a_{tx}$ and velocity increments $\Delta v_1$ and $\Delta v_2$ between two orbits:

$$a_{tx} = \frac{r_1 + r_2}{2}, \quad v_{tx1} = \sqrt{\mu\left(\frac{2}{r_1} - \frac{1}{a_{tx}}\right)}, \quad v_{tx2} = \sqrt{\mu\left(\frac{2}{r_2} - \frac{1}{a_{tx}}\right)}$$

$$\Delta v_{total} = |v_{tx1} - v_{circ1}| + |v_{circ2} - v_{tx2}|, \quad t_{tx} = \pi \sqrt{\frac{a_{tx}^3}{\mu}}$$

### 5. Relativistic Doppler Beaming in Accretion Disks
Observed luminous flux $I_{obs}$ scales with the relativistic Doppler factor $\delta$:

$$\delta = \frac{1}{\gamma(1 - \beta \cos\theta)}, \quad I_{obs} = I_0 \cdot \delta^3$$

Where $\beta = v/c$, $\gamma = (1 - \beta^2)^{-1/2}$, creating an approaching blue-shifted limb and a receding red-shifted limb.

---

## 🎮 Flight Simulator & Keyboard Controls

<div align="center">

| Key / Input | Action | Function |
| :---: | :--- | :--- |
| <kbd>W</kbd> | **Forward Thrusters** | Fires main engine, consumes Delta-v propellant |
| <kbd>A</kbd> / <kbd>D</kbd> | **Rotate Attitude** | Rotates spacecraft thrust vector counter-clockwise / clockwise |
| <kbd>S</kbd> | **Retro-Brake** | Fires forward attitude thrusters to arrest velocity |
| <kbd>Space</kbd> | **Pause / Play** | Freezes simulation time for tactical inspection and conics review |
| <kbd>1</kbd> | **Free Cam** | Pan and zoom freely anywhere across deep space |
| <kbd>2</kbd> | **Locked Cam** | Centers camera lock onto the selected planet or spacecraft |
| <kbd>3</kbd> | **Chase Cam** | Locks onto target and rotates camera frame with its velocity vector |
| <kbd>4</kbd> | **Barycenter Cam** | Continuously frames the system center of mass ($R_{com}$) |
| <kbd>C</kbd> | **Clear Trails** | Wipes historical orbital trajectory paths |
| <kbd>Click & Drag</kbd> | **Launch Vector** | Aims and launches new celestial bodies or probes into orbit |
| <kbd>Right-Click / Wheel</kbd> | **Pan & Zoom** | Smooth infinite viewport navigation |

</div>

---

## 🏗 System Architecture

```mermaid
flowchart TD
    subgraph UI_Layer [Frontend Telemetry & HUD Layer]
        HUD[Glassmorphic Swiss HUD]
        Radar[PiP Orbital Radar & Lagrange Points]
        AudioMixer[Web Audio Synthesizer Mixer]
        FlightHUD[Spacecraft Flight Director HUD]
    end

    subgraph Core_Engine [Physics & Simulation Core]
        Clock[RAF Animation Loop & Substepper]
        Verlet[Symplectic Velocity Verlet Integrator]
        Precession[General Relativistic PN Precession]
        Conics[Osculating Conics & Hohmann Planner]
        Habitable[Circumstellar Habitable Zones]
        Supernova[Supernova & Remnant Transformer]
        Spacecraft[Spacecraft Flight Controller]
        RingBuffer[State Ring Buffer - 300 Frames]
    end

    subgraph Visual_Layer [Retina Canvas 2D Pipeline]
        Renderer[CanvasRenderer - 60 FPS]
        SpacetimeGrid[Dynamic Spacetime Curvature Mesh]
        Particles[Particle System & Shockwaves]
        BodyRenderer[Celestial Body & Doppler Disks]
    end

    UI_Layer --> Clock
    Clock --> Verlet
    Verlet --> Precession
    Verlet --> Conics
    Verlet --> Habitable
    Verlet --> Supernova
    Verlet --> Spacecraft
    Verlet --> RingBuffer
    Verlet --> Visual_Layer
    Visual_Layer --> Renderer
    Renderer --> SpacetimeGrid
    Renderer --> BodyRenderer
    Renderer --> Particles
```

---

## ⚡ Production Benchmarks & Load Test

An automated high-concurrency stress test ([`test/load-test.js`](test/load-test.js)) tests **1,000 concurrent keep-alive users** requesting HTML, CSS, and ES6 modules:

| Benchmark Metric | Measured Result | Production Target | Status |
| :--- | :--- | :--- | :--- |
| **Concurrent Users** | **1,000 Virtual Users** | 1,000 Users | 🟢 PASS |
| **Throughput (RPS)** | **8,032 req/sec** | > 2,000 req/sec | 🟢 400% of Target |
| **Completed Requests** | **48,794 requests** in 6.07s | > 10,000 requests | 🟢 PASS |
| **Error / Drop Rate** | **0.00%** (0 / 48,794) | 0.00% | 🟢 ZERO DROP |
| **Latency p50 (Median)** | **116.60 ms** | < 250 ms | 🟢 OPTIMAL |
| **Latency p95** | **160.43 ms** | < 400 ms | 🟢 OPTIMAL |
| **Payload Optimization** | **81% Bandwidth Saved** | > 50% | 🟢 GZIP STREAM |
| **Node.js Peak Memory** | **290.16 MB** | < 512 MB | 🟢 BOUNDED |

---

## ⚡ Quickstart

### Prerequisites
- **Node.js**: Version 18.0.0 or higher
- **Browser**: Any modern browser with Canvas 2D and Web Audio API support (Chrome, Safari, Firefox, Edge)

### 1. Clone & Run (Zero Dependencies)
```bash
# Clone the repository
git clone https://github.com/underratedgitter/Event-Horizon.git
cd Event-Horizon

# Start the high-concurrency hardened HTTP server
npm start
```

Visit [`http://localhost:8080`](http://localhost:8080) in your browser.

### 2. Run Test Suites
```bash
# Run unit & astrodynamics test suite (95 tests)
npm test

# Run high-concurrency stress test (1,000 users)
npm run test:load

# Run Playwright end-to-end browser tests
npm run test:e2e
```

---

## 📁 Repository Structure

```
Event-Horizon/
├── .github/
│   ├── workflows/test.yml          # GitHub Actions CI matrix (Node 18, 20, 22)
│   ├── ISSUE_TEMPLATE/             # Bug report & feature request templates
│   └── PULL_REQUEST_TEMPLATE.md    # Code review & quality checklist
├── docs/
│   ├── assets/                     # High-resolution screenshots & UI previews
│   │   ├── event-horizon-banner.svg# High-craft vector aerospace banner
│   │   └── event-horizon-hero.png  # Playwright verified interface screenshot
│   ├── adr/                        # Architecture Decision Records
│   └── spec/                       # Engineering specifications
├── e2e/
│   ├── app.spec.js                 # Playwright E2E browser test suite
│   └── screenshots/app.png         # Playwright verified render screenshot
├── src/
│   ├── audio.js                    # Procedural Web Audio API synthesizer
│   ├── body.js                     # Celestial bodies, Doppler accretion disks, pulsars
│   ├── conics.js                   # Pure Keplerian conics & dominant attractor math
│   ├── habitable.js                # Circumstellar habitable zone equations
│   ├── main.js                     # Main loop, substepping, dynamic 30fps fallback
│   ├── missions.js                 # Aerospace flight challenges & mission engine
│   ├── particles.js                # Bounded memory particle explosions & shockwaves
│   ├── physics.js                  # Symplectic Velocity Verlet engine & state ring buffer
│   ├── presets.js                  # Astrophysical scenario presets
│   ├── renderer.js                 # Canvas 2D engine, starfield, spacetime grid
│   ├── serialization.js            # URL Base64 state encoding & injection defense
│   ├── spacecraft.js               # Spacecraft flight simulator & trajectory prediction
│   ├── spacetime.js                # Gravitational potential field & warp displacement
│   └── ui.js                       # Swiss horology HUD, telemetry dials, hotkeys
├── test/
│   ├── conics.test.js              # Keplerian conics math tests
│   ├── device-scalability.test.js  # Memory cap & low-performance fallback tests
│   ├── habitable.test.js           # Habitable zone calculation tests
│   ├── hohmann.test.js             # Hohmann transfer trajectory tests
│   ├── load-test.js                # 1,000 concurrent user load test script
│   ├── missions.test.js            # Aerospace flight challenges test suite
│   ├── physics.test.js             # Symplectic Verlet physical invariants tests
│   ├── precession.test.js          # Relativistic post-Newtonian precession tests
│   ├── pulsar.test.js              # Relativistic pulsar synchrotron jet tests
│   ├── security-and-fuzz.test.js   # Security hardening & fuzzing suite
│   ├── serialization.test.js       # Base64 state roundtrip & sanitization tests
│   ├── server.test.js              # Server static delivery, ETag, and CSP tests
│   ├── spacecraft.test.js          # Spacecraft flight & trajectory prediction tests
│   ├── spacetime.test.js           # Spacetime curvature & potential mesh tests
│   ├── state_scrubbing.test.js     # Ring buffer time scrubbing tests
│   ├── supernova.test.js           # Supernova collapse & remnant physics tests
│   └── visuals.test.js             # Expanding shockwave dissipation tests
├── index.html                      # Glassmorphic HUD & canvas viewport
├── server.js                       # Production in-memory static server (8,000+ RPS)
├── style.css                       # Swiss horology aerospace HUD stylesheet
├── package.json                    # Package metadata & test scripts
├── CONTRIBUTING.md                 # Contribution guidelines & coding discipline
├── SECURITY.md                     # Security policy & defense architecture
├── CITATION.cff                    # Citation metadata for researchers
└── LICENSE                         # MIT License
```

---

## 📄 License & Citation

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.

If using Event Horizon for research, education, or software benchmarks, please cite via [`CITATION.cff`](CITATION.cff).

Developed with 🌌 by Deepmind AI & Suraj Patel.
