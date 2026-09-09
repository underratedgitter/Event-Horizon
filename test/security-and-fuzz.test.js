import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SimulationEngine, Vector2D } from '../src/physics.js';
import {
  calculateOrbitalElements,
  findDominantAttractor,
  calculateCircularVelocity,
  calculateHohmannTransfer,
} from '../src/conics.js';
import {
  calculateGravitationalPotential,
  calculateSpacetimeWarp,
  getSpacetimeDepthColor,
} from '../src/spacetime.js';
import {
  calculateCircumstellarHabitableZone,
  evaluatePlanetaryAtmosphere,
} from '../src/habitable.js';
import { SpacecraftController } from '../src/spacecraft.js';
import { CosmicAudio } from '../src/audio.js';

describe('Security & Fuzz Suite - Slice 1: Physics Engine Math Boundaries & Non-Finite Inputs', () => {
  it('should prevent NaN and Infinity acceleration when two bodies overlap at r = 0 (singularity boundary)', () => {
    // Zero softening and identical coordinates
    const engine = new SimulationEngine({ G: 10.0, softening: 0.0, collisionsEnabled: false });
    const b1 = engine.addBody({
      id: 'b1',
      mass: 100,
      position: new Vector2D(50, 50),
      velocity: new Vector2D(0, 0),
    });
    const b2 = engine.addBody({
      id: 'b2',
      mass: 200,
      position: new Vector2D(50, 50), // EXACT same position
      velocity: new Vector2D(0, 0),
    });

    const accs = engine.computeAccelerations();
    assert.equal(Number.isFinite(accs[0].x), true, 'Acceleration x must be finite');
    assert.equal(Number.isFinite(accs[0].y), true, 'Acceleration y must be finite');
    assert.equal(Number.isFinite(accs[1].x), true, 'Acceleration x must be finite');
    assert.equal(Number.isFinite(accs[1].y), true, 'Acceleration y must be finite');

    // Stepping should not corrupt positions or velocities with NaN
    engine.step(0.01);
    assert.equal(Number.isFinite(b1.position.x), true);
    assert.equal(Number.isFinite(b1.position.y), true);
    assert.equal(Number.isFinite(b1.velocity.x), true);
    assert.equal(Number.isFinite(b1.velocity.y), true);
    assert.equal(Number.isFinite(b2.position.x), true);
    assert.equal(Number.isFinite(b2.position.y), true);
  });

  it('should handle bodies with zero mass or negative mass without corrupting momentum or crashing', () => {
    const engine = new SimulationEngine({ G: 1.0 });

    const normalBody = engine.addBody({
      id: 'normal',
      mass: 50,
      position: new Vector2D(0, 0),
      velocity: new Vector2D(2, -1),
    });

    // Zero mass particle (test mass)
    const zeroMassBody = engine.addBody({
      id: 'zero-mass',
      mass: 0,
      position: new Vector2D(10, 0),
      velocity: new Vector2D(0, 5),
    });

    // Directly injected negative mass body
    const negMassBody = engine.addBody({
      id: 'neg-mass',
      mass: -10,
      position: new Vector2D(-10, 0),
      velocity: new Vector2D(0, -2),
    });

    // Stepping should complete cleanly
    engine.step(0.1);

    const momentum = engine.getTotalLinearMomentum();
    assert.equal(Number.isFinite(momentum.x), true, 'Momentum x must be finite');
    assert.equal(Number.isFinite(momentum.y), true, 'Momentum y must be finite');

    const com = engine.getCenterOfMass();
    assert.equal(Number.isFinite(com.x), true, 'Center of mass x must be finite');
    assert.equal(Number.isFinite(com.y), true, 'Center of mass y must be finite');
  });

  it('should sanitize or filter non-finite state inputs (NaN, +Infinity, -Infinity) injected into positions, velocities, and masses', () => {
    const engine = new SimulationEngine({ G: 1.0 });

    const corruptedBody = engine.addBody({
      id: 'corrupted',
      mass: NaN,
      position: { x: Infinity, y: -Infinity },
      velocity: { x: NaN, y: Infinity },
      radius: NaN,
    });

    assert.equal(Number.isFinite(corruptedBody.mass), true, 'Sanitized mass must be finite');
    assert.ok(corruptedBody.mass > 0, 'Sanitized mass must be positive');
    assert.equal(Number.isFinite(corruptedBody.radius), true, 'Sanitized radius must be finite');
    assert.ok(corruptedBody.radius > 0, 'Sanitized radius must be positive');
    assert.equal(Number.isFinite(corruptedBody.position.x), true, 'Sanitized position x must be finite');
    assert.equal(Number.isFinite(corruptedBody.position.y), true, 'Sanitized position y must be finite');
    assert.equal(Number.isFinite(corruptedBody.velocity.x), true, 'Sanitized velocity x must be finite');
    assert.equal(Number.isFinite(corruptedBody.velocity.y), true, 'Sanitized velocity y must be finite');

    // Add another body and test runtime injection of NaN into position
    const victim = engine.addBody({
      id: 'victim',
      mass: 10,
      position: new Vector2D(100, 100),
      velocity: new Vector2D(0, 0),
    });

    // Manually corrupt body state
    victim.position.x = NaN;
    victim.velocity.y = Infinity;

    // Engine step must survive and sanitize without throwing
    assert.doesNotThrow(() => {
      engine.step(0.1);
    });

    assert.equal(Number.isFinite(victim.position.x), true);
    assert.equal(Number.isFinite(victim.velocity.y), true);
  });
});

