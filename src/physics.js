import { calculateOrbitalElements, findDominantAttractor } from './conics.js';

/**
 * Vector2D - 2D Vector mathematics utility
 */
export class Vector2D {
  constructor(x = 0, y = 0) {
    this.x = Number.isFinite(x) ? x : 0;
    this.y = Number.isFinite(y) ? y : 0;
  }

  set(x, y) {
    this.x = Number.isFinite(x) ? x : 0;
    this.y = Number.isFinite(y) ? y : 0;
    return this;
  }

  clone() {
    return new Vector2D(this.x, this.y);
  }

  add(v) {
    if (v && Number.isFinite(v.x) && Number.isFinite(v.y)) {
      this.x += v.x;
      this.y += v.y;
    }
    return this;
  }

  sub(v) {
    if (v && Number.isFinite(v.x) && Number.isFinite(v.y)) {
      this.x -= v.x;
      this.y -= v.y;
    }
    return this;
  }

  scale(s) {
    if (Number.isFinite(s)) {
      this.x *= s;
      this.y *= s;
    }
    return this;
  }

  magSq() {
    return this.x * this.x + this.y * this.y;
  }

  mag() {
    return Math.hypot(this.x, this.y);
  }

  normalize() {
    const m = this.mag();
    if (m > 1e-9 && Number.isFinite(m)) {
      this.scale(1 / m);
    }
    return this;
  }

  static distance(v1, v2) {
    if (!v1 || !v2) return 0;
    const dx = (Number.isFinite(v2.x) ? v2.x : 0) - (Number.isFinite(v1.x) ? v1.x : 0);
    const dy = (Number.isFinite(v2.y) ? v2.y : 0) - (Number.isFinite(v1.y) ? v1.y : 0);
    return Math.hypot(dx, dy);
  }
}

/**
 * SimulationEngine - Symplectic N-Body Gravitational Physics Engine
 */
export class SimulationEngine {
  constructor(options = {}) {
    this.G = options.G ?? 1.0;
    this.softening = options.softening ?? 2.0;
    this.collisionsEnabled = options.collisionsEnabled ?? true;
    this.rocheLimitEnabled = options.rocheLimitEnabled ?? true;
    this.relativisticCorrection = Boolean(options.relativisticCorrection);
    this.c = options.c ?? 100.0;
    this.historyCapacity = options.historyCapacity ?? 300;

    this.bodies = [];
    this.history = [];
    this.historyIndex = -1;
    this.supernovaBlasts = [];
    this.onCollision = options.onCollision || null;
    this.onTidalDisruption = options.onTidalDisruption || null;
    this.onSupernova = options.onSupernova || null;
  }

  getHistoryCapacity() {
    return this.historyCapacity;
  }

  getHistoryLength() {
    return this.history.length;
  }

  getHistoryIndex() {
    return this.historyIndex;
  }

  recordState() {
    const snapshot = this.bodies.map((b) => ({
      id: b.id,
      name: b.name,
      type: b.type,
      mass: b.mass,
      radius: b.radius,
      position: b.position.clone(),
      velocity: b.velocity.clone(),
      acceleration: b.acceleration ? b.acceleration.clone() : new Vector2D(0, 0),
      fixed: b.fixed,
      color: b.color,
      trail: (b.trail || []).map((p) => ({ x: p.x, y: p.y })),
      maxTrailLength: b.maxTrailLength ?? 120,
      magneticTilt: b.magneticTilt,
      spinPeriod: b.spinPeriod,
      isSelected: Boolean(b.isSelected),
    }));

    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    if (this.history.length >= this.historyCapacity) {
      this.history.shift();
    }
    this.history.push(snapshot);
    this.historyIndex = this.history.length - 1;
  }

