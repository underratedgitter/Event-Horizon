import { SimulationEngine } from './physics.js';
import { Renderer } from './renderer.js';
import { ParticleSystem } from './particles.js';
import { CosmicAudio } from './audio.js';
import { Presets } from './presets.js';
import { UIController } from './ui.js';
import { deserializeScenario } from './serialization.js';
import { MissionManager } from './missions.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('sandbox-canvas');
  if (!canvas) return;

  // Initialize Core Systems
  const engine = new SimulationEngine({
    G: 2.0,
    softening: 4.0,
    collisionsEnabled: true,
    rocheLimitEnabled: true,
  });

  const renderer = new Renderer(canvas);
  const particleSystem = new ParticleSystem();
  const audio = new CosmicAudio();
  const missionManager = new MissionManager({ engine });

  // Wire Physical Event Callbacks
  engine.onCollision = (larger, smaller, point) => {
    particleSystem.emitCollision(point.x, point.y, larger.color || '#ff9900', 35);
    particleSystem.emitShockwave(point.x, point.y, Math.min(300, (larger.radius + smaller.radius) * 12), larger.color || '#ff9900');
    audio.playCollisionSound(Math.min(5, (larger.mass + smaller.mass) / 50));
  };

  engine.onTidalDisruption = (massive, small) => {
    particleSystem.emitTidalDisruption(small.position.x, small.position.y, small.color || '#4fa3e3', 45);
    audio.playTidalSound();
  };

  engine.onSupernova = (star, blast) => {
    particleSystem.emitSupernovaBlast(blast.x, blast.y, blast.color);
    audio.playSupernovaSound();
    if (ui) ui.showToast(`💥 SUPERNOVA CORE-COLLAPSE: ${star.name} collapsed into ${star.type.toUpperCase()}`);
  };

  missionManager.onVictory = (mission) => {
    audio.playVictorySound();
    if (ui) ui.showMissionVictory(mission);
  };

  missionManager.onFailure = (mission, reason) => {
    audio.playFailureSound();
    if (ui) ui.showMissionFailure(mission, reason);
  };

  // Preset Switcher Handler
  const loadPreset = (presetKey) => {
    if (Presets[presetKey]) {
      missionManager.abortMission();
      if (ui) ui.hideMissionResult();
      Presets[presetKey](engine);
      particleSystem.clear();
      renderer.camera.x = 0;
      renderer.camera.y = 0;
      renderer.camera.targetBody = null;
      if (presetKey === 'solarSystem') renderer.camera.zoom = 1.0;
      else if (presetKey === 'galaxyCollision') renderer.camera.zoom = 0.85;
      else if (presetKey === 'blackHoleFeasting') renderer.camera.zoom = 1.1;
      else renderer.camera.zoom = 1.0;
      if (ui) {
        ui.despawnSpacecraft();
        ui.selectBody(null);
      }
    }
  };

  // Initialize UI Controller
  const ui = new UIController({
    engine,
    renderer,
    particleSystem,
    audio,
    presets: Presets,
    onPresetChange: loadPreset,
    missionManager,
  });

  // Expose global debug / E2E test handle
  window.__cosmicSandbox = { engine, renderer, particleSystem, audio, ui, missionManager };

  // Load Scenario from URL Hash or fallback to default
  const hash = window.location.hash;
  let loadedFromUrl = false;
  if (hash && (hash.includes('scenario=') || hash.includes('data='))) {
    const customState = deserializeScenario(hash);
    if (customState && customState.bodies && customState.bodies.length > 0) {
      engine.clear();
      engine.G = customState.G;
      engine.softening = customState.softening;
      for (const b of customState.bodies) {
        engine.addBody(b);
      }
      particleSystem.clear();
      renderer.camera.x = 0;
      renderer.camera.y = 0;
      renderer.camera.targetBody = null;
      renderer.camera.zoom = 1.0;
      ui.selectBody(null);
      ui.showToast('✓ Loaded shared scenario from URL');
      loadedFromUrl = true;
    }
  }

  if (!loadedFromUrl) {
    loadPreset('solarSystem');
  }

  // Simulation Loop Variables
  let lastTime = performance.now();
  let frameCount = 0;
  let fpsTimer = 0;
  let currentFps = 60;
  let trailTimer = 0;
  let lowFpsChecks = 0;

  function animate(now) {
    const rawDt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;

    // FPS Meter & Dynamic Low-End Device Fallback
    frameCount++;
    fpsTimer += rawDt;
    if (fpsTimer >= 0.5) {
      currentFps = (frameCount / fpsTimer);
      frameCount = 0;
      fpsTimer = 0;
      ui.updateTelemetry(currentFps);

      // Low-end device fallback: if device drops below 30 FPS, dynamically adapt
      if (currentFps < 30) {
        lowFpsChecks++;
        if (lowFpsChecks >= 3 && !renderer.options.lowPerformanceMode) {
          renderer.setLowPerformanceMode(true);
          console.warn('⚡ [Cosmic Sandbox Engine] Performance dropped below 30 FPS. Activated Low-Power / High-Performance fallback mode.');
        }
      } else if (currentFps >= 48) {
        if (lowFpsChecks > 0) lowFpsChecks--;
        if (lowFpsChecks === 0 && renderer.options.lowPerformanceMode) {
          renderer.setLowPerformanceMode(false);
          console.log('✨ [Cosmic Sandbox Engine] Frame rate recovered above 48 FPS. Restored full visual fidelity.');
        }
      }
    }

    // Physics Step with Adaptive Substepping for Extreme Numerical Stability
    if (!ui.isPaused) {
      const totalDt = rawDt * ui.timeWarp;
      const isLowPerf = renderer.options.lowPerformanceMode;
      const maxSub = isLowPerf ? 3 : 8;
      const multiplier = isLowPerf ? 1.0 : 2.0;
      const subSteps = Math.max(1, Math.min(maxSub, Math.ceil(ui.timeWarp * multiplier)));
      const subDt = totalDt / subSteps;

      for (let s = 0; s < subSteps; s++) {
        engine.step(subDt);
      }

      // Update Aerospace Flight Challenge if active
      missionManager.update(totalDt);

      // Trail recording (throttled for performance)
      trailTimer += rawDt;
      if (trailTimer >= 0.035) {
        trailTimer = 0;
        const bodies = engine.getBodies();
        for (let i = 0; i < bodies.length; i++) {
          const b = bodies[i];
          if (!b.trail) b.trail = [];
          b.trail.push({ x: b.position.x, y: b.position.y });
          const maxLen = b.maxTrailLength || 120;
          if (b.trail.length > maxLen) {
            b.trail.shift();
          }
        }
      }

      particleSystem.update(rawDt);
    }

    // Render Viewport with Hovered Body Target Reticle, Habitable Zones, Spacecraft Trajectory, and Mission Overlays
    const previewLaunch = ui.getLaunchPreview();
    renderer.render(engine, particleSystem, previewLaunch, now, ui.hoveredBody, missionManager, ui.spacecraftController);

    // Update Telemetry & Inspector & Spacecraft HUD & Mission HUD
    ui.updateInspector();
    ui.updateSpacecraftHud();
    ui.updateMissionHud();

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
});