describe('Security & Fuzz Suite - Slice 2: Orbital Conics Edge Cases & Astrodynamic Singularities', () => {
  const G = 10.0;
  const primary = {
    id: 'sun',
    mass: 1000,
    position: new Vector2D(0, 0),
    velocity: new Vector2D(0, 0),
  };

  it('should handle parabolic trajectory (e = 1.0, epsilon ~ 0) with infinite apoapsis and null period', () => {
    const r = 100;
    const mu = G * (primary.mass + 1);
    // Escape speed: vEsc = sqrt(2 * mu / r)
    const vEsc = Math.sqrt((2 * mu) / r);

    const probe = {
      id: 'parabolic-probe',
      mass: 1,
      position: new Vector2D(r, 0),
      velocity: new Vector2D(0, vEsc), // Exactly escape speed -> parabolic
    };

    const elements = calculateOrbitalElements({ primary, body: probe, G });
    assert.ok(elements, 'Elements must be calculated');
    assert.ok(Math.abs(elements.eccentricity - 1.0) < 1e-3, `Eccentricity should be ~1.0, got ${elements.eccentricity}`);
    assert.equal(elements.isBound, false);
    assert.equal(elements.apoapsis, Infinity);
    assert.equal(elements.period, null);
    assert.equal(elements.orbitType, 'parabolic');
    assert.ok(elements.periapsis > 0 && Number.isFinite(elements.periapsis), 'Periapsis must be finite positive number');
  });

  it('should handle extreme hyperbolic flyby with extreme velocities (v > 1000 AU/s) without NaN/overflow', () => {
    const probe = {
      id: 'hyper-probe',
      mass: 0.01,
      position: new Vector2D(200, 0),
      velocity: new Vector2D(0, 5000), // Extreme hyper-speed
    };

    const elements = calculateOrbitalElements({ primary, body: probe, G });
    assert.ok(elements, 'Elements must be calculated');
    assert.ok(elements.eccentricity > 10.0, 'Eccentricity must be very large');
    assert.equal(elements.isBound, false);
    assert.equal(elements.apoapsis, Infinity);
    assert.equal(elements.period, null);
    assert.equal(elements.orbitType, 'hyperbolic');
    assert.equal(Number.isFinite(elements.periapsis), true);
    assert.ok(elements.periapsis > 0);
    assert.equal(Number.isFinite(elements.specificEnergy), true);
    assert.ok(elements.specificEnergy > 0);
  });

  it('should handle stationary body (v = 0) and collinear radial plunge towards attractor', () => {
    const probe = {
      id: 'falling-rock',
      mass: 1,
      position: new Vector2D(150, 0),
      velocity: new Vector2D(0, 0), // Released from rest
    };

    const elements = calculateOrbitalElements({ primary, body: probe, G });
    assert.ok(elements, 'Elements must be calculated');
    // Angular momentum is zero
    assert.equal(elements.angularMomentum, 0);
    // Since v=0 and r=150, energy epsilon = -mu/150 < 0, so it is bound
    assert.equal(elements.isBound, true);
    // Periapsis distance of direct radial plunge is 0 (strikes the attractor center)
    assert.equal(elements.periapsis, 0);
    // Apoapsis is the release distance
    assert.ok(Math.abs(elements.apoapsis - 150) < 1e-2, `Apoapsis should be ~150, got ${elements.apoapsis}`);
    assert.equal(elements.orbitType, 'radial-plunge');
  });

  it('should gracefully reject degenerate conics inputs (r = 0, non-finite coords, zero/negative mass)', () => {
    // Overlapping body at r = 0
    const coincident = {
      id: 'coincident',
      mass: 1,
      position: new Vector2D(0, 0),
      velocity: new Vector2D(1, 1),
    };
    assert.equal(calculateOrbitalElements({ primary, body: coincident, G }), null);

    // Primary with zero or negative mass
    const zeroStar = { id: 'zero', mass: 0, position: new Vector2D(0, 0), velocity: new Vector2D(0, 0) };
    assert.equal(calculateOrbitalElements({ primary: zeroStar, body: coincident, G }), null);

    // Non-finite position
    const nanProbe = {
      id: 'nan-probe',
      mass: 1,
      position: { x: NaN, y: 10 },
      velocity: { x: 0, y: 0 },
    };
    assert.equal(calculateOrbitalElements({ primary, body: nanProbe, G }), null);

    // Hohmann transfer edge cases
    assert.equal(calculateHohmannTransfer({ primary, r1: 0, r2: 100, G }), null);
    assert.equal(calculateHohmannTransfer({ primary, r1: -50, r2: 100, G }), null);
    assert.equal(calculateHohmannTransfer({ primary, r1: NaN, r2: 100, G }), null);
    assert.equal(calculateHohmannTransfer({ primary: zeroStar, r1: 50, r2: 100, G }), null);

    // Hohmann transfer between identical orbits (r1 = r2)
    const sameOrbitTransfer = calculateHohmannTransfer({ primary, r1: 100, r2: 100, G });
    assert.ok(sameOrbitTransfer, 'Should return valid zero-deltaV transfer plan');
    assert.equal(sameOrbitTransfer.deltaV1, 0);
    assert.equal(sameOrbitTransfer.deltaV2, 0);
    assert.equal(sameOrbitTransfer.totalDeltaV, 0);
    assert.equal(sameOrbitTransfer.eccentricity, 0);

    // Circular velocity at singularity r = 0
    const zeroVel = calculateCircularVelocity(primary, new Vector2D(0, 0), G);
    assert.equal(zeroVel, null);

    // Circular velocity with non-finite coords
    assert.equal(calculateCircularVelocity(primary, { x: NaN, y: 50 }, G), null);
    assert.equal(calculateCircularVelocity(zeroStar, new Vector2D(50, 50), G), null);
  });
});

