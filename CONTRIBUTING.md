# Contributing to Event Horizon 🌌

Thank you for your interest in contributing to **Event Horizon**! We welcome contributions from astrophysicists, graphics programmers, and open-source contributors.

---

## 🏛 Core Engineering Principles

1. **Zero Runtime Dependencies**: The simulation, physics engine, renderer, and audio synthesizer must remain 100% native vanilla JavaScript (ES6+), Canvas 2D, and Web Audio API. No external runtime frameworks.
2. **Symplectic Physical Invariance**: All orbital mechanics and numerical integration must preserve physical invariants (total energy, linear momentum, and angular momentum) within numerical tolerances.
3. **Test-Driven Discipline (Red ➔ Green ➔ Refactor)**: Every new physics equation, celestial body behavior, or astrodynamic algorithm must be accompanied by comprehensive tests before implementation.
4. **Swiss Horological Aesthetics**: User interface and telemetry components follow aerospace HUD and Swiss watchmaking design specifications—clean typography, optical reticle brackets, tabular figures, and dark glassmorphic backings.

---

## 🛠 Local Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/underratedgitter/Event-Horizon.git
cd Event-Horizon

# 2. Install devDependencies (Playwright test runner)
npm install

# 3. Start local development server
npm start
# Server will launch at http://localhost:8080 with in-memory caching
```

---

## 🧪 Verification & Testing Commands

Before submitting a pull request, ensure all test suites pass green:

```bash
# Run unit & astrodynamics test suite
npm test

# Run high-concurrency load test suite (1,000 concurrent users)
npm run test:load

# Run Playwright end-to-end browser tests
npm run test:e2e
```

---

## 📐 Architecture Decision Records (ADRs)

When introducing fundamental architectural changes or altering the numerical integration pipeline, submit an ADR in [`docs/adr/`](docs/adr/) documenting:
- **Context**: The astrophysical or performance motivation.
- **Decision**: The chosen mathematical formulation or architecture seam.
- **Consequences**: Trade-offs, time complexity impact ($O(N^2)$ scaling), and browser compatibility.

---

## 📄 License
By contributing to Event Horizon, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
