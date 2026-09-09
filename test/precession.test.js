import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SimulationEngine, Vector2D } from '../src/physics.js';
import { calculateOrbitalElements } from '../src/conics.js';

describe('Relativistic Perihelion Precession & Post-Newtonian Gravity', () => {
  it('should compute exact post-Newtonian relativistic correction acceleration', () => {
    const G = 1.0;
    const c = 50.0;
    const engine = new SimulationEngine({
      G,
      softening: 0.0,
      relativisticCorrection: true,
      c,
    });

    const starMass = 1000;
    const r = 20;
    const v = 5; // Tangential velocity

    // Angular momentum L = r * v = 20 * 5 = 100
    // Expected a_GR = 3 * G * M * L^2 / (c^2 * r^4)
    // 3 * 1.0 * 1000 * 10000 / (2500 * 160000) = 30,000,000 / 400,000,000 = 0.075
    const star = engine.addBody({
      id: 'star',
      mass: starMass,
      position: new Vector2D(0, 0),
      velocity: new Vector2D(0, 0),
      fixed: true,
    });

    const planet = engine.addBody({
      id: 'planet',
      mass: 1,
      position: new Vector2D(r, 0),
      velocity: new Vector2D(0, v),
    });

    const accs = engine.computeAccelerations();
    // Planet is at index 1
    const planetAcc = accs[1];

    // a_Newton = G * M / r^2 = 1000 / 400 = 2.5
    // Total expected inward radial acceleration = 2.5 + 0.075 = 2.575
    // Since planet is at (r, 0), inward acceleration is in -x direction
    assert.ok(Math.abs(planetAcc.x - (-2.575)) < 1e-4, `Expected acc.x ~ -2.575, got ${planetAcc.x}`);
    assert.ok(Math.abs(planetAcc.y) < 1e-6, `Expected acc.y ~ 0, got ${planetAcc.y}`);
  });

  it('should produce measurable perihelion advance over time in an eccentric orbit', () => {
    const G = 100.0;
    const c = 45.0;
    const starMass = 10000;

    // 1. Pure Newtonian run
    const newtonianEngine = new SimulationEngine({
      G,
      softening: 0.1,
      relativisticCorrection: false,
      collisionsEnabled: false,
    });

    newtonianEngine.addBody({
      id: 'sun',
      mass: starMass,
      position: new Vector2D(0, 0),
      velocity: new Vector2D(0, 0),
      fixed: true,
    });

    const r0 = 100;
    const v0 = Math.sqrt((G * starMass) / r0) * 0.75; // Eccentric orbit

    newtonianEngine.addBody({
      id: 'mercury',
      mass: 0.1,
      position: new Vector2D(r0, 0),
      velocity: new Vector2D(0, v0),
    });

    // 2. Relativistic Post-Newtonian run
    const grEngine = new SimulationEngine({
      G,
      softening: 0.1,
      relativisticCorrection: true,
      c: 80.0,
      collisionsEnabled: false,
    });

    grEngine.addBody({
      id: 'sun',
      mass: starMass,
      position: new Vector2D(0, 0),
      velocity: new Vector2D(0, 0),
      fixed: true,
    });

    grEngine.addBody({
      id: 'mercury',
      mass: 0.1,
      position: new Vector2D(r0, 0),
      velocity: new Vector2D(0, v0),
    });

    // Run both for several orbits
    const dt = 0.02;
    for (let step = 0; step < 1200; step++) {
      newtonianEngine.step(dt);
      grEngine.step(dt);
    }

    const newtonianElements = newtonianEngine.getOrbitalElements('mercury');
    const grElements = grEngine.getOrbitalElements('mercury');

    const angleNewtonian = Math.atan2(newtonianElements.eccentricityVector.y, newtonianElements.eccentricityVector.x);
    const angleGR = Math.atan2(grElements.eccentricityVector.y, grElements.eccentricityVector.x);

    // Relativistic orbit should have experienced positive advance of perihelion line
    const perihelionShift = Math.abs(angleGR - angleNewtonian);
    assert.ok(perihelionShift > 0.05, `Expected perihelion precession > 0.05 rad, got ${perihelionShift}`);
  });
});
