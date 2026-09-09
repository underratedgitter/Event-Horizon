import { Vector2D } from './physics.js';

/**
 * MissionManager - Controller and Seam for Aerospace Flight Challenges
 */
export class MissionManager {
  constructor(options = {}) {
    this.engine = options.engine || null;
    this.status = 'idle'; // 'idle' | 'active' | 'victory' | 'failure'
    this.activeMission = null;
    this.timeRemaining = 0;
    this.elapsedTime = 0;
    this.failureReason = '';

    // Mission-specific state tracking
    this.captureHoldTime = 0;
    this.achievedSlingshot = false;

    // Callbacks
    this.onVictory = options.onVictory || null;
    this.onFailure = options.onFailure || null;
    this.onStatusChange = options.onStatusChange || null;
  }

  getMissions() {
    return [
      {
        id: 'lunar-insertion',
        title: 'Lunar Orbit Insertion',
        subtitle: 'Trans-Lunar Injection & Capture',
        difficulty: 'Intermediate',
        timeLimit: 60.0,
        description: 'Navigate probe from trans-lunar trajectory into a circular parking orbit around the Moon. Hold stable Keplerian orbit for 2.0s without surface collision.',
        objectives: [
          'Approach target Moon',
          'Match circular orbital speed',
          'Maintain stable orbit for 2.0s',
          'Avoid surface impact',
        ],
      },
      {
        id: 'jupiter-slingshot',
        title: 'Jupiter Slingshot',
        subtitle: 'Gravity-Assist Hyperbolic Flyby',
        difficulty: 'Advanced',
        timeLimit: 45.0,
        description: 'Execute a close hyperbolic flyby of gas giant Jupiter. Skim outside its turbulent atmosphere to gain slingshot escape velocity into deep space.',
        objectives: [
          'Enter Jupiter gravity well',
          'Perform periapsis flyby outside atmosphere (r > 40)',
          'Attain hyperbolic boost (speed >= 30)',
          'Escape past boundary (r > 700)',
        ],
      },
      {
        id: 'event-horizon-slalom',
        title: 'Event Horizon Slalom',
        subtitle: 'Relativistic Singularity Navigation',
        difficulty: 'Expert',
        timeLimit: 40.0,
        description: 'Pilot probe through the intense gravitational corridor between binary Schwarzschild black holes without breaching the 1.5 rs photon sphere instability boundary.',
        objectives: [
          'Enter binary singularity corridor',
          'Stay outside photon sphere (r > 1.5 rs)',
          'Thread the gravitational saddle',
          'Reach extraction waypoint (x > 400)',
        ],
      },
    ];
  }

  getMission(id) {
    return this.getMissions().find((m) => m.id === id) || null;
  }

  getActiveMission() {
    return this.activeMission;
  }

  getStatus() {
    return this.status;
  }

  getFailureReason() {
    return this.failureReason;
  }

  startMission(id) {
    const missionDef = this.getMission(id);
    if (!missionDef) return null;

    this.activeMission = missionDef;
    this.status = 'active';
    this.timeRemaining = missionDef.timeLimit;
    this.elapsedTime = 0;
    this.failureReason = '';
    this.captureHoldTime = 0;
    this.achievedSlingshot = false;

    if (this.engine) {
      this.engine.clear();
      this.spawnMissionBodies(id);
    }

    if (this.onStatusChange) {
      this.onStatusChange(this.status, this.activeMission);
    }

    return this.activeMission;
  }

  spawnMissionBodies(id) {
    if (!this.engine) return;

    if (id === 'lunar-insertion') {
      // Earth Primary
      this.engine.addBody({
        id: 'earth-primary',
        name: 'Earth',
        type: 'planet',
        mass: 3200,
        radius: 24,
        position: new Vector2D(-200, 0),
        velocity: new Vector2D(0, 0),
        fixed: true,
        color: '#38bdf8',
      });

      // Target Moon in circular orbit around Earth
      const moonDist = 280;
      const moonSpeed = Math.sqrt((this.engine.G * 3200) / moonDist);
      this.engine.addBody({
        id: 'lunar-target',
        name: 'Moon',
        type: 'moon',
        mass: 120,
        radius: 10,
        position: new Vector2D(-200 + moonDist, 0),
        velocity: new Vector2D(0, moonSpeed),
        color: '#d1d5db',
      });

      // Mission Probe launched along trans-lunar trajectory
      this.engine.addBody({
        id: 'mission-probe',
        name: 'Artemis Probe',
        type: 'debris',
        mass: 0.01,
        radius: 4,
        position: new Vector2D(-120, 20),
        velocity: new Vector2D(3.2, 1.8),
        color: '#00e5ff',
      });
    } else if (id === 'jupiter-slingshot') {
      // Jupiter Gas Giant
      this.engine.addBody({
        id: 'jupiter-primary',
        name: 'Jupiter',
        type: 'planet',
        mass: 14000,
        radius: 36,
        position: new Vector2D(0, 0),
        velocity: new Vector2D(0, 0),
        fixed: true,
        color: '#f59e0b',
      });

      // Mission Probe on incoming hyperbolic trajectory
      this.engine.addBody({
        id: 'mission-probe',
        name: 'Voyager Probe',
        type: 'debris',
        mass: 0.01,
        radius: 4,
        position: new Vector2D(-380, -120),
        velocity: new Vector2D(12, 4.5),
        color: '#00e5ff',
      });
    } else if (id === 'event-horizon-slalom') {
      // Binary Black Holes Alpha and Beta
      this.engine.addBody({
        id: 'bh-alpha',
        name: 'Singularity α',
        type: 'black-hole',
        mass: 16000,
        radius: 18,
        position: new Vector2D(0, -95),
        velocity: new Vector2D(0, 0),
        fixed: true,
        color: '#000000',
      });

      this.engine.addBody({
        id: 'bh-beta',
        name: 'Singularity β',
        type: 'black-hole',
        mass: 16000,
        radius: 18,
        position: new Vector2D(0, 95),
        velocity: new Vector2D(0, 0),
        fixed: true,
        color: '#000000',
      });

      // Mission Probe approaching the corridor
      this.engine.addBody({
        id: 'mission-probe',
        name: 'Daedalus Probe',
        type: 'debris',
        mass: 0.01,
        radius: 4,
        position: new Vector2D(-380, 0),
        velocity: new Vector2D(22, 0),
        color: '#00e5ff',
      });
    }
  }

