import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Vector2D } from '../src/physics.js';
import {
  calculateGravitationalPotential,
  calculateSpacetimeWarp,
  getSpacetimeDepthColor,
} from '../src/spacetime.js';

describe('Spacetime Curvature & Potential Mesh Math', () => {
  const G = 1.0;
  const softening = 10.0;

  it('should return zero potential in an empty universe', () => {
    const pt = new Vector2D(50, 50);
    const pot = calculateGravitationalPotential(pt, [], G, softening);
    assert.equal(pot, 0);
  });

  it('should calculate deeper negative potential closer to a massive body', () => {
    const star = {
      position: new Vector2D(0, 0),
      mass: 5000,
    };

    const closePt = new Vector2D(20, 0);
    const farPt = new Vector2D(200, 0);

    const phiClose = calculateGravitationalPotential(closePt, [star], G, softening);
    const phiFar = calculateGravitationalPotential(farPt, [star], G, softening);

    // Potential is negative; closer to star = more negative (deeper well)
    assert.ok(phiClose < phiFar, `phiClose (${phiClose}) should be deeper (more negative) than phiFar (${phiFar})`);
  });

  it('should correctly superimpose potential from multiple bodies', () => {
    const b1 = { position: new Vector2D(-50, 0), mass: 1000 };
    const b2 = { position: new Vector2D(50, 0), mass: 1000 };

    const centerPt = new Vector2D(0, 0);
    const phiTotal = calculateGravitationalPotential(centerPt, [b1, b2], G, softening);
    const phiB1 = calculateGravitationalPotential(centerPt, [b1], G, softening);
    const phiB2 = calculateGravitationalPotential(centerPt, [b2], G, softening);

    assert.ok(Math.abs(phiTotal - (phiB1 + phiB2)) < 1e-6, 'Superposition principle must hold');
  });

  it('should compute finite bounded spacetime warp displacement vector towards mass', () => {
    const blackHole = {
      position: new Vector2D(100, 100),
      mass: 20000,
    };

    const gridPoint = new Vector2D(130, 100); // to the right of black hole
    const warped = calculateSpacetimeWarp(gridPoint, [blackHole], G, 15.0);

    assert.ok(warped instanceof Vector2D);
    // Point should be pulled to the left (towards black hole x=100)
    assert.ok(warped.x < gridPoint.x, `Warped x (${warped.x}) should pull towards x=100`);
    assert.ok(Math.abs(warped.y - gridPoint.y) < 1e-4, 'Symmetric along x-axis');
    // Displacement should be finite and not overshoot the singularity
    assert.ok(warped.x > blackHole.position.x - 50, 'Displacement must remain numerically stable');
  });

  it('should produce depth color grading corresponding to well depth', () => {
    const flatColor = getSpacetimeDepthColor(0);
    const deepColor = getSpacetimeDepthColor(-150);

    assert.ok(typeof flatColor === 'string');
    assert.ok(typeof deepColor === 'string');
    assert.notEqual(flatColor, deepColor);
  });
});
