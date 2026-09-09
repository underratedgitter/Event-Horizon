import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateHohmannTransfer } from '../src/conics.js';
import { Vector2D } from '../src/physics.js';

describe('Hohmann Transfer Orbit & Maneuver Planner Seam', () => {
  it('should accurately calculate transfer parameters between two circular orbits', () => {
    const primary = {
      id: 'sol',
      name: 'Sun',
      mass: 1000,
      position: new Vector2D(0, 0),
      velocity: new Vector2D(0, 0),
    };

    const G = 1.0;
    const r1 = 100;
    const r2 = 200;

    const transfer = calculateHohmannTransfer({
      primary,
      r1,
      r2,
      G,
    });

    assert.ok(transfer, 'Transfer calculation must return an object');
    // semiMajorAxis a_tx = (100 + 200) / 2 = 150
    assert.ok(Math.abs(transfer.semiMajorAxis - 150) < 1e-4);

    // Initial circular speed v_c1 = sqrt(1000 / 100) = sqrt(10) ~ 3.162277
    assert.ok(Math.abs(transfer.initialCircularSpeed - Math.sqrt(10)) < 1e-4);

    // Target circular speed v_c2 = sqrt(1000 / 200) = sqrt(5) ~ 2.236067
    assert.ok(Math.abs(transfer.targetCircularSpeed - Math.sqrt(5)) < 1e-4);

    // Departure burn deltaV1: |sqrt(1000 * (2/100 - 1/150)) - sqrt(10)|
    // v_tx1 = sqrt(1000 * 1/75) = sqrt(13.3333) ~ 3.6514837
    // deltaV1 ~ 3.6514837 - 3.1622776 = 0.489206
    assert.ok(Math.abs(transfer.deltaV1 - 0.4892) < 1e-3, `deltaV1 was ${transfer.deltaV1}`);

    // Arrival burn deltaV2: |sqrt(5) - sqrt(1000 * (2/200 - 1/150))|
    // v_tx2 = sqrt(1000 * 1/300) = sqrt(3.33333) ~ 1.8257418
    // deltaV2 ~ 2.2360679 - 1.8257418 = 0.410326
    assert.ok(Math.abs(transfer.deltaV2 - 0.4103) < 1e-3, `deltaV2 was ${transfer.deltaV2}`);

    // Total deltaV = deltaV1 + deltaV2 ~ 0.89953
    assert.ok(Math.abs(transfer.totalDeltaV - (transfer.deltaV1 + transfer.deltaV2)) < 1e-6);

    // Transfer time = pi * sqrt(150^3 / 1000) ~ pi * sqrt(3375) ~ pi * 58.09475 ~ 182.51
    assert.ok(Math.abs(transfer.transferTime - Math.PI * Math.sqrt(Math.pow(150, 3) / 1000)) < 1e-3);
  });

  it('should support inward transfers (r1 > r2) correctly', () => {
    const primary = { id: 'sol', mass: 1000, position: new Vector2D(0, 0), velocity: new Vector2D(0, 0) };
    const transfer = calculateHohmannTransfer({
      primary,
      r1: 200,
      r2: 100,
      G: 1.0,
    });

    assert.ok(transfer);
    assert.equal(transfer.transferType, 'inward');
    assert.ok(transfer.deltaV1 > 0);
    assert.ok(transfer.deltaV2 > 0);
    assert.ok(transfer.totalDeltaV > 0);
  });

  it('should compute transfer between two celestial body objects directly', () => {
    const sun = { id: 'sun', mass: 1000, position: new Vector2D(0, 0), velocity: new Vector2D(0, 0) };
    const earth = { id: 'earth', mass: 1, position: new Vector2D(100, 0), velocity: new Vector2D(0, 3.16) };
    const mars = { id: 'mars', mass: 0.1, position: new Vector2D(0, 150), velocity: new Vector2D(-2.58, 0) };

    const transfer = calculateHohmannTransfer({
      primary: sun,
      fromBody: earth,
      toBody: mars,
      G: 1.0,
    });

    assert.ok(transfer);
    assert.ok(transfer.totalDeltaV > 0);
    assert.equal(transfer.fromId, 'earth');
    assert.equal(transfer.toId, 'mars');
  });
});