describe('Security & Fuzz Suite - Slice 3: Habitable Zone & Spacetime Curvature Singularities', () => {
  it('should handle star with zero mass or negative luminosity without producing NaN boundaries', () => {
    const deadStar = {
      id: 'dead-star',
      mass: 0,
      luminosity: 0,
      position: new Vector2D(0, 0),
    };

    const zoneZero = calculateCircumstellarHabitableZone(deadStar);
    assert.ok(zoneZero, 'Zone object should be returned');
    assert.equal(zoneZero.luminosity, 0);
    assert.equal(zoneZero.rInner, 0);
    assert.equal(zoneZero.rOuter, 0);

    const negLuminosityStar = {
      id: 'dark-energy-star',
      mass: 5000,
      luminosity: -5.0,
      position: new Vector2D(0, 0),
    };

    const zoneNeg = calculateCircumstellarHabitableZone(negLuminosityStar);
    assert.ok(zoneNeg, 'Zone object should be returned');
    assert.equal(Number.isFinite(zoneNeg.rInner), true, 'rInner must be finite, not NaN');
    assert.equal(Number.isFinite(zoneNeg.rOuter), true, 'rOuter must be finite, not NaN');
    assert.ok(zoneNeg.rInner >= 0, 'rInner must be non-negative');
    assert.ok(zoneNeg.rOuter >= 0, 'rOuter must be non-negative');
  });

  it('should classify planet at distance zero and distance 10^9 AU without NaN temperatures or scores', () => {
    const star = {
      id: 'sun',
      type: 'star',
      mass: 8000,
      luminosity: 1.0,
      position: new Vector2D(0, 0),
    };

    // Planet exactly at the core of the star (distance = 0)
    const planetCenter = {
      id: 'submerged-planet',
      type: 'planet',
      position: new Vector2D(0, 0),
    };

    const evalZero = evaluatePlanetaryAtmosphere(planetCenter, [star, planetCenter]);
    assert.ok(evalZero);
    assert.equal(Number.isFinite(evalZero.surfaceTempK), true, 'Temperature at r=0 must be finite');
    assert.equal(Number.isFinite(evalZero.habitabilityScore), true, 'Score at r=0 must be finite');
    assert.equal(evalZero.tempCategory, 'infernal');
    assert.equal(evalZero.isHabitable, false);

    // Planet at extreme cosmological distance (10^9 AU)
    const deepSpacePlanet = {
      id: 'voyager-world',
      type: 'planet',
      position: new Vector2D(1e9, 0),
    };

    const evalDeep = evaluatePlanetaryAtmosphere(deepSpacePlanet, [star, deepSpacePlanet]);
    assert.ok(evalDeep);
    assert.equal(Number.isFinite(evalDeep.surfaceTempK), true, 'Temperature at 10^9 AU must be finite');
    assert.equal(Number.isFinite(evalDeep.habitabilityScore), true, 'Score at 10^9 AU must be finite');
    assert.equal(evalDeep.tempCategory, 'cryogenic');
    assert.equal(evalDeep.isHabitable, false);

    // Planet with NaN position
    const nanPlanet = {
      id: 'nan-world',
      type: 'planet',
      position: { x: NaN, y: 0 },
    };
    const evalNan = evaluatePlanetaryAtmosphere(nanPlanet, [star, nanPlanet]);
    assert.ok(evalNan);
    assert.equal(Number.isFinite(evalNan.surfaceTempK), true);
    assert.equal(Number.isFinite(evalNan.habitabilityScore), true);
  });

  it('should evaluate spacetime curvature & potential mesh math safely with zero softening, coincident points, and extreme potentials', () => {
    const body = {
      id: 'dense-mass',
      mass: 10000,
      position: new Vector2D(100, 100),
    };

    // Coincident point with zero softening
    const phiCoincident = calculateGravitationalPotential({ x: 100, y: 100 }, [body], 1.0, 0.0);
    assert.equal(Number.isFinite(phiCoincident), true, 'Potential at r=0 with zero softening must be finite');

    // Non-finite point coords
    const phiNan = calculateGravitationalPotential({ x: NaN, y: 100 }, [body], 1.0, 15.0);
    assert.equal(Number.isFinite(phiNan), true, 'Potential with NaN coordinate must be finite');

    // Spacetime warp with coincident point and zero softening
    const warpCoincident = calculateSpacetimeWarp({ x: 100, y: 100 }, [body], 1.0, 0.0);
    assert.equal(Number.isFinite(warpCoincident.x), true, 'Warp x must be finite');
    assert.equal(Number.isFinite(warpCoincident.y), true, 'Warp y must be finite');

    // Non-finite warp point
    const warpNan = calculateSpacetimeWarp({ x: Infinity, y: -Infinity }, [body]);
    assert.equal(Number.isFinite(warpNan.x), true);
    assert.equal(Number.isFinite(warpNan.y), true);

    // Color string generation with NaN, Infinity, and extreme potentials
    const colorNan = getSpacetimeDepthColor(NaN);
    assert.ok(!colorNan.includes('NaN'), 'Color string must not contain NaN');
    assert.ok(colorNan.startsWith('rgba('), 'Color string must be valid rgba');

    const colorInf = getSpacetimeDepthColor(Infinity);
    assert.ok(!colorInf.includes('NaN') && !colorInf.includes('Infinity'), 'Color string must not contain Infinity');

    const colorExtreme = getSpacetimeDepthColor(1e12);
    assert.ok(colorExtreme.startsWith('rgba('));
  });
});

