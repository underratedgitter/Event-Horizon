import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SimulationEngine, Vector2D } from '../src/physics.js';

describe('Supernova Core-Collapse & Stellar Remnant Physics', () => {
  it('should collapse intermediate-mass star into a Relativistic Pulsar', () => {
    const engine = new SimulationEngine({ G: 1.0 });
    const star = engine.addBody({
      id: 'betelgeuse',
      name: 'Betelgeuse',
      type: 'star',
      mass: 8000,
      radius: 30,
      position: new Vector2D(0, 0),
      velocity: new Vector2D(0, 0),
    });

    const blast = engine.triggerSupernova('betelgeuse');
    assert.ok(blast, 'Should return a supernova blast event');
    assert.equal(star.type, 'pulsar');
    assert.ok(star.spinPeriod > 0, 'Pulsar remnant must have a spin period');
    assert.ok(star.magneticTilt > 0, 'Pulsar remnant must have magnetic tilt');
    assert.ok(star.radius < 30, 'Remnant core must contract');
    assert.ok(star.mass < 8000, 'Ejecta mass loss should reduce core mass');
  });

  it('should collapse supermassive star exceeding TOV limit into a Schwarzschild Black Hole', () => {
    const engine = new SimulationEngine({ G: 1.0 });
    const star = engine.addBody({
      id: 'vy-canis',
      name: 'VY Canis Majoris',
      type: 'star',
      mass: 35000,
      radius: 45,
      position: new Vector2D(0, 0),
      velocity: new Vector2D(0, 0),
    });

    const blast = engine.triggerSupernova('vy-canis');
    assert.ok(blast);
    assert.equal(star.type, 'black-hole');
    assert.ok(star.radius <= 25, 'Event horizon should form compact horizon radius');
  });

  it('should generate an expanding radiation pressure wave that repels nearby celestial bodies', () => {
    const engine = new SimulationEngine({ G: 1.0, softening: 1.0 });
    const star = engine.addBody({
      id: 'core-star',
      type: 'star',
      mass: 10000,
      radius: 20,
      position: new Vector2D(0, 0),
      velocity: new Vector2D(0, 0),
      fixed: true,
    });

    const planet = engine.addBody({
      id: 'nearby-planet',
      type: 'planet',
      mass: 5,
      radius: 5,
      position: new Vector2D(40, 0),
      velocity: new Vector2D(0, 0),
    });

    const initialX = planet.position.x;
    engine.triggerSupernova('core-star');

    // Step simulation so blast wave reaches and impacts planet
    for (let i = 0; i < 20; i++) {
      engine.step(0.1);
    }

    // Radiation pressure must repel planet radially outward (+x)
    assert.ok(planet.position.x > initialX + 5, `Planet should be repelled outward, was ${planet.position.x}`);
    assert.ok(planet.velocity.x > 0, `Planet velocity should be directed radially away, got ${planet.velocity.x}`);
  });

  it('should vaporize micro-debris caught inside the relativistic blast wave envelope', () => {
    const engine = new SimulationEngine({ G: 1.0 });
    const star = engine.addBody({
      id: 'nova-star',
      type: 'star',
      mass: 12000,
      position: new Vector2D(0, 0),
    });

    const debris = engine.addBody({
      id: 'micro-asteroid',
      type: 'debris',
      mass: 0.05,
      radius: 2,
      position: new Vector2D(25, 0),
    });

    engine.triggerSupernova('nova-star');
    assert.ok(engine.getBody('micro-asteroid'), 'Debris exists before blast wave overtakes it');

    // Step until blast wave vaporizes debris
    for (let i = 0; i < 25; i++) {
      engine.step(0.1);
    }

    assert.equal(engine.getBody('micro-asteroid'), undefined, 'Micro-debris should be vaporized and removed');
  });

  it('should automatically trigger core-collapse when star exceeds critical mass through coalescence', () => {
    const engine = new SimulationEngine({ G: 1.0 });
    let supernovaTriggered = false;
    engine.onSupernova = () => {
      supernovaTriggered = true;
    };

    // Star just under critical mass
    const primaryStar = engine.addBody({
      id: 'massive-star',
      type: 'star',
      mass: 24500,
      radius: 20,
      position: new Vector2D(0, 0),
      velocity: new Vector2D(0, 0),
    });

    // Companion star colliding with it
    engine.addBody({
      id: 'companion-star',
      type: 'star',
      mass: 1000,
      radius: 10,
      position: new Vector2D(5, 0),
      velocity: new Vector2D(-1, 0),
    });

    // Step to trigger coalescence merger
    engine.step(0.05);

    assert.equal(supernovaTriggered, true, 'Coalescence past critical mass should trigger core-collapse');
    assert.equal(primaryStar.type, 'black-hole', 'Post-critical remnant should collapse into black hole');
  });
});
