import { Vector2D } from './physics.js';
import { evaluatePlanetaryAtmosphere, findPrimaryStar } from './habitable.js';

/**
 * CelestialBodyRenderer - specialized canvas rendering for cosmic bodies
 */
export class CelestialBodyRenderer {
  static render(ctx, body, time = 0, options = {}) {
    const { x, y } = body.position;
    const r = Math.max(1, body.radius);

    // 1. Draw orbital trail
    if (options.showTrails !== false && body.trail && body.trail.length > 1) {
      this.renderTrail(ctx, body);
    }

    // 2. Draw body according to type
    ctx.save();
    ctx.translate(x, y);

    switch (body.type) {
      case 'black-hole':
        this.renderBlackHole(ctx, r, time);
        break;
      case 'pulsar':
        this.renderPulsar(ctx, body, r, time);
        break;
      case 'star':
        this.renderStar(ctx, body, r, time);
        break;
      case 'planet':
        this.renderPlanet(ctx, body, r, time, options);
        break;
      case 'spacecraft':
        this.renderSpacecraft(ctx, body, r, time);
        break;
      case 'moon':
        this.renderMoon(ctx, body, r);
        break;
      case 'debris':
      default:
        this.renderDebris(ctx, body, r);
        break;
    }

    // 3. Optional selection ring / name tag
    if (body.isSelected) {
      this.renderSelection(ctx, r);
    }

    if (options.showLabels && body.name && (body.type !== 'debris' || body.isSelected)) {
      this.renderLabel(ctx, body, r);
    }

    ctx.restore();
  }

  static renderTrail(ctx, body) {
    const trail = body.trail;
    if (trail.length < 2) return;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(trail[0].x, trail[0].y);

    for (let i = 1; i < trail.length; i++) {
      ctx.lineTo(trail[i].x, trail[i].y);
    }

    ctx.strokeStyle = body.color || '#4fa3e3';
    ctx.lineWidth = Math.min(2.5, Math.max(0.8, body.radius * 0.2));
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.45;
    ctx.stroke();
    ctx.restore();
  }

  static renderBlackHole(ctx, r, time = 0) {
    // A. Outer Gravitational Lensing & Spacetime Distortion Glow
    const lensRadius = r * 3.8;
    const lensGrad = ctx.createRadialGradient(0, 0, r * 1.3, 0, 0, lensRadius);
    lensGrad.addColorStop(0, 'rgba(125, 211, 252, 0.35)');
    lensGrad.addColorStop(0.35, 'rgba(168, 85, 247, 0.18)');
    lensGrad.addColorStop(0.7, 'rgba(56, 189, 248, 0.06)');
    lensGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.beginPath();
    ctx.arc(0, 0, lensRadius, 0, Math.PI * 2);
    ctx.fillStyle = lensGrad;
    ctx.fill();

    // B. Relativistic Gravitational Lensing (Interstellar-style Upper & Lower Warped Disk Arcs)
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.35, r * 1.85, r * 1.15, 0, Math.PI, 0);
    ctx.strokeStyle = 'rgba(254, 215, 170, 0.45)';
    ctx.lineWidth = r * 0.28;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(0, r * 0.35, r * 1.75, r * 0.95, 0, 0, Math.PI);
    ctx.strokeStyle = 'rgba(251, 146, 60, 0.25)';
    ctx.lineWidth = r * 0.2;
    ctx.stroke();
    ctx.restore();

    // C. Differential Keplerian Accretion Disk with Doppler Beaming & Spiral Density Waves
    ctx.save();
    ctx.rotate(0.32); // Accretion disk orbital plane tilt
    const diskRMax = r * 3.0;
    const diskRMin = r * 1.25;

    // 1. Background Base Disk Annulus with Doppler Beaming Gradient
    const diskGrad = ctx.createLinearGradient(-diskRMax, 0, diskRMax, 0);
    diskGrad.addColorStop(0, 'rgba(224, 242, 254, 0.95)');   // Approaching: extreme relativistic blue beaming
    diskGrad.addColorStop(0.25, 'rgba(253, 224, 71, 0.85)'); // Hot Keplerian gas
    diskGrad.addColorStop(0.55, 'rgba(249, 115, 22, 0.7)');  // Transition
    diskGrad.addColorStop(0.8, 'rgba(225, 29, 72, 0.4)');    // Redshift
    diskGrad.addColorStop(1, 'rgba(136, 19, 55, 0.15)');     // Receding: dim & redshifted

