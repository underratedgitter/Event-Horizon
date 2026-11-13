<div align="center">

<a href="#-interactive-scenario-gallery">
  <img src="docs/assets/event-horizon-banner.svg" alt="Event Horizon Aerospace Banner" width="100%" style="border-radius: 12px; box-shadow: 0 20px 50px rgba(0,0,0,0.8);" />
</a>

<br/><br/>

[![Node.js CI](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Tests Passing](https://img.shields.io/badge/Tests-95%2F95%20Passing-00e5ff?style=for-the-badge&logo=node.js&logoColor=white)](test/)
[![Throughput](https://img.shields.io/badge/Throughput-8%2C032%20RPS-f59e0b?style=for-the-badge&logo=speedtest&logoColor=white)](#-production-benchmarks--concurrency-stress-test)
[![Runtime Dependencies](https://img.shields.io/badge/Dependencies-0%20Zero-10b981?style=for-the-badge)](package.json)
[![Canvas Engine](https://img.shields.io/badge/Canvas%202D-60%20FPS%20Retina-ec4899?style=for-the-badge&logo=html5&logoColor=white)](#)
[![Web Audio](https://img.shields.io/badge/Audio-Web%20Audio%20API-a855f7?style=for-the-badge&logo=audacity&logoColor=white)](#)
[![License](https://img.shields.io/badge/License-MIT-3b82f6?style=for-the-badge)](LICENSE)

<br/>

<a href="#-interactive-scenario-gallery">
  <img src="docs/assets/event-horizon-hero.png" alt="Event Horizon Interface Preview" width="100%" style="border-radius: 12px; box-shadow: 0 24px 64px rgba(0,0,0,0.85); border: 1px solid rgba(0,229,255,0.35);" />
</a>

<br/><br/>

<p align="center">
  <b><a href="#-executive-overview">Overview</a></b> •
  <b><a href="#-interactive-scenario-gallery">Visual Gallery</a></b> •
  <b><a href="#-the-meridian-chronometer--temporal-engine">Meridian Chronometer</a></b> •
  <b><a href="#-theoretical-astrophysics--mathematics">Theoretical Physics</a></b> •
  <b><a href="#-flight-simulator--keyboard-controls">Flight Controls</a></b> •
  <b><a href="#-system-architecture">Architecture</a></b> •
  <b><a href="#-production-benchmarks--concurrency-stress-test">Benchmarks</a></b> •
  <b><a href="#-quickstart">Quickstart</a></b>
</p>

</div>

---

## 🔭 Executive Overview

**Event Horizon** is an ultra-performant, zero-dependency browser-native astrophysics laboratory, relativistic N-body gravity simulator, and aerospace flight simulator. Engineered with mathematical rigor and Matt Pocock software engineering discipline, it fuses:

- **Symplectic Velocity Verlet N-Body Gravitational Physics**: Pairwise $O(N^2)$ gravity with momentum-conserving inelastic mergers, Plummer softening, and tidal Roche disruption.
- **General Relativistic Mechanics**: Post-Newtonian orbital perihelion precession, spinning millisecond pulsars with relativistic synchrotron jets, and Schwarzschild black holes with differential Doppler-beamed accretion disks.
- **Odyssey Spacecraft Flight Simulator**: Pilotable aerospace probe with real-time $\Delta v$ propellant budgets, forward predictive N-body trajectory propagation, and gravitational slingshot visualizers.
- **Circumstellar Habitable Zones**: Stellar luminosity flux equations calculating Goldilocks boundaries, atmospheric Rayleigh twilight scattering, and planetary climate classifications.
- **Workspace & Live Body Editor**: In-app modal scenario gallery for rapid scenario deployment and empty sandbox resets, circular-orbit placement calculating tangent Keplerian velocities around the dominant attractor, and a real-time body editor to modify celestial mass, radius, and velocity vectors on the fly.
- **Swiss Horology Telemetry HUD**: Aerospace optical reticle corner brackets, vector telemetry cards, picture-in-picture orbital radar with all five Lagrange points ($L_1-L_5$), and a lossless 300-state temporal scrubbing ring buffer.
- **Production-Hardened Static Delivery Engine**: Built-in Node.js server pushing **8,032 requests/second** under 1,000 concurrent keep-alive connections with zero-disk I/O RAM caching, pre-compressed gzip streams, ETag validation, and comprehensive CSP security headers.

> [!TIP]
> **Zero External Runtime Dependencies**: Built entirely with native ES6+ modules, HTML5 Canvas 2D with Retina DPR scaling, and the procedural Web Audio API.

---

## 🌌 Interactive Scenario Gallery

Explore the rich astrophysical environments simulated in real time with high numerical fidelity.

<br/>

### 🚀 1. Odyssey Spacecraft Simulator & Gravitational Slingshots

```text
SUBSYSTEM: ODYSSEY_FLIGHT_DIRECTOR // ENGINE: TSIOLKOVSKY ION DRIVE // PREDICTOR: 320-STEP FORWARD PROPAGATOR
```

<p align="center">
  <img src="docs/assets/preview-spacecraft-slingshot.png" alt="Odyssey Spacecraft Simulator & Gravitational Slingshot" width="100%" style="border-radius: 10px; border: 1px solid rgba(0, 229, 255, 0.35); box-shadow: 0 16px 40px rgba(0,0,0,0.8);" />
</p>

- **Real-Time Delta-v Budget**: Manage propellant reserves modeled after the Tsiolkovsky rocket equation with in-flight refuel seams.
- **Forward Trajectory Prediction**: A multi-step forward symplectic propagator projects planetary gravitational assists, periapsis speed boosts, and hyperbolic escape orbits before firing thrusters.
- **Flight Director HUD**: Real-time altitude, orbital eccentricity, velocity vector heading, target distance telemetry, and tactical pause controls.

<br/>

### 🕳️ 2. Schwarzschild Black Holes & Doppler Accretion Disks

```text
METRIC: SCHWARZSCHILD // RADIUS: r_s = 2GM/c² // BEAMING: δ³ FLUX BOOST // PHOTON RING: 1.5 r_s
```

<p align="center">
  <img src="docs/assets/preview-black-hole.png" alt="Schwarzschild Black Hole and Doppler-Beamed Accretion Disk" width="100%" style="border-radius: 10px; border: 1px solid rgba(0, 229, 255, 0.35); box-shadow: 0 16px 40px rgba(0,0,0,0.8);" />
</p>

- **Keplerian Velocity Shearing**: Differential rotational velocity across logarithmic spiral density wave perturbations ($v \propto r^{-1/2}$).
- **Relativistic Doppler Beaming**: Intense flux amplification on the approaching limb and dimming on the receding limb ($\delta = \gamma^{-1}(1 - eta \cos	heta)^{-1}$).
- **Photon Sphere & Event Horizon**: Exact visual rendering of the relativistic photon instability ring at $r_{ph} = 1.5 r_s$ and total photon capture within the Schwarzschild horizon.

<br/>

### ⚡ 3. Millisecond Pulsars & Relativistic Synchrotron Jets

```text
OBJECT: NEUTRON_STAR_PULSAR // PERIOD: 1.4 ms // B-FIELD: 10¹² GAUSS // EMISSION: RELATIVISTIC SYNCHROTRON
```

<p align="center">
  <img src="docs/assets/preview-pulsar-system.png" alt="Millisecond Pulsar Synchrotron Jets" width="100%" style="border-radius: 10px; border: 1px solid rgba(0, 229, 255, 0.35); box-shadow: 0 16px 40px rgba(0,0,0,0.8);" />
</p>

- **Relativistic Polar Beams**: High-energy synchrotron radiation jets emitting along the magnetic dipole axis, sweeping through space like a cosmic lighthouse.
- **Radiation Pressure**: Emitted shockwave particles exert radial radiation pressure ($P_{rad} \propto r^{-2}$) on nearby celestial bodies and debris.
- **Dynamic Supernova Remnant**: Progenitor stars exceeding critical mass limits undergo core-collapse, triggering a supernova shockwave and leaving behind a spinning neutron star remnant.

<br/>

### 💫 4. Binary Star Choreography & Tidal Roche Disruption

```text
SYSTEM: CO-ORBITING BINARY // MASS RATIO: 1.25:1.00 // DYNAMICS: DYNAMIC BARYCENTER & MUTUAL 3-BODY
```

<p align="center">
  <img src="docs/assets/preview-binary-stars.png" alt="Binary Star Dance and Relativistic Orbitals" width="100%" style="border-radius: 10px; border: 1px solid rgba(0, 229, 255, 0.35); box-shadow: 0 16px 40px rgba(0,0,0,0.8);" />
</p>

- **True Mutual Barycentric Orbitals**: Massive stellar pairs orbit their shared center of mass without artificial fixed anchors.
- **Tidal Roche Disruption**: Passing bodies that penetrate the Roche limit ($pprox 2.44 R (M/m)^{1/3}$) undergo catastrophic tidal disruption and mass accretion.
- **Chaotic Three-Body Dynamics**: High-precision integration captures orbital resonance, figure-8 configurations, and chaotic ejections.

<br/>

### 🪐 5. Solar System & Circumstellar Habitable Goldilocks Zones

```text
STELLAR MODEL: G2V MAIN SEQUENCE // LUMINOSITY: L = M³.5 // HABITABLE CORRIDOR: 0.95 - 1.37 AU
```

<p align="center">
  <img src="docs/assets/preview-solar-system.png" alt="Solar System Overview and Habitable Zones" width="100%" style="border-radius: 10px; border: 1px solid rgba(0, 229, 255, 0.35); box-shadow: 0 16px 40px rgba(0,0,0,0.8);" />
</p>

- **Dynamic Stellar Flux Modeling**: Runaway greenhouse and maximum greenhouse boundaries scale dynamically with stellar mass and temperature ($L = M^{3.5}$).
- **Astrobiological Climate Scoring**: Real-time thermal classification categorizing planets into *Infernal*, *Temperate* (liquid water zone), and *Cryogenic*.
- **Atmospheric Twilight Scattering**: Multi-layer Rayleigh glow rendering illuminated planetary crescents and atmospheric horizons.

<br/>

### 🛠️ 6. Workspace Suite: Scenario Gallery, Circular Orbit Placement & Body Editor

- **Scenario Gallery Modal**: Open via the `Explore scenarios` interface to launch curated astrophysical presets (`solarSystem`, `binaryStars`, `blackHoleFeasting`, `pulsarSystem`) or initialize an empty sandbox.
- **Circular Orbit Placement**: Toggle placement mode from *Free launch* to *Circular orbit* to automatically compute tangent Keplerian orbital velocity ($v = \sqrt{GM/r}$) around the nearest dominant attractor, with support for prograde and retrograde directions.
- **Live Celestial Body Inspector & Editor**: Select any celestial body in the viewport to inspect and directly edit its `name`, `mass`, `radius`, and velocity vector components (`vx`, `vy`) in real time with instant physical simulation updates.

---

## ⏱️ The Meridian Chronometer & Temporal Engine

Inspired by Swiss horological precision and aerospace flight directors, Event Horizon features the **Meridian Chronometer**—a lossless, zero-allocation temporal scrubbing system.

> [!NOTE]
> 📖 **Comprehensive Specification & Architectural Guide**: For mathematical proofs of Liouville phase-space preservation, API references, and standalone integration blueprints, see the dedicated [**Meridian Chronometer Whitepaper**](docs/MERIDIAN_CHRONOMETER.md).

<br/>

<p align="center">
  <img src="docs/assets/meridian-chronometer.svg" alt="The Meridian Chronometer Horology Architecture" width="100%" style="border-radius: 10px; border: 1px solid rgba(0, 229, 255, 0.4); box-shadow: 0 20px 48px rgba(0,0,0,0.85);" />
</p>

<br/>

### Core Engineering Invariants

| Architecture Pillar | Specification | Verification Seam |
| :--- | :--- | :--- |
| **Ring Buffer Topology** | 300-state circular buffer | Zero garbage collection pauses, $O(1)$ cyclic push |
| **Temporal Scrubbing** | Bidirectional scrubbing slider | Frame-stepping backwards/forwards with 100% numerical replay fidelity |
| **Energy Invariance** | Symplectic phase-space preservation | $\Delta E / E_0 < 0.001\%$ across full 300-frame rewind and resume cycles |
| **Speed Range** | $0.1	imes$ slow-motion to $5.0	imes$ orbital acceleration | Smooth sub-frame time scaling without integration breakdown |
| **Substepping Engine** | Adaptive substepping (up to 8 steps/frame) | Eliminates close-encounter tunneling and numerical singularities |

```javascript
// State snapshot structure cached in the 300-frame cyclic ring buffer
class StateRingBuffer {
  push(simulationTime, bodies, spacecraft) {
    this.buffer[this.head] = {
      t: simulationTime,
      bodies: bodies.map(b => b.cloneState()),
      spacecraft: spacecraft ? spacecraft.cloneState() : null
    };
    this.head = (this.head + 1) % 300;
  }
}
```

---

## 🧮 Theoretical Astrophysics & Mathematics

### 1. Symplectic Velocity Verlet Integration
Standard explicit Euler integration suffers from artificial energy drift and orbital decay. Event Horizon implements symplectic Velocity Verlet integration:

$$ec{x}(t + \Delta t) = ec{x}(t) + ec{v}(t)\Delta t + rac{1}{2}ec{a}(t)\Delta t^2$$

$$ec{v}(t + \Delta t) = ec{v}(t) + rac{1}{2}\left[ec{a}(t) + ec{a}(t + \Delta t)ight]\Delta t$$

Paired with a Plummer softening length ($\epsilon = 2.0$) to eliminate numerical singularities during close encounters:

$$ec{a}_i = \sum_{j 
e i} rac{G M_j (ec{x}_j - ec{x}_i)}{\left(\|ec{x}_j - ec{x}_i\|^2 + \epsilon^2ight)^{3/2}}$$

### 2. General-Relativistic Post-Newtonian Precession
To model Einsteinian orbital precession (e.g., Mercury's perihelion advance), a post-Newtonian radial perturbation is applied where $L = \|ec{r} 	imes ec{v}\|$ is the specific relative angular momentum:

$$ec{a}_{total} = -rac{G M}{r^3}ec{r} - rac{3 G M L^2}{c^2 r^5}ec{r}$$

This induces an authentic advance of the line of apsides per orbital period:

$$\Delta arpi pprox rac{6 \pi G M}{c^2 a (1 - e^2)}$$

### 3. Circumstellar Habitable Zone Boundaries
Habitable zone orbital boundaries scale with stellar luminosity $L = M^{3.5}$ (for main-sequence stars):

$$r_{	ext{inner}} = \sqrt{rac{L}{1.1}} 	ext{ AU (Runaway Greenhouse Limit)}$$

$$r_{	ext{mid}} = \sqrt{L} 	ext{ AU (Optimum Earth-Equivalent Flux)}$$

$$r_{	ext{outer}} = \sqrt{rac{L}{0.53}} 	ext{ AU (Maximum Greenhouse Limit)}$$

### 4. Coplanar Hohmann Transfer Orbits
Calculates the minimum two-impulse semi-major axis $a_{tx}$ and velocity increments $\Delta v_1$ and $\Delta v_2$ between two orbits:

$$a_{tx} = rac{r_1 + r_2}{2}, \quad v_{tx1} = \sqrt{\mu\left(rac{2}{r_1} - rac{1}{a_{tx}}ight)}, \quad v_{tx2} = \sqrt{\mu\left(rac{2}{r_2} - rac{1}{a_{tx}}ight)}$$

$$\Delta v_{total} = |v_{tx1} - v_{circ1}| + |v_{circ2} - v_{tx2}|, \quad t_{tx} = \pi \sqrt{rac{a_{tx}^3}{\mu}}$$

### 5. Relativistic Doppler Beaming in Accretion Disks
Observed luminous flux $I_{obs}$ scales with the relativistic Doppler factor $\delta$:

$$\delta = rac{1}{\gamma(1 - eta \cos	heta)}, \quad I_{obs} = I_0 \cdot \delta^3$$

Where $eta = v/c$, $\gamma = (1 - eta^2)^{-1/2}$, creating an approaching blue-shifted limb and a receding red-shifted limb.

---

## 🎮 Flight Simulator & Controls

<div align="center">

| Key / Input | Action | Context & Subsystem Function |
| :---: | :--- | :--- |
| <kbd>W</kbd> / <kbd>↑</kbd> | **Prograde Thruster** | Fires main engine aligned with velocity vector ($+ec{v}$), consuming $\Delta v$ |
| <kbd>S</kbd> / <kbd>↓</kbd> | **Retrograde Thruster** | Fires thrusters opposed to velocity vector ($-ec{v}$) to decelerate |
| <kbd>A</kbd> / <kbd>←</kbd> | **Radial-In Burn** | Fires thrusters radially inward towards the primary gravitational attractor |
| <kbd>D</kbd> / <kbd>→</kbd> | **Radial-Out Burn** | Fires thrusters radially outward away from the primary gravitational attractor |
| <kbd>R</kbd> | **Refuel Spacecraft** | Restores spacecraft propellant reserves to maximum $\Delta v$ capacity |
| <kbd>WASD / Arrows</kbd> | **Directional Thrusters** | Up, Down, Left, Right translational thruster burns (during Flight Challenges) |
| <kbd>Space</kbd> | **Pause / Play** | Freezes simulation time for tactical inspection and conics analysis |
| <kbd>1</kbd> | **Free Cam** | Pan and zoom freely anywhere across the viewport |
| <kbd>2</kbd> | **Locked Cam** | Centers camera lock onto the selected celestial body or spacecraft |
| <kbd>3</kbd> | **Chase Cam** | Locks onto target and rotates camera frame with its velocity heading |
| <kbd>4</kbd> | **Barycenter Cam** | Continuously frames the system center of mass ($R_{com}$) |
| <kbd>F</kbd> | **Follow / Focus** | Toggles camera tracking lock on the currently selected body |
| <kbd>C</kbd> | **Clear Trails** | Wipes all historical orbital trajectory paths |
| <kbd>R</kbd> | **Step Backward** | Steps 1 frame backward in time history (when spacecraft is inactive) |
| <kbd>Click & Drag (Free)</kbd> | **Launch Vector** | Sets initial launch position and vector velocity for new celestial bodies |
| <kbd>Click / Drag (Circular)</kbd> | **Circular Orbit** | Snaps new body into calculated circular Keplerian orbit around dominant attractor |
| <kbd>Click Body</kbd> | **Select Body** | Opens telemetry inspector and live body parameter editor |
| <kbd>Right / Middle / Shift Drag</kbd> | **Pan Viewport** | Smooth infinite viewport navigation |
| <kbd>Mouse Wheel</kbd> | **Zoom Viewport** | Exponential camera zoom in / out |

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
        Chrono[Meridian Chronometer Dial]
        Workspace[Scenario Gallery & Live Body Editor]
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

## ⚡ Production Benchmarks & Concurrency Stress Test

An automated high-concurrency stress test ([`test/load-test.js`](test/load-test.js)) validates **1,000 concurrent keep-alive users** requesting HTML, CSS, and ES6 modules:

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

### Static Server Engineering
- **In-Memory Zero-I/O Caching**: Static assets (`index.html`, CSS, JS modules) are pre-buffered into memory at startup. Zero disk read overhead during heavy traffic spikes.
- **Pre-Compressed Gzip Streams**: Compresses text payloads on demand or from buffer, slashing payload size by 81%.
- **ETag & HTTP 304 Validation**: Client-side revalidation saves network bandwidth and CPU cycles.
- **Strict Content Security Policy (CSP)**: Robust protection against XSS and resource injection.

### Configuration & Environment Variables

The server and stress test suites read the following optional environment variables:

| Variable | Target | Default | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | `server.js`, `test/load-test.js` | `8080` | HTTP listener port for the static server and stress testing |
| `CONCURRENCY` | `test/load-test.js` | `1000` | Number of simultaneous concurrent virtual user connections |
| `DURATION` | `test/load-test.js` | `6` | Duration of load test execution in seconds |
| `HOST` | `test/load-test.js` | `127.0.0.1` | Target server hostname or IP address for the load test |

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

# Start the high-concurrency hardened HTTP server (default: port 8080)
npm start

# Optionally run on a custom port
PORT=3000 npm start
```

Visit [`http://localhost:8080`](http://localhost:8080) in your browser.

### 2. Run Test Suites
```bash
# Run unit & astrodynamics test suite (95 tests via Node.js test runner)
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
│   ├── ISSUE_TEMPLATE/             # Bug report & feature request templates
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   ├── PULL_REQUEST_TEMPLATE.md    # Code review & quality checklist
│   └── workflows/
│       └── deploy.yml              # GitHub Actions CI & Pages deployment (Node 24)
├── docs/
│   ├── MERIDIAN_CHRONOMETER.md     # Swiss horology chronometer whitepaper & specification
│   ├── adr/                        # Architecture Decision Records
│   │   ├── 0001-symplectic-verlet-physics.md
│   │   └── 0002-zero-dependency-canvas-web-audio.md
│   ├── agents/                     # Project guidelines & issue triage documentation
│   │   ├── domain.md
│   │   ├── issue-tracker.md
│   │   └── triage-labels.md
│   ├── assets/                     # Vector aerospace banners, UI showcases & scenario previews
│   │   ├── event-horizon-banner.svg
│   │   ├── event-horizon-hero.png
│   │   ├── meridian-chronometer-banner.svg
│   │   ├── meridian-chronometer.svg
│   │   ├── preview-binary-stars.png
│   │   ├── preview-black-hole.png
│   │   ├── preview-meridian-chronometer-ui.png
│   │   ├── preview-pulsar-system.png
│   │   ├── preview-solar-system.png
│   │   └── preview-spacecraft-slingshot.png
│   └── spec/                       # Engineering specifications
│       └── 0001-cosmic-gravity-sandbox.md
├── e2e/
│   ├── app.spec.js                 # Playwright E2E browser test suite
│   ├── screenshots/app.png         # Playwright verified render screenshot
│   └── workspace.spec.js           # Playwright E2E tests for gallery, placement & body editor
├── scripts/
│   └── generate-screenshots.js     # Automated Retina screenshot generator
├── src/
│   ├── audio.js                    # Procedural Web Audio API synthesizer
│   ├── body.js                     # Celestial bodies, Doppler accretion disks, pulsars
│   ├── conics.js                   # Pure Keplerian conics & dominant attractor math
│   ├── habitable.js                # Circumstellar habitable zone equations
│   ├── main.js                     # Main loop, adaptive substepping, dynamic 30fps fallback
│   ├── missions.js                 # Aerospace flight challenges & mission engine
│   ├── particles.js                # Bounded memory particle explosions & shockwaves
│   ├── physics.js                  # Symplectic Velocity Verlet engine & state ring buffer
│   ├── presets.js                  # Astrophysical scenario presets
│   ├── renderer.js                 # Canvas 2D engine, starfield, spacetime grid
│   ├── serialization.js            # URL Base64 state encoding & injection defense
│   ├── spacecraft.js               # Spacecraft flight simulator & trajectory prediction
│   ├── spacetime.js                # Gravitational potential field & warp displacement
│   ├── ui.js                       # Swiss horology HUD, telemetry dials, hotkeys
│   └── workspace.js                # Scenario gallery modal, circular placement & body editor
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
├── .gitattributes                  # Git line ending normalization
├── .gitignore                      # Git ignore rules
├── .nojekyll                       # GitHub Pages static hosting directive
├── CITATION.cff                    # Citation metadata for researchers
├── CONTEXT.md                      # Project architectural context & guidelines
├── CONTRIBUTING.md                 # Contribution guidelines & coding discipline
├── LICENSE                         # MIT License
├── README.md                       # Repository documentation
├── SECURITY.md                     # Security policy & defense architecture
├── index.html                      # Glassmorphic HUD & canvas viewport
├── package-lock.json               # Locked dependency tree
├── package.json                    # Package metadata & test scripts
├── playwright.config.js            # Playwright E2E configuration & dev server harness
├── server.js                       # Production in-memory static server (8,000+ RPS)
└── style.css                       # Swiss horology aerospace HUD stylesheet
```

---

## 📄 License & Citation

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.

If using Event Horizon for research, education, or software benchmarks, please cite via [`CITATION.cff`](CITATION.cff).

Developed with 🌌 by Deepmind AI & Suraj Patel.
