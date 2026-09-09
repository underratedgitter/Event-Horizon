# Spec: Cosmic Gravity & Orbital Sandbox

## Problem Statement

Users interested in celestial mechanics, astrophysics, and creative digital sandboxes lack an intuitive, performant, and zero-setup web playground to experiment with N-body gravity, spawn custom star systems, and witness cosmic phenomena (such as black hole accretion disks, orbital resonance, and tidal collisions) in real time.

## Solution

A responsive, zero-dependency browser sandbox that runs an accurate N-body gravitational physics engine using symplectic Velocity Verlet integration. The application provides an interactive HTML5 canvas with glassmorphic UI controls, orbital trail rendering, drag-to-aim trajectory launching, presets (Solar System, Binary Stars, Black Hole, Galaxy Collision), and ambient procedural cosmic audio.

## User Stories

1. As a cosmic explorer, I want to watch our Solar System with the Sun and orbiting planets in real-time, so that I can observe stable planetary orbits.
2. As a sandbox creator, I want to click and drag to spawn a new Celestial Body with a custom Trajectory Vector, so that I can inject planets or comets into existing systems.
3. As a space enthusiast, I want to select different Body Types (Star, Planet, Moon, Black Hole, Debris), so that I can experiment with varied masses and visual properties.
4. As an astrophysics curious user, I want to see a Black Hole with a glowing accretion disk and gravitational lensing ring, so that I can experience relativistic visual styling in 2D.
5. As an experimenter, I want colliding Celestial Bodies to undergo inelastic Coalescence, so that larger worlds form through physical momentum conservation.
6. As a physics tester, I want small bodies entering the Roche Limit of a massive body to break apart into debris, so that tidal disruption is realistically demonstrated.
7. As a student, I want to view orbital trails with fading glow, so that I can visualize the geometry of ellipses, hyperbolas, and chaotic three-body paths.
8. As a user, I want to smoothly pan and zoom the cosmic canvas, so that I can examine distant bodies or zoom in on close encounters.
9. As an observer, I want to lock the camera onto any selected Celestial Body, so that the viewport tracks it through its orbital journey.
10. As an experimenter, I want to pause the simulation, step forward frame-by-frame, or adjust the time warp factor (0.1x to 10x), so that I can inspect high-speed interactions.
11. As an explorer, I want one-click scenario presets (Solar System, Binary Star Dance, Black Hole Feasting, Galactic Collision, Trojan Asteroids), so that I can immediately explore famous gravitational phenomena without manual setup.
12. As a user, I want to click any Celestial Body to inspect its mass, velocity, kinetic energy, and distance to center of mass, so that I can analyze physical metrics.
13. As a user, I want an ambient generative cosmic drone and collision impact sound synthesizer, so that the sandbox feels immersive without loading external audio assets.
14. As a mobile or tablet user, I want touch support for dragging, panning, and pinch-to-zoom, so that the sandbox works seamlessly on touchscreens.

## Implementation Decisions

- **Symplectic Numerical Integrator**: Use Velocity Verlet integration across discrete time steps $\Delta t$ with a Softening Length $\epsilon = 5.0$ to ensure energy conservation and prevent singularities.
- **Pairwise Gravitational Acceleration**: Compute mutual gravitational forces between all active bodies with $O(N^2)$ precision, suitable for hundreds of bodies at 60 FPS.
- **Physical Coalescence**: Check pairwise distance $d < r_1 + r_2$. Merge smaller body into larger body, conserving linear momentum $\vec{v}_{new} = \frac{m_1\vec{v}_1 + m_2\vec{v}_2}{m_1 + m_2}$ and scaling radius $r_{new} = (r_1^3 + r_2^3)^{1/3}$.
- **Roche Limit Disruption**: When a small body ($m_2 \ll m_1$) approaches within $d < 1.5 \times r_1$, dissolve it into a burst of 12-20 debris particles distributed along tangential orbital tangents.
- **Zero-Dependency Native Architecture**: Modular ES6 modules loaded via standard `<script type="module">`, rendering to high-DPI HTML5 Canvas 2D with Web Audio API synthesis.

## Testing Decisions

- **Testing Philosophy**: Verify external observable physical behavior at the public seam (`SimulationEngine`), rather than mocking internal helper methods.
- **Primary Seam**: `SimulationEngine` (`addBody()`, `step(dt)`, `getBodies()`, `getState()`).
- **Target Invariants**:
  - Conservation of linear momentum during free orbital motion and during Coalescence mergers.
  - Energy conservation bounds in a closed two-body Keplerian circular orbit over 500 steps.
  - Verification of inverse-square gravitational acceleration at varying distances.
  - Correct execution of inelastic Coalescence and mass combination.
  - Correct Roche Limit debris fracturing.

## Out of Scope

- 3D WebGL meshes (the simulation is designed specifically for high-clarity 2D cosmic canvas mechanics).
- General relativistic Kerr metric spacetime tensor equations (simplified stylized accretion disk and lensing shader ring are used).
- Cloud backend save states (simulations can be saved to browser `localStorage`).

## Further Notes

- Runs completely offline in any modern browser.
- Includes high-DPI retina display scaling so orbits and text are razor-sharp.
