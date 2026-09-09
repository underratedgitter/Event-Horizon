import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SimulationEngine, Vector2D } from '../src/physics.js';
import {
  serializeScenario,
  deserializeScenario,
} from '../src/serialization.js';

describe('Scenario State Serialization & URL Sharing', () => {
  it('should serialize and deserialize a multi-body scenario preserving physical state', () => {
    const engine = new SimulationEngine({ G: 2.5, softening: 3.0 });
    engine.addBody({
      name: 'Alpha Star',
      type: 'star',
      mass: 12000,
      radius: 18,
      position: new Vector2D(10, -20),
      velocity: new Vector2D(0, 5.5),
      color: '#ffaa00',
    });
    engine.addBody({
      name: 'Companion World',
      type: 'planet',
      mass: 8,
      radius: 5,
      position: new Vector2D(160, 45),
      velocity: new Vector2D(-2.1, 8.4),
      color: '#38bdf8',
    });

    const encoded = serializeScenario(engine);
    assert.ok(typeof encoded === 'string', 'Serialized scenario must be a string');
    assert.ok(encoded.length > 0);

    const restored = deserializeScenario(encoded);
    assert.ok(restored, 'Deserialization must return data');
    assert.equal(restored.G, 2.5);
    assert.equal(restored.softening, 3.0);
    assert.equal(restored.bodies.length, 2);

    const [b1, b2] = restored.bodies;
    assert.equal(b1.name, 'Alpha Star');
    assert.equal(b1.type, 'star');
    assert.equal(b1.mass, 12000);
    assert.ok(Math.abs(b1.position.x - 10) < 0.01);
    assert.ok(Math.abs(b1.position.y - (-20)) < 0.01);
    assert.ok(Math.abs(b1.velocity.y - 5.5) < 0.01);

    assert.equal(b2.name, 'Companion World');
    assert.equal(b2.type, 'planet');
    assert.equal(b2.mass, 8);
    assert.ok(Math.abs(b2.position.x - 160) < 0.01);
  });

  it('should handle URL hash prefix "#scenario=" gracefully', () => {
    const engine = new SimulationEngine({ G: 1.0 });
    engine.addBody({ name: 'Solo', type: 'moon', mass: 1, radius: 3 });

    const raw = serializeScenario(engine);
    const withHash = `#scenario=${raw}`;

    const restored = deserializeScenario(withHash);
    assert.ok(restored);
    assert.equal(restored.bodies.length, 1);
    assert.equal(restored.bodies[0].name, 'Solo');
  });

  it('should return null safely when deserializing corrupted or invalid strings', () => {
    assert.equal(deserializeScenario(null), null);
    assert.equal(deserializeScenario(''), null);
    assert.equal(deserializeScenario('not-valid-base64!@#$'), null);
    assert.equal(deserializeScenario('bm90LWpzb24='), null); // base64 for "not-json"
  });

  describe('Security Hardening & Injection Neutralization', () => {
    it('should neutralize Prototype Pollution attempts without polluting Object prototype', () => {
      const maliciousPayload = JSON.stringify({
        __proto__: { polluted: true },
        constructor: { prototype: { isAdmin: true } },
        G: 2.0,
        s: 3.0,
        b: [
          {
            __proto__: { injectedNested: true },
            n: 'Trojan Body',
            t: 'planet',
            m: 10,
          },
        ],
      });

      const base64 = Buffer.from(maliciousPayload).toString('base64');
      const result = deserializeScenario(base64);

      assert.ok(result);
      assert.equal(result.bodies.length, 1);
      assert.equal(result.bodies[0].name, 'Trojan Body');

      // Verify Object prototype remains completely unpolluted
      assert.equal(({}).polluted, undefined);
      assert.equal(Object.prototype.polluted, undefined);
      assert.equal(({}).isAdmin, undefined);
      assert.equal(Object.prototype.isAdmin, undefined);
      assert.equal(({}).injectedNested, undefined);
      assert.equal(Object.prototype.injectedNested, undefined);
    });

    it('should sanitize script tags and HTML injection vectors from body names', () => {
      const xssPayload = JSON.stringify({
        G: 1.5,
        s: 2.0,
        b: [
          {
            n: '<script>alert("xss")</script>Coruscant',
            t: 'planet',
            m: 5,
            r: 4,
          },
          {
            n: '<img src=x onerror=alert(1)>World',
            t: 'planet',
            m: 10,
            r: 6,
          },
        ],
      });

      const base64 = Buffer.from(xssPayload).toString('base64');
      const result = deserializeScenario(base64);

      assert.ok(result);
      assert.equal(result.bodies.length, 2);

      // Verify HTML tags are stripped
      assert.equal(result.bodies[0].name.includes('<script>'), false);
      assert.equal(result.bodies[0].name.includes('<'), false);
      assert.equal(result.bodies[0].name.includes('>'), false);
      assert.equal(result.bodies[1].name.includes('<img'), false);
      assert.equal(result.bodies[1].name.includes('<'), false);
      assert.equal(result.bodies[1].name.includes('>'), false);
    });

    it('should validate and sanitize non-finite numeric inputs (NaN, Infinity)', () => {
      const nanPayload = JSON.stringify({
        G: Infinity,
        s: NaN,
        b: [
          {
            n: 'Quantum Singularity',
            m: Infinity,
            r: -10,
            x: NaN,
            y: Infinity,
            vx: 'invalid',
            vy: null,
          },
        ],
      });

      const base64 = Buffer.from(nanPayload).toString('base64');
      const result = deserializeScenario(base64);

      assert.ok(result);
      assert.equal(Number.isFinite(result.G), true);
      assert.equal(Number.isFinite(result.softening), true);
      const b = result.bodies[0];
      assert.equal(Number.isFinite(b.mass), true);
      assert.ok(b.mass > 0);
      assert.equal(Number.isFinite(b.radius), true);
      assert.ok(b.radius > 0);
      assert.equal(Number.isFinite(b.position.x), true);
      assert.equal(Number.isFinite(b.position.y), true);
      assert.equal(Number.isFinite(b.velocity.x), true);
      assert.equal(Number.isFinite(b.velocity.y), true);
    });

    it('should bound array lengths to prevent memory exhaustion DoS', () => {
      const hugeBodies = Array.from({ length: 800 }, (_, i) => ({
        n: `Debris ${i}`,
        m: 1,
        r: 1,
      }));

      const payload = JSON.stringify({ G: 1, s: 2, b: hugeBodies });
      const base64 = Buffer.from(payload).toString('base64');
      const result = deserializeScenario(base64);

      assert.ok(result);
      assert.ok(result.bodies.length <= 512, 'Bodies array must be clamped to 512 items');
    });
  });
});
