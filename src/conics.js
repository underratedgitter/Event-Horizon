import { Vector2D } from './physics.js';

/**
 * calculateOrbitalElements
 * Computes instantaneous osculating Keplerian orbital elements for a 2-body system.
 *
 * @param {Object} params
 * @param {Object} params.primary - Central attractor body (mass, position, velocity)
 * @param {Object} params.body - Orbiting body (mass, position, velocity)
 * @param {number} params.G - Gravitational constant
 * @returns {Object} Calculated orbital elements
 */
export function calculateOrbitalElements({ primary, body, G }) {
  if (!primary || !body || !Number.isFinite(G) || G <= 0) return null;

  const m1 = primary.mass;
  const m2 = body.mass || 0;
  if (!Number.isFinite(m1) || m1 <= 0) return null;
  if (!Number.isFinite(m2) || m2 < 0) return null;

  if (
    !Number.isFinite(body.position?.x) ||
    !Number.isFinite(body.position?.y) ||
    !Number.isFinite(primary.position?.x) ||
    !Number.isFinite(primary.position?.y) ||
    !Number.isFinite(body.velocity?.x) ||
    !Number.isFinite(body.velocity?.y) ||
    !Number.isFinite(primary.velocity?.x) ||
    !Number.isFinite(primary.velocity?.y)
  ) {
    return null;
  }

  const mu = G * (m1 + m2);
  if (!Number.isFinite(mu) || mu <= 0) return null;

  // Relative displacement and velocity vectors (body relative to primary)
  const rx = body.position.x - primary.position.x;
  const ry = body.position.y - primary.position.y;
  const vx = body.velocity.x - primary.velocity.x;
  const vy = body.velocity.y - primary.velocity.y;

  const r = Math.hypot(rx, ry);
  const vSq = vx * vx + vy * vy;

  if (!Number.isFinite(r) || r < 1e-6) return null;

  // Specific angular momentum h_z = rx * vy - ry * vx
  const hz = rx * vy - ry * vx;
  const hSq = hz * hz;

  // Specific orbital energy epsilon = v^2 / 2 - mu / r
  const epsilon = vSq * 0.5 - mu / r;

  // Eccentricity vector e_vec = (v x h) / mu - r / |r|
  // v x h = (vy * hz, -vx * hz)
  const ex = (vy * hz) / mu - rx / r;
  const ey = (-vx * hz) / mu - ry / r;
  let eccentricity = Math.hypot(ex, ey);

  // If floating point drift makes e barely negative or close to 0
  if (eccentricity < 1e-7) eccentricity = 0;

  // Special Case 1: Collinear / Radial Plunge (zero angular momentum, bound energy)
  if (Math.abs(hz) < 1e-6 && epsilon < 0) {
    const semiMajorAxis = -mu / (2 * epsilon);
    return {
      semiMajorAxis,
      eccentricity: 1.0,
      periapsis: 0,
      apoapsis: r,
      period: semiMajorAxis > 0 ? 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxis, 3) / mu) : null,
      isBound: true,
      orbitType: 'radial-plunge',
      relativeDistance: r,
      relativeSpeed: Math.sqrt(vSq),
      specificEnergy: epsilon,
      angularMomentum: 0,
      eccentricityVector: new Vector2D(ex, ey),
      primaryId: primary.id,
      primaryName: primary.name,
    };
  }

  // Semi-major axis a = -mu / (2 * epsilon)
  let semiMajorAxis;
  let periapsis;
  let apoapsis;
  let period = null;
  let isBound = false;
  let orbitType = 'hyperbolic';

  if (eccentricity >= 1.0 || epsilon >= 0) {
    // Hyperbolic or parabolic orbit
    isBound = false;
    orbitType = (Math.abs(eccentricity - 1.0) < 1e-3 || Math.abs(epsilon) < 1e-6) ? 'parabolic' : 'hyperbolic';
    semiMajorAxis = Math.abs(epsilon) > 1e-7 ? -mu / (2 * epsilon) : Infinity;
    // Periapsis distance rp = h^2 / (mu * (1 + e))
    periapsis = hSq > 0 ? hSq / (mu * (1 + eccentricity)) : 0;
    apoapsis = Infinity;
    period = null;
  } else {
    // Bound elliptical or circular orbit
    isBound = true;
    orbitType = eccentricity < 0.05 ? 'circular' : 'elliptical';
    semiMajorAxis = -mu / (2 * epsilon);
    periapsis = semiMajorAxis * (1 - eccentricity);
    apoapsis = semiMajorAxis * (1 + eccentricity);

    if (semiMajorAxis > 0) {
      period = 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxis, 3) / mu);
    }
  }

  return {
    semiMajorAxis,
    eccentricity,
    periapsis,
    apoapsis,
    period,
    isBound,
    orbitType,
    relativeDistance: r,
    relativeSpeed: Math.sqrt(vSq),
    specificEnergy: epsilon,
    angularMomentum: hz,
    eccentricityVector: new Vector2D(ex, ey),
    primaryId: primary.id,
    primaryName: primary.name,
  };
}