describe('Security & Fuzz Suite - Slice 4: Spacecraft Slingshot Fuzzing & Degenerate Maneuvers', () => {
  it('should reject invalid thrust burns (non-vector, NaN/Infinity direction, negative/zero dt, negative refuel)', () => {
    const engine = new SimulationEngine({ G: 1.0 });
    const ship = new SpacecraftController({
      engine,
      id: 'fuzz-ship',
      maxDeltaV: 50.0,
      currentDeltaV: 50.0,
      thrustPower: 10.0,
    });

    const initialVelX = ship.body.velocity.x;
    const initialVelY = ship.body.velocity.y;

    // 1. Non-vector inputs (string, null, empty object, object with NaN)
    assert.equal(ship.applyThrust('MAX_THRUST', 0.1), 0);
    assert.equal(ship.applyThrust(null, 0.1), 0);
    assert.equal(ship.applyThrust({}, 0.1), 0);
    assert.equal(ship.applyThrust({ x: NaN, y: 1 }, 0.1), 0);
    assert.equal(ship.applyThrust({ x: 1, y: Infinity }, 0.1), 0);
    assert.equal(ship.applyThrust(new Vector2D(0, 0), 0.1), 0); // zero magnitude

    // 2. Negative and non-finite dt
    assert.equal(ship.applyThrust(new Vector2D(1, 0), -0.5), 0);
    assert.equal(ship.applyThrust(new Vector2D(1, 0), 0), 0);
    assert.equal(ship.applyThrust(new Vector2D(1, 0), NaN), 0);

    // Ship velocity and fuel should be completely uncorrupted
    assert.equal(ship.body.velocity.x, initialVelX);
    assert.equal(ship.body.velocity.y, initialVelY);
    assert.equal(ship.currentDeltaV, 50.0);

    // 3. Negative / non-finite refuel
    ship.refuel(-100);
    assert.equal(ship.currentDeltaV, 50.0);
    ship.refuel(NaN);
    assert.equal(ship.currentDeltaV, 50.0);
    ship.refuel(Infinity);
    assert.equal(ship.currentDeltaV, 50.0);
  });

  it('should handle trajectory predictions with 0 attractors, degenerate velocities, and 0 steps', () => {
    const engine = new SimulationEngine({ G: 1.0 });
    const ship = new SpacecraftController({
      engine,
      id: 'lonely-voyager',
      position: new Vector2D(0, 0),
      velocity: new Vector2D(10, 0),
    });

    // 1. Zero attractors in universe
    const emptyResult = ship.calculateTrajectoryPath({ steps: 50, dt: 0.1 });
    assert.ok(emptyResult);
    assert.equal(emptyResult.points.length, 50);
    assert.equal(emptyResult.closestApproach, null);
    assert.equal(emptyResult.slingshotBoost, 0);
    assert.equal(emptyResult.initialSpeed, 10);
    assert.equal(emptyResult.finalSpeed, 10);
    // Path should be a straight linear drift along x
    assert.ok(emptyResult.points[49].x > 40);

    // 2. Zero steps or negative steps
    const zeroStepResult = ship.calculateTrajectoryPath({ steps: 0, dt: 0.1 });
    assert.ok(zeroStepResult);
    assert.equal(zeroStepResult.points.length, 0);

    const negStepResult = ship.calculateTrajectoryPath({ steps: -10, dt: 0.1 });
    assert.ok(negStepResult);
    assert.equal(negStepResult.points.length, 0);

    // 3. Degenerate / NaN velocity in ship
    ship.body.velocity.x = NaN;
    ship.body.velocity.y = Infinity;
    const degenResult = ship.calculateTrajectoryPath({ steps: 20, dt: 0.1 });
    assert.ok(degenResult);
    for (const pt of degenResult.points) {
      assert.equal(Number.isFinite(pt.x), true, 'Point x must be finite');
      assert.equal(Number.isFinite(pt.y), true, 'Point y must be finite');
      assert.equal(Number.isFinite(pt.speed), true, 'Point speed must be finite');
    }
  });
});

