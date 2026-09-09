import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SimulationEngine, Vector2D } from '../src/physics.js';
import { Presets } from '../src/presets.js';

describe('Relativistic Pulsar & Synchrotron Jets System', () => {
  it('should initialize a celestial body with pulsar characteristics', () => {
    const engine = new SimulationEngine();
    const pulsar = engine.addBody({
      name: 'Crab Pulsar',
      type: 'pulsar',
      mass: 15000,
      radius: 9,
      position: new Vector2D(0, 0),
      velocity: new Vector2D(0, 0),
      magneticTilt: 0.5,
      spinPeriod: 0.8,
    });

    assert.equal(pulsar.type, 'pulsar');
    assert.equal(pulsar.mass, 15000);
    assert.equal(pulsar.radius, 9);
    assert.equal(pulsar.magneticTilt, 0.5);
    assert.equal(pulsar.spinPeriod, 0.8);
  });

  it('should support pulsarSystem preset with central pulsar and companion bodies', () => {
    const engine = new SimulationEngine();
    assert.ok(typeof Presets.pulsarSystem === 'function', 'pulsarSystem preset must exist');

    Presets.pulsarSystem(engine);
    const bodies = engine.getBodies();
    assert.ok(bodies.length >= 3, 'Pulsar system should contain pulsar and multiple orbiting bodies');

    const pulsar = bodies.find((b) => b.type === 'pulsar');
    assert.ok(pulsar, 'Central pulsar must be present in pulsarSystem preset');
    assert.ok(pulsar.mass >= 10000, 'Pulsar must possess extreme mass');
  });
});
