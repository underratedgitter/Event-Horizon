import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Vector2D } from '../src/physics.js';
import {
  calculateOrbitalElements,
  findDominantAttractor,
  calculateCircularVelocity,
} from '../src/conics.js';

describe('Orbital Conics Calculator & Maneuver Node Math', () => {
  const G = 100.0;

  it('should accurately calculate orbital elements for a circular Keplerian orbit', () => {
    const primary = {
      id: 'sun',
      mass: 10000,
      position: new Vector2D(0, 0),
      velocity: new Vector2D(0, 0),
    };

    const r = 200;
    const mu = G * (primary.mass + 1); // standard gravitational parameter
    const vCirc = Math.sqrt(mu / r);

    const planet = {
      id: 'earth',
      mass: 1,
      position: new Vector2D(r, 0),
      velocity: new Vector2D(0, vCirc),
    };

    const elements = calculateOrbitalElements({ primary, body: planet, G });

    assert.ok(elements, 'Orbital elements must be returned');
    assert.ok(Math.abs(elements.eccentricity) < 1e-4, `Eccentricity should be ~0, got ${elements.eccentricity}`);
    assert.ok(Math.abs(elements.semiMajorAxis - r) < 1e-2, `Semi-major axis should be ~${r}, got ${elements.semiMajorAxis}`);
    assert.ok(Math.abs(elements.periapsis - r) < 1e-2, `Periapsis should be ~${r}, got ${elements.periapsis}`);
    assert.ok(Math.abs(elements.apoapsis - r) < 1e-2, `Apoapsis should be ~${r}, got ${elements.apoapsis}`);

    const expectedPeriod = 2 * Math.PI * Math.sqrt(Math.pow(r, 3) / mu);
    assert.ok(Math.abs(elements.period - expectedPeriod) < 1e-2, `Period should be ~${expectedPeriod}, got ${elements.period}`);
    assert.equal(elements.isBound, true);
    assert.equal(elements.orbitType, 'circular');
  });

  it('should accurately calculate elements for an eccentric elliptical orbit', () => {
    const primary = {
      id: 'sun',
      mass: 10000,
      position: new Vector2D(0, 0),
      velocity: new Vector2D(0, 0),
    };

    const rPeriapsis = 150;
    const mu = G * primary.mass;
    // For e = 0.5, rp = a(1 - e) => a = rp / 0.5 = 300
    // Periapsis speed: vp = sqrt(mu * (2/rp - 1/a)) = sqrt(mu * (2/150 - 1/300)) = sqrt(mu * 3/300) = sqrt(mu / 100)
    const expectedA = 300;
    const expectedRa = expectedA * 1.5; // 450
    const vPeriapsis = Math.sqrt(mu * (2 / rPeriapsis - 1 / expectedA));

    const comet = {
      id: 'halley',
      mass: 0.1,
      position: new Vector2D(rPeriapsis, 0),
      velocity: new Vector2D(0, vPeriapsis),
    };

    const elements = calculateOrbitalElements({ primary, body: comet, G });

    assert.ok(elements, 'Orbital elements must be returned');
    assert.ok(Math.abs(elements.eccentricity - 0.5) < 1e-3, `Eccentricity should be ~0.5, got ${elements.eccentricity}`);
    assert.ok(Math.abs(elements.semiMajorAxis - expectedA) < 1.0, `Semi-major axis should be ~300, got ${elements.semiMajorAxis}`);
    assert.ok(Math.abs(elements.periapsis - rPeriapsis) < 1.0, `Periapsis should be ~150, got ${elements.periapsis}`);
    assert.ok(Math.abs(elements.apoapsis - expectedRa) < 1.0, `Apoapsis should be ~450, got ${elements.apoapsis}`);
    assert.equal(elements.isBound, true);
    assert.equal(elements.orbitType, 'elliptical');
  });

  it('should identify hyperbolic escape trajectories and handle infinite apoapsis and period', () => {
    const primary = {
      id: 'sun',
      mass: 10000,
      position: new Vector2D(0, 0),
      velocity: new Vector2D(0, 0),
    };

    const r = 200;
    const mu = G * primary.mass;
    const escapeSpeed = Math.sqrt((2 * mu) / r);
    const hyperSpeed = escapeSpeed * 1.3; // Well above escape speed

    const voyager = {
      id: 'voyager',
      mass: 0.01,
      position: new Vector2D(r, 0),
      velocity: new Vector2D(0, hyperSpeed),
    };

    const elements = calculateOrbitalElements({ primary, body: voyager, G });

    assert.ok(elements.eccentricity > 1.0, `Eccentricity must be > 1 for hyperbolic orbit, got ${elements.eccentricity}`);
    assert.equal(elements.isBound, false);
    assert.equal(elements.apoapsis, Infinity);
    assert.equal(elements.period, null);
    assert.equal(elements.orbitType, 'hyperbolic');
    assert.ok(elements.periapsis > 0, 'Periapsis distance must remain a positive number');
  });

  it('should find dominant gravitational attractor in hierarchical multi-body system', () => {
    const sun = {
      id: 'sun',
      mass: 50000,
      position: new Vector2D(0, 0),
      velocity: new Vector2D(0, 0),
    };

    const earth = {
      id: 'earth',
      mass: 500,
      position: new Vector2D(600, 0),
      velocity: new Vector2D(0, 9.1),
    };

    const moon = {
      id: 'moon',
      mass: 0.05,
      position: new Vector2D(615, 0), // 15 units from Earth, 615 from Sun
      velocity: new Vector2D(0, 11),
    };

    const bodies = [sun, earth, moon];

    // Earth's acceleration towards Sun: G * 50000 / (600^2) = 5000000 / 360000 ≈ 13.88
    // Moon's acceleration towards Earth: G * 500 / (15^2) = 50000 / 225 ≈ 222.22 (Dominant!)
    // Moon's acceleration towards Sun: G * 50000 / (615^2) = 5000000 / 378225 ≈ 13.21

    const moonAttractor = findDominantAttractor(moon, bodies, G);
    assert.equal(moonAttractor?.id, 'earth', "Moon's dominant attractor should be Earth");

    const earthAttractor = findDominantAttractor(earth, bodies, G);
    assert.equal(earthAttractor?.id, 'sun', "Earth's dominant attractor should be Sun");
  });

  it('should calculate circular velocity magnitude and tangent directions for maneuver assist', () => {
    const primary = {
      id: 'jupiter',
      mass: 5000,
      position: new Vector2D(100, 100),
      velocity: new Vector2D(5, -2),
    };

    const spawnPos = new Vector2D(200, 100); // 100 units to the right
    const assist = calculateCircularVelocity(primary, spawnPos, G);

    // r = 100, mu = G * M = 100 * 5000 = 500000
    // speed = sqrt(500000 / 100) = sqrt(5000) ≈ 70.71
    assert.ok(Math.abs(assist.speed - Math.sqrt(5000)) < 1e-3);
    // Relative vector from primary is (1, 0)
    // Prograde tangent is perpendicular: (0, 1) or (0, -1)
    assert.ok(Math.abs(assist.prograde.x) < 1e-4);
    assert.ok(Math.abs(Math.abs(assist.prograde.y) - 1.0) < 1e-4);
    // Combined with primary velocity
    assert.ok(assist.progradeVelocity instanceof Vector2D);
    assert.ok(assist.retrogradeVelocity instanceof Vector2D);
  });
});