describe('Security & Fuzz Suite - Slice 5: Ring Buffer & Time Scrubbing Memory Stress Test', () => {
  it('should strictly cap ring buffer capacity without memory growth over 10,000 rapid steps', () => {
    const capacity = 250;
    const engine = new SimulationEngine({ G: 1.0, historyCapacity: capacity });

    engine.addBody({
      id: 'pulsar-core',
      mass: 500,
      position: new Vector2D(0, 0),
      velocity: new Vector2D(0, 0),
    });
    engine.addBody({
      id: 'orbiter',
      mass: 1,
      position: new Vector2D(50, 0),
      velocity: new Vector2D(0, 3.16),
    });

    // 10,000 rapid simulation step burst
    for (let i = 0; i < 10000; i++) {
      engine.step(0.05);
    }

    assert.equal(engine.getHistoryLength(), capacity, `History length must be strictly capped at ${capacity}`);
    assert.equal(engine.getHistoryIndex(), capacity - 1, 'Current history index must be at the end of capped buffer');
  });

  it('should safely reject all out-of-bounds, float, and non-finite scrub indices without throwing', () => {
    const engine = new SimulationEngine({ G: 1.0, historyCapacity: 100 });
    engine.addBody({ id: 'b', mass: 10, position: new Vector2D(0, 0), velocity: new Vector2D(1, 1) });

    for (let i = 0; i < 20; i++) {
      engine.step(0.1);
    }
    const currentLen = engine.getHistoryLength();
    const currentIndex = engine.getHistoryIndex();

    // Invalid scrub indices: negative, out-of-bounds, NaN, Infinity, floats
    assert.equal(engine.scrubTo(-1), false);
    assert.equal(engine.scrubTo(-999), false);
    assert.equal(engine.scrubTo(currentLen), false);
    assert.equal(engine.scrubTo(currentLen + 50), false);
    assert.equal(engine.scrubTo(NaN), false);
    assert.equal(engine.scrubTo(Infinity), false);
    assert.equal(engine.scrubTo(-Infinity), false);
    assert.equal(engine.scrubTo(5.5), false); // Float index
    assert.equal(engine.scrubTo('invalid'), false);

    // Current history index must remain intact
    assert.equal(engine.getHistoryIndex(), currentIndex);

    // Valid scrub must succeed
    assert.equal(engine.scrubTo(5), true);
    assert.equal(engine.getHistoryIndex(), 5);
  });
});

