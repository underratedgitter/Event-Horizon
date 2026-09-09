import { Vector2D } from './physics.js';

/**
 * serializeScenario
 * Encodes simulation parameters and celestial body configurations into a compact URL-safe Base64 string.
 *
 * @param {SimulationEngine} engine - Active simulation engine
 * @returns {string} URL-safe base64 serialized scenario
 */
export function serializeScenario(engine) {
  if (!engine) return '';
  const bodies = engine.getBodies ? engine.getBodies() : (engine.bodies || []);

  const payload = {
    G: Number((engine.G ?? 1.0).toFixed(2)),
    s: Number((engine.softening ?? 2.0).toFixed(2)),
    b: bodies.map((b) => ({
      n: b.name,
      t: b.type,
      m: Number(b.mass.toFixed(2)),
      r: Number(b.radius.toFixed(2)),
      x: Number((b.position?.x ?? 0).toFixed(2)),
      y: Number((b.position?.y ?? 0).toFixed(2)),
      vx: Number((b.velocity?.x ?? 0).toFixed(3)),
      vy: Number((b.velocity?.y ?? 0).toFixed(3)),
      c: b.color,
      f: b.fixed ? 1 : 0,
      mt: b.magneticTilt !== undefined ? Number(b.magneticTilt.toFixed(2)) : undefined,
      sp: b.spinPeriod !== undefined ? Number(b.spinPeriod.toFixed(2)) : undefined,
    })),
  };

  const json = JSON.stringify(payload);
  let base64;
  if (typeof btoa === 'function') {
    base64 = btoa(json);
  } else if (typeof Buffer !== 'undefined') {
    base64 = Buffer.from(json).toString('base64');
  } else {
    base64 = json;
  }

  return encodeURIComponent(base64);
}

const BLOCKED_PROPERTIES = new Set(['__proto__', 'constructor', 'prototype']);

const ALLOWED_BODY_TYPES = new Set([
  'star',
  'planet',
  'moon',
  'black-hole',
  'black_hole',
  'pulsar',
  'spacecraft',
  'debris',
  'asteroid',
]);

const SAFE_COLOR_REGEX = /^#[0-9a-fA-F]{3,8}$|^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(\s*,\s*[\d.]+\s*)?\)$/;
const MAX_BODIES = 512;
const MAX_NAME_LENGTH = 64;
const MAX_PAYLOAD_LENGTH = 500000; // 500KB limit to prevent memory exhaustion

/**
 * deserializeScenario
 * Decodes, sanitizes, and validates a serialized Base64 scenario string back into celestial bodies and parameters.
 * Defends against Prototype Pollution, script injections, non-finite numbers, and memory exhaustion.
 *
 * @param {string} input - Base64 encoded scenario or URL containing #scenario=
 * @returns {Object|null} Deserialized configuration { G, softening, bodies } or null if invalid
 */
export function deserializeScenario(input) {
  if (!input || typeof input !== 'string') return null;

  try {
    let clean = input.trim();
    if (clean.includes('#scenario=')) {
      clean = clean.split('#scenario=')[1];
    } else if (clean.includes('#data=')) {
      clean = clean.split('#data=')[1];
    } else if (clean.startsWith('#')) {
      clean = clean.slice(1);
    }

    if (clean.length > MAX_PAYLOAD_LENGTH) return null;

    clean = decodeURIComponent(clean);
    let jsonStr;

    if (typeof atob === 'function') {
      jsonStr = atob(clean);
    } else if (typeof Buffer !== 'undefined') {
      jsonStr = Buffer.from(clean, 'base64').toString('utf8');
    } else {
      jsonStr = clean;
    }

    if (jsonStr.length > MAX_PAYLOAD_LENGTH) return null;

    // Defense against Prototype Pollution: Strip dangerous keys during JSON parsing
    const data = JSON.parse(jsonStr, (key, value) => {
      if (BLOCKED_PROPERTIES.has(key)) {
        return undefined;
      }
      return value;
    });

    if (!data || typeof data !== 'object' || !Array.isArray(data.b)) return null;

    const G = (typeof data.G === 'number' && Number.isFinite(data.G))
      ? Math.max(0, Math.min(data.G, 100))
      : 2.0;

    const softening = (typeof data.s === 'number' && Number.isFinite(data.s))
      ? Math.max(0.1, Math.min(data.s, 100))
      : 3.0;

    // Bounded array length
    const rawBodies = data.b.slice(0, MAX_BODIES);
    const cleanBodies = [];

    for (const b of rawBodies) {
      if (!b || typeof b !== 'object') continue;

      // Sanitize name: remove HTML tags, strip control characters, truncate length
      let rawName = typeof b.n === 'string' ? b.n : 'Celestial Body';
      let sanitizedName = rawName.replace(/[<>]/g, '').trim().slice(0, MAX_NAME_LENGTH) || 'Celestial Body';

      let rawType = typeof b.t === 'string' ? b.t : 'planet';
      if (rawType === 'black_hole') rawType = 'black-hole';
      const type = ALLOWED_BODY_TYPES.has(rawType) ? rawType : 'planet';

      const mass = (typeof b.m === 'number' && Number.isFinite(b.m) && b.m > 0) ? b.m : 1;
      const radius = (typeof b.r === 'number' && Number.isFinite(b.r) && b.r > 0) ? b.r : 5;
      const x = (typeof b.x === 'number' && Number.isFinite(b.x)) ? b.x : 0;
      const y = (typeof b.y === 'number' && Number.isFinite(b.y)) ? b.y : 0;
      const vx = (typeof b.vx === 'number' && Number.isFinite(b.vx)) ? b.vx : 0;
      const vy = (typeof b.vy === 'number' && Number.isFinite(b.vy)) ? b.vy : 0;
      const color = (typeof b.c === 'string' && SAFE_COLOR_REGEX.test(b.c.trim())) ? b.c.trim() : '#4fa3e3';
      const fixed = Boolean(b.f);
      const magneticTilt = (typeof b.mt === 'number' && Number.isFinite(b.mt)) ? b.mt : undefined;
      const spinPeriod = (typeof b.sp === 'number' && Number.isFinite(b.sp)) ? b.sp : undefined;

      cleanBodies.push({
        name: sanitizedName,
        type,
        mass,
        radius,
        position: new Vector2D(x, y),
        velocity: new Vector2D(vx, vy),
        color,
        fixed,
        magneticTilt,
        spinPeriod,
      });
    }

    return {
      G,
      softening,
      bodies: cleanBodies,
    };
  } catch {
    return null;
  }
}
