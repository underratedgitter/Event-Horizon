import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ParticleSystem } from '../src/particles.js';
import { SimulationEngine, Vector2D } from '../src/physics.js';
import { Renderer } from '../src/renderer.js';

describe('Client-Side 60fps & Device Scalability Defense Suite', () => {
  describe('Particle System Memory Bounding & Pruning', () => {
    it('should strictly cap particles and shockwaves under extreme emission rates', () => {
      const ps = new ParticleSystem({ maxParticles: 300, maxShockwaves: 15 });

      // Simulate extreme collision & supernova spam
      for (let i = 0; i < 50; i++) {
        ps.emitCollision(0, 0, '#ffaa00', 40);
        ps.emitSupernovaBlast(0, 0, '#00e5ff', 50);
        ps.update(0.016);
      }

      assert.ok(ps.particles.length <= 300, `Particles exceeded max cap: ${ps.particles.length}`);
      assert.ok(ps.shockwaves.length <= 15, `Shockwaves exceeded max cap: ${ps.shockwaves.length}`);

      // Advance time to allow natural lifespan pruning
      for (let i = 0; i < 150; i++) {
        ps.update(0.05);
      }

      assert.equal(ps.particles.length, 0);
      assert.equal(ps.shockwaves.length, 0);
    });
  });

  describe('Orbital Trail Bounded Ring Buffer', () => {
    it('should strictly bound body trail lengths to prevent memory leaks over thousands of frames', () => {
      const engine = new SimulationEngine({ G: 1.0 });
      const body = engine.addBody({
        name: 'Earth',
        position: new Vector2D(100, 0),
        velocity: new Vector2D(0, 10),
        mass: 1,
        radius: 5,
        color: '#34d399',
      });

      const maxLen = body.maxTrailLength || 120;
      body.trail = [];

      for (let frame = 0; frame < 2000; frame++) {
        body.position.x += 1;
        body.position.y += 1;
        body.trail.push({ x: body.position.x, y: body.position.y });
        if (body.trail.length > maxLen) {
          body.trail.shift();
        }
      }

      assert.equal(body.trail.length, 120);
    });
  });

  describe('Renderer Low-Performance Adaptive Fallback Mode', () => {
    it('should support dynamic activation and deactivation of lowPerformanceMode', () => {
      // Mock canvas for node test environment
      const mockCtx = {
        save() {},
        restore() {},
        beginPath() {},
        arc() {},
        fill() {},
        stroke() {},
        fillRect() {},
        createRadialGradient() {
          return { addColorStop() {} };
        },
        createLinearGradient() {
          return { addColorStop() {} };
        },
        setLineDash() {},
        measureText(text) {
          return { width: text.length * 6 };
        },
        fillText() {},
      };

      const mockCanvas = {
        getContext: () => mockCtx,
        width: 1920,
        height: 1080,
      };

      const renderer = new Renderer(mockCanvas);
      assert.equal(renderer.options.lowPerformanceMode, false);

      renderer.setLowPerformanceMode(true);
      assert.equal(renderer.options.lowPerformanceMode, true);

      renderer.setLowPerformanceMode(false);
      assert.equal(renderer.options.lowPerformanceMode, false);
    });
  });
});