describe('Security & Fuzz Suite - Slice 6: Web Audio Engine Node Disconnect Lifecycle & NaN Clamping', () => {
  function createMockAudioContext() {
    const createdNodes = [];

    class MockAudioParam {
      constructor(val = 1) {
        this.value = val;
      }
      setValueAtTime(val, time) {
        assert.equal(Number.isFinite(val), true, `setValueAtTime value must be finite, got ${val}`);
        assert.equal(Number.isFinite(time), true, `setValueAtTime time must be finite, got ${time}`);
        this.value = val;
      }
      exponentialRampToValueAtTime(val, time) {
        assert.equal(Number.isFinite(val), true, `exponentialRamp value must be finite, got ${val}`);
        assert.ok(val > 0, `exponentialRamp target value must be strictly positive (> 0), got ${val}`);
        assert.equal(Number.isFinite(time), true, `exponentialRamp time must be finite, got ${time}`);
        this.value = val;
      }
    }

    class MockNode {
      constructor(type) {
        this.type = type;
        this.connectedTo = [];
        this.disconnected = false;
        this.onended = null;
        createdNodes.push(this);
      }
      connect(target) {
        this.connectedTo.push(target);
      }
      disconnect() {
        this.disconnected = true;
      }
    }

    class MockGain extends MockNode {
      constructor() {
        super('gain');
        this.gain = new MockAudioParam(1.0);
      }
    }

    class MockOscillator extends MockNode {
      constructor() {
        super('oscillator');
        this.frequency = new MockAudioParam(440);
      }
      start(time) {}
      stop(time) {
        if (typeof this.onended === 'function') {
          this.onended();
        }
      }
    }

    class MockFilter extends MockNode {
      constructor() {
        super('filter');
        this.frequency = new MockAudioParam(1000);
        this.Q = new MockAudioParam(1);
      }
    }

    class MockBufferSource extends MockNode {
      constructor() {
        super('buffer-source');
      }
      start(time) {}
      stop(time) {
        if (typeof this.onended === 'function') {
          this.onended();
        }
      }
    }

    return {
      createdNodes,
      ctx: {
        currentTime: 0.1,
        sampleRate: 44100,
        destination: new MockNode('destination'),
        createGain: () => new MockGain(),
        createOscillator: () => new MockOscillator(),
        createBiquadFilter: () => new MockFilter(),
        createBufferSource: () => new MockBufferSource(),
        createBuffer: (channels, length, rate) => ({
          length,
          getChannelData: () => new Float32Array(length),
        }),
      },
    };
  }

  it('should clamp volume and resonance settings against NaN, Infinity, and out-of-range values', () => {
    const { ctx } = createMockAudioContext();
    const audio = new CosmicAudio();
    audio.ctx = ctx;
    audio.droneGain = ctx.createGain();
    audio.droneFilter = ctx.createBiquadFilter();
    audio.crackleGain = ctx.createGain();

    // Test NaN and Infinity in volume/filter controls
    audio.setDroneGain(NaN);
    assert.equal(Number.isFinite(audio.droneLevel), true);
    assert.ok(audio.droneLevel >= 0 && audio.droneLevel <= 1.0);

    audio.setDroneGain(Infinity);
    assert.equal(audio.droneLevel, 1.0);

    audio.setDroneGain(-5);
    assert.equal(audio.droneLevel, 0);

    audio.setDroneResonance(NaN);
    assert.equal(Number.isFinite(audio.droneResonance), true);
    assert.ok(audio.droneResonance >= 50 && audio.droneResonance <= 600);

    audio.setDroneResonance(Infinity);
    assert.equal(audio.droneResonance, 600);

    audio.setCrackleGain(NaN);
    assert.equal(Number.isFinite(audio.crackleLevel), true);
    assert.equal(audio.crackleLevel, 0);

    audio.setBoomGain(NaN);
    assert.equal(Number.isFinite(audio.boomGainLevel), true);
    assert.equal(audio.boomGainLevel, 1.0);
  });

  it('should disconnect dynamic audio nodes upon completion for collision, tidal, supernova, and thruster sounds to prevent memory leaks', () => {
    const { ctx, createdNodes } = createMockAudioContext();
    const audio = new CosmicAudio();
    audio.ctx = ctx;
    audio.masterGain = ctx.createGain();

    // 1. Collision sound with NaN / Infinity intensity
    assert.doesNotThrow(() => {
      audio.playCollisionSound(NaN);
      audio.playCollisionSound(Infinity);
      audio.playCollisionSound(10.0);
    });

    // 2. Tidal sound
    assert.doesNotThrow(() => {
      audio.playTidalSound();
    });

    // 3. Supernova sound
    assert.doesNotThrow(() => {
      audio.playSupernovaSound();
    });

    // 4. Thruster sound
    assert.doesNotThrow(() => {
      audio.playThrusterSound();
    });

    // 5. Victory & Failure sounds
    assert.doesNotThrow(() => {
      audio.playVictorySound();
      audio.playFailureSound();
    });

    // Filter dynamic sound effect nodes (excluding permanent masterGain)
    const dynamicNodes = createdNodes.filter((n) => n !== audio.masterGain && n.type !== 'destination');

    // ALL dynamic nodes must have disconnect() called upon completion
    const uncollectedNodes = dynamicNodes.filter((n) => !n.disconnected);
    assert.equal(
      uncollectedNodes.length,
      0,
      `Detected ${uncollectedNodes.length} dynamic audio node(s) not disconnected upon completion: ${uncollectedNodes.map((n) => n.type).join(', ')}`
    );
  });
});