    ctx.beginPath();
    ctx.ellipse(0, 0, diskRMax, diskRMax * 0.42, 0, 0, Math.PI * 2);
    ctx.strokeStyle = diskGrad;
    ctx.lineWidth = (diskRMax - diskRMin) * 0.65;
    ctx.stroke();

    // 2. Differential Keplerian Shearing Rings (Inner orbits rotate much faster than outer: v ~ r^-0.5, Omega ~ r^-1.5)
    const numAnnuli = 6;
    for (let a = 0; a < numAnnuli; a++) {
      const ringFraction = a / (numAnnuli - 1);
      const ringR = diskRMin + ringFraction * (diskRMax - diskRMin);
      // Keplerian angular velocity Omega ~ r^-1.5
      const keplerOmega = 0.0028 * Math.pow(diskRMin / ringR, 1.5);

      // Logarithmic Spiral Density Wave perturbation
      const spiralOffset = Math.log(ringR / diskRMin) * 2.2;
      const ringAngle = time * keplerOmega + spiralOffset;

      const numGasKnots = 4;
      for (let k = 0; k < numGasKnots; k++) {
        const knotAngle = ringAngle + (k / numGasKnots) * Math.PI * 2;
        const kx = Math.cos(knotAngle) * ringR;
        const ky = Math.sin(knotAngle) * (ringR * 0.42);

        // Doppler boosting factor: approaching side (negative x) is intensely bright
        const dopplerFlux = Math.max(0.15, 1.0 - (kx / diskRMax) * 0.85);

        ctx.beginPath();
        const knotRadius = Math.max(1.2, r * (0.09 - ringFraction * 0.04));
        ctx.arc(kx, ky, knotRadius, 0, Math.PI * 2);

        // Color shifts from brilliant white/cyan on left to deep amber/crimson on right
        if (kx < 0) {
          ctx.fillStyle = `rgba(255, 255, 255, ${(0.85 * dopplerFlux).toFixed(2)})`;
        } else {
          ctx.fillStyle = `rgba(249, 115, 22, ${(0.55 * dopplerFlux).toFixed(2)})`;
        }
        ctx.fill();
      }
    }
    ctx.restore();