/**
 * findDominantAttractor
 * Identifies the body exerting the maximum gravitational acceleration (G * M / r^2)
 * on the target body.
 *
 * @param {Object} body - The target body
 * @param {Array<Object>} bodies - All celestial bodies in the simulation
 * @param {number} G - Gravitational constant
 * @returns {Object|null} The dominant attractor body
 */
export function findDominantAttractor(body, bodies, G = 1.0) {
  if (!body || !Array.isArray(bodies) || bodies.length <= 1) return null;
  if (!Number.isFinite(body.position?.x) || !Number.isFinite(body.position?.y)) return null;

  let dominantBody = null;
  let maxAcc = -1;

  for (const candidate of bodies) {
    if (candidate.id === body.id || !Number.isFinite(candidate.mass) || candidate.mass <= 0) continue;
    if (!Number.isFinite(candidate.position?.x) || !Number.isFinite(candidate.position?.y)) continue;

    const dx = candidate.position.x - body.position.x;
    const dy = candidate.position.y - body.position.y;
    const distSq = dx * dx + dy * dy;

    if (distSq < 1e-6) continue;

    // Gravitational acceleration magnitude a = G * M / r^2
    const acc = (G * candidate.mass) / distSq;
    if (Number.isFinite(acc) && acc > maxAcc) {
      maxAcc = acc;
      dominantBody = candidate;
    }
  }

  return dominantBody;
}

/**
 * calculateCircularVelocity
 * Computes circular orbit velocity magnitude and prograde/retrograde tangents
 * for a test particle at a given position around a primary body.
 *
 * @param {Object} primary - Central attractor body
 * @param {Vector2D|Object} position - Spawn position
 * @param {number} G - Gravitational constant
 * @returns {Object} Circular orbital speed and vectors
 */
export function calculateCircularVelocity(primary, position, G = 1.0) {
  if (!primary || !position || !Number.isFinite(G) || G <= 0) return null;
  if (!Number.isFinite(primary.mass) || primary.mass <= 0) return null;
  if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) return null;
  if (!Number.isFinite(primary.position?.x) || !Number.isFinite(primary.position?.y)) return null;

  const dx = position.x - primary.position.x;
  const dy = position.y - primary.position.y;
  const r = Math.hypot(dx, dy);

  if (!Number.isFinite(r) || r < 1e-5) return null;

  const mu = G * primary.mass;
  const speed = Math.sqrt(mu / r);

  // Radial unit vector
  const urx = dx / r;
  const ury = dy / r;

  // Tangential unit vectors (perpendicular to radius)
  // Prograde: (-ury, urx)
  // Retrograde: (ury, -urx)
  const prograde = new Vector2D(-ury, urx);
  const retrograde = new Vector2D(ury, -urx);

  const primVx = primary.velocity?.x || 0;
  const primVy = primary.velocity?.y || 0;

  const progradeVelocity = new Vector2D(primVx + prograde.x * speed, primVy + prograde.y * speed);
  const retrogradeVelocity = new Vector2D(primVx + retrograde.x * speed, primVy + retrograde.y * speed);

  return {
    radius: r,
    speed,
    prograde,
    retrograde,
    progradeVelocity,
    retrogradeVelocity,
  };
}

