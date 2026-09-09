import { Vector2D } from './physics.js';

export class Particle {
  constructor(x, y, vx, vy, color, size, life) {
    this.position = new Vector2D(x, y);
    this.velocity = new Vector2D(vx, vy);
    this.color = color;
    this.size = size;
    this.life = life;
    this.maxLife = life;
  }

  update(dt) {
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.velocity.scale(0.98); // slight drag
    this.life -= dt;
  }

  render(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, Math.max(0.5, this.size * alpha), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class Shockwave {
  constructor(x, y, maxRadius = 160, color = '#ffaa00', life = 1.2) {
    this.x = x;
    this.y = y;
    this.radius = 4;
    this.maxRadius = maxRadius;
    this.color = color;
    this.life = life;
    this.maxLife = life;
  }

  update(dt) {
    this.life -= dt;
    const progress = Math.max(0, Math.min(1, 1 - this.life / this.maxLife));
    // Smooth ease-out expansion: sin(progress * pi / 2)
    this.radius = 4 + (this.maxRadius - 4) * Math.sin(progress * Math.PI * 0.5);
  }

  render(ctx) {
    const progress = Math.max(0, Math.min(1, 1 - this.life / this.maxLife));
    const alpha = Math.max(0, Math.pow(this.life / this.maxLife, 1.3));

    ctx.save();
    ctx.translate(this.x, this.y);

    // 1. Inner compression wavefront (cyan chromatic fringe)
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(1, this.radius * 0.97), 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0, 229, 255, ${(alpha * 0.7).toFixed(3)})`;
    ctx.lineWidth = Math.max(1, 2.5 * (1 - progress));
    ctx.stroke();

    // 2. Primary wavefront (white/primary color)
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(1, this.radius), 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 255, 255, ${(alpha * 0.9).toFixed(3)})`;
    ctx.lineWidth = Math.max(1.5, 3.5 * (1 - progress));
    ctx.stroke();

    // 3. Outer rarefaction wavefront (red/orange chromatic fringe)
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(1, this.radius * 1.03), 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(244, 63, 94, ${(alpha * 0.6).toFixed(3)})`;
    ctx.lineWidth = Math.max(1, 2.0 * (1 - progress));
    ctx.stroke();

    // 4. Translucent expanding pressure disc
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${(alpha * 0.035).toFixed(3)})`;
    ctx.fill();

    ctx.restore();
  }
}

export class ParticleSystem {
  constructor(options = {}) {
    this.particles = [];
    this.shockwaves = [];
    this.maxParticles = options.maxParticles || 500;
    this.maxShockwaves = options.maxShockwaves || 25;
  }

  emitCollision(x, y, color = '#ff9900', count = 35) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 15 + Math.random() * 80;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = 1.5 + Math.random() * 3.5;
      const life = 0.4 + Math.random() * 0.9;
      const pColor = Math.random() > 0.4 ? color : '#ffffff';
      this.particles.push(new Particle(x, y, vx, vy, pColor, size, life));
    }
  }

  emitShockwave(x, y, maxRadius = 160, color = '#ffaa00') {
    this.shockwaves.push(new Shockwave(x, y, maxRadius, color));
  }

  emitSupernovaBlast(x, y, color = '#00e5ff', count = 75) {
    // 1. Relativistic plasma filaments & sparks
    const colors = [color, '#ffffff', '#00e5ff', '#a855f7', '#ec4899'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 220;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = 1.8 + Math.random() * 4.2;
      const life = 1.2 + Math.random() * 1.8;
      const pColor = colors[Math.floor(Math.random() * colors.length)];
      this.particles.push(new Particle(x, y, vx, vy, pColor, size, life));
    }

    // 2. Relativistic expanding shockwave wavefront
    this.shockwaves.push(new Shockwave(x, y, 420, color, 2.0));
  }

  emitThruster(x, y, thrustX, thrustY, color = '#00e5ff', count = 4) {
    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * 0.4;
      const speed = -(25 + Math.random() * 45); // exhaust directed opposite thrust
      const angle = Math.atan2(thrustY, thrustX) + spread;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = 1.2 + Math.random() * 2.0;
      const life = 0.2 + Math.random() * 0.25;
      this.particles.push(new Particle(x, y, vx, vy, color, size, life));
    }
  }

  emitTidalDisruption(x, y, color = '#4fa3e3', count = 40) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 120;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = 1.0 + Math.random() * 2.5;
      const life = 0.8 + Math.random() * 1.5;
      this.particles.push(new Particle(x, y, vx, vy, color, size, life));
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update(dt);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.update(dt);
      if (s.life <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Strict Memory Cap Enforcement: Prune excess elements under high-frequency emission
    if (this.particles.length > this.maxParticles) {
      this.particles.splice(0, this.particles.length - this.maxParticles);
    }
    if (this.shockwaves.length > this.maxShockwaves) {
      this.shockwaves.splice(0, this.shockwaves.length - this.maxShockwaves);
    }
  }

  render(ctx) {
    // Render shockwave wavefronts under particles
    for (let i = 0; i < this.shockwaves.length; i++) {
      this.shockwaves[i].render(ctx);
    }

    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].render(ctx);
    }
  }

  clear() {
    this.particles = [];
    this.shockwaves = [];
  }
}