    // D. Relativistic Photon Ring (Instability radius: r_ph = 1.5 * r_s in Schwarzschild metric)
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.12, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.lineWidth = Math.max(1.5, r * 0.08);
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // E. Event Horizon (Pure Absolute Black Void: r_s)
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();
  }

  static renderStar(ctx, body, r, time) {
    const starColor = body.color || '#ffcc33';

    // 1. Pass 1: Vast Outer Radiant Bloom
    const outerBloom = r * 4.2;
    const bloomGrad = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, outerBloom);
    bloomGrad.addColorStop(0, `${starColor}66`);
    bloomGrad.addColorStop(0.3, `${starColor}28`);
    bloomGrad.addColorStop(0.7, `${starColor}08`);
    bloomGrad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.beginPath();
    ctx.arc(0, 0, outerBloom, 0, Math.PI * 2);
    ctx.fillStyle = bloomGrad;
    ctx.fill();

    // 2. Pass 2: Convective Mantle Corona Glow
    const coronaRadius = r * 2.2;
    const coronaGrad = ctx.createRadialGradient(0, 0, r * 0.8, 0, 0, coronaRadius);
    coronaGrad.addColorStop(0, '#ffffff');
    coronaGrad.addColorStop(0.2, starColor);
    coronaGrad.addColorStop(0.65, `${starColor}55`);
    coronaGrad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.beginPath();
    ctx.arc(0, 0, coronaRadius, 0, Math.PI * 2);
    ctx.fillStyle = coronaGrad;
    ctx.fill();

    // 3. Pass 3: Dynamic Coronal Prominence Arcs & Solar Flares
    const flares = 8;
    for (let i = 0; i < flares; i++) {
      const angle = (i / flares) * Math.PI * 2 + time * 0.0004;
      const pulse = Math.sin(time * 0.0025 + i * 1.3);
      const flareLen = r * (1.35 + pulse * 0.25);
      const fx = Math.cos(angle) * flareLen;
      const fy = Math.sin(angle) * flareLen;

      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * r * 0.8, Math.sin(angle) * r * 0.8);
      ctx.lineTo(fx, fy);
      ctx.strokeStyle = `rgba(255, 245, 210, ${(0.3 + pulse * 0.15).toFixed(2)})`;
      ctx.lineWidth = Math.max(1.2, r * 0.16);
      ctx.stroke();
    }

    // 4. Pass 4: Blinding White-Hot Fusion Core
    const coreGrad = ctx.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.05, 0, 0, r);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.4, '#fff6d6');
    coreGrad.addColorStop(0.75, starColor);
    coreGrad.addColorStop(1, '#ff4400');

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = coreGrad;
    ctx.shadowColor = starColor;
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  static renderPlanet(ctx, body, r, time = 0, options = {}) {
    const bodies = options.bodies || [];
    const climate = evaluatePlanetaryAtmosphere(body, bodies);
    const star = findPrimaryStar(body, bodies);

    // 1. Circumstellar Habitable Zone: Liquid Oceans & Rotating Clouds
    if (climate && climate.state === 'habitable-terrestrial') {
      this.renderHabitableTerrestrialPlanet(ctx, body, r, time, star);
      return;
    }

    // 2. Runaway Greenhouse Limit: Scorched Venusian Atmosphere
    if (climate && climate.state === 'scorched-runaway') {
      this.renderScorchedRunawayPlanet(ctx, body, r, time, star);
      return;
    }

    // 3. Beyond Maximum Greenhouse Limit: Cryogenic Glaciated Ice World
    if (climate && climate.state === 'cryogenic-ice') {
      this.renderCryogenicIcePlanet(ctx, body, r, time, star);
      return;
    }

    // 4. Standard Planetary Renderer (Gas Giants or unclassified planets)
    const baseColor = body.color || '#3388ee';

    // Outer Exosphere Rayleigh Scattering Limb Glow
    const exoRadius = r * 1.42;
    const exoGrad = ctx.createRadialGradient(0, 0, r * 0.95, 0, 0, exoRadius);
    exoGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
    exoGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.15)');
    exoGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.beginPath();
    ctx.arc(0, 0, exoRadius, 0, Math.PI * 2);
    ctx.fillStyle = exoGrad;
    ctx.fill();

    // Inner Troposphere Atmospheric Layer
    const tropoRadius = r * 1.15;
    const tropoGrad = ctx.createRadialGradient(0, 0, r * 0.85, 0, 0, tropoRadius);
    tropoGrad.addColorStop(0, `${baseColor}66`);
    tropoGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.beginPath();
    ctx.arc(0, 0, tropoRadius, 0, Math.PI * 2);
    ctx.fillStyle = tropoGrad;
    ctx.fill();

    // 3D Spherical Surface with Directional Daylight & Terminator Shadow
    const sphereGrad = ctx.createRadialGradient(-r * 0.38, -r * 0.38, r * 0.08, 0, 0, r);
    sphereGrad.addColorStop(0, '#ffffff');
    sphereGrad.addColorStop(0.25, baseColor);
    sphereGrad.addColorStop(0.7, baseColor);
    sphereGrad.addColorStop(1, '#050c1a');

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = sphereGrad;
    ctx.fill();

    // Subtle Nightside Rim Light
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = Math.max(0.8, r * 0.08);
    ctx.stroke();

    // Planetary Rings (if present, e.g. Saturn)
    if (body.hasRings) {
      ctx.save();
      ctx.rotate(0.4);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 2.4, r * 0.58, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(226, 205, 160, 0.7)';
      ctx.lineWidth = r * 0.45;
      ctx.stroke();
      ctx.restore();
    }
  }

  static renderHabitableTerrestrialPlanet(ctx, body, r, time = 0, star = null) {
    // Determine directional sunlight vector from primary star
    let sunAngle = -Math.PI / 4;
    if (star) {
      sunAngle = Math.atan2(star.position.y - body.position.y, star.position.x - body.position.x);
    }
    const sunCos = Math.cos(sunAngle);
    const sunSin = Math.sin(sunAngle);

    // 1. Rayleigh Scattering Atmospheric Limb Glow (Nitrogen/Oxygen Blue Fringe)
    const exoRadius = r * 1.48;
    const exoGrad = ctx.createRadialGradient(sunCos * r * 0.3, sunSin * r * 0.3, r * 0.9, 0, 0, exoRadius);
    exoGrad.addColorStop(0, 'rgba(56, 189, 248, 0.6)');
    exoGrad.addColorStop(0.4, 'rgba(14, 165, 233, 0.25)');
    exoGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.beginPath();
    ctx.arc(0, 0, exoRadius, 0, Math.PI * 2);
    ctx.fillStyle = exoGrad;
    ctx.fill();

    // 2. Liquid Ocean Base Surface (Clipped to planetary sphere)
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    const oceanGrad = ctx.createRadialGradient(sunCos * r * 0.4, sunSin * r * 0.4, r * 0.08, 0, 0, r);
    oceanGrad.addColorStop(0, '#38bdf8'); // Shallow turquoise shores
    oceanGrad.addColorStop(0.3, '#0284c7'); // Azure deep sea
    oceanGrad.addColorStop(0.7, '#0369a1'); // Abyssal navy
    oceanGrad.addColorStop(1, '#051329'); // Deep terminator nightside
    ctx.fillStyle = oceanGrad;
    ctx.fill();
    ctx.clip(); // Clip continents & clouds inside planet disk

    // 3. Procedural Fractal Continental Landmasses (Lush Emerald & Forest Biomes)
    const numContinents = 5;
    const rotation = (time * 0.00018) % (Math.PI * 2);

    for (let i = 0; i < numContinents; i++) {
      const baseAngle = (i / numContinents) * Math.PI * 2 + rotation;
      const cDist = r * (0.32 + (i % 3) * 0.16);
      const cx = Math.cos(baseAngle) * cDist;
      const cy = Math.sin(baseAngle) * (cDist * 0.7);
      const cRadius = r * (0.36 + (i % 2) * 0.14);

      // Continent body (Lush green biomes)
      ctx.beginPath();
      ctx.ellipse(cx, cy, cRadius, cRadius * 0.62, baseAngle * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? '#15803d' : '#166534';
      ctx.fill();

      // Golden coastline sandy margins
      ctx.strokeStyle = 'rgba(253, 230, 138, 0.45)';
      ctx.lineWidth = Math.max(0.6, r * 0.06);
      ctx.stroke();

      // Mountainous plateau highlands
      ctx.beginPath();
      ctx.arc(cx, cy, cRadius * 0.32, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(120, 113, 108, 0.55)';
      ctx.fill();
    }

    // 4. Specular Sunlight Ocean Glint (Glistening water reflection facing star)
    const glintX = sunCos * (r * 0.38);
    const glintY = sunSin * (r * 0.38);
    const glintGrad = ctx.createRadialGradient(glintX, glintY, 0, glintX, glintY, r * 0.32);
    glintGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
    glintGrad.addColorStop(0.35, 'rgba(186, 230, 253, 0.45)');
    glintGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.beginPath();
    ctx.arc(glintX, glintY, r * 0.32, 0, Math.PI * 2);
    ctx.fillStyle = glintGrad;
    ctx.fill();

    // 5. Dynamic Rotating Cloud Swirls & Cyclone Systems
    const cloudRotation = (time * 0.00035) % (Math.PI * 2);
    const numClouds = 6;
    for (let c = 0; c < numClouds; c++) {
      const cloudAngle = (c / numClouds) * Math.PI * 2 + cloudRotation;
      const clX = Math.cos(cloudAngle) * (r * 0.52);
      const clY = Math.sin(cloudAngle) * (r * 0.42);
      const clW = r * (0.45 + (c % 3) * 0.18);
      const clH = r * (0.18 + (c % 2) * 0.09);

      ctx.beginPath();
      ctx.ellipse(clX, clY, clW, clH, cloudAngle * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fill();

      // Dense cloud core
      ctx.beginPath();
      ctx.ellipse(clX, clY, clW * 0.55, clH * 0.5, cloudAngle * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
      ctx.fill();
    }

    // 6. Day/Night Planetary Terminator Shadow
    const shadowGrad = ctx.createLinearGradient(sunCos * r, sunSin * r, -sunCos * r, -sunSin * r);
    shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    shadowGrad.addColorStop(0.46, 'rgba(2, 6, 23, 0.08)');
    shadowGrad.addColorStop(0.72, 'rgba(2, 6, 23, 0.75)');
    shadowGrad.addColorStop(1, 'rgba(2, 6, 23, 0.96)');

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = shadowGrad;
    ctx.fill();
    ctx.restore(); // End clipping

    // 7. Twilight Crepuscular Atmospheric Halo
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
    ctx.lineWidth = Math.max(0.8, r * 0.08);
    ctx.stroke();
  }

  static renderScorchedRunawayPlanet(ctx, body, r, time = 0, star = null) {
    let sunAngle = -Math.PI / 4;
    if (star) {
      sunAngle = Math.atan2(star.position.y - body.position.y, star.position.x - body.position.x);
    }
    const sunCos = Math.cos(sunAngle);
    const sunSin = Math.sin(sunAngle);

    // Dense Venusian Sulfuric Haze Envelope
    const hazeR = r * 1.38;
    const hazeGrad = ctx.createRadialGradient(sunCos * r * 0.3, sunSin * r * 0.3, r * 0.8, 0, 0, hazeR);
    hazeGrad.addColorStop(0, 'rgba(245, 158, 11, 0.65)');
    hazeGrad.addColorStop(0.6, 'rgba(217, 119, 6, 0.25)');
    hazeGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.beginPath();
    ctx.arc(0, 0, hazeR, 0, Math.PI * 2);
    ctx.fillStyle = hazeGrad;
    ctx.fill();

    // Scorched Surface & Opaque Sulfuric Cloud Bands
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    const surfGrad = ctx.createRadialGradient(sunCos * r * 0.4, sunSin * r * 0.4, r * 0.1, 0, 0, r);
    surfGrad.addColorStop(0, '#fef08a'); // Superheated yellow
    surfGrad.addColorStop(0.35, '#f59e0b');
    surfGrad.addColorStop(0.7, '#b45309');
    surfGrad.addColorStop(1, '#451a03'); // Dark basalt
    ctx.fillStyle = surfGrad;
    ctx.fill();
    ctx.clip();

    // Sulfuric cloud stream bands
    const cloudRotation = (time * 0.0004) % (Math.PI * 2);
    for (let b = -2; b <= 2; b++) {
      const by = b * (r * 0.32);
      ctx.beginPath();
      ctx.ellipse(Math.cos(cloudRotation + b) * 4, by, r * 1.1, r * 0.18, 0.08, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(253, 224, 71, 0.35)';
      ctx.fill();
    }
    ctx.restore();
  }

  static renderCryogenicIcePlanet(ctx, body, r, time = 0, star = null) {
    let sunAngle = -Math.PI / 4;
    if (star) {
      sunAngle = Math.atan2(star.position.y - body.position.y, star.position.x - body.position.x);
    }
    const sunCos = Math.cos(sunAngle);
    const sunSin = Math.sin(sunAngle);

    // Subtle Frost Crystal Limb Glow
    const frostR = r * 1.25;
    const frostGrad = ctx.createRadialGradient(0, 0, r * 0.9, 0, 0, frostR);
    frostGrad.addColorStop(0, 'rgba(186, 230, 253, 0.45)');
    frostGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.beginPath();
    ctx.arc(0, 0, frostR, 0, Math.PI * 2);
    ctx.fillStyle = frostGrad;
    ctx.fill();

    // Glaciated Ice Sheets & Nitrogen/Water Frost
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    const iceGrad = ctx.createRadialGradient(sunCos * r * 0.35, sunSin * r * 0.35, r * 0.1, 0, 0, r);
    iceGrad.addColorStop(0, '#ffffff'); // Glacial white
    iceGrad.addColorStop(0.3, '#e0f2fe');
    iceGrad.addColorStop(0.7, '#7dd3fc');
    iceGrad.addColorStop(1, '#0c2e59'); // Deep frost nightside
    ctx.fillStyle = iceGrad;
    ctx.fill();
    ctx.clip();

    // Glacial rift crevasses
    ctx.strokeStyle = 'rgba(2, 132, 199, 0.45)';
    ctx.lineWidth = Math.max(0.7, r * 0.07);
    for (let c = 1; c <= 3; c++) {
      ctx.beginPath();
      ctx.arc(r * 0.2 * c, -r * 0.2 * c, r * 0.5, 0.4, 2.4);
      ctx.stroke();
    }
    ctx.restore();
  }

  static renderSpacecraft(ctx, body, r, time = 0) {
    ctx.save();
    // Orientation aligns with instantaneous velocity vector
    const speed = body.velocity ? Math.hypot(body.velocity.x, body.velocity.y) : 0;
    if (speed > 0.05) {
      const angle = Math.atan2(body.velocity.y, body.velocity.x);
      ctx.rotate(angle);
    }

    const s = Math.max(4.0, r);

    // 1. Blue Photovoltaic Solar Array Wings
    ctx.fillStyle = '#0284c7';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 0.8;

    // Port wing
    ctx.fillRect(-s * 0.35, -s * 2.2, s * 0.7, s * 1.5);
    ctx.strokeRect(-s * 0.35, -s * 2.2, s * 0.7, s * 1.5);

    // Starboard wing
    ctx.fillRect(-s * 0.35, s * 0.7, s * 0.7, s * 1.5);
    ctx.strokeRect(-s * 0.35, s * 0.7, s * 0.7, s * 1.5);

    // Solar grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -s * 2.2); ctx.lineTo(0, -s * 0.7);
    ctx.moveTo(0, s * 0.7); ctx.lineTo(0, s * 2.2);
    ctx.stroke();

    // 2. Titanium Avionics Body
    const busGrad = ctx.createLinearGradient(-s, -s * 0.6, s, s * 0.6);
    busGrad.addColorStop(0, '#f8fafc');
    busGrad.addColorStop(0.5, '#94a3b8');
    busGrad.addColorStop(1, '#334155');

    ctx.beginPath();
    ctx.moveTo(s * 1.3, 0); // Nose
    ctx.lineTo(s * 0.4, -s * 0.65);
    ctx.lineTo(-s * 0.75, -s * 0.65);
    ctx.lineTo(-s * 1.0, 0);
    ctx.lineTo(-s * 0.75, s * 0.65);
    ctx.lineTo(s * 0.4, s * 0.65);
    ctx.closePath();
    ctx.fillStyle = busGrad;
    ctx.fill();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 3. High-Gain Communications Dish
    ctx.beginPath();
    ctx.arc(s * 0.25, 0, s * 0.42, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.3;
    ctx.stroke();

    // 4. Status Beacon LED
    const beacon = 0.5 + 0.5 * Math.sin(time * 0.008);
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(1.2, s * 0.22), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 229, 255, ${beacon.toFixed(2)})`;
    ctx.fill();

    // 5. Thruster Nozzle
    ctx.beginPath();
    ctx.arc(-s * 0.95, 0, s * 0.3, Math.PI * 0.5, -Math.PI * 0.5);
    ctx.fillStyle = '#1e293b';
    ctx.fill();

    ctx.restore();
  }

  static renderMoon(ctx, body, r) {
    const moonGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
    moonGrad.addColorStop(0, '#e0e0e0');
    moonGrad.addColorStop(0.6, body.color || '#9e9e9e');
    moonGrad.addColorStop(1, '#2c2c2c');

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = moonGrad;
    ctx.fill();
  }

  static renderPulsar(ctx, body, r, time = 0) {
    const spinPeriod = body.spinPeriod || 0.8;
    const spinSpeed = (Math.PI * 2) / (spinPeriod * 1000);
    const currentAngle = (time * spinSpeed) % (Math.PI * 2);

    ctx.save();

    // 1. Dual Sweeping Synchrotron Radiation Jets (Opposite poles)
    const jetLength = 340;
    const jetSpread = 0.20; // half-angle of cone
    const poles = [currentAngle, currentAngle + Math.PI];

    for (let p = 0; p < 2; p++) {
      const angle = poles[p];
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      const leftAngle = angle - jetSpread;
      const rightAngle = angle + jetSpread;
      const lx = Math.cos(leftAngle) * jetLength;
      const ly = Math.sin(leftAngle) * jetLength;

      // Radial synchrotron beam gradient
      const jetGrad = ctx.createRadialGradient(0, 0, r * 0.5, cosA * jetLength * 0.5, sinA * jetLength * 0.5, jetLength);
      jetGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      jetGrad.addColorStop(0.15, 'rgba(0, 229, 255, 0.75)');
      jetGrad.addColorStop(0.45, 'rgba(168, 85, 247, 0.35)');
      jetGrad.addColorStop(0.8, 'rgba(236, 72, 153, 0.1)');
      jetGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(lx, ly);
      ctx.arc(0, 0, jetLength, leftAngle, rightAngle);
      ctx.closePath();
      ctx.fillStyle = jetGrad;
      ctx.fill();

      // Intense central beam filament
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(cosA * jetLength * 1.15, sinA * jetLength * 1.15);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = Math.max(1.5, r * 0.3);
      ctx.stroke();

      // Relativistic stream sparks along the jet
      for (let s = 1; s <= 5; s++) {
        const sDist = (jetLength * (s / 6) + (time * 0.15) % (jetLength / 6));
        const px = cosA * sDist + (Math.sin(time * 0.02 + s) * 4);
        const py = sinA * sDist + (Math.cos(time * 0.02 + s) * 4);
        ctx.beginPath();
        ctx.arc(px, py, Math.max(1, 2.5 * (1 - sDist / jetLength)), 0, Math.PI * 2);
        ctx.fillStyle = s % 2 === 0 ? '#00e5ff' : '#ec4899';
        ctx.fill();
      }
    }

    // 2. Magnetic Dipole Field Lines
    ctx.save();
    ctx.rotate(currentAngle + Math.PI / 2);
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.22)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);

    for (let m = 1; m <= 3; m++) {
      const magR = r * (1.8 + m * 0.9);
      ctx.beginPath();
      ctx.ellipse(0, 0, magR, magR * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // 3. Ultra-Dense Neutron Star Core & Relativistic Glow
    const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2.8);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.3, '#00e5ff');
    coreGrad.addColorStop(0.65, '#a855f7');
    coreGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');

    ctx.beginPath();
    ctx.arc(0, 0, r * 2.8, 0, Math.PI * 2);
    ctx.fillStyle = coreGrad;
    ctx.fill();

    // Hard surface core
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 18;
    ctx.fill();

    // 4. Periodic Lighthouse Flash
    const flashPhase = Math.abs(Math.cos(currentAngle));
    if (flashPhase > 0.92) {
      const intensity = (flashPhase - 0.92) / 0.08;
      ctx.beginPath();
      ctx.arc(0, 0, r * (3 + intensity * 4), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.55})`;
      ctx.fill();
    }

    ctx.restore();
  }

  static renderDebris(ctx, body, r) {
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(1.2, r), 0, Math.PI * 2);
    ctx.fillStyle = body.color || '#d4af37';
    ctx.fill();
  }

  static renderSelection(ctx, r) {
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.6 + 6, 0, Math.PI * 2);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  static renderLabel(ctx, body, r) {
    const text = body.name;
    ctx.save();
    ctx.font = '500 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';

    // Measure text width for micro-pill reticle backing
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const padX = 5;
    const padY = 2;
    const yPos = r + 13;

    // Dark semi-transparent pill backing
    ctx.fillStyle = 'rgba(6, 10, 20, 0.82)';
    ctx.strokeStyle = body.isSelected ? 'rgba(0, 229, 255, 0.45)' : 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    const bx = -textWidth / 2 - padX;
    const by = yPos - 9 - padY;
    const bw = textWidth + padX * 2;
    const bh = 11 + padY * 2;
    if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 3);
    else ctx.rect(bx, by, bw, bh);
    ctx.fill();
    ctx.stroke();

    // High-contrast label with subtle shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 3;
    ctx.fillStyle = body.isSelected ? '#00e5ff' : '#f1f5f9';
    ctx.fillText(text, 0, yPos);
    ctx.restore();
  }
}