  update(dt) {
    if (this.status !== 'active' || !this.activeMission || !this.engine) return;

    this.elapsedTime += dt;
    this.timeRemaining -= dt;

    // Check Countdown Timer
    if (this.timeRemaining <= 0) {
      this.triggerFailure('Time Expired: Mission Launch Window Closed');
      return;
    }

    const probe = this.engine.getBody('mission-probe');
    if (!probe) {
      this.triggerFailure('Mission Probe Destroyed or Lost');
      return;
    }

    switch (this.activeMission.id) {
      case 'lunar-insertion':
        this.updateLunarInsertion(probe, dt);
        break;
      case 'jupiter-slingshot':
        this.updateJupiterSlingshot(probe, dt);
        break;
      case 'event-horizon-slalom':
        this.updateEventHorizonSlalom(probe, dt);
        break;
    }
  }

  updateLunarInsertion(probe, dt) {
    const moon = this.engine.getBody('lunar-target');
    const earth = this.engine.getBody('earth-primary');

    if (!moon) {
      this.triggerFailure('Lunar Target Lost');
      return;
    }

    const dx = probe.position.x - moon.position.x;
    const dy = probe.position.y - moon.position.y;
    const distMoon = Math.hypot(dx, dy);

    // Surface collision
    if (distMoon <= moon.radius) {
      this.triggerFailure('Probe Impacted Lunar Surface');
      return;
    }

    if (earth) {
      const distEarth = Vector2D.distance(probe.position, earth.position);
      if (distEarth <= earth.radius) {
        this.triggerFailure('Probe Re-entered Earth Atmosphere');
        return;
      }
    }

    // Parking orbit window: within 15 to 75 AU
    const minOrbit = moon.radius + 5;
    const maxOrbit = 75;

    if (distMoon >= minOrbit && distMoon <= maxOrbit) {
      const rvx = probe.velocity.x - moon.velocity.x;
      const rvy = probe.velocity.y - moon.velocity.y;
      const relSpeed = Math.hypot(rvx, rvy);
      const circularSpeed = Math.sqrt((this.engine.G * moon.mass) / distMoon);

      // Orbital velocity speed matching
      if (Math.abs(relSpeed - circularSpeed) < 2.0) {
        this.captureHoldTime += dt;
        if (this.captureHoldTime >= 2.0) {
          this.triggerVictory();
        }
        return;
      }
    }

    // If outside capture corridor, decay hold time
    this.captureHoldTime = Math.max(0, this.captureHoldTime - dt * 0.5);
  }

  updateJupiterSlingshot(probe, dt) {
    const jupiter = this.engine.getBody('jupiter-primary');
    if (!jupiter) {
      this.triggerFailure('Jupiter Target Lost');
      return;
    }

    const dist = Vector2D.distance(probe.position, jupiter.position);

    // Atmospheric re-entry / incineration
    const atmosphereRadius = 40;
    if (dist <= atmosphereRadius) {
      this.triggerFailure('Probe Vaporized in Jupiter Atmosphere');
      return;
    }

    const speed = probe.velocity.mag();

    // Close periapsis flyby outside atmosphere with high speed boost
    if (dist <= 120 && dist > atmosphereRadius && speed >= 30) {
      this.achievedSlingshot = true;
    }

    // Escape boundary victory
    if (this.achievedSlingshot && dist > 700) {
      this.triggerVictory();
    }
  }