  scrubTo(index) {
    if (typeof index !== 'number' || !Number.isInteger(index) || index < 0 || index >= this.history.length) {
      return false;
    }
    this.historyIndex = index;
    const snapshot = this.history[index];
    if (!snapshot) return false;
    this.bodies = snapshot.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      mass: s.mass,
      radius: s.radius,
      position: s.position.clone(),
      velocity: s.velocity.clone(),
      acceleration: s.acceleration ? s.acceleration.clone() : new Vector2D(0, 0),
      fixed: s.fixed,
      color: s.color,
      trail: (s.trail || []).map((p) => ({ x: p.x, y: p.y })),
      maxTrailLength: s.maxTrailLength ?? 120,
      magneticTilt: s.magneticTilt,
      spinPeriod: s.spinPeriod,
      isSelected: s.isSelected,
    }));
    return true;
  }

  addBody(bodyConfig) {
    const rawMass = Number(bodyConfig.mass);
    const mass = Number.isFinite(rawMass) ? (rawMass <= 0 ? 0 : rawMass) : 1;
    const rawRadius = Number(bodyConfig.radius);
    const radius = Number.isFinite(rawRadius) && rawRadius > 0 ? rawRadius : 5;

    const posX = Number.isFinite(bodyConfig.position?.x) ? bodyConfig.position.x : 0;
    const posY = Number.isFinite(bodyConfig.position?.y) ? bodyConfig.position.y : 0;
    const velX = Number.isFinite(bodyConfig.velocity?.x) ? bodyConfig.velocity.x : 0;
    const velY = Number.isFinite(bodyConfig.velocity?.y) ? bodyConfig.velocity.y : 0;

    const body = {
      id: bodyConfig.id || `body-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: bodyConfig.name || 'Celestial Body',
      type: bodyConfig.type || 'planet',
      mass,
      radius,
      position: new Vector2D(posX, posY),
      velocity: new Vector2D(velX, velY),
      acceleration: new Vector2D(0, 0),
      fixed: Boolean(bodyConfig.fixed),
      color: bodyConfig.color || '#4fa3e3',
      trail: [],
      maxTrailLength: Number.isFinite(bodyConfig.maxTrailLength) ? bodyConfig.maxTrailLength : 120,
      magneticTilt: Number.isFinite(bodyConfig.magneticTilt) ? bodyConfig.magneticTilt : (bodyConfig.type === 'pulsar' ? 0.45 : 0),
      spinPeriod: Number.isFinite(bodyConfig.spinPeriod) ? bodyConfig.spinPeriod : (bodyConfig.type === 'pulsar' ? 1.0 : 0),
    };
    this.bodies.push(body);
    return body;
  }

  removeBody(id) {
    const index = this.bodies.findIndex((b) => b.id === id);
    if (index !== -1) {
      return this.bodies.splice(index, 1)[0];
    }
    return null;
  }

  getBody(id) {
    return this.bodies.find((b) => b.id === id);
  }

  getOrbitalElements(id) {
    const body = this.getBody(id);
    if (!body) return null;
    const dominant = findDominantAttractor(body, this.bodies, this.G);
    if (!dominant) return null;
    return calculateOrbitalElements({ primary: dominant, body, G: this.G });
  }

  getBodies() {
    return this.bodies;
  }

  clear() {
    this.bodies = [];
    this.history = [];
    this.historyIndex = -1;
    this.supernovaBlasts = [];
  }

  getSupernovaBlasts() {
    return this.supernovaBlasts;
  }

  triggerSupernova(starId) {
    const star = this.getBody(starId);
    if (!star) return null;

    const initialMass = star.mass;
    const initialRadius = star.radius;
    const isSupermassive = initialMass >= 20000; // TOV mass threshold

    if (isSupermassive) {
      star.type = 'black-hole';
      star.mass = initialMass * 0.45;
      star.radius = Math.min(22, Math.max(8, initialRadius * 0.45));
      star.color = '#000000';
      star.spinPeriod = 0;
      star.magneticTilt = 0;
    } else {
      star.type = 'pulsar';
      star.mass = initialMass * 0.35;
      star.radius = Math.max(6, Math.min(initialRadius - 1, initialRadius * 0.35));
      star.spinPeriod = star.spinPeriod || 0.6;
      star.magneticTilt = star.magneticTilt || 0.52;
      star.color = '#00e5ff';
    }

    const blast = {
      id: `sn-blast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      originId: star.id,
      x: star.position.x,
      y: star.position.y,
      radius: 0,
      maxRadius: 450,
      speed: 280,
      pressure: 45000,
      color: star.type === 'black-hole' ? '#a855f7' : '#00e5ff',
      age: 0,
    };

    this.supernovaBlasts.push(blast);

    if (this.onSupernova) {
      this.onSupernova(star, blast);
    }

    return blast;
  }

  getTotalLinearMomentum() {
    const momentum = new Vector2D(0, 0);
    for (const body of this.bodies) {
      const m = Number.isFinite(body.mass) && body.mass > 0 ? body.mass : 0;
      const vx = Number.isFinite(body.velocity?.x) ? body.velocity.x : 0;
      const vy = Number.isFinite(body.velocity?.y) ? body.velocity.y : 0;
      momentum.x += m * vx;
      momentum.y += m * vy;
    }
    return momentum;
  }

  getCenterOfMass() {
    let totalMass = 0;
    const com = new Vector2D(0, 0);
    for (const body of this.bodies) {
      const m = Number.isFinite(body.mass) && body.mass > 0 ? body.mass : 0;
      const px = Number.isFinite(body.position?.x) ? body.position.x : 0;
      const py = Number.isFinite(body.position?.y) ? body.position.y : 0;
      totalMass += m;
      com.x += px * m;
      com.y += py * m;
    }
    if (totalMass > 0) {
      com.scale(1 / totalMass);
    }
    return com;
  }

  computeAccelerations() {
    const n = this.bodies.length;
    const accelerations = Array.from({ length: n }, () => new Vector2D(0, 0));
    const safeSoftening = Math.max(0, Number.isFinite(this.softening) ? this.softening : 2.0);
    const eps2 = safeSoftening * safeSoftening;

    for (let i = 0; i < n; i++) {
      const b1 = this.bodies[i];
      if (!Number.isFinite(b1.position.x)) b1.position.x = 0;
      if (!Number.isFinite(b1.position.y)) b1.position.y = 0;
      if (!Number.isFinite(b1.velocity.x)) b1.velocity.x = 0;
      if (!Number.isFinite(b1.velocity.y)) b1.velocity.y = 0;
      if (!Number.isFinite(b1.mass) || b1.mass < 0) b1.mass = 0;

      for (let j = i + 1; j < n; j++) {
        const b2 = this.bodies[j];
        if (!Number.isFinite(b2.position.x)) b2.position.x = 0;
        if (!Number.isFinite(b2.position.y)) b2.position.y = 0;
        if (!Number.isFinite(b2.velocity.x)) b2.velocity.x = 0;
        if (!Number.isFinite(b2.velocity.y)) b2.velocity.y = 0;
        if (!Number.isFinite(b2.mass) || b2.mass < 0) b2.mass = 0;

        const dx = b2.position.x - b1.position.x;
        const dy = b2.position.y - b1.position.y;
        const rawDistSq = dx * dx + dy * dy;
        const r2 = rawDistSq + eps2;

        // Collision / Singularity boundary guard ($r \to 0$ with 0 softening)
        if (r2 < 1e-8) {
          continue;
        }

        const dist = Math.sqrt(r2);
        const invDist3 = 1 / (r2 * dist);
        if (!Number.isFinite(invDist3)) continue;

        // Standard Newtonian factor
        let factor = this.G * invDist3;

        // General-relativistic post-Newtonian correction term: -3*G*M*L^2 / (c^2 * r^4)
        if (this.relativisticCorrection && Number.isFinite(this.c) && this.c > 0 && r2 > 1e-9) {
          const relVx = b2.velocity.x - b1.velocity.x;
          const relVy = b2.velocity.y - b1.velocity.y;
          const L = Math.abs(dx * relVy - dy * relVx);
          const L2 = L * L;
          const c2 = this.c * this.c;
          const relFactor = (3.0 * L2) / (c2 * r2);
          if (Number.isFinite(relFactor)) {
            factor *= (1.0 + relFactor);
          }
        }

        if (!Number.isFinite(factor)) continue;

        if (!b1.fixed && b2.mass > 0) {
          const ax = dx * (b2.mass * factor);
          const ay = dy * (b2.mass * factor);
          if (Number.isFinite(ax)) accelerations[i].x += ax;
          if (Number.isFinite(ay)) accelerations[i].y += ay;
        }
        if (!b2.fixed && b1.mass > 0) {
          const ax = dx * (b1.mass * factor);
          const ay = dy * (b1.mass * factor);
          if (Number.isFinite(ax)) accelerations[j].x -= ax;
          if (Number.isFinite(ay)) accelerations[j].y -= ay;
        }
      }
    }
    return accelerations;
  }

  step(dt) {
    if (this.bodies.length === 0 || !Number.isFinite(dt) || dt <= 0) return;

    for (const b of this.bodies) {
      if (!Number.isFinite(b.position.x)) b.position.x = 0;
      if (!Number.isFinite(b.position.y)) b.position.y = 0;
      if (!Number.isFinite(b.velocity.x)) b.velocity.x = 0;
      if (!Number.isFinite(b.velocity.y)) b.velocity.y = 0;
      if (!Number.isFinite(b.mass) || b.mass < 0) b.mass = 0;
      if (!Number.isFinite(b.radius) || b.radius <= 0) b.radius = 1;
    }

    // Record pre-step physical state for ring-buffer time scrubbing
    this.recordState();

    // 0. Update expanding relativistic supernova shockwaves & apply radiation pressure
    if (this.supernovaBlasts && this.supernovaBlasts.length > 0) {
      const vaporizedIds = new Set();
      for (const blast of this.supernovaBlasts) {
        blast.age += dt;
        blast.radius += blast.speed * dt;

        for (const b of this.bodies) {
          if (b.id === blast.originId) continue;

          const dx = b.position.x - blast.x;
          const dy = b.position.y - blast.y;
          const dist = Math.hypot(dx, dy);

          // Check if caught in blast shockwave envelope
          if (dist <= blast.radius) {
            // Micro-debris vaporization
            if (b.type === 'debris' || b.mass <= 0.1) {
              vaporizedIds.add(b.id);
              continue;
            }

            // Radial radiation pressure impulse on non-fixed celestial bodies
            if (!b.fixed && dist > 1e-3) {
              const invDist = 1 / dist;
              const nx = dx * invDist;
              const ny = dy * invDist;
              const radAcc = blast.pressure / (dist * dist + 10);
              if (Number.isFinite(radAcc)) {
                b.velocity.x += nx * radAcc * dt;
                b.velocity.y += ny * radAcc * dt;
              }
            }
          }
        }
      }

      if (vaporizedIds.size > 0) {
        this.bodies = this.bodies.filter((b) => !vaporizedIds.has(b.id));
      }

      this.supernovaBlasts = this.supernovaBlasts.filter((blast) => blast.radius < blast.maxRadius);
    }

    const n = this.bodies.length;
    // Step 1: Compute initial accelerations a(t)
    const a0 = this.computeAccelerations();

    // Step 2: Update positions x(t + dt) = x(t) + v(t)*dt + 0.5 * a(t) * dt^2
    const halfDt = 0.5 * dt;
    const halfDtSq = 0.5 * dt * dt;

    for (let i = 0; i < n; i++) {
      const b = this.bodies[i];
      if (b.fixed) continue;

      b.position.x += b.velocity.x * dt + a0[i].x * halfDtSq;
      b.position.y += b.velocity.y * dt + a0[i].y * halfDtSq;
      if (!Number.isFinite(b.position.x)) b.position.x = 0;
      if (!Number.isFinite(b.position.y)) b.position.y = 0;
    }

    // Step 3: Compute new accelerations a(t + dt) at updated positions
    const a1 = this.computeAccelerations();

    // Step 4: Update velocities v(t + dt) = v(t) + 0.5 * (a(t) + a(t + dt)) * dt
    for (let i = 0; i < n; i++) {
      const b = this.bodies[i];
      if (b.fixed) continue;

      b.velocity.x += (a0[i].x + a1[i].x) * halfDt;
      b.velocity.y += (a0[i].y + a1[i].y) * halfDt;
      if (!Number.isFinite(b.velocity.x)) b.velocity.x = 0;
      if (!Number.isFinite(b.velocity.y)) b.velocity.y = 0;
      b.acceleration = a1[i];
    }

    // Step 5: Check tidal disruption (Roche limit) and inelastic collisions
    this.handleInteractions();
  }

  handleInteractions() {
    const toRemove = new Set();
    const n = this.bodies.length;

    for (let i = 0; i < n; i++) {
      if (toRemove.has(i)) continue;
      const b1 = this.bodies[i];

      for (let j = i + 1; j < n; j++) {
        if (toRemove.has(j)) continue;
        const b2 = this.bodies[j];

        const dx = b2.position.x - b1.position.x;
        const dy = b2.position.y - b1.position.y;
        const dist = Math.hypot(dx, dy);

        // Identify more massive vs smaller body
        const [larger, smaller, lIdx, sIdx] = b1.mass >= b2.mass ? [b1, b2, i, j] : [b2, b1, j, i];

        // 1. Inelastic Coalescence Check (Direct physical contact)
        if (this.collisionsEnabled && dist <= (larger.radius + smaller.radius)) {
          const totalMass = larger.mass + smaller.mass;

          // Conservation of linear momentum: v_new = (m1*v1 + m2*v2) / (m1+m2)
          larger.velocity.x = (larger.mass * larger.velocity.x + smaller.mass * smaller.velocity.x) / totalMass;
          larger.velocity.y = (larger.mass * larger.velocity.y + smaller.mass * smaller.velocity.y) / totalMass;

          // Combined mass
          larger.mass = totalMass;

          // Radius scaling: volume proportional to mass (cube root)
          larger.radius = Math.cbrt(Math.pow(larger.radius, 3) + Math.pow(smaller.radius, 3));

          // If a planet consumes a star or black hole, it becomes that type
          if (smaller.type === 'black-hole') larger.type = 'black-hole';
          else if (smaller.type === 'star' && larger.type !== 'black-hole') larger.type = 'star';

          toRemove.add(sIdx);

          if (this.onCollision) {
            const collisionPoint = new Vector2D(
              (larger.position.x + smaller.position.x) * 0.5,
              (larger.position.y + smaller.position.y) * 0.5
            );
            this.onCollision(larger, smaller, collisionPoint);
          }

          // Automatic Core-Collapse check if star exceeds critical mass
          if (larger.type === 'star' && larger.mass >= 25000) {
            this.triggerSupernova(larger.id);
          }
          continue;
        }

        // 2. Tidal Disruption Check (Roche Limit for non-contact flyby)
        if (this.rocheLimitEnabled && (larger.type === 'black-hole' || larger.type === 'star') && smaller.type !== 'black-hole') {
          // Approximate rigid Roche limit: ~1.5 * R_massive for bodies with high mass ratio
          const rocheLimit = larger.radius * 1.6;
          if (dist < rocheLimit && larger.mass >= smaller.mass * 10) {
            toRemove.add(sIdx);
            if (this.onTidalDisruption) {
              this.onTidalDisruption(larger, smaller);
            }
            continue;
          }
        }
      }
    }

    if (toRemove.size > 0) {
      // Filter remaining bodies
      this.bodies = this.bodies.filter((_, idx) => !toRemove.has(idx));
    }
  }
}
