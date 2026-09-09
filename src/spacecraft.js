import { Vector2D } from './physics.js';

/**
 * SpacecraftController - Interactive pilotable spacecraft entity with Delta-v budgeting
 * and predictive N-body trajectory propagation for gravitational slingshots.
 */
export class SpacecraftController {
  constructor(options = {}) {
    this.engine = options.engine || null;
    this.id = options.id || 'player-spacecraft';
    this.name = options.name || 'Odyssey Probe';
    this.mass = options.mass ?? 1.0;
    this.radius = options.radius ?? 5.0;
    this.maxDeltaV = options.maxDeltaV ?? 25.0;
    this.currentDeltaV = options.currentDeltaV ?? this.maxDeltaV;
    this.thrustPower = options.thrustPower ?? 8.0;
    this.color = options.color || '#00e5ff';

    const pos = options.position instanceof Vector2D
      ? options.position.clone()
      : new Vector2D(options.position?.x || 0, options.position?.y || 0);

    const vel = options.velocity instanceof Vector2D
      ? options.velocity.clone()
      : new Vector2D(options.velocity?.x || 0, options.velocity?.y || 0);

    // Register or attach to body in engine
    if (this.engine) {
      let existing = this.engine.getBody(this.id);
      if (!existing) {
        this.body = this.engine.addBody({
          id: this.id,
          name: this.name,
          type: 'spacecraft',
          mass: this.mass,
          radius: this.radius,
          position: pos,
          velocity: vel,
          color: this.color,
        });
      } else {
        this.body = existing;
        this.body.type = 'spacecraft';
      }
    } else {
      this.body = {
        id: this.id,
        name: this.name,
        type: 'spacecraft',
        mass: this.mass,
        radius: this.radius,
        position: pos,
        velocity: vel,
        color: this.color,
      };
    }
  }

  getFuelPercentage() {
    if (this.maxDeltaV <= 0) return 0;
    return Math.max(0, Math.min(100, (this.currentDeltaV / this.maxDeltaV) * 100));
  }

  isPropellantDepleted() {
    return this.currentDeltaV <= 1e-4;
  }

  refuel(amount = this.maxDeltaV) {
    if (!Number.isFinite(amount) || amount <= 0) {
      return this.currentDeltaV;
    }
    this.currentDeltaV = Math.max(0, Math.min(this.maxDeltaV, this.currentDeltaV + amount));
    return this.currentDeltaV;
  }

  applyThrust(directionVector, dt) {
    if (
      this.isPropellantDepleted() ||
      !directionVector ||
      typeof directionVector !== 'object' ||
      !Number.isFinite(directionVector.x) ||
      !Number.isFinite(directionVector.y) ||
      !Number.isFinite(dt) ||
      dt <= 0
    ) {
      return 0;
    }

    const mag = Math.hypot(directionVector.x, directionVector.y);
    if (!Number.isFinite(mag) || mag < 1e-6) return 0;

    const nx = directionVector.x / mag;
    const ny = directionVector.y / mag;

    const rawPower = Number(this.thrustPower);
    const thrustPower = Number.isFinite(rawPower) && rawPower > 0 ? rawPower : 8.0;
    const requestedDeltaV = thrustPower * dt;
    const actualDeltaV = Math.min(requestedDeltaV, this.currentDeltaV);

    if (actualDeltaV > 0 && this.body) {
      if (!Number.isFinite(this.body.velocity.x)) this.body.velocity.x = 0;
      if (!Number.isFinite(this.body.velocity.y)) this.body.velocity.y = 0;
      this.body.velocity.x += nx * actualDeltaV;
      this.body.velocity.y += ny * actualDeltaV;
      this.currentDeltaV = Math.max(0, this.currentDeltaV - actualDeltaV);
    }

    return actualDeltaV;
  }

