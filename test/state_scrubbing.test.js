import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SimulationEngine, Vector2D } from '../src/physics.js';

describe('SimulationEngine - State Ring Buffer & Time Scrubbing Seam', () => {
  it('should initialize with a state ring buffer and record history up to capacity', () => {
    const engine = new SimulationEngine({ G: 1.0, historyCapacity: 300 });
    assert.equal(engine.getHistoryCapacity(), 300);
    assert.equal(engine.getHistoryLength(), 0);

    engine.addBody({
      id: 'body-1',
      name: 'Alpha',
      type: 'planet',
      mass: 10,
      radius: 5,
      position: new Vector2D(0, 0),
      velocity: new Vector2D(1, 0),
    });

    // Step 50 times
    for (let i = 0; i < 50; i++) {
      engine.step(0.1);
    }

    assert.equal(engine.getHistoryLength(), 50);

    // Step another 300 times to exceed capacity
    for (let i = 0; i < 300; i++) {
      engine.step(0.1);
    }

    // Capacity must be strictly clamped to 300
    assert.equal(engine.getHistoryLength(), 300);
  });

  it('should allow scrubbing backwards in time and restore exact physical body states', () => {
    const engine = new SimulationEngine({ G: 1.0, historyCapacity: 300 });

    const body = engine.addBody({
      id: 'probe',
      name: 'Voyager',
      type: 'debris',
      mass: 2,
      radius: 3,
      position: new Vector2D(0, 0),
      velocity: new Vector2D(10, 0),
    });

    // Step 10 times
    for (let i = 0; i < 10; i++) {
      engine.step(1.0);
    }

    // At step 10, position x should be ~100
    const finalPos = body.position.x;
    assert.ok(finalPos > 90, `Expected position > 90, got ${finalPos}`);

    // Scrub back to frame 3 (where x ~ 30)
    const scrubSuccess = engine.scrubTo(3);
    assert.equal(scrubSuccess, true);

    const scrubbedBody = engine.getBody('probe');
    assert.ok(scrubbedBody, 'Body should still exist after scrubbing');
    assert.ok(Math.abs(scrubbedBody.position.x - 30) < 1.0, `Expected position ~30, got ${scrubbedBody.position.x}`);
    assert.equal(scrubbedBody.velocity.x, 10);
    assert.equal(scrubbedBody.mass, 2);
  });

  it('should handle boundary clamping and invalid scrub indices safely', () => {
    const engine = new SimulationEngine({ G: 1.0, historyCapacity: 300 });

    engine.addBody({
      id: 'test-body',
      position: new Vector2D(0, 0),
      velocity: new Vector2D(1, 1),
    });

    for (let i = 0; i < 5; i++) {
      engine.step(0.1);
    }

    // Attempt negative index or index >= length
    assert.equal(engine.scrubTo(-5), false);
    assert.equal(engine.scrubTo(100), false);
    assert.equal(engine.getHistoryIndex(), 4); // Still at latest frame
  });
});
