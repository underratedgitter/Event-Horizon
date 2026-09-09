import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Vector2D } from '../src/physics.js';
import {
  calculateCircumstellarHabitableZone,
  evaluatePlanetaryAtmosphere,
} from '../src/habitable.js';

describe('Circumstellar Habitable Zones & Planetary Atmosphere Classification Seam', () => {
  it('should compute exact inner runaway greenhouse and outer maximum greenhouse boundaries for a star', () => {
    // Standard solar analog star: mass = 8000
    const solarStar = {
      id: 'sun',
      name: 'Sun',
      type: 'star',
      mass: 8000,
      radius: 20,
    };

    const zone = calculateCircumstellarHabitableZone(solarStar);
    assert.ok(zone);
    assert.equal(zone.starId, 'sun');
    assert.equal(zone.luminosity, 1.0);
    // Baseline calibrated boundaries: inner ~ 130 AU, outer ~ 195 AU
    assert.ok(Math.abs(zone.rInner - 130) < 1.0, `Expected rInner ~ 130, got ${zone.rInner}`);
    assert.ok(Math.abs(zone.rOuter - 195) < 1.0, `Expected rOuter ~ 195, got ${zone.rOuter}`);
  });

  it('should scale habitable zone boundaries with stellar luminosity for high-mass and low-mass stars', () => {
    // Massive bright star
    const blueGiant = {
      id: 'rigel',
      type: 'star',
      mass: 16000, // 2x solar mass -> higher luminosity
      radius: 35,
    };

    const redDwarf = {
      id: 'proxima',
      type: 'star',
      mass: 4000, // 0.5x solar mass -> lower luminosity
      radius: 12,
    };

    const giantZone = calculateCircumstellarHabitableZone(blueGiant);
    const dwarfZone = calculateCircumstellarHabitableZone(redDwarf);

    assert.ok(giantZone.luminosity > 1.0);
    assert.ok(giantZone.rInner > 130, 'Massive star must push habitable zone outward');
    assert.ok(giantZone.rOuter > 195);

    assert.ok(dwarfZone.luminosity < 1.0);
    assert.ok(dwarfZone.rInner < 130, 'Dwarf star habitable zone must contract closer to star');
    assert.ok(dwarfZone.rOuter < 195);
  });

  it('should classify terrestrial planet residing inside the Goldilocks zone as habitable with liquid oceans and atmosphere', () => {
    const star = {
      id: 'sun',
      type: 'star',
      mass: 8000,
      radius: 20,
      position: new Vector2D(0, 0),
    };

    // Earth at distance = 155 AU (within [130, 195])
    const earth = {
      id: 'earth',
      name: 'Earth',
      type: 'planet',
      mass: 6.0,
      radius: 6,
      position: new Vector2D(155, 0),
      velocity: new Vector2D(0, 10),
    };

    const climate = evaluatePlanetaryAtmosphere(earth, [star, earth]);

    assert.ok(climate);
    assert.equal(climate.state, 'habitable-terrestrial');
    assert.equal(climate.isHabitable, true);
    assert.equal(climate.hasLiquidOceans, true);
    assert.equal(climate.hasCloudSwirls, true);
    assert.ok(climate.habitabilityScore > 0.85);
  });

  it('should classify planet closer than runaway greenhouse limit as scorched infernal world', () => {
    const star = {
      id: 'sun',
      type: 'star',
      mass: 8000,
      radius: 20,
      position: new Vector2D(0, 0),
    };

    // Venus at distance = 80 AU (< 130 AU inner limit)
    const venus = {
      id: 'venus',
      name: 'Venus',
      type: 'planet',
      mass: 5.0,
      radius: 5.5,
      position: new Vector2D(80, 0),
      velocity: new Vector2D(0, 14),
    };

    const climate = evaluatePlanetaryAtmosphere(venus, [star, venus]);

    assert.ok(climate);
    assert.equal(climate.state, 'scorched-runaway');
    assert.equal(climate.isHabitable, false);
    assert.equal(climate.hasLiquidOceans, false);
    assert.equal(climate.tempCategory, 'infernal');
  });

  it('should classify planet outside maximum greenhouse limit as frozen cryogenic ice world', () => {
    const star = {
      id: 'sun',
      type: 'star',
      mass: 8000,
      radius: 20,
      position: new Vector2D(0, 0),
    };

    // Mars / Europa far at distance = 350 AU (> 195 AU outer limit)
    const frozenWorld = {
      id: 'glacio',
      name: 'Glacio',
      type: 'planet',
      mass: 2.0,
      radius: 4,
      position: new Vector2D(350, 0),
      velocity: new Vector2D(0, 6),
    };

    const climate = evaluatePlanetaryAtmosphere(frozenWorld, [star, frozenWorld]);

    assert.ok(climate);
    assert.equal(climate.state, 'cryogenic-ice');
    assert.equal(climate.isHabitable, false);
    assert.equal(climate.hasLiquidOceans, false);
    assert.equal(climate.tempCategory, 'cryogenic');
  });
});