  calculateTrajectoryPath(options = {}) {
    if (!this.engine || !this.body) return null;

    const rawSteps = options.steps ?? 300;
    const steps = Number.isFinite(rawSteps) && rawSteps > 0 ? Math.floor(rawSteps) : 0;
    const rawDt = options.dt ?? 0.15;
    const dt = Number.isFinite(rawDt) && rawDt > 0 ? rawDt : 0.15;
    const G = Number.isFinite(this.engine.G) && this.engine.G > 0 ? this.engine.G : 2.0;
    const softening = Number.isFinite(this.engine.softening) ? Math.max(0.1, this.engine.softening) : 2.0;
    const eps2 = softening * softening;

    const initVx = Number.isFinite(this.body.velocity?.x) ? this.body.velocity.x : 0;
    const initVy = Number.isFinite(this.body.velocity?.y) ? this.body.velocity.y : 0;
    const initPx = Number.isFinite(this.body.position?.x) ? this.body.position.x : 0;
    const initPy = Number.isFinite(this.body.position?.y) ? this.body.position.y : 0;

    let curPos = new Vector2D(initPx, initPy);
    let curVel = new Vector2D(initVx, initVy);
    const initialSpeed = curVel.mag();

    if (steps <= 0) {
      return {
        points: [],
        closestApproach: null,
        initialSpeed,
        finalSpeed: initialSpeed,
        slingshotBoost: 0,
      };
    }

    const attractors = (this.engine.getBodies() || []).filter(
      (b) => b && b.id !== this.body.id && Number.isFinite(b.mass) && b.mass >= 0.5 && Number.isFinite(b.position?.x) && Number.isFinite(b.position?.y)
    );

    const points = [];
    let closestApproach = null;
    let minDistance = Infinity;

    for (let s = 0; s < steps; s++) {
      // 1. Record predicted position point
      const speed = curVel.mag();
      points.push({
        x: curPos.x,
        y: curPos.y,
        speed,
        velocity: curVel.clone(),
        time: s * dt,
      });

      // 2. Compute accelerations towards all attractors
      let ax = 0;
      let ay = 0;

      for (const attr of attractors) {
        const attrVx = Number.isFinite(attr.velocity?.x) ? attr.velocity.x : 0;
        const attrVy = Number.isFinite(attr.velocity?.y) ? attr.velocity.y : 0;
        // Project attractor position assuming linear velocity
        const attrX = attr.position.x + attrVx * (s * dt);
        const attrY = attr.position.y + attrVy * (s * dt);

        const dx = attrX - curPos.x;
        const dy = attrY - curPos.y;
        const distSq = dx * dx + dy * dy + eps2;
        const dist = Math.sqrt(distSq);

        if (dist < minDistance && s > 5) {
          minDistance = dist;
          closestApproach = {
            bodyId: attr.id,
            bodyName: attr.name,
            distance: dist,
            time: s * dt,
            speedAtPeriapsis: speed,
            position: new Vector2D(curPos.x, curPos.y),
          };
        }

        const invDist3 = 1 / (distSq * dist);
        if (Number.isFinite(invDist3)) {
          const factor = G * attr.mass * invDist3;
          if (Number.isFinite(factor)) {
            ax += dx * factor;
            ay += dy * factor;
          }
        }
      }

      // 3. Symplectic Euler / Verlet integration step
      curVel.x += ax * dt;
      curVel.y += ay * dt;
      if (!Number.isFinite(curVel.x)) curVel.x = 0;
      if (!Number.isFinite(curVel.y)) curVel.y = 0;

      curPos.x += curVel.x * dt;
      curPos.y += curVel.y * dt;
      if (!Number.isFinite(curPos.x)) curPos.x = 0;
      if (!Number.isFinite(curPos.y)) curPos.y = 0;
    }

    const finalSpeed = curVel.mag();
    const slingshotBoost = Math.max(0, finalSpeed - initialSpeed);

    return {
      points,
      closestApproach,
      initialSpeed,
      finalSpeed,
      slingshotBoost,
    };
  }
}
