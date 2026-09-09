import { Vector2D } from './physics.js';
import { CelestialBodyRenderer } from './body.js';
import { calculateGravitationalPotential, calculateSpacetimeWarp, getSpacetimeDepthColor } from './spacetime.js';
import { calculateCircumstellarHabitableZone } from './habitable.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;

    this.camera = {
      x: 0,
      y: 0,
      zoom: 1.0,
      angle: 0,
      mode: 'free', // 'free' | 'locked' | 'chase' | 'barycenter'
      targetBody: null,
    };

    this.options = {
      showTrails: true,
      showLabels: true,
      showGrid: true,
      showManeuverGuide: true,
      showSpacetimeGrid: true,
      showRadar: true,
      showReticles: true,
      showHabitableZones: true,
      lowPerformanceMode: false,
    };

    this.activeHohmann = null;
    this.hoveredBody = null;
    this.stars = [];
    this.initStarfield();
    this.resize();
  }

  setLowPerformanceMode(enabled) {
    this.options.lowPerformanceMode = Boolean(enabled);
  }

  initStarfield() {
    this.stars = [];
    const starColors = ['#ffffff', '#a0c4ff', '#bde0fe', '#ffd166', '#ffc6ff', '#caf0f8'];
    for (let i = 0; i < 320; i++) {
      this.stars.push({
        x: (Math.random() - 0.5) * 4000,
        y: (Math.random() - 0.5) * 4000,
        size: Math.random() < 0.08 ? Math.random() * 2.2 + 1.2 : Math.random() * 1.5 + 0.4,
        alpha: Math.random() * 0.7 + 0.3,
        parallax: Math.random() * 0.35 + 0.05,
        twinkleSpeed: Math.random() * 0.003 + 0.001,
        color: starColors[Math.floor(Math.random() * starColors.length)],
        hasSpikes: Math.random() < 0.06,
      });
    }

    this.nebulae = [
      { x: -600, y: -400, r: 850, colorOuter: 'rgba(56, 189, 248, 0)', colorMid: 'rgba(59, 130, 246, 0.08)', colorCore: 'rgba(147, 51, 234, 0.14)', parallax: 0.05 },
      { x: 700, y: 350, r: 950, colorOuter: 'rgba(20, 184, 166, 0)', colorMid: 'rgba(6, 182, 212, 0.07)', colorCore: 'rgba(16, 185, 129, 0.12)', parallax: 0.08 },
      { x: -200, y: 700, r: 750, colorOuter: 'rgba(245, 158, 11, 0)', colorMid: 'rgba(236, 72, 153, 0.06)', colorCore: 'rgba(239, 68, 68, 0.10)', parallax: 0.04 },
    ];
  }

  resize() {
    const width = (typeof window !== 'undefined' && window.innerWidth) || (this.canvas && this.canvas.width) || 1280;
    const height = (typeof window !== 'undefined' && window.innerHeight) || (this.canvas && this.canvas.height) || 720;
    this.width = width;
    this.height = height;

    if (this.canvas) {
      this.canvas.width = width * this.dpr;
      this.canvas.height = height * this.dpr;
      if (this.canvas.style) {
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
      }
    }

    if (this.ctx && this.ctx.resetTransform) {
      this.ctx.resetTransform();
    }
    if (this.ctx && this.ctx.scale) {
      this.ctx.scale(this.dpr, this.dpr);
    }
  }

  screenToWorld(sx, sy) {
    const cx = this.width / 2;
    const cy = this.height / 2;
    let dx = sx - cx;
    let dy = sy - cy;

    if (this.camera.angle) {
      const cos = Math.cos(this.camera.angle);
      const sin = Math.sin(this.camera.angle);
      const rx = dx * cos - dy * sin;
      const ry = dx * sin + dy * cos;
      dx = rx;
      dy = ry;
    }

    return new Vector2D(
      dx / this.camera.zoom + this.camera.x,
      dy / this.camera.zoom + this.camera.y
    );
  }

  worldToScreen(wx, wy) {
    const cx = this.width / 2;
    const cy = this.height / 2;
    let dx = (wx - this.camera.x) * this.camera.zoom;
    let dy = (wy - this.camera.y) * this.camera.zoom;

    if (this.camera.angle) {
      const cos = Math.cos(-this.camera.angle);
      const sin = Math.sin(-this.camera.angle);
      const rx = dx * cos - dy * sin;
      const ry = dx * sin + dy * cos;
      dx = rx;
      dy = ry;
    }

    return {
      x: dx + cx,
      y: dy + cy,
    };
  }

  updateCamera(engine) {
    if (this.camera.mode === 'locked' && this.camera.targetBody) {
      const targetPos = this.camera.targetBody.position;
      this.camera.x += (targetPos.x - this.camera.x) * 0.08;
      this.camera.y += (targetPos.y - this.camera.y) * 0.08;
      this.camera.angle += (0 - this.camera.angle) * 0.1;
    } else if (this.camera.mode === 'chase' && this.camera.targetBody) {
      const targetPos = this.camera.targetBody.position;
      const vel = this.camera.targetBody.velocity;
      this.camera.x += (targetPos.x - this.camera.x) * 0.12;
      this.camera.y += (targetPos.y - this.camera.y) * 0.12;

      const speed = vel ? vel.mag() : 0;
      if (speed > 0.05) {
        const targetAngle = Math.atan2(vel.y, vel.x) + Math.PI / 2;
        let diff = (targetAngle - this.camera.angle) % (Math.PI * 2);
        if (diff < -Math.PI) diff += Math.PI * 2;
        if (diff > Math.PI) diff -= Math.PI * 2;
        this.camera.angle += diff * 0.08;
      }
    } else if (this.camera.mode === 'barycenter' && engine) {
      const com = engine.getCenterOfMass();
      const bodies = engine.getBodies();
      this.camera.x += (com.x - this.camera.x) * 0.06;
      this.camera.y += (com.y - this.camera.y) * 0.06;
      this.camera.angle += (0 - this.camera.angle) * 0.1;

      if (bodies.length > 0) {
        let maxDist = 80;
        for (const b of bodies) {
          const d = Vector2D.distance(b.position, com) + (b.radius || 10) * 1.5;
          if (d > maxDist) maxDist = d;
        }
        const viewportMinDim = Math.min(this.width, this.height) * 0.38;
        const targetZoom = Math.min(2.5, Math.max(0.12, viewportMinDim / maxDist));
        this.camera.zoom += (targetZoom - this.camera.zoom) * 0.04;
      }
    } else {
      // Free mode with optional gentle target follow if targetBody is specified
      if (this.camera.targetBody) {
        const targetPos = this.camera.targetBody.position;
        this.camera.x += (targetPos.x - this.camera.x) * 0.08;
        this.camera.y += (targetPos.y - this.camera.y) * 0.08;
      }
      this.camera.angle += (0 - this.camera.angle) * 0.1;
    }
  }

  render(engine, particleSystem, previewLaunch = null, timestamp = 0, hoveredBody = null, missionManager = null, spacecraftController = null) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    this.updateCamera(engine);
    this.hoveredBody = hoveredBody;

    // Deep Space Radial Background Fill
    const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, Math.max(w, h));
    bgGrad.addColorStop(0, '#0a0e1c');
    bgGrad.addColorStop(0.6, '#060810');
    bgGrad.addColorStop(1, '#020306');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Render Procedural Glowing Nebulae (skipped in low-performance fallback mode to conserve GPU fillrate)
    if (!this.options.lowPerformanceMode) {
      ctx.save();
      for (const neb of this.nebulae) {
        const nx = (w / 2 + (neb.x - this.camera.x * neb.parallax));
        const ny = (h / 2 + (neb.y - this.camera.y * neb.parallax));
        const grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, neb.r);
        grad.addColorStop(0, neb.colorCore);
        grad.addColorStop(0.5, neb.colorMid);
        grad.addColorStop(1, neb.colorOuter);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(nx, ny, neb.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Draw Parallax Starfield with Twinkle & Diffraction Spikes
    ctx.save();
    for (const star of this.stars) {
      const sx = ((star.x - this.camera.x * star.parallax + 12000) % w);
      const sy = ((star.y - this.camera.y * star.parallax + 12000) % h);
      const twinkle = star.alpha * (0.8 + 0.25 * Math.sin(timestamp * star.twinkleSpeed));

      ctx.beginPath();
      ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
      ctx.fillStyle = star.color;
      ctx.globalAlpha = Math.max(0.15, Math.min(1.0, twinkle));
      ctx.fill();

      // Cross diffraction spikes on prominent stars (skipped in lowPerformanceMode)
      if (!this.options.lowPerformanceMode && star.hasSpikes && star.size > 1.6) {
        ctx.strokeStyle = star.color;
        ctx.lineWidth = 0.8;
        ctx.globalAlpha = twinkle * 0.4;
        const arm = star.size * 3.8;
        ctx.beginPath();
        ctx.moveTo(sx - arm, sy); ctx.lineTo(sx + arm, sy);
        ctx.moveTo(sx, sy - arm); ctx.lineTo(sx + arm, sy);
        ctx.stroke();
      }
    }
    ctx.restore();

    // World Transform
    ctx.save();
    ctx.translate(w / 2, h / 2);
    if (this.camera.angle) {
      ctx.rotate(-this.camera.angle);
    }
    ctx.scale(this.camera.zoom, this.camera.zoom);
    ctx.translate(-this.camera.x, -this.camera.y);

    // Coordinate Grid / Spacetime Curvature
    if (this.options.showGrid) {
      if (this.options.showSpacetimeGrid) {
        this.renderSpacetimeGrid(ctx, engine);
      } else {
        this.renderCoordinateGrid(ctx);
      }
    }

    // Hohmann Transfer Orbit if plotted
    if (this.activeHohmann) {
      this.renderHohmannTransfer(ctx, engine, this.activeHohmann);
    }

    // Render Circumstellar Habitable Zones (Goldilocks corridor around stars)
    if (this.options.showHabitableZones !== false) {
      this.renderHabitableZones(ctx, engine, timestamp);
    }

    // Render Celestial Bodies
    const bodies = engine.getBodies();
    this.options.bodies = bodies;
    for (const body of bodies) {
      CelestialBodyRenderer.render(ctx, body, timestamp, this.options);
    }

    // Render Osculating Conic & Attractor Guide for Selected Body
    const selectedBody = bodies.find((b) => b.isSelected);
    if (selectedBody) {
      this.renderSelectedBodyConics(ctx, engine, selectedBody);
    }

    // Render Tactical Targeting Reticles on Hovered and/or Selected Bodies
    if (this.options.showReticles !== false) {
      if (selectedBody) {
        this.renderTargetingReticle(ctx, selectedBody, true, false, timestamp, engine);
      }
      if (hoveredBody && hoveredBody !== selectedBody) {
        this.renderTargetingReticle(ctx, hoveredBody, false, true, timestamp, engine);
      }
    }

    // Render Spacecraft Trajectory & Gravitational Slingshot Prediction
    if (spacecraftController) {
      this.renderSpacecraftTrajectory(ctx, engine, spacecraftController, timestamp);
    }

    // Render Particle explosions & disruption effects
    particleSystem.render(ctx);

    // Render Trajectory Launch Vector & Predictive Orbit
    if (previewLaunch) {
      this.renderLaunchPreview(ctx, engine, previewLaunch);
    }

    // Render expanding relativistic Supernova Shockwave Blasts
    this.renderSupernovaBlasts(ctx, engine, timestamp);

    // Render Tactical Flight Challenge Mission Overlays (Target corridors, photon spheres, extraction gate)
    if (missionManager) {
      this.renderMissionOverlays(ctx, engine, missionManager, timestamp);
    }

    ctx.restore();

    // Render Screen-space Picture-in-Picture Orbital Radar
    if (this.options.showRadar !== false) {
      this.renderOrbitalRadar(ctx, engine, timestamp);
    }
  }

  renderSpacetimeGrid(ctx, engine) {
    const bodies = engine.getBodies();
    // Optimization: only bodies with significant mass bend spacetime visibly.
    // Filtering out dozens of tiny debris particles yields a 40x speedup!
    const massiveBodies = bodies.filter(b => b.mass >= 0.5 && b.type !== 'debris');
    const activeBodies = massiveBodies.length > 0 ? massiveBodies : bodies;

    const halfW = (this.width / this.camera.zoom) * 0.5;
    const halfH = (this.height / this.camera.zoom) * 0.5;
    const minX = this.camera.x - halfW - 60;
    const maxX = this.camera.x + halfW + 60;
    const minY = this.camera.y - halfH - 60;
    const maxY = this.camera.y + halfH + 60;

    // Viewport adaptive grid step for smooth 60-120 FPS
    const stepMultiplier = this.options.lowPerformanceMode ? 1.75 : 1.0;
    const step = Math.max(70, Math.min(240, Math.round((100 * stepMultiplier) / this.camera.zoom)));
    const startX = Math.floor(minX / step) * step;
    const endX = Math.ceil(maxX / step) * step;
    const startY = Math.floor(minY / step) * step;
    const endY = Math.ceil(maxY / step) * step;

    const maxGridDim = this.options.lowPerformanceMode ? 26 : 45;
    const cols = Math.min(maxGridDim, Math.max(2, Math.floor((endX - startX) / step) + 1));
    const rows = Math.min(maxGridDim, Math.max(2, Math.floor((endY - startY) / step) + 1));
    const grid = [];

    for (let r = 0; r < rows; r++) {
      grid[r] = [];
      const y = startY + r * step;
      for (let c = 0; c < cols; c++) {
        const x = startX + c * step;
        const warped = calculateSpacetimeWarp({ x, y }, activeBodies, engine.G, 22.0);
        const phi = calculateGravitationalPotential({ x, y }, activeBodies, engine.G, 22.0);
        grid[r][c] = { x: warped.x, y: warped.y, phi };
      }
    }

    // High performance Path2D stroke batching:
    // Reduces ~1,600 individual ctx.beginPath()/stroke() GPU flushes down to 3 batched draw calls!
    const bucketLow = new Path2D();
    const bucketMid = new Path2D();
    const bucketHigh = new Path2D();

    const addSegment = (p1, p2) => {
      const avgPhi = Math.abs((p1.phi + p2.phi) * 0.5);
      const target = avgPhi < 0.15 ? bucketLow : (avgPhi < 0.85 ? bucketMid : bucketHigh);
      target.moveTo(p1.x, p1.y);
      target.lineTo(p2.x, p2.y);
    };

    // Horizontal grid lines
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols - 1; c++) {
        addSegment(grid[r][c], grid[r][c + 1]);
      }
    }

    // Vertical grid lines
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows - 1; r++) {
        addSegment(grid[r][c], grid[r + 1][c]);
      }
    }

    ctx.save();
    ctx.lineWidth = Math.max(0.75, 1.1 / this.camera.zoom);

    ctx.strokeStyle = 'rgba(0, 229, 255, 0.08)'; // Ambient spacetime
    ctx.stroke(bucketLow);

    ctx.strokeStyle = 'rgba(168, 85, 247, 0.30)'; // Moderate curvature
    ctx.stroke(bucketMid);

    ctx.strokeStyle = 'rgba(244, 63, 94, 0.65)';  // Deep gravity well
    ctx.stroke(bucketHigh);

    ctx.restore();
  }

  renderCoordinateGrid(ctx) {
    const gridSize = 150;
    const range = 2400;
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 1 / this.camera.zoom;

    ctx.beginPath();
    for (let x = -range; x <= range; x += gridSize) {
      ctx.moveTo(x, -range);
      ctx.lineTo(x, range);
    }
    for (let y = -range; y <= range; y += gridSize) {
      ctx.moveTo(-range, y);
      ctx.lineTo(range, y);
    }
    ctx.stroke();

    // Subtle origin crosshair
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(-40, 0);
    ctx.lineTo(40, 0);
    ctx.moveTo(0, -40);
    ctx.lineTo(0, 40);
    ctx.stroke();
    ctx.restore();
  }

  renderSelectedBodyConics(ctx, engine, body) {
    const conics = engine.getOrbitalElements(body.id);
    if (!conics) return;

    const primary = engine.getBody(conics.primaryId);
    if (!primary) return;

    ctx.save();

    // 1. Dashed gravitational attractor baseline
    ctx.beginPath();
    ctx.moveTo(body.position.x, body.position.y);
    ctx.lineTo(primary.position.x, primary.position.y);
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.2)';
    ctx.lineWidth = 1 / this.camera.zoom;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    const e = conics.eccentricity;
    const a = conics.semiMajorAxis;
    const ex = conics.eccentricityVector?.x || 0;
    const ey = conics.eccentricityVector?.y || 0;
    const theta = Math.atan2(ey, ex);

    // 2. Bound Ellipse
    if (conics.isBound && a > 0 && e < 1.0) {
      const b = a * Math.sqrt(Math.max(0, 1 - e * e));
      const c = a * e;

      // Center of ellipse relative to focus (primary)
      const centerX = primary.position.x - c * Math.cos(theta);
      const centerY = primary.position.y - c * Math.sin(theta);

      ctx.beginPath();
      ctx.ellipse(centerX, centerY, a, b, theta, 0, Math.PI * 2);
      ctx.strokeStyle = e < 0.05 ? 'rgba(0, 229, 255, 0.4)' : 'rgba(250, 204, 21, 0.45)';
      ctx.lineWidth = 1.5 / this.camera.zoom;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Periapsis (Pe) Marker
      const peX = primary.position.x + conics.periapsis * Math.cos(theta);
      const peY = primary.position.y + conics.periapsis * Math.sin(theta);
      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.arc(peX, peY, 3.5 / this.camera.zoom, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = `600 ${Math.max(9, 10 / this.camera.zoom)}px "JetBrains Mono", monospace`;
      ctx.fillText(`Pe: ${conics.periapsis.toFixed(1)} AU`, peX + 6 / this.camera.zoom, peY - 4 / this.camera.zoom);

      // Apoapsis (Ap) Marker
      const apX = primary.position.x - conics.apoapsis * Math.cos(theta);
      const apY = primary.position.y - conics.apoapsis * Math.sin(theta);
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(apX, apY, 3.5 / this.camera.zoom, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillText(`Ap: ${conics.apoapsis.toFixed(1)} AU`, apX + 6 / this.camera.zoom, apY - 4 / this.camera.zoom);
    } else if (!conics.isBound && conics.periapsis > 0) {
      // Hyperbolic Periapsis marker
      const peX = primary.position.x + conics.periapsis * Math.cos(theta);
      const peY = primary.position.y + conics.periapsis * Math.sin(theta);
      ctx.fillStyle = '#fb7185';
      ctx.beginPath();
      ctx.arc(peX, peY, 4 / this.camera.zoom, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = `700 ${Math.max(9, 10 / this.camera.zoom)}px "JetBrains Mono", monospace`;
      ctx.fillText(`Pe: ${conics.periapsis.toFixed(1)} AU (ESCAPE)`, peX + 6 / this.camera.zoom, peY - 4 / this.camera.zoom);
    }

    ctx.restore();
  }

  renderLaunchPreview(ctx, engine, launch) {
    const { start, current, config, velocity, isSnapped, snapType, circularAssist, primaryAttractor } = launch;
    const vx = velocity ? velocity.x : (start.x - current.x) * 0.12;
    const vy = velocity ? velocity.y : (start.y - current.y) * 0.12;
    const baseSpeed = Math.hypot(vx, vy);

    ctx.save();

    // 1. Maneuver Node Assist: Render circular orbit guide & tangential assist vectors
    if (this.options.showManeuverGuide !== false && circularAssist && primaryAttractor) {
      // Circular orbit radius ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(primaryAttractor.position.x, primaryAttractor.position.y, circularAssist.radius, 0, Math.PI * 2);
      ctx.strokeStyle = isSnapped ? 'rgba(0, 255, 180, 0.45)' : 'rgba(0, 229, 255, 0.2)';
      ctx.lineWidth = (isSnapped ? 2 : 1) / this.camera.zoom;
      ctx.setLineDash([6, 6]);
      ctx.stroke();

      // Label on the circular orbit path
      ctx.font = `600 ${Math.max(9, 10 / this.camera.zoom)}px "JetBrains Mono", monospace`;
      ctx.fillStyle = isSnapped ? '#00ffb4' : 'rgba(0, 229, 255, 0.6)';
      const labelAngle = Math.atan2(start.y - primaryAttractor.position.y, start.x - primaryAttractor.position.x) + 0.15;
      const lx = primaryAttractor.position.x + Math.cos(labelAngle) * circularAssist.radius;
      const ly = primaryAttractor.position.y + Math.sin(labelAngle) * circularAssist.radius;
      ctx.fillText(`CIRCULAR ORBIT (vc = ${circularAssist.speed.toFixed(1)} km/s)`, lx, ly);
      ctx.restore();

      // Prograde / Retrograde tangential guide hints
      const tangentLen = 35 / this.camera.zoom;
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
      ctx.lineWidth = 1.5 / this.camera.zoom;
      ctx.setLineDash([3, 3]);

      // Prograde direction guide
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(start.x + circularAssist.prograde.x * tangentLen, start.y + circularAssist.prograde.y * tangentLen);
      ctx.stroke();

      // Retrograde direction guide
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(start.x + circularAssist.retrograde.x * tangentLen, start.y + circularAssist.retrograde.y * tangentLen);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Predictive Trajectory with Gravity Assist / Slingshot Visualizer
    const simSteps = 90;
    const dt = 0.35;
    let simX = start.x;
    let simY = start.y;
    let simVx = vx;
    let simVy = vy;

    const trajectory = [{ x: simX, y: simY, speed: baseSpeed }];
    let maxSpeed = baseSpeed;
    let periapsisPoint = null;

    for (let s = 0; s < simSteps; s++) {
      let ax = 0;
      let ay = 0;
      for (const b of engine.getBodies()) {
        const dx = b.position.x - simX;
        const dy = b.position.y - simY;
        const r2 = dx * dx + dy * dy + engine.softening * engine.softening;
        const dist = Math.sqrt(r2);
        const f = (engine.G * b.mass) / (r2 * dist);
        ax += dx * f;
        ay += dy * f;
      }

      simX += simVx * dt;
      simY += simVy * dt;
      simVx += ax * dt;
      simVy += ay * dt;

      const currentSpeed = Math.hypot(simVx, simVy);
      trajectory.push({ x: simX, y: simY, speed: currentSpeed });

      if (currentSpeed > maxSpeed) {
        maxSpeed = currentSpeed;
        periapsisPoint = { x: simX, y: simY, speed: currentSpeed, deltaV: currentSpeed - baseSpeed };
      }
    }

    // Draw trajectory segments with continuous speed gradient
    for (let i = 0; i < trajectory.length - 1; i++) {
      const p1 = trajectory[i];
      const p2 = trajectory[i + 1];
      const progress = i / simSteps;
      const alpha = Math.max(0.12, 1.0 - progress);

      // Color coding: cyan (base) -> amber (accelerating) -> magenta (peak slingshot)
      const ratio = baseSpeed > 0 ? p1.speed / baseSpeed : 1.0;
      let color;
      if (ratio >= 1.45) {
        color = `rgba(244, 63, 94, ${alpha})`; // Hot magenta
      } else if (ratio >= 1.1) {
        color = `rgba(250, 204, 21, ${alpha})`; // Amber
      } else {
        color = `rgba(0, 229, 255, ${alpha})`; // Cool cyan
      }

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1, (2.2 * (1 - progress * 0.5)) / this.camera.zoom);
      ctx.stroke();
    }

    // Draw flyby slingshot boost tag at periapsis if acceleration is significant
    if (periapsisPoint && periapsisPoint.deltaV >= 1.2 && baseSpeed > 0.5) {
      ctx.save();
      // Glowing periapsis marker
      ctx.beginPath();
      ctx.arc(periapsisPoint.x, periapsisPoint.y, 5 / this.camera.zoom, 0, Math.PI * 2);
      ctx.fillStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 10;
      ctx.fill();

      // Slingshot text
      ctx.font = `700 ${Math.max(10, 11 / this.camera.zoom)}px "JetBrains Mono", monospace`;
      ctx.fillStyle = '#fb7185';
      ctx.shadowBlur = 0;
      const label = `+Δv ${periapsisPoint.deltaV.toFixed(1)} km/s (SLINGSHOT)`;
      ctx.fillText(label, periapsisPoint.x + 8 / this.camera.zoom, periapsisPoint.y - 8 / this.camera.zoom);
      ctx.restore();
    }

    // 3. Velocity vector launch arrow
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    const arrowLen = 8;
    const endX = start.x + vx * arrowLen;
    const endY = start.y + vy * arrowLen;
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = isSnapped ? '#00ffb4' : '#00e5ff';
    ctx.lineWidth = 2.5 / this.camera.zoom;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Arrowhead
    const angle = Math.atan2(vy, vx);
    const headLen = 8 / this.camera.zoom;
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - headLen * Math.cos(angle - Math.PI / 6), endY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(endX - headLen * Math.cos(angle + Math.PI / 6), endY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = isSnapped ? '#00ffb4' : '#00e5ff';
    ctx.fill();

    // 4. Snapped Visual Indicator
    if (isSnapped) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(start.x, start.y, (config.radius || 6) * 1.8, 0, Math.PI * 2);
      ctx.strokeStyle = '#00ffb4';
      ctx.lineWidth = 2 / this.camera.zoom;
      ctx.shadowColor = '#00ffb4';
      ctx.shadowBlur = 12;
      ctx.stroke();

      ctx.font = `700 ${Math.max(10, 11 / this.camera.zoom)}px "JetBrains Mono", monospace`;
      ctx.fillStyle = '#00ffb4';
      ctx.fillText(`⚡ ${snapType} LOCKED`, start.x + 14 / this.camera.zoom, start.y - 14 / this.camera.zoom);
      ctx.restore();
    }

    // 5. Spawn body preview circle
    ctx.beginPath();
    ctx.arc(start.x, start.y, config.radius || 6, 0, Math.PI * 2);
    ctx.fillStyle = config.color || '#33aaff';
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5 / this.camera.zoom;
    ctx.stroke();

    ctx.restore();
  }

  renderTargetingReticle(ctx, body, isSelected, isHovered, timestamp, engine) {
    if (!body) return;

    ctx.save();
    const bx = body.position.x;
    const by = body.position.y;
    const r = Math.max(body.radius * 1.5, 16 / this.camera.zoom);
    const corner = r * 0.45;
    const color = isSelected ? '#00ffb4' : (body.type === 'black-hole' ? '#a855f7' : '#00e5ff');
    const pulseAlpha = 0.75 + 0.25 * Math.sin(timestamp * 0.006);

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.5 / this.camera.zoom;
    ctx.globalAlpha = pulseAlpha;

    // 1. Four Aerospace Corner Brackets
    ctx.beginPath();
    ctx.moveTo(bx - r, by - r + corner); ctx.lineTo(bx - r, by - r); ctx.lineTo(bx - r + corner, by - r);
    ctx.moveTo(bx + r - corner, by - r); ctx.lineTo(bx + r, by - r); ctx.lineTo(bx + r, by - r + corner);
    ctx.moveTo(bx - r, by + r - corner); ctx.lineTo(bx - r, by + r); ctx.lineTo(bx - r + corner, by + r);
    ctx.moveTo(bx + r - corner, by + r); ctx.lineTo(bx + r, by + r); ctx.lineTo(bx + r, by + r - corner);
    ctx.stroke();

    // 2. Rotating Inner Range Ring with Ticks
    const rot = (timestamp * 0.0015) % (Math.PI * 2);
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.75, 0, Math.PI * 2);
    ctx.setLineDash([2 / this.camera.zoom, 4 / this.camera.zoom]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // 3. Heading / Velocity vector leader line
    const vx = body.velocity ? body.velocity.x : 0;
    const vy = body.velocity ? body.velocity.y : 0;
    const vMag = Math.hypot(vx, vy);
    if (vMag > 0.02) {
      const vLen = Math.min(60 / this.camera.zoom, Math.max(15 / this.camera.zoom, vMag * 5));
      const vNormX = vx / vMag;
      const vNormY = vy / vMag;
      const arrowTipX = bx + vNormX * (r + vLen);
      const arrowTipY = by + vNormY * (r + vLen);

      ctx.beginPath();
      ctx.moveTo(bx + vNormX * r, by + vNormY * r);
      ctx.lineTo(arrowTipX, arrowTipY);
      ctx.stroke();

      // Diamond tip
      ctx.save();
      ctx.translate(arrowTipX, arrowTipY);
      ctx.rotate(Math.atan2(vNormY, vNormX));
      ctx.beginPath();
      const dSize = 3.5 / this.camera.zoom;
      ctx.moveTo(dSize, 0); ctx.lineTo(0, -dSize); ctx.lineTo(-dSize, 0); ctx.lineTo(0, dSize);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 4. Live Vector Telemetry HUD Bracket
    const conics = engine.getOrbitalElements(body.id);
    const doglegStart = { x: bx + r, y: by - r };
    const doglegMid = { x: bx + r + 22 / this.camera.zoom, y: by - r - 22 / this.camera.zoom };
    const doglegEnd = { x: doglegMid.x + 130 / this.camera.zoom, y: doglegMid.y };

    ctx.beginPath();
    ctx.moveTo(doglegStart.x, doglegStart.y);
    ctx.lineTo(doglegMid.x, doglegMid.y);
    ctx.lineTo(doglegEnd.x, doglegMid.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2 / this.camera.zoom;
    ctx.stroke();

    // HUD Data Card Background
    const cardW = 140 / this.camera.zoom;
    const cardH = 48 / this.camera.zoom;
    const cardX = doglegMid.x;
    const cardY = doglegMid.y - cardH;

    ctx.fillStyle = 'rgba(6, 12, 24, 0.88)';
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.strokeRect(cardX, cardY, cardW, cardH);

    // Text metrics
    const fontSize = Math.max(7, Math.min(11, 8.5 / this.camera.zoom));
    ctx.font = `700 ${fontSize}px "JetBrains Mono", monospace`;
    ctx.fillStyle = color;
    ctx.globalAlpha = 1.0;

    const lineH = fontSize * 1.35;
    const tx = cardX + 5 / this.camera.zoom;
    let ty = cardY + fontSize + 2 / this.camera.zoom;

    ctx.fillText(`[${body.name.toUpperCase()}] ${isSelected ? '• LOCKED' : '• ACQUIRED'}`, tx, ty);
    ty += lineH;

    ctx.font = `500 ${fontSize * 0.9}px "JetBrains Mono", monospace`;
    ctx.fillStyle = '#cbd5e1';

    if (conics && conics.primaryName) {
      const sma = conics.isBound && conics.semiMajorAxis > 0 ? `${conics.semiMajorAxis.toFixed(1)}AU` : 'ESC';
      const ecc = conics.eccentricity.toFixed(3);
      ctx.fillText(`SMA: ${sma}  ECC: ${ecc}`, tx, ty);
      ty += lineH;

      const ra = conics.apoapsis !== Infinity ? `${conics.apoapsis.toFixed(1)}AU` : '∞';
      const rp = `${conics.periapsis.toFixed(1)}AU`;
      ctx.fillText(`APO: ${ra}  PER: ${rp}`, tx, ty);
      ty += lineH;

      const period = conics.period ? `${conics.period.toFixed(1)}s` : '∞';
      ctx.fillText(`VEL: ${vMag.toFixed(2)}km/s  T: ${period}`, tx, ty);
    } else {
      ctx.fillText(`MASS: ${body.mass.toFixed(1)}  RAD: ${body.radius.toFixed(1)}`, tx, ty);
      ty += lineH;
      ctx.fillText(`VEL: ${vMag.toFixed(2)}km/s  TYPE: ${body.type.toUpperCase()}`, tx, ty);
    }

    ctx.restore();
  }

  renderHohmannTransfer(ctx, engine, transfer) {
    if (!transfer) return;
    const primary = engine.getBody(transfer.primaryId);
    if (!primary) return;

    ctx.save();
    const r1 = transfer.r1;
    const r2 = transfer.r2;
    const a = transfer.semiMajorAxis;
    const b = Math.sqrt(Math.max(1, r1 * r2));
    const c = Math.abs(a - Math.min(r1, r2));

    const angle = transfer.transferAngle || 0;
    const centerX = primary.position.x - c * Math.cos(angle);
    const centerY = primary.position.y - c * Math.sin(angle);

    ctx.beginPath();
    ctx.ellipse(centerX, centerY, a, b, angle, 0, Math.PI * 2);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.8 / this.camera.zoom;
    ctx.setLineDash([8 / this.camera.zoom, 6 / this.camera.zoom]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Departure impulse burn (Delta-v 1)
    const p1X = primary.position.x + r1 * Math.cos(angle);
    const p1Y = primary.position.y + r1 * Math.sin(angle);
    ctx.fillStyle = '#00ffb4';
    ctx.beginPath();
    ctx.arc(p1X, p1Y, 4.5 / this.camera.zoom, 0, Math.PI * 2);
    ctx.fill();

    // Arrival impulse burn (Delta-v 2)
    const p2X = primary.position.x - r2 * Math.cos(angle);
    const p2Y = primary.position.y - r2 * Math.sin(angle);
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(p2X, p2Y, 4.5 / this.camera.zoom, 0, Math.PI * 2);
    ctx.fill();

    // Text labels
    ctx.font = `700 ${Math.max(9, 11 / this.camera.zoom)}px "JetBrains Mono", monospace`;
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(
      `HOHMANN TRANSFER: Δv ${transfer.totalDeltaV.toFixed(2)} km/s  T: ${transfer.transferTime.toFixed(1)}s`,
      p1X + 8 / this.camera.zoom,
      p1Y - 8 / this.camera.zoom
    );

    ctx.fillStyle = '#00ffb4';
    ctx.fillText(`BURN 1: +Δv ${transfer.deltaV1.toFixed(2)} km/s`, p1X + 8 / this.camera.zoom, p1Y + 14 / this.camera.zoom);

    ctx.fillStyle = '#f43f5e';
    ctx.fillText(`BURN 2: +Δv ${transfer.deltaV2.toFixed(2)} km/s`, p2X + 8 / this.camera.zoom, p2Y + 14 / this.camera.zoom);

    ctx.restore();
  }

  renderOrbitalRadar(ctx, engine, timestamp) {
    const bodies = engine.getBodies();
    const radarW = 200;
    const radarH = 200;
    const pad = 18;
    const rx = this.width - radarW - pad;
    const ry = this.height - radarH - 46;
    const cx = rx + radarW / 2;
    const cy = ry + radarH / 2;
    const radius = radarW / 2 - 12;

    ctx.save();

    // 1. Radar Glassmorphism Panel
    ctx.beginPath();
    ctx.roundRect(rx, ry, radarW, radarH, 12);
    ctx.fillStyle = 'rgba(7, 11, 22, 0.88)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.28)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Corner decorative aerospace notches
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    const cornerL = 8;
    ctx.beginPath();
    ctx.moveTo(rx, ry + cornerL); ctx.lineTo(rx, ry); ctx.lineTo(rx + cornerL, ry);
    ctx.moveTo(rx + radarW - cornerL, ry); ctx.lineTo(rx + radarW, ry); ctx.lineTo(rx + radarW, ry + cornerL);
    ctx.moveTo(rx, ry + radarH - cornerL); ctx.lineTo(rx, ry + radarH); ctx.lineTo(rx + cornerL, ry + radarH);
    ctx.moveTo(rx + radarW - cornerL, ry + radarH); ctx.lineTo(rx + radarW, ry + radarH); ctx.lineTo(rx + radarW, ry + radarH - cornerL);
    ctx.stroke();

    // Radar Header
    ctx.font = '700 9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#00e5ff';
    ctx.fillText('ORBITAL RADAR • PIP', rx + 10, ry + 16);

    ctx.fillStyle = '#00ffb4';
    ctx.beginPath();
    ctx.arc(rx + radarW - 14, ry + 12, 3, 0, Math.PI * 2);
    ctx.fill();

    // 2. Radar Circular Scope (Clip region)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy + 6, radius, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = '#040711';
    ctx.fill();

    // Concentric Range Rings
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    [0.33, 0.66, 1.0].forEach((ratio) => {
      ctx.beginPath();
      ctx.arc(cx, cy + 6, radius * ratio, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // Crosshairs
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.12)';
    ctx.beginPath();
    ctx.moveTo(cx - radius, cy + 6); ctx.lineTo(cx + radius, cy + 6);
    ctx.moveTo(cx, cy + 6 - radius); ctx.lineTo(cx, cy + 6 + radius);
    ctx.stroke();

    // 3. Rotating Sweep Line
    const sweepAngle = (timestamp * 0.0018) % (Math.PI * 2);
    const grad = ctx.createRadialGradient(cx, cy + 6, 0, cx, cy + 6, radius);
    grad.addColorStop(0, 'rgba(0, 229, 255, 0.25)');
    grad.addColorStop(1, 'rgba(0, 229, 255, 0.02)');

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy + 6);
    ctx.arc(cx, cy + 6, radius, sweepAngle - 0.5, sweepAngle);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx, cy + 6);
    ctx.lineTo(cx + Math.cos(sweepAngle) * radius, cy + 6 + Math.sin(sweepAngle) * radius);
    ctx.strokeStyle = 'rgba(0, 255, 180, 0.75)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // Scale calculation
    let maxDist = 350;
    for (const b of bodies) {
      const d = Math.hypot(b.position.x, b.position.y);
      if (d > maxDist) maxDist = d;
    }
    const radarScale = (radius * 0.85) / maxDist;

    // 4. Lagrange Points (L1-L5) calculation for dominant pair
    let primary = null;
    let secondary = null;
    let maxM = 0;
    for (const b of bodies) {
      if (b.mass > maxM) {
        maxM = b.mass;
        primary = b;
      }
    }
    if (primary) {
      let maxSecM = 0;
      for (const b of bodies) {
        if (b !== primary && b.mass > maxSecM && b.mass >= 0.01) {
          maxSecM = b.mass;
          secondary = b;
        }
      }
    }

    if (primary && secondary) {
      const dx = secondary.position.x - primary.position.x;
      const dy = secondary.position.y - primary.position.y;
      const R = Math.hypot(dx, dy);

      if (R > 10) {
        const uX = dx / R;
        const uY = dy / R;
        const perpX = -uY;
        const perpY = uX;
        const massRatio = Math.cbrt(secondary.mass / (3 * primary.mass));

        const l1World = { x: primary.position.x + uX * R * (1 - massRatio), y: primary.position.y + uY * R * (1 - massRatio) };
        const l2World = { x: primary.position.x + uX * R * (1 + massRatio), y: primary.position.y + uY * R * (1 + massRatio) };
        const l3World = {
          x: primary.position.x - uX * R * (1 + (5 / 12) * (secondary.mass / primary.mass)),
          y: primary.position.y - uY * R * (1 + (5 / 12) * (secondary.mass / primary.mass)),
        };
        const l4World = {
          x: primary.position.x + uX * R * 0.5 - perpX * R * (Math.sqrt(3) / 2),
          y: primary.position.y + uY * R * 0.5 - perpY * R * (Math.sqrt(3) / 2),
        };
        const l5World = {
          x: primary.position.x + uX * R * 0.5 + perpX * R * (Math.sqrt(3) / 2),
          y: primary.position.y + uY * R * 0.5 + perpY * R * (Math.sqrt(3) / 2),
        };

        const lagrangePoints = [
          { name: 'L1', pos: l1World },
          { name: 'L2', pos: l2World },
          { name: 'L3', pos: l3World },
          { name: 'L4', pos: l4World },
          { name: 'L5', pos: l5World },
        ];

        ctx.fillStyle = '#00ffb4';
        ctx.strokeStyle = '#00ffb4';
        ctx.lineWidth = 1;
        ctx.font = '600 7px "JetBrains Mono", monospace';

        for (const lp of lagrangePoints) {
          const lx = cx + lp.pos.x * radarScale;
          const ly = (cy + 6) + lp.pos.y * radarScale;
          if (Math.hypot(lx - cx, ly - (cy + 6)) <= radius - 4) {
            ctx.beginPath();
            ctx.moveTo(lx - 2.5, ly); ctx.lineTo(lx + 2.5, ly);
            ctx.moveTo(lx, ly - 2.5); ctx.lineTo(lx, ly + 2.5);
            ctx.stroke();
            ctx.fillText(lp.name, lx + 4, ly + 2);
          }
        }
      }
    }

    // 5. Camera Viewport Frustum Box
    const screenCorners = [
      { x: 0, y: 0 },
      { x: this.width, y: 0 },
      { x: this.width, y: this.height },
      { x: 0, y: this.height },
    ];
    const worldCorners = screenCorners.map((p) => this.screenToWorld(p.x, p.y));

    ctx.beginPath();
    worldCorners.forEach((wp, idx) => {
      const rxPos = cx + wp.x * radarScale;
      const ryPos = (cy + 6) + wp.y * radarScale;
      if (idx === 0) ctx.moveTo(rxPos, ryPos);
      else ctx.lineTo(rxPos, ryPos);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 229, 255, 0.08)';
    ctx.fill();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 2]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 6. Macro Body Blips
    for (const b of bodies) {
      const bx = cx + b.position.x * radarScale;
      const by = (cy + 6) + b.position.y * radarScale;

      if (Math.hypot(bx - cx, by - (cy + 6)) > radius - 2) continue;

      ctx.beginPath();
      if (b.type === 'star' || b.type === 'pulsar') {
        ctx.arc(bx, by, 3, 0, Math.PI * 2);
        ctx.fillStyle = b.type === 'pulsar' ? '#00e5ff' : '#f59e0b';
      } else if (b.type === 'black-hole') {
        ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#a855f7';
      } else {
        ctx.arc(bx, by, 2, 0, Math.PI * 2);
        ctx.fillStyle = b.color || '#38bdf8';
      }
      ctx.fill();

      if (b.isSelected) {
        ctx.beginPath();
        ctx.arc(bx, by, 5.5, 0, Math.PI * 2);
        ctx.strokeStyle = '#00ffb4';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    }

    ctx.restore(); // End Scope Clip

    // Radar scale footnote
    ctx.font = '500 8px "JetBrains Mono", monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`R: ${Math.round(maxDist)} AU`, rx + 10, ry + radarH - 8);

    ctx.restore();
  }

  renderSupernovaBlasts(ctx, engine, timestamp = 0) {
    const blasts = engine.getSupernovaBlasts();
    if (!blasts || blasts.length === 0) return;

    for (const blast of blasts) {
      if (blast.radius <= 0) continue;
      const progress = Math.min(1.0, blast.radius / blast.maxRadius);
      const alpha = Math.max(0, 1.0 - progress);

      ctx.save();
      ctx.translate(blast.x, blast.y);

      // 1. Expanding relativistic plasma shockwave disk
      const grad = ctx.createRadialGradient(0, 0, blast.radius * 0.45, 0, 0, blast.radius);
      grad.addColorStop(0, `rgba(255, 255, 255, ${(alpha * 0.35).toFixed(3)})`);
      grad.addColorStop(0.3, blast.color === '#000000' || blast.color === '#a855f7' ? `rgba(168, 85, 247, ${(alpha * 0.3).toFixed(3)})` : `rgba(0, 229, 255, ${(alpha * 0.35).toFixed(3)})`);
      grad.addColorStop(0.8, `rgba(236, 72, 153, ${(alpha * 0.15).toFixed(3)})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.arc(0, 0, blast.radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // 2. Multi-spectral chromatic shock fronts
      // High-energy blue shock crest
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(1, blast.radius * 0.98), 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 229, 255, ${(alpha * 0.8).toFixed(3)})`;
      ctx.lineWidth = Math.max(1.5, 4.0 * (1 - progress));
      ctx.stroke();

      // Blinding white relativistic crest
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(1, blast.radius), 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${(alpha * 0.95).toFixed(3)})`;
      ctx.lineWidth = Math.max(2.0, 5.0 * (1 - progress));
      ctx.stroke();

      // Redshifted outer wake
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(1, blast.radius * 1.025), 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(244, 63, 94, ${(alpha * 0.6).toFixed(3)})`;
      ctx.lineWidth = Math.max(1.2, 3.0 * (1 - progress));
      ctx.stroke();

      // 3. Relativistic radiation pressure filament rays
      const rays = 12;
      ctx.strokeStyle = `rgba(255, 255, 255, ${(alpha * 0.25).toFixed(3)})`;
      ctx.lineWidth = 1;
      for (let r = 0; r < rays; r++) {
        const ang = (r / rays) * Math.PI * 2 + (timestamp * 0.0004);
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * blast.radius * 0.25, Math.sin(ang) * blast.radius * 0.25);
        ctx.lineTo(Math.cos(ang) * blast.radius * 1.05, Math.sin(ang) * blast.radius * 1.05);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  renderMissionOverlays(ctx, engine, missionManager, timestamp = 0) {
    if (!missionManager || missionManager.getStatus() === 'idle') return;
    const mission = missionManager.getActiveMission();
    if (!mission) return;

    const probe = engine.getBody('mission-probe');
    ctx.save();

    if (mission.id === 'lunar-insertion') {
      const moon = engine.getBody('lunar-target');
      if (moon) {
        // Lunar target capture circular parking orbit ring (r = 40 AU)
        ctx.save();
        ctx.translate(moon.position.x, moon.position.y);
        ctx.beginPath();
        ctx.arc(0, 0, 40, 0, Math.PI * 2);
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 1.6;
        ctx.setLineDash([6, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Capture corridor tolerance envelope (r = 75 AU)
        ctx.beginPath();
        ctx.arc(0, 0, 75, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.22)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = '600 9px "JetBrains Mono", monospace';
        ctx.fillStyle = '#00e5ff';
        ctx.textAlign = 'center';
        ctx.fillText('TARGET PARKING ORBIT [40 AU]', 0, -46);
        ctx.restore();

        // Telemetry range vector line
        if (probe) {
          ctx.beginPath();
          ctx.moveTo(probe.position.x, probe.position.y);
          ctx.lineTo(moon.position.x, moon.position.y);
          ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    } else if (mission.id === 'jupiter-slingshot') {
      const jupiter = engine.getBody('jupiter-primary');
      if (jupiter) {
        ctx.save();
        ctx.translate(jupiter.position.x, jupiter.position.y);

        // Atmosphere hazard boundary (r = 40 AU)
        const pulse = 0.55 + 0.35 * Math.sin(timestamp * 0.005);
        ctx.beginPath();
        ctx.arc(0, 0, 40, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(239, 68, 68, ${pulse.toFixed(2)})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Slingshot corridor boundary (r = 120 AU)
        ctx.beginPath();
        ctx.arc(0, 0, 120, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Solar escape threshold indicator (r = 700 AU)
        ctx.beginPath();
        ctx.arc(0, 0, 700, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
        ctx.lineWidth = 1.6;
        ctx.setLineDash([8, 8]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = '600 9px "JetBrains Mono", monospace';
        ctx.fillStyle = '#ef4444';
        ctx.textAlign = 'center';
        ctx.fillText('⚠ ATMOSPHERIC INCINERATION (R <= 40 AU)', 0, -45);
        ctx.fillStyle = '#10b981';
        ctx.fillText('✓ SOLAR ESCAPE PERIMETER (R > 700 AU)', 0, -706);
        ctx.restore();
      }
    } else if (mission.id === 'event-horizon-slalom') {
      const bhA = engine.getBody('bh-alpha');
      const bhB = engine.getBody('bh-beta');

      [bhA, bhB].forEach((bh) => {
        if (!bh) return;
        const photonR = bh.radius * 1.5;
        const pulse = 0.55 + 0.35 * Math.sin(timestamp * 0.006 + (bh.id === 'bh-alpha' ? 0 : 2));

        ctx.save();
        ctx.translate(bh.position.x, bh.position.y);
        ctx.beginPath();
        ctx.arc(0, 0, photonR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(239, 68, 68, ${pulse.toFixed(2)})`;
        ctx.lineWidth = 2.2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = '600 9px "JetBrains Mono", monospace';
        ctx.fillStyle = '#ef4444';
        ctx.textAlign = 'center';
        ctx.fillText('⚠ PHOTON SPHERE (1.5 rs)', 0, photonR + 14);
        ctx.restore();
      });

      // Extraction Gateway boundary at x = 400
      ctx.beginPath();
      ctx.moveTo(400, -280);
      ctx.lineTo(400, 280);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([10, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.fillStyle = '#10b981';
      ctx.textAlign = 'left';
      ctx.fillText('▶ EXTRACTION GATEWAY (X > 400)', 412, 0);
    }

    ctx.restore();
  }

  renderHabitableZones(ctx, engine, timestamp = 0) {
    const bodies = engine.getBodies();
    const stars = bodies.filter(b => b.type === 'star' || b.type === 'pulsar');
    if (stars.length === 0) return;

    ctx.save();
    for (const star of stars) {
      const zone = calculateCircumstellarHabitableZone(star);
      if (!zone || zone.rInner <= 0 || zone.rOuter <= zone.rInner) continue;

      ctx.save();
      ctx.translate(star.position.x, star.position.y);

      const pulse = 0.88 + 0.12 * Math.sin(timestamp * 0.0015);

      // 1. Annular Green Goldilocks Zone Band Fill
      ctx.beginPath();
      ctx.arc(0, 0, zone.rOuter, 0, Math.PI * 2, false);
      ctx.arc(0, 0, zone.rInner, 0, Math.PI * 2, true);
      ctx.closePath();

      const grad = ctx.createRadialGradient(0, 0, zone.rInner, 0, 0, zone.rOuter);
      grad.addColorStop(0, `rgba(245, 158, 11, ${(0.04 * pulse).toFixed(3)})`); // inner warm boundary
      grad.addColorStop(0.2, `rgba(16, 185, 129, ${(0.09 * pulse).toFixed(3)})`);
      grad.addColorStop(0.6, `rgba(52, 211, 153, ${(0.14 * pulse).toFixed(3)})`);
      grad.addColorStop(1, `rgba(56, 189, 248, ${(0.04 * pulse).toFixed(3)})`); // outer cold boundary
      ctx.fillStyle = grad;
      ctx.fill();

      // 2. Inner Boundary (Runaway Greenhouse Limit)
      ctx.beginPath();
      ctx.arc(0, 0, zone.rInner, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
      ctx.lineWidth = 1.4;
      ctx.setLineDash([5, 5]);
      ctx.stroke();

      // 3. Outer Boundary (Maximum Greenhouse Limit)
      ctx.beginPath();
      ctx.arc(0, 0, zone.rOuter, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 1.4;
      ctx.setLineDash([5, 5]);
      ctx.stroke();

      // 4. Optimum Habitable Orbit Midline (Dashed Emerald)
      const rMid = (zone.rInner + zone.rOuter) * 0.5;
      ctx.beginPath();
      ctx.arc(0, 0, rMid, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
      ctx.lineWidth = 1.0;
      ctx.setLineDash([2, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // 5. Zone Annotations & Scientific Telemetry
      if (this.options.showLabels !== false) {
        ctx.font = '600 8.5px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';

        const drawZoneBadge = (text, x, y, textColor, borderColor) => {
          const metrics = ctx.measureText(text);
          const w = metrics.width;
          const padX = 5;
          const padY = 2;
          const h = 10;
          const bx = x - 2;
          const by = y - h + 1;
          const bw = w + padX * 2;
          const bh = h + padY * 2;

          ctx.save();
          ctx.fillStyle = 'rgba(8, 14, 26, 0.82)';
          ctx.strokeStyle = borderColor;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 3);
          else ctx.rect(bx, by, bw, bh);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = textColor;
          ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
          ctx.shadowBlur = 2;
          ctx.fillText(text, x + padX - 2, y);
          ctx.restore();
        };

        // Inner limit annotation
        drawZoneBadge(`◬ RUNAWAY GREENHOUSE LIMIT (${Math.round(zone.rInner)} AU)`, zone.rInner + 6, -6, 'rgba(245, 158, 11, 0.95)', 'rgba(245, 158, 11, 0.35)');

        // Goldilocks zone annotation
        drawZoneBadge(`★ CIRCUMSTELLAR HABITABLE ZONE (${Math.round(rMid)} AU)`, rMid + 6, 8, 'rgba(52, 211, 153, 0.95)', 'rgba(52, 211, 153, 0.35)');

        // Outer limit annotation
        drawZoneBadge(`❄ MAXIMUM GREENHOUSE LIMIT (${Math.round(zone.rOuter)} AU)`, zone.rOuter + 6, -6, 'rgba(56, 189, 248, 0.95)', 'rgba(56, 189, 248, 0.35)');
      }

      ctx.restore();
    }
    ctx.restore();
  }

  renderSpacecraftTrajectory(ctx, engine, spacecraftController, timestamp = 0) {
    if (!spacecraftController || !spacecraftController.body) return;

    const trajectory = spacecraftController.calculateTrajectoryPath({ steps: 320, dt: 0.15 });
    if (!trajectory || !trajectory.points || trajectory.points.length < 2) return;

    const points = trajectory.points;
    const body = spacecraftController.body;

    ctx.save();

    // 1. Draw Multi-Segment Forward Predictive Trajectory Path
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 2.0;

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const frac = i / points.length;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);

      // Gradient fade along path: bright cyan at start, emerald mid, fading blue at end
      const alpha = Math.max(0.1, 0.9 - frac * 0.75);
      if (frac < 0.4) {
        ctx.strokeStyle = `rgba(0, 229, 255, ${alpha.toFixed(2)})`;
      } else if (frac < 0.75) {
        ctx.strokeStyle = `rgba(16, 185, 129, ${alpha.toFixed(2)})`;
      } else {
        ctx.strokeStyle = `rgba(56, 189, 248, ${alpha.toFixed(2)})`;
      }
      ctx.stroke();

      // Draw forward motion time markers every 30 steps
      if (i > 0 && i % 30 === 0) {
        ctx.save();
        ctx.translate(p1.x, p1.y);
        ctx.beginPath();
        ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = '#00e5ff';
        ctx.globalAlpha = alpha;
        ctx.fill();

        ctx.font = '600 7.5px "JetBrains Mono", monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'left';
        ctx.fillText(`+${Math.round(p1.time)}s`, 5, 2.5);
        ctx.restore();
      }
    }
    ctx.setLineDash([]);

    // 2. Gravitational Slingshot Periapsis & Flyby Encounter Reticle
    if (trajectory.closestApproach) {
      const ca = trajectory.closestApproach;
      const pulse = 0.65 + 0.35 * Math.sin(timestamp * 0.008);

      ctx.save();
      ctx.translate(ca.position.x, ca.position.y);

      // Periapsis Diamond Marker
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(9, 0);
      ctx.lineTo(0, 9);
      ctx.lineTo(-9, 0);
      ctx.closePath();
      ctx.strokeStyle = `rgba(16, 185, 129, ${pulse.toFixed(2)})`;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Radiating ring around encounter
      ctx.beginPath();
      ctx.arc(0, 0, 14 + 4 * Math.sin(timestamp * 0.005), 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
      ctx.lineWidth = 1.0;
      ctx.stroke();

      // Slingshot callout bracket & text badge
      ctx.beginPath();
      ctx.moveTo(10, -4);
      ctx.lineTo(24, -14);
      ctx.lineTo(135, -14);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = 'rgba(8, 12, 22, 0.85)';
      ctx.fillRect(24, -28, 130, 28);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.strokeRect(24, -28, 130, 28);

      ctx.font = '700 8.5px "JetBrains Mono", monospace';
      ctx.fillStyle = '#10b981';
      ctx.textAlign = 'left';
      ctx.fillText(`PERIAPSIS: ${ca.bodyName.toUpperCase()}`, 28, -17);

      ctx.font = '600 8px "JetBrains Mono", monospace';
      if (trajectory.slingshotBoost > 0.05) {
        ctx.fillStyle = '#00e5ff';
        ctx.fillText(`⚡ ASSIST: +${trajectory.slingshotBoost.toFixed(2)} AU/s`, 28, -6);
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`R: ${Math.round(ca.distance)} AU | ${Math.round(ca.speedAtPeriapsis)} AU/s`, 28, -6);
      }

      ctx.restore();
    }

    // 3. Spacecraft Flight Heading & Velocity Vector Arrow
    const vel = body.velocity;
    const speed = vel.mag();
    if (speed > 0.1) {
      const vScale = Math.min(60, speed * 2.5);
      const vx = (vel.x / speed) * vScale;
      const vy = (vel.y / speed) * vScale;

      ctx.save();
      ctx.translate(body.position.x, body.position.y);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(vx, vy);
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Arrow head
      const headLen = 6;
      const angle = Math.atan2(vy, vx);
      ctx.beginPath();
      ctx.moveTo(vx, vy);
      ctx.lineTo(vx - headLen * Math.cos(angle - Math.PI / 6), vy - headLen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(vx - headLen * Math.cos(angle + Math.PI / 6), vy - headLen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fillStyle = '#00e5ff';
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }
}

