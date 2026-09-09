import { Vector2D } from './physics.js';

/**
 * calculateGravitationalPotential
 * Calculates the total scalar gravitational potential Phi at a given 2D coordinate.
 * Phi(x, y) = - sum_i [ (G * M_i) / sqrt(r_i^2 + eps^2) ]
 *
 * @param {Vector2D|Object} point - 2D evaluation coordinate
 * @param {Array<Object>} bodies - Array of celestial bodies
 * @param {number} G - Gravitational constant
 * @param {number} softening - Softening length
 * @returns {number} Gravitational potential
 */
export function calculateGravitationalPotential(point, bodies, G = 1.0, softening = 15.0) {
  if (!point || !Array.isArray(bodies) || bodies.length === 0) return 0;
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || !Number.isFinite(G)) return 0;

  const safeSoftening = Math.max(0.1, Number.isFinite(softening) ? Math.max(0, softening) : 15.0);
  const eps2 = safeSoftening * safeSoftening;
  let phi = 0;

  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i];
    if (!b || !Number.isFinite(b.mass) || b.mass <= 0) continue;
    if (!Number.isFinite(b.position?.x) || !Number.isFinite(b.position?.y)) continue;

    const dx = point.x - b.position.x;
    const dy = point.y - b.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy + eps2);

    if (dist > 1e-6) {
      phi -= (G * b.mass) / dist;
    }
  }

  return Number.isFinite(phi) ? phi : 0;
}

/**
 * calculateSpacetimeWarp
 * Computes warped coordinates of a spacetime grid vertex deformed by gravitational wells.
 * Displaces points radially towards mass concentrations with smooth topological clamping.
 *
 * @param {Vector2D|Object} point - Original coordinate
 * @param {Array<Object>} bodies - Array of celestial bodies
 * @param {number} G - Gravitational constant
 * @param {number} softening - Softening length
 * @param {number} maxPullFactor - Maximum relative displacement limit
 * @returns {Vector2D} Warped coordinate
 */
export function calculateSpacetimeWarp(point, bodies, G = 1.0, softening = 20.0, maxPullFactor = 0.65) {
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return new Vector2D(0, 0);
  if (!Array.isArray(bodies) || bodies.length === 0) return new Vector2D(point.x, point.y);

  let totalDx = 0;
  let totalDy = 0;
  const safeSoftening = Math.max(0.1, Number.isFinite(softening) ? Math.max(0, softening) : 20.0);
  const eps2 = safeSoftening * safeSoftening;

  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i];
    if (!b || !Number.isFinite(b.mass) || b.mass <= 0) continue;
    if (!Number.isFinite(b.position?.x) || !Number.isFinite(b.position?.y)) continue;

    const rx = b.position.x - point.x;
    const ry = b.position.y - point.y;
    const distSq = rx * rx + ry * ry;
    const dist = Math.sqrt(distSq);

    if (dist < 1e-4) continue;

    // Acceleration magnitude proxy for spacetime sag
    const pullMagnitude = (G * b.mass * 1.8) / (distSq + eps2);
    if (!Number.isFinite(pullMagnitude)) continue;

    // Smooth bounded displacement to avoid grid self-intersection
    const maxAllowed = dist * maxPullFactor;
    const displacement = Math.min(maxAllowed, pullMagnitude);

    totalDx += (rx / dist) * displacement;
    totalDy += (ry / dist) * displacement;
  }

  const resX = point.x + totalDx;
  const resY = point.y + totalDy;
  return new Vector2D(Number.isFinite(resX) ? resX : point.x, Number.isFinite(resY) ? resY : point.y);
}

/**
 * getSpacetimeDepthColor
 * Produces color and alpha based on gravitational potential depth.
 *
 * @param {number} potential - Scalar potential value
 * @returns {string} CSS rgba color string
 */
export function getSpacetimeDepthColor(potential) {
  const depth = Number.isFinite(potential) ? Math.abs(potential) : 0;

  if (depth < 0.05) {
    return 'rgba(0, 229, 255, 0.07)';
  }

  const t = Math.min(1.0, depth / 200);

  // Interpolate:
  // t=0: cyan (0, 229, 255, 0.12)
  // t=0.5: violet (168, 85, 247, 0.28)
  // t=1.0: hot neon magenta (244, 63, 94, 0.45)
  let r, g, b, alpha;
  if (t < 0.5) {
    const localT = t * 2;
    r = Math.round(0 + localT * 168);
    g = Math.round(229 - localT * (229 - 85));
    b = Math.round(255 - localT * (255 - 247));
    alpha = 0.08 + localT * 0.18;
  } else {
    const localT = (t - 0.5) * 2;
    r = Math.round(168 + localT * (244 - 168));
    g = Math.round(85 - localT * (85 - 63));
    b = Math.round(247 - localT * (247 - 94));
    alpha = 0.26 + localT * 0.18;
  }

  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
}
