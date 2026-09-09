import { Vector2D } from './physics.js';

/**
 * calculateCircumstellarHabitableZone - Computes inner Runaway Greenhouse limit
 * and outer Maximum Greenhouse limit based on stellar luminosity.
 *
 * Calibrated for solar mass (M = 8000, L = 1.0) with Earth at 150 AU:
 * Inner boundary: ~130 AU
 * Outer boundary: ~195 AU
 */
export function calculateCircumstellarHabitableZone(star) {
  if (!star) return null;

  // Mass-luminosity relation: L ~ (M / M_sun)^3.5
  const baseMass = 8000.0;
  const mass = Number.isFinite(Number(star.mass)) ? Math.max(0, Number(star.mass)) : baseMass;
  let luminosity;
  if (star.luminosity !== undefined && Number.isFinite(Number(star.luminosity))) {
    luminosity = Math.max(0, Number(star.luminosity));
  } else if (mass <= 0) {
    luminosity = 0;
  } else {
    luminosity = Math.max(0.005, Math.pow(mass / baseMass, 3.5));
  }

  const kInner = 130.0;
  const kOuter = 195.0;

  const sqrtL = Math.sqrt(Math.max(0, luminosity));
  const rInner = kInner * sqrtL;
  const rOuter = kOuter * sqrtL;

  return {
    starId: star.id,
    starName: star.name || 'Star',
    luminosity,
    rInner,
    rOuter,
    center: star.position instanceof Vector2D ? star.position.clone() : new Vector2D(star.position?.x || 0, star.position?.y || 0),
  };
}

/**
 * findPrimaryStar - Identifies the primary luminous gravitational attractor for a body
 */
export function findPrimaryStar(body, bodies = []) {
  if (!body || !bodies || bodies.length === 0) return null;

  let primary = null;
  let minDist = Infinity;

  for (const b of bodies) {
    if (b.id === body.id) continue;
    const isStarLike = b.type === 'star' || b.type === 'pulsar' || b.luminosity !== undefined || (b.mass && b.mass >= 1000 && b.type !== 'planet' && b.type !== 'moon' && b.type !== 'debris' && b.type !== 'spacecraft');
    if (isStarLike) {
      const bx = Number.isFinite(b.position?.x) ? b.position.x : 0;
      const by = Number.isFinite(b.position?.y) ? b.position.y : 0;
      const px = Number.isFinite(body.position?.x) ? body.position.x : 0;
      const py = Number.isFinite(body.position?.y) ? body.position.y : 0;
      const dx = bx - px;
      const dy = by - py;
      const dist = Math.hypot(dx, dy);
      if (dist < minDist) {
        minDist = dist;
        primary = b;
      }
    }
  }

  return primary;
}

/**
 * evaluatePlanetaryAtmosphere - Evaluates the climatic and atmospheric regime
 * of a celestial planet based on its stellar insolation and circumstellar habitable zone.
 */
export function evaluatePlanetaryAtmosphere(planet, bodies = []) {
  if (!planet) return null;

  const star = findPrimaryStar(planet, bodies);
  if (!star) {
    return {
      state: 'rogue-frozen',
      isHabitable: false,
      hasLiquidOceans: false,
      hasCloudSwirls: false,
      habitabilityScore: 0,
      tempCategory: 'cryogenic',
      surfaceTempK: 25,
      hasAtmosphere: false,
      atmosphereColor: null,
    };
  }

  const zone = calculateCircumstellarHabitableZone(star);
  const px = Number.isFinite(planet.position?.x) ? planet.position.x : 0;
  const py = Number.isFinite(planet.position?.y) ? planet.position.y : 0;
  const sx = Number.isFinite(star.position?.x) ? star.position.x : 0;
  const sy = Number.isFinite(star.position?.y) ? star.position.y : 0;
  const rawDist = Math.hypot(px - sx, py - sy);
  const dist = Number.isFinite(rawDist) ? rawDist : 0;

  if (zone.rInner <= 0 || dist < zone.rInner) {
    // 1. Runaway Greenhouse Limit Breached (Infernal / Venusian state)
    const proximityRatio = zone.rInner > 0 ? Math.max(0.1, Math.min(1.0, dist / zone.rInner)) : 0.1;
    return {
      state: 'scorched-runaway',
      isHabitable: false,
      hasLiquidOceans: false,
      hasCloudSwirls: false,
      habitabilityScore: Math.max(0, 0.45 * proximityRatio),
      tempCategory: 'infernal',
      surfaceTempK: Math.round(520 + 380 * (1 - proximityRatio)),
      hasAtmosphere: true,
      atmosphereColor: 'rgba(245, 158, 11, 0.65)',
      zone,
      distToStar: dist,
      starName: star.name || 'Star',
    };
  } else if (dist <= zone.rOuter) {
    // 2. Residing inside Circumstellar Habitable Zone (Goldilocks state)
    const midZone = (zone.rInner + zone.rOuter) * 0.5;
    const zoneWidth = Math.max(1e-4, zone.rOuter - zone.rInner);
    const deviation = Math.abs(dist - midZone) / zoneWidth;
    const habitabilityScore = Math.max(0.85, 1.0 - deviation * 0.22);
    const surfaceTempK = Math.round(288 - (dist - midZone) * 0.45);

    return {
      state: 'habitable-terrestrial',
      isHabitable: true,
      hasLiquidOceans: true,
      hasCloudSwirls: true,
      habitabilityScore,
      tempCategory: 'temperate',
      surfaceTempK,
      hasAtmosphere: true,
      atmosphereColor: 'rgba(56, 189, 248, 0.5)',
      zone,
      distToStar: dist,
      starName: star.name || 'Star',
    };
  } else {
    // 3. Beyond Maximum Greenhouse Limit (Cryogenic / Ice World state)
    const frostRatio = zone.rOuter / Math.max(1, dist);
    return {
      state: 'cryogenic-ice',
      isHabitable: false,
      hasLiquidOceans: false,
      hasCloudSwirls: false,
      habitabilityScore: Math.max(0, 0.35 * frostRatio),
      tempCategory: 'cryogenic',
      surfaceTempK: Math.round(Math.max(35, 185 * Math.sqrt(Math.max(0, frostRatio)))),
      hasAtmosphere: false,
      hasIceSheets: true,
      atmosphereColor: 'rgba(224, 242, 254, 0.35)',
      zone,
      distToStar: dist,
      starName: star.name || 'Star',
    };
  }
}
