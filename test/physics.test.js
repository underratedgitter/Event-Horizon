import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SimulationEngine, Vector2D } from '../src/physics.js';

describe('Physics Engine - SimulationEngine Seam', () => {
  it('should preserve total linear momentum in an isolated multi-body system', () => {
    const engine = new SimulationEngine({ G: 1.0, softening: 2.0 });
    
    // Add three bodies with non-zero velocities
    engine.addBody({
      id: 'body-1',
      mass: 500,
      radius: 10,
      position: new Vector2D(0, 0),
      velocity: new Vector2D(0, 2),
    });
    engine.addBody({
      id: 'body-2',
      mass: 300,
      radius: 8,
      position: new Vector2D(100, 0),
      velocity: new Vector2D(0, -3),
    });
    engine.addBody({
      id: 'body-3',
      mass: 200,
      radius: 6,
      position: new Vector2D(50, 100),
      velocity: new Vector2D(1, 0),
    });

    const initialMomentum = engine.getTotalLinearMomentum();

    // Step the simulation for 100 iterations
    const dt = 0.05;
    for (let i = 0; i < 100; i++) {
      engine.step(dt);
    }

    const finalMomentum = engine.getTotalLinearMomentum();

    // In an isolated system without external forces, momentum must be strictly conserved
    assert.ok(Math.abs(finalMomentum.x - initialMomentum.x) < 1e-6, `X-momentum drift: ${finalMomentum.x - initialMomentum.x}`);
    assert.ok(Math.abs(finalMomentum.y - initialMomentum.y) < 1e-6, `Y-momentum drift: ${finalMomentum.y - initialMomentum.y}`);
  });

  it('should maintain stable circular Keplerian orbit with Velocity Verlet integration', () => {
    const G = 100.0;
    const engine = new SimulationEngine({ G, softening: 0.1 });

    const starMass = 10000;
    const orbitRadius = 150;
    // Theoretical circular velocity v = sqrt(G * M / r)
    const circularSpeed = Math.sqrt((G * starMass) / orbitRadius);

    engine.addBody({
      id: 'central-star',
      mass: starMass,
      radius: 20,
      position: new Vector2D(0, 0),
      velocity: new Vector2D(0, 0),
      fixed: true, // Fixed central attractor
    });

    engine.addBody({
      id: 'planet',
      mass: 1,
      radius: 4,
      position: new Vector2D(orbitRadius, 0),
      velocity: new Vector2D(0, circularSpeed),
    });

    // Approximate orbital period T = 2 * pi * r / v
    const period = (2 * Math.PI * orbitRadius) / circularSpeed;
    const dt = 0.01;
    const steps = Math.floor(period / dt);

    for (let i = 0; i < steps; i++) {
      engine.step(dt);
    }

    const planet = engine.getBody('planet');
    assert.ok(planet, 'Planet must exist');
    const currentRadius = Math.hypot(planet.position.x, planet.position.y);
    const radiusError = Math.abs(currentRadius - orbitRadius) / orbitRadius;

    // Radius deviation after a full orbit must remain under 0.5%
    assert.ok(radiusError < 0.005, `Orbital radius drift too large: ${(radiusError * 100).toFixed(3)}%`);
  });

  it('should conserve momentum and combine mass during inelastic Coalescence', () => {
    const engine = new SimulationEngine({ G: 1.0, softening: 1.0, collisionsEnabled: true });

    // Head-on collision
    engine.addBody({
      id: 'heavy-body',
      mass: 80,
      radius: 10,
      position: new Vector2D(-15, 0),
      velocity: new Vector2D(5, 0),
    });

    engine.addBody({
      id: 'light-body',
      mass: 20,
      radius: 5,
      position: new Vector2D(15, 0),
      velocity: new Vector2D(-10, 0),
    });

    // Initial total momentum: 80 * 5 + 20 * (-10) = 400 - 200 = 200
    // Total mass: 100
    // Expected final velocity: 200 / 100 = 2.0
    // Expected combined radius: (10^3 + 5^3)^(1/3) = (1000 + 125)^(1/3) = 1125^(1/3) ≈ 10.4

    // Step through collision
    let collided = false;
    engine.onCollision = () => { collided = true; };

    for (let i = 0; i < 50; i++) {
      engine.step(0.05);
      if (engine.getBodies().length === 1) break;
    }

    const remainingBodies = engine.getBodies();
    assert.equal(remainingBodies.length, 1, 'Bodies should have merged into 1 body');
    const merged = remainingBodies[0];

    assert.equal(merged.mass, 100, 'Combined mass should equal sum of constituent masses');
    assert.ok(Math.abs(merged.velocity.x - 2.0) < 1e-3, `Merged velocity.x ${merged.velocity.x} should be close to 2.0`);
    assert.ok(Math.abs(merged.velocity.y - 0.0) < 1e-3, `Merged velocity.y ${merged.velocity.y} should be 0`);
    assert.ok(Math.abs(merged.radius - Math.cbrt(1000 + 125)) < 1e-3, 'Radius should scale with cube root of volume');
    assert.ok(collided, 'Collision callback should have fired');
  });

  it('should trigger tidal disruption when small body enters Roche Limit of massive body', () => {
    const engine = new SimulationEngine({ G: 10.0, softening: 1.0, rocheLimitEnabled: true });

    engine.addBody({
      id: 'black-hole',
      type: 'black-hole',
      mass: 50000,
      radius: 30,
      position: new Vector2D(0, 0),
      velocity: new Vector2D(0, 0),
    });

    let disruptedEvent = null;
    engine.onTidalDisruption = (massive, small) => {
      disruptedEvent = { massiveId: massive.id, smallId: small.id };
    };

    // Add a tiny asteroid placed inside the Roche limit
    engine.addBody({
      id: 'doomed-asteroid',
      type: 'debris',
      mass: 1,
      radius: 3,
      position: new Vector2D(40, 0), // within 1.5 * 30 = 45 Roche limit
      velocity: new Vector2D(0, 20),
    });

    engine.step(0.01);

    assert.ok(disruptedEvent, 'Tidal disruption event must fire');
    assert.equal(disruptedEvent.smallId, 'doomed-asteroid');
    assert.equal(engine.getBody('doomed-asteroid'), undefined, 'Doomed body must be removed from simulation');
  });
});
