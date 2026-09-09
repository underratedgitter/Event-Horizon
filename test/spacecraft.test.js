import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SimulationEngine, Vector2D } from '../src/physics.js';
import { SpacecraftController } from '../src/spacecraft.js';

describe('Spacecraft Flight Simulator & Trajectory Prediction Seam', () => {
  it('should initialize player spacecraft with Delta-v budget and fuel tracking', () => {
    const engine = new SimulationEngine({ G: 2.0 });
    const spacecraft = new SpacecraftController({
      engine,
      id: 'apollo-spacecraft',
      name: 'Odyssey Probe',
      position: new Vector2D(0, 100),
      velocity: new Vector2D(5, 0),
      maxDeltaV: 25.0, // 25 AU/s total delta-v capacity
      thrustPower: 8.0,
      mass: 1.0,
    });

    assert.equal(spacecraft.id, 'apollo-spacecraft');
    assert.equal(spacecraft.maxDeltaV, 25.0);
    assert.equal(spacecraft.currentDeltaV, 25.0);
    assert.equal(spacecraft.getFuelPercentage(), 100);

    const body = engine.getBody('apollo-spacecraft');
    assert.ok(body, 'Spacecraft body must be registered in simulation engine');
    assert.equal(body.type, 'spacecraft');
  });

  it('should consume Delta-v fuel linearly upon applying thruster acceleration', () => {
    const engine = new SimulationEngine({ G: 2.0 });
    const spacecraft = new SpacecraftController({
      engine,
      id: 'test-craft',
      position: new Vector2D(0, 0),
      velocity: new Vector2D(0, 0),
      maxDeltaV: 20.0,
      thrustPower: 10.0,
      mass: 1.0,
    });

    const initialVx = spacecraft.body.velocity.x;
    const dt = 0.5;
    // Apply prograde thrust along +x with power 10
    // deltaV spent = acceleration * dt = 10 * 0.5 = 5.0
    spacecraft.applyThrust(new Vector2D(1, 0), dt);

    assert.equal(spacecraft.body.velocity.x, initialVx + 5.0);
    assert.equal(spacecraft.currentDeltaV, 15.0);
    assert.equal(spacecraft.getFuelPercentage(), 75.0);
  });

  it('should inhibit propulsion when Delta-v propellant is fully depleted', () => {
    const engine = new SimulationEngine({ G: 2.0 });
    const spacecraft = new SpacecraftController({
      engine,
      id: 'empty-craft',
      position: new Vector2D(0, 0),
      velocity: new Vector2D(0, 0),
      maxDeltaV: 4.0,
      thrustPower: 10.0,
      mass: 1.0,
    });

    // Fire thruster requiring 10 * 0.5 = 5.0 delta-v, but only 4.0 is available
    spacecraft.applyThrust(new Vector2D(1, 0), 0.5);

    assert.equal(spacecraft.currentDeltaV, 0);
    assert.equal(spacecraft.getFuelPercentage(), 0);
    assert.equal(spacecraft.isPropellantDepleted(), true);
    assert.equal(spacecraft.body.velocity.x, 4.0);

    // Attempting further burns should not increase velocity
    spacecraft.applyThrust(new Vector2D(1, 0), 0.5);
    assert.equal(spacecraft.body.velocity.x, 4.0, 'Depleted craft cannot accelerate further');
  });

  it('should allow refueling Delta-v capacity up to maximum limit', () => {
    const engine = new SimulationEngine({ G: 2.0 });
    const spacecraft = new SpacecraftController({
      engine,
      id: 'refuel-craft',
      maxDeltaV: 30.0,
      currentDeltaV: 5.0,
    });

    assert.equal(spacecraft.currentDeltaV, 5.0);
    spacecraft.refuel(15.0);
    assert.equal(spacecraft.currentDeltaV, 20.0);

    // Refuel beyond max should clamp to maxDeltaV
    spacecraft.refuel(50.0);
    assert.equal(spacecraft.currentDeltaV, 30.0);
    assert.equal(spacecraft.getFuelPercentage(), 100);
  });

  it('should compute forward predictive trajectory forecasting gravitational slingshot around a planet', () => {
    const engine = new SimulationEngine({ G: 2.0, softening: 2.0 });
    
    // Gas giant at (0, 0)
    const jupiter = engine.addBody({
      id: 'jupiter',
      name: 'Jupiter',
      type: 'planet',
      mass: 15000,
      radius: 35,
      position: new Vector2D(0, 0),
      velocity: new Vector2D(0, 0),
      fixed: true,
    });

    // Spacecraft on hyperbolic flyby trajectory
    const spacecraft = new SpacecraftController({
      engine,
      id: 'voyager-craft',
      position: new Vector2D(-300, -80),
      velocity: new Vector2D(14, 0),
      maxDeltaV: 20.0,
    });

    const trajectory = spacecraft.calculateTrajectoryPath({
      steps: 300,
      dt: 0.1,
    });

    assert.ok(trajectory);
    assert.ok(trajectory.points.length > 50, 'Trajectory must project multiple future waypoints');
    assert.ok(trajectory.closestApproach, 'Trajectory must compute closest approach to attractor');
    assert.equal(trajectory.closestApproach.bodyId, 'jupiter');
    assert.ok(trajectory.closestApproach.distance < 120, 'Flyby periapsis must be within Jupiter gravity well');

    // Gravitational deflection check: initial vy was 0, slingshot must bend vy upwards
    const finalPoint = trajectory.points[trajectory.points.length - 1];
    assert.ok(finalPoint.velocity.y > 2.0, `Slingshot must deflect velocity vector (+y), got ${finalPoint.velocity.y}`);
    assert.ok(trajectory.slingshotBoost > 0, 'Trajectory predictor must record velocity gain from assist');
  });
});