  updateEventHorizonSlalom(probe, dt) {
    const bhAlpha = this.engine.getBody('bh-alpha');
    const bhBeta = this.engine.getBody('bh-beta');

    // Photon sphere radius = 1.5 * Schwarzschild radius
    if (bhAlpha) {
      const distA = Vector2D.distance(probe.position, bhAlpha.position);
      if (distA <= bhAlpha.radius * 1.5) {
        this.triggerFailure('Photon Sphere Breached! Probe Trapped in Singularity Horizon');
        return;
      }
    }

    if (bhBeta) {
      const distB = Vector2D.distance(probe.position, bhBeta.position);
      if (distB <= bhBeta.radius * 1.5) {
        this.triggerFailure('Photon Sphere Breached! Probe Trapped in Singularity Horizon');
        return;
      }
    }

    // Extraction boundary reached
    if (probe.position.x > 400) {
      this.triggerVictory();
    }
  }

  triggerVictory() {
    this.status = 'victory';
    if (this.onVictory) {
      this.onVictory(this.activeMission);
    }
    if (this.onStatusChange) {
      this.onStatusChange(this.status, this.activeMission);
    }
  }

  triggerFailure(reason) {
    this.status = 'failure';
    this.failureReason = reason;
    if (this.onFailure) {
      this.onFailure(this.activeMission, reason);
    }
    if (this.onStatusChange) {
      this.onStatusChange(this.status, this.activeMission);
    }
  }

  applyThrust(thrustVector, dt) {
    if (this.status !== 'active' || !this.engine) return;
    const probe = this.engine.getBody('mission-probe');
    if (!probe) return;

    probe.velocity.x += thrustVector.x * dt;
    probe.velocity.y += thrustVector.y * dt;
  }

  resetMission() {
    if (this.activeMission) {
      return this.startMission(this.activeMission.id);
    }
    return null;
  }

  abortMission() {
    this.status = 'idle';
    this.activeMission = null;
    this.failureReason = '';
    this.captureHoldTime = 0;
    this.achievedSlingshot = false;
    if (this.onStatusChange) {
      this.onStatusChange(this.status, null);
    }
  }

  getTelemetry() {
    if (this.status === 'idle' || !this.activeMission || !this.engine) {
      return null;
    }

    const probe = this.engine.getBody('mission-probe');
    let target = null;
    let distTarget = 0;
    let relSpeed = 0;
    let guidance = 'ALL SYSTEMS NOMINAL';

    if (this.activeMission.id === 'lunar-insertion') {
      target = this.engine.getBody('lunar-target');
      if (probe && target) {
        distTarget = Vector2D.distance(probe.position, target.position);
        relSpeed = Math.hypot(probe.velocity.x - target.velocity.x, probe.velocity.y - target.velocity.y);
        const vCirc = Math.sqrt((this.engine.G * target.mass) / Math.max(1, distTarget));
        if (this.captureHoldTime > 0) {
          guidance = `STABLE CAPTURE: HOLDING ORBIT (${(this.captureHoldTime).toFixed(1)}s / 2.0s)`;
        } else if (distTarget > 75) {
          guidance = 'INTERCEPT PHASE: BURN RETROGRADE TOWARDS MOON';
        } else {
          guidance = `MATCH ORBITAL SPEED (${relSpeed.toFixed(1)} -> ${vCirc.toFixed(1)} AU/s)`;
        }
      }
    } else if (this.activeMission.id === 'jupiter-slingshot') {
      target = this.engine.getBody('jupiter-primary');
      if (probe && target) {
        distTarget = Vector2D.distance(probe.position, target.position);
        relSpeed = probe.velocity.mag();
        if (this.achievedSlingshot) {
          guidance = 'SLINGSHOT ACHIEVED! COAST TO ESCAPE RADIUS';
        } else if (distTarget <= 120) {
          guidance = 'PERIAPSIS PASSAGE: MAINTAIN ALTITUDE > 40 AU';
        } else {
          guidance = 'APPROACHING JUPITER GRAVITY WELL';
        }
      }
    } else if (this.activeMission.id === 'event-horizon-slalom') {
      const bhA = this.engine.getBody('bh-alpha');
      const bhB = this.engine.getBody('bh-beta');
      if (probe) {
        relSpeed = probe.velocity.mag();
        const distA = bhA ? Vector2D.distance(probe.position, bhA.position) : 999;
        const distB = bhB ? Vector2D.distance(probe.position, bhB.position) : 999;
        distTarget = Math.min(distA, distB);
        const photonLimit = (bhA ? bhA.radius : 18) * 1.5;
        if (distTarget < photonLimit * 1.4) {
          guidance = 'CRITICAL: DIVERGENT PHOTON SPHERE PROXIMITY!';
        } else {
          guidance = 'THREAD THE SINGULARITY SADDLE TOWARD X > 400';
        }
      }
    }

    return {
      missionId: this.activeMission.id,
      title: this.activeMission.title,
      status: this.status,
      timeRemaining: Math.max(0, this.timeRemaining),
      elapsedTime: this.elapsedTime,
      captureHoldProgress: Math.min(1.0, this.captureHoldTime / 2.0),
      achievedSlingshot: this.achievedSlingshot,
      distTarget,
      relSpeed,
      guidance,
      failureReason: this.failureReason,
      probeSpeed: probe ? probe.velocity.mag() : 0,
      probeAltitude: distTarget,
    };
  }
}