/**
 * calculateHohmannTransfer
 * Computes the coplanar Hohmann transfer orbit parameters and Delta-V burns
 * between two orbital radii or celestial bodies around a common primary attractor.
 *
 * @param {Object} params
 * @param {Object} params.primary - Central massive attractor
 * @param {Object} [params.fromBody] - Departure celestial body
 * @param {Object} [params.toBody] - Target celestial body
 * @param {number} [params.r1] - Departure orbit radius
 * @param {number} [params.r2] - Target orbit radius
 * @param {number} [params.G=1.0] - Gravitational constant
 * @returns {Object|null} Comprehensive Hohmann maneuver plan
 */
export function calculateHohmannTransfer({ primary, fromBody, toBody, r1: paramR1, r2: paramR2, G = 1.0 }) {
  if (!primary || !Number.isFinite(primary.mass) || primary.mass <= 0) return null;
  if (!Number.isFinite(G) || G <= 0) return null;

  let r1 = paramR1;
  let r2 = paramR2;

  if (fromBody && fromBody.position && primary.position) {
    r1 = Math.hypot(fromBody.position.x - primary.position.x, fromBody.position.y - primary.position.y);
  }
  if (toBody && toBody.position && primary.position) {
    r2 = Math.hypot(toBody.position.x - primary.position.x, toBody.position.y - primary.position.y);
  }

  if (typeof r1 !== 'number' || typeof r2 !== 'number' || !Number.isFinite(r1) || !Number.isFinite(r2) || r1 <= 0 || r2 <= 0) {
    return null;
  }

  const mu = G * primary.mass;
  if (mu <= 0) return null;

  // Transfer orbit semi-major axis: a_tx = (r1 + r2) / 2
  const semiMajorAxis = (r1 + r2) * 0.5;

  // Circular speeds at both radii
  const initialCircularSpeed = Math.sqrt(mu / r1);
  const targetCircularSpeed = Math.sqrt(mu / r2);

  // Vis-viva velocities at apsides of transfer ellipse: v = sqrt(mu * (2/r - 1/a))
  const vTransfer1 = Math.sqrt(Math.max(0, mu * (2 / r1 - 1 / semiMajorAxis)));
  const vTransfer2 = Math.sqrt(Math.max(0, mu * (2 / r2 - 1 / semiMajorAxis)));

  // Delta-V impulse at departure (burn 1) and injection at arrival (burn 2)
  const deltaV1 = Math.abs(vTransfer1 - initialCircularSpeed);
  const deltaV2 = Math.abs(targetCircularSpeed - vTransfer2);
  const totalDeltaV = deltaV1 + deltaV2;

  // Transfer time: half the orbital period of the transfer ellipse
  const transferTime = Math.PI * Math.sqrt(Math.pow(semiMajorAxis, 3) / mu);

  // Eccentricity of transfer ellipse
  const eccentricity = Math.abs(r2 - r1) / (r1 + r2);

  return {
    primaryId: primary.id,
    primaryName: primary.name || 'Primary Attractor',
    fromId: fromBody?.id || null,
    toId: toBody?.id || null,
    fromName: fromBody?.name || 'Origin Orbit',
    toName: toBody?.name || 'Destination Orbit',
    r1,
    r2,
    semiMajorAxis,
    eccentricity,
    initialCircularSpeed,
    targetCircularSpeed,
    vTransfer1,
    vTransfer2,
    deltaV1,
    deltaV2,
    totalDeltaV,
    transferTime,
    transferType: r1 <= r2 ? 'outward' : 'inward',
  };
}

