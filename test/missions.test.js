import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SimulationEngine, Vector2D } from '../src/physics.js';
import { MissionManager } from '../src/missions.js';

describe('Aerospace Flight Challenges & Mission Controller Seam', () => {
  it('should initialize and load Lunar Orbit Insertion mission preset into engine', () => {
    const engine = new SimulationEngine({ G: 2.0 });
    const manager = new MissionManager({ engine });

    const mission = manager.startMission('lunar-insertion');
    assert.ok(mission);
    assert.equal(mission.id, 'lunar-insertion');
    assert.equal(manager.getStatus(), 'active');

    const probe = engine.getBody('mission-probe');
    const moon = engine.getBody('lunar-target');
    const earth = engine.getBody('earth-primary');

    assert.ok(probe, 'Mission probe must be spawned');
    assert.ok(moon, 'Target Moon must be spawned');
    assert.ok(earth, 'Parent Earth must be spawned');
  });

  it('should detect stable Keplerian capture around Moon for Lunar Orbit Insertion victory', () => {
    const engine = new SimulationEngine({ G: 2.0 });
    const manager = new MissionManager({ engine });
    manager.startMission('lunar-insertion');

    const probe = engine.getBody('mission-probe');
    const moon = engine.getBody('lunar-target');

    // Place probe directly into circular lunar parking orbit
    const orbitRadius = 40;
    probe.position.set(moon.position.x + orbitRadius, moon.position.y);
    const circularSpeed = Math.sqrt((engine.G * moon.mass) / orbitRadius);
    probe.velocity.set(moon.velocity.x, moon.velocity.y + circularSpeed);

    // Update manager across capture hold window (requires holding stable for 2.0 seconds)
    for (let t = 0; t < 25; t++) {
      manager.update(0.1);
    }

    assert.equal(manager.getStatus(), 'victory');
  });

  it('should detect Jupiter Slingshot victory when probe achieves periapsis boost and escapes', () => {
    const engine = new SimulationEngine({ G: 2.0 });
    const manager = new MissionManager({ engine });
    manager.startMission('jupiter-slingshot');

    const probe = engine.getBody('mission-probe');
    const jupiter = engine.getBody('jupiter-primary');

    // Simulate probe executing close periapsis flyby outside gas atmosphere (atmosphere ~ 40)
    probe.position.set(jupiter.position.x + 60, jupiter.position.y);
    probe.velocity.set(0, 35); // Boosted hyperbolic escape velocity

    manager.update(0.1);

    // Move probe to outer solar boundary with high speed
    probe.position.set(jupiter.position.x + 750, jupiter.position.y);
    manager.update(0.1);

    assert.equal(manager.getStatus(), 'victory');
  });

  it('should trigger mission failure if probe breaches the Black Hole Photon Sphere in Slalom', () => {
    const engine = new SimulationEngine({ G: 2.0 });
    const manager = new MissionManager({ engine });
    manager.startMission('event-horizon-slalom');

    const probe = engine.getBody('mission-probe');
    const bh1 = engine.getBody('bh-alpha');

    // Breach photon sphere of BH1 (d <= 1.5 * radius)
    probe.position.set(bh1.position.x + bh1.radius * 1.2, bh1.position.y);

    manager.update(0.1);
    assert.equal(manager.getStatus(), 'failure');
    assert.ok(manager.getFailureReason().includes('Photon Sphere Breached'));
  });

  it('should trigger mission failure when mission countdown timer expires', () => {
    const engine = new SimulationEngine({ G: 2.0 });
    const manager = new MissionManager({ engine });
    const mission = manager.startMission('lunar-insertion');

    // Consume all time without achieving orbit
    manager.update(mission.timeLimit + 1.0);
    assert.equal(manager.getStatus(), 'failure');
    assert.ok(manager.getFailureReason().includes('Time Expired'));
  });
});
