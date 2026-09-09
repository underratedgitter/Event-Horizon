import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ParticleSystem } from '../src/particles.js';

describe('Astrophysics Visuals - Shockwaves & Multi-Pass Effects', () => {
  it('should emit and update expanding collision shockwave rings', () => {
    const ps = new ParticleSystem();
    assert.equal(ps.shockwaves.length, 0);

    ps.emitShockwave(100, 100, 180, '#ff9900');
    assert.equal(ps.shockwaves.length, 1);

    const sw = ps.shockwaves[0];
    assert.equal(sw.x, 100);
    assert.equal(sw.y, 100);
    assert.equal(sw.maxRadius, 180);
    assert.ok(sw.radius < sw.maxRadius);

    const initialRadius = sw.radius;
    // Step forward 0.2 seconds
    ps.update(0.2);

    assert.ok(sw.radius > initialRadius, 'Shockwave radius should expand over time');
    assert.ok(sw.life < sw.maxLife, 'Shockwave life should decay');
  });

  it('should clean up expired shockwaves after lifespan completes', () => {
    const ps = new ParticleSystem();
    ps.emitShockwave(0, 0, 100, '#00e5ff');

    // Advance time past shockwave maxLife (1.5s)
    ps.update(1.6);

    assert.equal(ps.shockwaves.length, 0, 'Expired shockwaves must be pruned from system');
  });
});
