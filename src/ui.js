import { Vector2D } from './physics.js';
import { calculateCircularVelocity, findDominantAttractor, calculateHohmannTransfer } from './conics.js';
import { serializeScenario } from './serialization.js';
import { SpacecraftController } from './spacecraft.js';
import { evaluatePlanetaryAtmosphere } from './habitable.js';

export class UIController {
  constructor({ engine, renderer, particleSystem, audio, presets, onPresetChange, missionManager }) {
    this.engine = engine;
    this.renderer = renderer;
    this.particles = particleSystem;
    this.audio = audio;
    this.presets = presets;
    this.onPresetChange = onPresetChange;
    this.missionManager = missionManager || null;
    this.spacecraftController = null;

    this.selectedBody = null;
    this.hoveredBody = null;
    this.isPaused = false;
    this.timeWarp = 1.0;
    this.showManeuverGuide = true;
    this.isScrubbing = false;

    // Body Creator selected template
    this.bodyTemplates = {
      planet: { name: 'Exoplanet', type: 'planet', mass: 6, radius: 6, color: '#3fa3f1' },
      star: { name: 'Radiant Star', type: 'star', mass: 8000, radius: 18, color: '#ffbb33' },
      'black-hole': { name: 'Singularity', type: 'black-hole', mass: 35000, radius: 25, color: '#000000' },
      pulsar: { name: 'Vela Pulsar', type: 'pulsar', mass: 15000, radius: 10, color: '#00e5ff' },
      moon: { name: 'Lunar Body', type: 'moon', mass: 0.5, radius: 2.5, color: '#d0d0d0' },
      debris: { name: 'Asteroid', type: 'debris', mass: 0.05, radius: 1.5, color: '#c49969' },
      spacecraft: { name: 'Odyssey Probe', type: 'spacecraft', mass: 1.0, radius: 4.5, color: '#00e5ff' },
    };
    this.activeTemplate = 'planet';

    // Interaction state
    this.interactionMode = 'launch'; // 'launch' or 'pan'
    this.isDragging = false;
    this.dragStartScreen = { x: 0, y: 0 };
    this.dragStartWorld = null;
    this.currentWorldPos = null;
    this.isPanning = false;

    this.initDOMElements();
    this.bindEvents();
  }

  initDOMElements() {
    this.btnPlay = document.getElementById('btn-play');
    this.btnStep = document.getElementById('btn-step');
    this.btnRewind = document.getElementById('btn-rewind');
    this.sliderScrub = document.getElementById('slider-scrub');
    this.scrubVal = document.getElementById('scrub-val');
    this.cameraSelect = document.getElementById('camera-select');
    this.btnReset = document.getElementById('btn-reset');
    this.btnClear = document.getElementById('btn-clear');
    this.btnSound = document.getElementById('btn-sound');
    this.btnMixer = document.getElementById('btn-mixer');
    this.btnShare = document.getElementById('btn-share');
    this.btnFollow = document.getElementById('btn-follow');
    this.toastEl = document.getElementById('toast-notification');
    this.sliderSpeed = document.getElementById('slider-speed');
    this.speedVal = document.getElementById('speed-val');
    this.sliderG = document.getElementById('slider-g');
    this.gVal = document.getElementById('g-val');
    this.chkTrails = document.getElementById('chk-trails');
    this.chkLabels = document.getElementById('chk-labels');
    this.chkManeuver = document.getElementById('chk-maneuver');
    this.chkSpacetime = document.getElementById('chk-spacetime');
    this.chkRadar = document.getElementById('chk-radar');
    this.chkReticles = document.getElementById('chk-reticles');
    this.chkPrecession = document.getElementById('chk-precession');
    this.presetSelect = document.getElementById('preset-select');
    this.bodyTypeButtons = document.querySelectorAll('.type-btn');
    this.modeButtons = document.querySelectorAll('.mode-btn');

    // Audio Mixer modal elements
    this.mixerPanel = document.getElementById('mixer-panel');
    this.btnCloseMixer = document.getElementById('btn-close-mixer');
    this.sliderMixerDrone = document.getElementById('slider-mixer-drone');
    this.mixerDroneVal = document.getElementById('mixer-drone-val');
    this.sliderMixerResonance = document.getElementById('slider-mixer-resonance');
    this.mixerResVal = document.getElementById('mixer-res-val');
    this.sliderMixerCrackle = document.getElementById('slider-mixer-crackle');
    this.mixerCrackleVal = document.getElementById('mixer-crackle-val');
    this.sliderMixerBoom = document.getElementById('slider-mixer-boom');
    this.mixerBoomVal = document.getElementById('mixer-boom-val');

    // Inspector elements
    this.inspectorPanel = document.getElementById('inspector-panel');
    this.inspName = document.getElementById('insp-name');
    this.inspType = document.getElementById('insp-type');
    this.inspOrbitBadge = document.getElementById('insp-orbit-badge');
    this.inspMass = document.getElementById('insp-mass');
    this.inspSpeed = document.getElementById('insp-speed');
    this.inspPrimary = document.getElementById('insp-primary');
    this.inspEcc = document.getElementById('insp-ecc');
    this.inspPeriapsis = document.getElementById('insp-periapsis');
    this.inspApoapsis = document.getElementById('insp-apoapsis');
    this.inspPeriod = document.getElementById('insp-period');
    this.inspDistance = document.getElementById('insp-dist');
    this.btnInspFollow = document.getElementById('btn-insp-follow');
    this.btnInspDelete = document.getElementById('btn-insp-delete');
    this.btnInspDouble = document.getElementById('btn-insp-double');
    this.btnInspHalf = document.getElementById('btn-insp-half');

    // Hohmann Maneuver elements
    this.hohmannTargetSelect = document.getElementById('hohmann-target-select');
    this.hohmannMetrics = document.getElementById('hohmann-metrics');
    this.hohmannDv1 = document.getElementById('hohmann-dv1');
    this.hohmannDv2 = document.getElementById('hohmann-dv2');
    this.hohmannTotalDv = document.getElementById('hohmann-total-dv');
    this.hohmannTime = document.getElementById('hohmann-time');
    this.btnHohmannPlot = document.getElementById('btn-hohmann-plot');

    // Supernova action button
    this.btnInspSupernova = document.getElementById('btn-insp-supernova');

    // Telemetry HUD
    this.bodyCountVal = document.getElementById('body-count');
    this.fpsVal = document.getElementById('fps-val');

    // Flight Challenges & Mission Mode elements
    this.btnMissions = document.getElementById('btn-missions');
    this.missionsPanel = document.getElementById('missions-panel');
    this.btnCloseMissions = document.getElementById('btn-close-missions');

    this.missionHud = document.getElementById('mission-hud');
    this.mhudTitle = document.getElementById('mhud-title');
    this.mhudBadge = document.getElementById('mhud-badge');
    this.mhudGuidance = document.getElementById('mhud-guidance');
    this.mhudTimer = document.getElementById('mhud-timer');
    this.mhudSpeed = document.getElementById('mhud-speed');
    this.mhudDist = document.getElementById('mhud-dist');
    this.mhudHoldBox = document.getElementById('mhud-progress-box');
    this.mhudHoldText = document.getElementById('mhud-hold-text');
    this.mhudHoldFill = document.getElementById('mhud-hold-fill');
    this.btnMissionReset = document.getElementById('btn-mission-reset');
    this.btnMissionAbort = document.getElementById('btn-mission-abort');

    this.missionResultModal = document.getElementById('mission-result-modal');
    this.resultBox = document.getElementById('result-box');
    this.resultIcon = document.getElementById('result-icon');
    this.resultTitle = document.getElementById('result-title');
    this.resultSubtitle = document.getElementById('result-subtitle');
    this.resultReason = document.getElementById('result-reason');
    this.btnResultRetry = document.getElementById('btn-result-retry');
    this.btnResultNext = document.getElementById('btn-result-next');

    // Circumstellar Habitable Zone & Spacecraft Launcher
    this.chkHabitable = document.getElementById('chk-habitable');
    this.btnSpawnSpacecraft = document.getElementById('btn-spawn-spacecraft');

    // Spacecraft Flight Simulator HUD elements
    this.spacecraftHud = document.getElementById('spacecraft-hud');
    this.scName = document.getElementById('sc-name');
    this.scThrustStatus = document.getElementById('sc-thrust-status');
    this.scFuelBar = document.getElementById('sc-fuel-bar');
    this.scDeltavVal = document.getElementById('sc-deltav-val');
    this.scFuelPct = document.getElementById('sc-fuel-pct');
    this.scSpeedVal = document.getElementById('sc-speed-val');
    this.scSlingshotInfo = document.getElementById('sc-slingshot-info');
    this.scSlingshotText = document.getElementById('sc-slingshot-text');
    this.btnScPrograde = document.getElementById('btn-sc-prograde');
    this.btnScRetrograde = document.getElementById('btn-sc-retrograde');
    this.btnScRadialIn = document.getElementById('btn-sc-radial-in');
    this.btnScRadialOut = document.getElementById('btn-sc-radial-out');
    this.btnScRefuel = document.getElementById('btn-sc-refuel');
    this.btnScDock = document.getElementById('btn-sc-dock');
    this.btnScClose = document.getElementById('btn-sc-close');

    // Planetary Climate & Habitability Inspector elements
    this.inspClimateBox = document.getElementById('insp-climate-box');
    this.inspClimateBadge = document.getElementById('insp-climate-badge');
    this.inspHabitabilityScore = document.getElementById('insp-habitability-score');
    this.inspTemp = document.getElementById('insp-temp');
    this.inspStarDist = document.getElementById('insp-star-dist');
  }

  bindEvents() {
    const canvas = this.renderer.canvas;

    // Canvas Pointer events
    canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    window.addEventListener('mouseup', (e) => this.handleMouseUp(e));

    // Wheel zoom
    canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });

    // Touch support
    canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    window.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    window.addEventListener('touchend', (e) => this.handleTouchEnd(e));

    // Controls
    if (this.btnPlay) {
      this.btnPlay.addEventListener('click', () => this.togglePlay());
    }
    if (this.btnStep) {
      this.btnStep.addEventListener('click', () => {
        this.isPaused = true;
        this.updatePlayButton();
        this.engine.step(0.04);
        this.updateScrubUI();
      });
    }
    if (this.btnRewind) {
      this.btnRewind.addEventListener('click', () => {
        this.isPaused = true;
        this.updatePlayButton();
        const prev = Math.max(0, this.engine.getHistoryIndex() - 1);
        this.engine.scrubTo(prev);
        this.updateScrubUI();
      });
    }
    if (this.sliderScrub) {
      this.sliderScrub.addEventListener('input', (e) => {
        this.isPaused = true;
        this.isScrubbing = true;
        this.updatePlayButton();
        const idx = parseInt(e.target.value, 10);
        this.engine.scrubTo(idx);
        if (this.scrubVal) {
          this.scrubVal.textContent = `${idx + 1}/${this.engine.getHistoryLength()}`;
        }
      });
      this.sliderScrub.addEventListener('change', () => {
        this.isScrubbing = false;
      });
    }

    if (this.cameraSelect) {
      this.cameraSelect.addEventListener('change', (e) => {
        this.setCameraMode(e.target.value);
      });
    }

    if (this.btnReset) {
      this.btnReset.addEventListener('click', () => {
        if (this.onPresetChange) {
          this.onPresetChange(this.presetSelect.value);
        }
      });
    }

    if (this.btnClear) {
      this.btnClear.addEventListener('click', () => {
        this.engine.clear();
        this.particles.clear();
        this.renderer.activeHohmann = null;
        this.selectBody(null);
        this.updateScrubUI();
      });
    }

    if (this.btnSound) {
      this.btnSound.addEventListener('click', () => {
        const isMuted = this.audio.toggleMute();
        this.btnSound.textContent = isMuted ? '🔇 Audio Off' : '🔊 Audio On';
        this.btnSound.classList.toggle('active', !isMuted);
      });
    }

    // Audio Mixer Modal
    if (this.btnMixer && this.mixerPanel) {
      this.btnMixer.addEventListener('click', () => {
        this.mixerPanel.classList.toggle('hidden');
        if (this.audio && !this.audio.initialized) this.audio.init();
      });
    }
    if (this.btnCloseMixer && this.mixerPanel) {
      this.btnCloseMixer.addEventListener('click', () => {
        this.mixerPanel.classList.add('hidden');
      });
    }
    if (this.sliderMixerDrone) {
      this.sliderMixerDrone.addEventListener('input', (e) => {
        const v = parseFloat(e.target.value);
        this.audio.setDroneGain(v);
        if (this.mixerDroneVal) this.mixerDroneVal.textContent = `${Math.round((v / 0.3) * 100)}%`;
      });
    }
    if (this.sliderMixerResonance) {
      this.sliderMixerResonance.addEventListener('input', (e) => {
        const v = parseFloat(e.target.value);
        this.audio.setDroneResonance(v);
        if (this.mixerResVal) this.mixerResVal.textContent = `${Math.round(v)} Hz`;
      });
    }
    if (this.sliderMixerCrackle) {
      this.sliderMixerCrackle.addEventListener('input', (e) => {
        const v = parseFloat(e.target.value);
        this.audio.setCrackleGain(v);
        if (this.mixerCrackleVal) this.mixerCrackleVal.textContent = `${Math.round((v / 0.15) * 100)}%`;
      });
    }
    if (this.sliderMixerBoom) {
      this.sliderMixerBoom.addEventListener('input', (e) => {
        const v = parseFloat(e.target.value);
        this.audio.setBoomGain(v);
        if (this.mixerBoomVal) this.mixerBoomVal.textContent = `${v.toFixed(1)}x`;
      });
    }

    if (this.btnShare) {
      this.btnShare.addEventListener('click', () => {
        const hash = serializeScenario(this.engine);
        const url = `${window.location.origin}${window.location.pathname}#scenario=${hash}`;
        window.location.hash = `scenario=${hash}`;

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url)
            .then(() => this.showToast('✓ Shareable scenario link copied to clipboard!'))
            .catch(() => this.showToast('✓ URL updated in address bar!'));
        } else {
          this.showToast('✓ URL updated in address bar!');
        }
      });
    }

    if (this.sliderSpeed) {
      this.sliderSpeed.addEventListener('input', (e) => {
        this.timeWarp = parseFloat(e.target.value);
        if (this.speedVal) this.speedVal.textContent = `${this.timeWarp.toFixed(1)}x`;
      });
    }

    if (this.sliderG) {
      this.sliderG.addEventListener('input', (e) => {
        const g = parseFloat(e.target.value);
        this.engine.G = g;
        if (this.gVal) this.gVal.textContent = g.toFixed(1);
      });
    }

    if (this.chkTrails) {
      this.chkTrails.addEventListener('change', (e) => {
        this.renderer.options.showTrails = e.target.checked;
        if (!e.target.checked) {
          this.engine.getBodies().forEach((b) => (b.trail = []));
        }
      });
    }

    if (this.chkLabels) {
      this.chkLabels.addEventListener('change', (e) => {
        this.renderer.options.showLabels = e.target.checked;
      });
    }

    if (this.chkManeuver) {
      this.chkManeuver.addEventListener('change', (e) => {
        this.showManeuverGuide = e.target.checked;
        this.renderer.options.showManeuverGuide = e.target.checked;
      });
    }

    if (this.chkSpacetime) {
      this.chkSpacetime.addEventListener('change', (e) => {
        this.renderer.options.showSpacetimeGrid = e.target.checked;
      });
    }

    if (this.chkRadar) {
      this.chkRadar.addEventListener('change', (e) => {
        this.renderer.options.showRadar = e.target.checked;
      });
    }

    if (this.chkReticles) {
      this.chkReticles.addEventListener('change', (e) => {
        this.renderer.options.showReticles = e.target.checked;
      });
    }

    if (this.chkHabitable) {
      this.chkHabitable.addEventListener('change', (e) => {
        this.renderer.options.showHabitableZones = e.target.checked;
      });
    }

    if (this.chkPrecession) {
      this.chkPrecession.addEventListener('change', (e) => {
        this.engine.relativisticCorrection = e.target.checked;
        this.showToast(e.target.checked ? '⚡ Relativistic GR Precession Active' : 'ℹ Pure Newtonian Gravity Active');
      });
    }

    // Spacecraft Launcher & Controls
    if (this.btnSpawnSpacecraft) {
      this.btnSpawnSpacecraft.addEventListener('click', () => {
        this.spawnPlayerSpacecraft();
      });
    }

    if (this.btnScPrograde) {
      this.btnScPrograde.addEventListener('click', () => this.applySpacecraftThrust('prograde'));
    }
    if (this.btnScRetrograde) {
      this.btnScRetrograde.addEventListener('click', () => this.applySpacecraftThrust('retrograde'));
    }
    if (this.btnScRadialIn) {
      this.btnScRadialIn.addEventListener('click', () => this.applySpacecraftThrust('radial-in'));
    }
    if (this.btnScRadialOut) {
      this.btnScRadialOut.addEventListener('click', () => this.applySpacecraftThrust('radial-out'));
    }
    if (this.btnScRefuel) {
      this.btnScRefuel.addEventListener('click', () => this.refuelSpacecraft());
    }
    if (this.btnScDock) {
      this.btnScDock.addEventListener('click', () => {
        if (this.spacecraftController && this.spacecraftController.body) {
          this.renderer.camera.targetBody = this.spacecraftController.body;
          this.showToast('🔭 Camera locked onto Odyssey-1');
        }
      });
    }
    if (this.btnScClose) {
      this.btnScClose.addEventListener('click', () => {
        this.despawnSpacecraft();
      });
    }

    if (this.presetSelect) {
      this.presetSelect.addEventListener('change', (e) => {
        if (this.onPresetChange) {
          this.onPresetChange(e.target.value);
        }
      });
    }

    // Body type selection buttons
    this.bodyTypeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.bodyTypeButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeTemplate = btn.dataset.type;
      });
    });

    // Interaction mode buttons
    this.modeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.modeButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.interactionMode = btn.dataset.mode;
      });
    });

    // Hohmann Maneuver Planner interactions
    if (this.hohmannTargetSelect) {
      this.hohmannTargetSelect.addEventListener('change', () => {
        this.updateHohmannReadout();
      });
    }

    if (this.btnHohmannPlot) {
      this.btnHohmannPlot.addEventListener('click', () => {
        if (this.renderer.activeHohmann) {
          this.renderer.activeHohmann = null;
          this.btnHohmannPlot.textContent = '📐 Plot Transfer Orbit';
          this.btnHohmannPlot.classList.remove('active');
        } else {
          const plan = this.computeHohmannPlan();
          if (plan) {
            this.renderer.activeHohmann = plan;
            this.btnHohmannPlot.textContent = '❌ Clear Transfer';
            this.btnHohmannPlot.classList.add('active');
            this.showToast(`✓ Hohmann plotted: Δv = ${plan.totalDeltaV.toFixed(2)} km/s`);
          } else {
            this.showToast('⚠️ Cannot plot transfer (no common attractor)');
          }
        }
      });
    }

    // Inspector Action Buttons
    if (this.btnInspFollow) {
      this.btnInspFollow.addEventListener('click', () => {
        if (this.selectedBody) {
          if (this.renderer.camera.targetBody === this.selectedBody) {
            this.renderer.camera.targetBody = null;
            this.btnInspFollow.textContent = '🔭 Follow Body';
          } else {
            this.renderer.camera.targetBody = this.selectedBody;
            this.btnInspFollow.textContent = '❌ Unfollow';
          }
        }
      });
    }

    if (this.btnInspDelete) {
      this.btnInspDelete.addEventListener('click', () => {
        if (this.selectedBody) {
          this.engine.removeBody(this.selectedBody.id);
          this.selectBody(null);
        }
      });
    }

    if (this.btnInspDouble) {
      this.btnInspDouble.addEventListener('click', () => {
        if (this.selectedBody) {
          this.selectedBody.mass *= 2;
          this.selectedBody.radius = Math.cbrt(Math.pow(this.selectedBody.radius, 3) * 2);
        }
      });
    }

    if (this.btnInspHalf) {
      this.btnInspHalf.addEventListener('click', () => {
        if (this.selectedBody) {
          this.selectedBody.mass = Math.max(0.01, this.selectedBody.mass / 2);
          this.selectedBody.radius = Math.max(1.5, Math.cbrt(Math.pow(this.selectedBody.radius, 3) / 2));
        }
      });
    }

    // Supernova action button
    if (this.btnInspSupernova) {
      this.btnInspSupernova.addEventListener('click', () => {
        if (this.selectedBody && (this.selectedBody.type === 'star' || this.selectedBody.type === 'pulsar')) {
          const blast = this.engine.triggerSupernova(this.selectedBody.id);
          if (blast) {
            this.showToast(`💥 Supernova Core-Collapse Triggered on ${this.selectedBody.name}!`);
            this.updateInspector();
          }
        }
      });
    }

    // Missions Drawer and Controls
    if (this.btnMissions && this.missionsPanel) {
      this.btnMissions.addEventListener('click', () => {
        this.missionsPanel.classList.toggle('hidden');
      });
    }

    if (this.btnCloseMissions && this.missionsPanel) {
      this.btnCloseMissions.addEventListener('click', () => {
        this.missionsPanel.classList.add('hidden');
      });
    }

    const launchButtons = document.querySelectorAll('.btn-launch-mission');
    launchButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const missionId = e.currentTarget.getAttribute('data-mission-id');
        this.startMission(missionId);
      });
    });

    if (this.btnMissionReset) {
      this.btnMissionReset.addEventListener('click', () => {
        if (this.missionManager) {
          this.missionManager.resetMission();
          this.hideMissionResult();
          this.showToast('↺ Challenge Restarted');
        }
      });
    }

    if (this.btnMissionAbort) {
      this.btnMissionAbort.addEventListener('click', () => {
        if (this.missionManager) {
          this.missionManager.abortMission();
          if (this.missionHud) this.missionHud.classList.add('hidden');
          this.hideMissionResult();
          this.showToast('ℹ Mission Aborted');
        }
      });
    }

    if (this.btnResultRetry) {
      this.btnResultRetry.addEventListener('click', () => {
        if (this.missionManager) {
          this.missionManager.resetMission();
          this.hideMissionResult();
        }
      });
    }

    if (this.btnResultNext) {
      this.btnResultNext.addEventListener('click', () => {
        this.hideMissionResult();
        if (this.missionsPanel) {
          this.missionsPanel.classList.remove('hidden');
        }
      });
    }

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      // Flight Challenge Probe Thruster Controls (WASD / Arrows)
      if (this.missionManager && this.missionManager.getStatus() === 'active') {
        let thrust = null;
        const power = 3.5;
        if (e.code === 'KeyW' || e.code === 'ArrowUp') thrust = new Vector2D(0, -power);
        else if (e.code === 'KeyS' || e.code === 'ArrowDown') thrust = new Vector2D(0, power);
        else if (e.code === 'KeyA' || e.code === 'ArrowLeft') thrust = new Vector2D(-power, 0);
        else if (e.code === 'KeyD' || e.code === 'ArrowRight') thrust = new Vector2D(power, 0);

        if (thrust) {
          e.preventDefault();
          this.missionManager.applyThrust(thrust, 0.1);
          const probe = this.engine.getBody('mission-probe');
          if (probe) {
            this.particles.emitThruster(probe.position.x, probe.position.y, thrust.x, thrust.y);
            this.audio.playThrusterSound();
          }
          return;
        }
      }

      // Spacecraft Flight Simulator Thruster Controls (WASD / Arrows / R)
      if (this.spacecraftController && this.spacecraftController.body && (!this.missionManager || this.missionManager.getStatus() !== 'active')) {
        if (e.code === 'KeyR') {
          e.preventDefault();
          this.refuelSpacecraft();
          return;
        }

        let direction = null;
        if (e.code === 'KeyW' || e.code === 'ArrowUp') direction = 'prograde';
        else if (e.code === 'KeyS' || e.code === 'ArrowDown') direction = 'retrograde';
        else if (e.code === 'KeyA' || e.code === 'ArrowLeft') direction = 'radial-in';
        else if (e.code === 'KeyD' || e.code === 'ArrowRight') direction = 'radial-out';

        if (direction) {
          e.preventDefault();
          this.applySpacecraftThrust(direction);
          return;
        }
      }

      if (e.code === 'Space') {
        e.preventDefault();
        this.togglePlay();
      } else if (e.code === 'KeyC') {
        this.engine.getBodies().forEach((b) => (b.trail = []));
      } else if (e.code === 'KeyF') {
        if (this.selectedBody) {
          this.renderer.camera.targetBody = this.renderer.camera.targetBody ? null : this.selectedBody;
        }
      } else if (e.code === 'Digit1') {
        this.setCameraMode('free');
      } else if (e.code === 'Digit2') {
        this.setCameraMode('locked');
      } else if (e.code === 'Digit3') {
        this.setCameraMode('chase');
      } else if (e.code === 'Digit4') {
        this.setCameraMode('barycenter');
      } else if (e.code === 'KeyR') {
        this.isPaused = true;
        this.updatePlayButton();
        const prev = Math.max(0, this.engine.getHistoryIndex() - 1);
        this.engine.scrubTo(prev);
        this.updateScrubUI();
      }
    });

    window.addEventListener('resize', () => this.renderer.resize());
  }

  handleMouseDown(e) {
    if (e.button === 1 || e.button === 2 || this.interactionMode === 'pan' || e.shiftKey) {
      this.isPanning = true;
      this.dragStartScreen = { x: e.clientX, y: e.clientY };
      return;
    }

    const worldPos = this.renderer.screenToWorld(e.clientX, e.clientY);

    // Check if clicked an existing body
    const clickedBody = this.findBodyNear(worldPos);
    if (clickedBody) {
      this.selectBody(clickedBody);
      return;
    }

    // Launch mode on empty canvas
    this.isDragging = true;
    this.dragStartWorld = worldPos;
    this.currentWorldPos = worldPos.clone();
  }

  handleMouseMove(e) {
    if (this.isPanning) {
      const dx = (e.clientX - this.dragStartScreen.x) / this.renderer.camera.zoom;
      const dy = (e.clientY - this.dragStartScreen.y) / this.renderer.camera.zoom;
      this.renderer.camera.x -= dx;
      this.renderer.camera.y -= dy;
      this.renderer.camera.targetBody = null; // Break follow on manual pan
      this.dragStartScreen = { x: e.clientX, y: e.clientY };
      return;
    }

    if (this.isDragging) {
      this.currentWorldPos = this.renderer.screenToWorld(e.clientX, e.clientY);
    } else {
      // Hover detection for Tactical Targeting Reticle
      const worldPos = this.renderer.screenToWorld(e.clientX, e.clientY);
      this.hoveredBody = this.findBodyNear(worldPos);
      this.renderer.hoveredBody = this.hoveredBody;
    }
  }

  handleMouseUp(e) {
    if (this.isPanning) {
      this.isPanning = false;
      return;
    }

    const launch = this.computeLaunchState();
    if (launch) {
      const template = launch.config;

      const newBody = this.engine.addBody({
        name: template.name,
        type: template.type,
        mass: template.mass,
        radius: template.radius,
        position: launch.start.clone(),
        velocity: launch.velocity.clone(),
        color: template.color,
      });

      if (template.type === 'spacecraft') {
        this.spacecraftController = new SpacecraftController({
          engine: this.engine,
          id: newBody.id,
          name: newBody.name,
          mass: newBody.mass,
          radius: newBody.radius,
          position: newBody.position,
          velocity: newBody.velocity,
          maxDeltaV: 25.0,
          currentDeltaV: 25.0,
          thrustPower: 8.0,
          color: newBody.color,
        });
        if (this.spacecraftHud) this.spacecraftHud.classList.remove('hidden');
      }

      this.selectBody(newBody);
      if (this.audio) this.audio.init();

      this.isDragging = false;
      this.dragStartWorld = null;
      this.currentWorldPos = null;
    }
  }

  handleWheel(e) {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newZoom = Math.min(6.0, Math.max(0.08, this.renderer.camera.zoom * zoomFactor));

    // Cursor-centered zoom
    const mouseWorldBefore = this.renderer.screenToWorld(e.clientX, e.clientY);
    this.renderer.camera.zoom = newZoom;
    const mouseWorldAfter = this.renderer.screenToWorld(e.clientX, e.clientY);

    this.renderer.camera.x += (mouseWorldBefore.x - mouseWorldAfter.x);
    this.renderer.camera.y += (mouseWorldBefore.y - mouseWorldAfter.y);
  }

  handleTouchStart(e) {
    if (e.touches.length === 2) {
      // Initialize pinch-to-zoom and two-finger pan
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      this.pinchStartDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      this.pinchStartZoom = this.renderer.camera.zoom;
      const centerScreen = { x: (t1.clientX + t2.clientX) * 0.5, y: (t1.clientY + t2.clientY) * 0.5 };
      this.pinchStartCenterWorld = this.renderer.screenToWorld(centerScreen.x, centerScreen.y);

      // Abort any ongoing single-touch launch drag
      this.isDragging = false;
      this.dragStartWorld = null;
      this.currentWorldPos = null;
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      this.handleMouseDown({
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: this.interactionMode === 'pan' ? 1 : 0,
        shiftKey: false,
      });
    }
  }

  handleTouchMove(e) {
    if (e.touches.length === 2 && this.pinchStartDist) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

      if (this.pinchStartDist > 10) {
        // Pinch Zoom
        const ratio = currentDist / this.pinchStartDist;
        const newZoom = Math.min(6.0, Math.max(0.08, this.pinchStartZoom * ratio));
        this.renderer.camera.zoom = newZoom;

        // Two-finger pan centering
        const centerScreen = { x: (t1.clientX + t2.clientX) * 0.5, y: (t1.clientY + t2.clientY) * 0.5 };
        const centerWorldNow = this.renderer.screenToWorld(centerScreen.x, centerScreen.y);
        this.renderer.camera.x += (this.pinchStartCenterWorld.x - centerWorldNow.x);
        this.renderer.camera.y += (this.pinchStartCenterWorld.y - centerWorldNow.y);
      }
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      this.handleMouseMove({
        clientX: touch.clientX,
        clientY: touch.clientY,
      });
    }
  }

  handleTouchEnd(e) {
    if (e.touches.length < 2) {
      this.pinchStartDist = null;
      this.pinchStartZoom = null;
    }
    if (e.touches.length === 0) {
      this.handleMouseUp({});
    }
  }

  findBodyNear(worldPos) {
    const bodies = this.engine.getBodies();
    const tolerance = 25 / this.renderer.camera.zoom;

    for (let i = bodies.length - 1; i >= 0; i--) {
      const b = bodies[i];
      const dist = Vector2D.distance(b.position, worldPos);
      if (dist <= Math.max(tolerance, b.radius * 1.5)) {
        return b;
      }
    }
    return null;
  }

  selectBody(body) {
    if (this.selectedBody) {
      this.selectedBody.isSelected = false;
    }
    this.selectedBody = body;
    if (body) {
      body.isSelected = true;
      if (body.type === 'spacecraft') {
        if (!this.spacecraftController || this.spacecraftController.id !== body.id) {
          this.spacecraftController = new SpacecraftController({
            engine: this.engine,
            id: body.id,
            name: body.name,
            mass: body.mass,
            radius: body.radius,
            position: body.position,
            velocity: body.velocity,
            color: body.color,
          });
        }
        if (this.spacecraftHud) this.spacecraftHud.classList.remove('hidden');
      }
      if (this.inspectorPanel) this.inspectorPanel.classList.remove('hidden');
      if (this.btnInspSupernova) {
        if (body.type === 'star' || body.type === 'pulsar') {
          this.btnInspSupernova.classList.remove('hidden');
        } else {
          this.btnInspSupernova.classList.add('hidden');
        }
      }
      this.refreshHohmannTargets();
    } else {
      if (this.inspectorPanel) this.inspectorPanel.classList.add('hidden');
      if (this.btnInspSupernova) this.btnInspSupernova.classList.add('hidden');
      this.renderer.activeHohmann = null;
      if (this.btnHohmannPlot) {
        this.btnHohmannPlot.textContent = '📐 Plot Transfer Orbit';
        this.btnHohmannPlot.classList.remove('active');
      }
      if (this.renderer.camera.mode === 'locked' || this.renderer.camera.mode === 'chase') {
        this.renderer.camera.targetBody = null;
      }
    }
  }

  refreshHohmannTargets() {
    if (!this.selectedBody || !this.hohmannTargetSelect) return;
    const bodies = this.engine.getBodies().filter((b) => b.id !== this.selectedBody.id);
    const prevVal = this.hohmannTargetSelect.value;
    this.hohmannTargetSelect.textContent = '';
    for (const b of bodies) {
      const opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = `${b.name} (${b.type})`;
      this.hohmannTargetSelect.appendChild(opt);
    }
    if (bodies.length > 0) {
      if (prevVal && bodies.some((b) => b.id === prevVal)) {
        this.hohmannTargetSelect.value = prevVal;
      } else {
        this.hohmannTargetSelect.value = bodies[0].id;
      }
      this.updateHohmannReadout();
    } else {
      if (this.hohmannMetrics) this.hohmannMetrics.classList.add('hidden');
    }
  }

  computeHohmannPlan() {
    if (!this.selectedBody || !this.hohmannTargetSelect) return null;
    const targetId = this.hohmannTargetSelect.value;
    if (!targetId) return null;
    const target = this.engine.getBody(targetId);
    if (!target) return null;

    const primary = findDominantAttractor(this.selectedBody, this.engine.getBodies(), this.engine.G);
    if (!primary) return null;

    return calculateHohmannTransfer({
      primary,
      fromBody: this.selectedBody,
      toBody: target,
      G: this.engine.G,
    });
  }

  updateHohmannReadout() {
    if (!this.selectedBody || !this.hohmannMetrics) return;
    const plan = this.computeHohmannPlan();
    if (plan) {
      this.hohmannMetrics.classList.remove('hidden');
      if (this.hohmannDv1) this.hohmannDv1.textContent = `${plan.deltaV1.toFixed(2)} km/s`;
      if (this.hohmannDv2) this.hohmannDv2.textContent = `${plan.deltaV2.toFixed(2)} km/s`;
      if (this.hohmannTotalDv) this.hohmannTotalDv.textContent = `${plan.totalDeltaV.toFixed(2)} km/s`;
      if (this.hohmannTime) this.hohmannTime.textContent = `${plan.transferTime.toFixed(1)} s`;
      if (this.renderer.activeHohmann) {
        this.renderer.activeHohmann = plan;
      }
    } else {
      this.hohmannMetrics.classList.add('hidden');
    }
  }

  computeLaunchState() {
    if (!this.isDragging || !this.dragStartWorld || !this.currentWorldPos) {
      return null;
    }

    const template = this.bodyTemplates[this.activeTemplate] || this.bodyTemplates.planet;
    const rawVx = (this.dragStartWorld.x - this.currentWorldPos.x) * 0.12;
    const rawVy = (this.dragStartWorld.y - this.currentWorldPos.y) * 0.12;
    const rawSpeed = Math.hypot(rawVx, rawVy);

    let finalVx = rawVx;
    let finalVy = rawVy;
    let isSnapped = false;
    let snapType = null;
    let circularAssist = null;
    let dominantAttractor = null;

    if (this.showManeuverGuide) {
      const pseudoBody = {
        id: '__launch_temp__',
        position: this.dragStartWorld,
        mass: template.mass,
      };
      dominantAttractor = findDominantAttractor(pseudoBody, this.engine.getBodies(), this.engine.G);

      if (dominantAttractor && dominantAttractor.mass > 5) {
        circularAssist = calculateCircularVelocity(dominantAttractor, this.dragStartWorld, this.engine.G);

        if (circularAssist && rawSpeed > 0.5) {
          const candidates = [
            { name: 'PROGRADE CIRCULAR', vel: circularAssist.progradeVelocity },
            { name: 'RETROGRADE CIRCULAR', vel: circularAssist.retrogradeVelocity },
          ];

          for (const cand of candidates) {
            const candSpeed = cand.vel.mag();
            if (candSpeed <= 0) continue;

            const speedDiffRatio = Math.abs(rawSpeed - candSpeed) / candSpeed;
            const dot = (rawVx * cand.vel.x + rawVy * cand.vel.y) / (rawSpeed * candSpeed);
            const angleDiff = Math.acos(Math.max(-1, Math.min(1, dot)));

            // Soft magnetic snapping within ±14% speed and ±11° (0.20 rad) angle
            if (speedDiffRatio <= 0.14 && angleDiff <= 0.20) {
              isSnapped = true;
              snapType = cand.name;
              finalVx = cand.vel.x;
              finalVy = cand.vel.y;
              break;
            }
          }
        }
      }
    }

    return {
      start: this.dragStartWorld,
      current: this.currentWorldPos,
      velocity: new Vector2D(finalVx, finalVy),
      rawVelocity: new Vector2D(rawVx, rawVy),
      isSnapped,
      snapType,
      circularAssist,
      primaryAttractor: dominantAttractor,
      config: template,
    };
  }

  getLaunchPreview() {
    return this.computeLaunchState();
  }

  updateInspector() {
    if (!this.selectedBody) return;

    // Check if body was destroyed
    if (!this.engine.getBody(this.selectedBody.id)) {
      this.selectBody(null);
      return;
    }

    const b = this.selectedBody;
    const speed = b.velocity.mag();
    const dist = b.position.mag();

    if (this.inspName) this.inspName.textContent = b.name;
    if (this.inspType) this.inspType.textContent = b.type.toUpperCase();
    if (this.inspMass) this.inspMass.textContent = b.mass.toFixed(1);
    if (this.inspSpeed) this.inspSpeed.textContent = `${speed.toFixed(2)} km/s`;
    if (this.inspDistance) this.inspDistance.textContent = `${dist.toFixed(1)} AU`;

    // Compute osculating orbital conics
    const conics = this.engine.getOrbitalElements(b.id);
    if (conics) {
      if (this.inspPrimary) this.inspPrimary.textContent = conics.primaryName || 'Attractor';
      if (this.inspEcc) this.inspEcc.textContent = conics.eccentricity.toFixed(3);
      if (this.inspPeriapsis) this.inspPeriapsis.textContent = `${conics.periapsis.toFixed(1)} AU`;

      if (this.inspApoapsis) {
        if (!conics.isBound || conics.apoapsis === Infinity) {
          this.inspApoapsis.textContent = '∞ (Escape)';
        } else {
          this.inspApoapsis.textContent = `${conics.apoapsis.toFixed(1)} AU`;
        }
      }

      if (this.inspPeriod) {
        if (conics.period === null || !conics.isBound) {
          this.inspPeriod.textContent = '∞ (Unbound)';
        } else {
          this.inspPeriod.textContent = `${conics.period.toFixed(1)} s`;
        }
      }

      if (this.inspOrbitBadge) {
        this.inspOrbitBadge.textContent = conics.orbitType.toUpperCase();
        this.inspOrbitBadge.className = `badge-orbit ${conics.orbitType}`;
      }
    } else {
      if (this.inspPrimary) this.inspPrimary.textContent = 'None';
      if (this.inspEcc) this.inspEcc.textContent = '—';
      if (this.inspPeriapsis) this.inspPeriapsis.textContent = '—';
      if (this.inspApoapsis) this.inspApoapsis.textContent = '—';
      if (this.inspPeriod) this.inspPeriod.textContent = '—';
      if (this.inspOrbitBadge) {
        this.inspOrbitBadge.textContent = 'DRIFTING';
        this.inspOrbitBadge.className = 'badge-orbit';
      }
    }

    // Refresh Hohmann readouts if body is in orbit
    this.updateHohmannReadout();

    // Evaluate Planetary Climate & Circumstellar Habitable Zone
    if (this.inspClimateBox) {
      if (b.type === 'planet') {
        const atmo = evaluatePlanetaryAtmosphere(b, this.engine.getBodies());
        if (atmo) {
          this.inspClimateBox.classList.remove('hidden');
          if (this.inspClimateBadge) {
            if (atmo.state === 'habitable-terrestrial') {
              this.inspClimateBadge.textContent = 'HABITABLE (GOLDILOCKS)';
              this.inspClimateBadge.className = 'badge-climate temperate';
            } else if (atmo.state === 'scorched-runaway') {
              this.inspClimateBadge.textContent = 'RUNAWAY GREENHOUSE';
              this.inspClimateBadge.className = 'badge-climate infernal';
            } else {
              this.inspClimateBadge.textContent = 'CRYOGENIC ICE';
              this.inspClimateBadge.className = 'badge-climate cryogenic';
            }
          }
          if (this.inspHabitabilityScore) {
            this.inspHabitabilityScore.textContent = `${Math.round(atmo.habitabilityScore * 100)}%`;
          }
          if (this.inspTemp) {
            const tempC = atmo.surfaceTempK - 273;
            this.inspTemp.textContent = `${atmo.surfaceTempK} K (${tempC > 0 ? '+' : ''}${tempC}°C)`;
          }
          if (this.inspStarDist) {
            this.inspStarDist.textContent = atmo.starName ? `${atmo.starName} (${Math.round(atmo.distToStar || 0)} AU)` : 'Rogue (No Star)';
          }
        }
      } else {
        this.inspClimateBox.classList.add('hidden');
      }
    }

    if (this.btnInspSupernova) {
      if (b.type === 'star' || b.type === 'pulsar') {
        this.btnInspSupernova.classList.remove('hidden');
      } else {
        this.btnInspSupernova.classList.add('hidden');
      }
    }

    if (this.btnInspFollow) {
      this.btnInspFollow.textContent =
        this.renderer.camera.targetBody === b ? '❌ Unfollow' : '🔭 Follow Body';
    }
  }

  startMission(missionId) {
    if (!this.missionManager) return;
    const mission = this.missionManager.startMission(missionId);
    if (!mission) return;

    if (this.missionsPanel) {
      this.missionsPanel.classList.add('hidden');
    }

    if (this.missionHud) {
      this.missionHud.classList.remove('hidden');
      if (this.mhudTitle) this.mhudTitle.textContent = mission.title;
      if (this.mhudBadge) this.mhudBadge.textContent = 'MISSION ACTIVE';
    }

    this.hideMissionResult();
    this.particles.clear();
    this.selectBody(null);

    // Camera setup for challenge
    this.renderer.camera.x = 0;
    this.renderer.camera.y = 0;
    const probe = this.engine.getBody('mission-probe');
    if (probe) {
      this.renderer.camera.targetBody = probe;
    }
    this.renderer.camera.zoom = missionId === 'jupiter-slingshot' ? 0.75 : 0.95;

    this.showToast(`🚀 Launching Challenge: ${mission.title}! [WASD/Arrows to thrust]`);
  }

  showMissionVictory(mission) {
    if (!this.missionResultModal) return;
    this.missionResultModal.classList.remove('hidden');
    if (this.resultBox) {
      this.resultBox.className = 'result-box victory';
    }
    if (this.resultIcon) this.resultIcon.textContent = '🏆';
    if (this.resultTitle) this.resultTitle.textContent = 'MISSION ACCOMPLISHED';
    if (this.resultSubtitle) this.resultSubtitle.textContent = mission ? mission.title : 'Flight Challenge Success';
    if (this.resultReason) this.resultReason.textContent = 'Orbital parameters verified. Telemetry nominal.';
    if (this.btnResultNext) this.btnResultNext.textContent = '▶ Next Challenge';
  }

  showMissionFailure(mission, reason) {
    if (!this.missionResultModal) return;
    this.missionResultModal.classList.remove('hidden');
    if (this.resultBox) {
      this.resultBox.className = 'result-box failure';
    }
    if (this.resultIcon) this.resultIcon.textContent = '💥';
    if (this.resultTitle) this.resultTitle.textContent = 'MISSION FAILED';
    if (this.resultSubtitle) this.resultSubtitle.textContent = mission ? mission.title : 'Flight Challenge';
    if (this.resultReason) this.resultReason.textContent = reason || 'Mission probe was lost or trajectory failed.';
    if (this.btnResultNext) this.btnResultNext.textContent = '✕ Dismiss';
  }

  hideMissionResult() {
    if (this.missionResultModal) {
      this.missionResultModal.classList.add('hidden');
    }
  }

  updateMissionHud() {
    if (!this.missionManager) return;
    const telemetry = this.missionManager.getTelemetry();

    if (!telemetry || telemetry.status === 'idle') {
      if (this.missionHud && !this.missionHud.classList.contains('hidden')) {
        this.missionHud.classList.add('hidden');
      }
      return;
    }

    if (this.missionHud && this.missionHud.classList.contains('hidden')) {
      this.missionHud.classList.remove('hidden');
    }

    if (this.mhudTitle) this.mhudTitle.textContent = telemetry.title;
    if (this.mhudGuidance) this.mhudGuidance.textContent = telemetry.guidance;

    if (this.mhudTimer) {
      this.mhudTimer.textContent = `${telemetry.timeRemaining.toFixed(1)}s`;
      if (telemetry.timeRemaining <= 10.0) {
        this.mhudTimer.classList.add('critical');
      } else {
        this.mhudTimer.classList.remove('critical');
      }
    }

    if (this.mhudSpeed) {
      this.mhudSpeed.textContent = `${telemetry.probeSpeed.toFixed(2)} AU/s`;
    }

    if (this.mhudDist) {
      this.mhudDist.textContent = `${telemetry.distTarget.toFixed(1)} AU`;
    }

    if (this.mhudHoldFill && this.mhudHoldText) {
      if (telemetry.missionId === 'lunar-insertion') {
        if (this.mhudHoldBox) this.mhudHoldBox.style.display = 'flex';
        this.mhudHoldFill.style.width = `${Math.round(telemetry.captureHoldProgress * 100)}%`;
        this.mhudHoldText.textContent = `${(telemetry.captureHoldProgress * 2.0).toFixed(1)}s / 2.0s`;
      } else {
        if (this.mhudHoldBox) this.mhudHoldBox.style.display = 'none';
      }
    }

    if (this.mhudBadge) {
      if (telemetry.status === 'victory') {
        this.mhudBadge.textContent = 'VICTORY';
        this.mhudBadge.style.color = '#10b981';
      } else if (telemetry.status === 'failure') {
        this.mhudBadge.textContent = 'FAILED';
        this.mhudBadge.style.color = '#ef4444';
      } else {
        this.mhudBadge.textContent = 'ACTIVE';
        this.mhudBadge.style.color = '#00e5ff';
      }
    }
  }

  togglePlay() {
    this.isPaused = !this.isPaused;
    this.isScrubbing = false;
    this.updatePlayButton();
  }

  updatePlayButton() {
    if (!this.btnPlay) return;
    if (this.isPaused) {
      this.btnPlay.textContent = '▶ Play';
      this.btnPlay.classList.remove('active');
    } else {
      this.btnPlay.textContent = '⏸ Pause';
      this.btnPlay.classList.add('active');
    }
  }

  setCameraMode(mode) {
    if (this.renderer && this.renderer.camera) {
      this.renderer.camera.mode = mode;
      if (mode === 'free') {
        this.renderer.camera.targetBody = null;
      } else if (mode === 'locked' || mode === 'chase') {
        if (!this.renderer.camera.targetBody && this.selectedBody) {
          this.renderer.camera.targetBody = this.selectedBody;
        }
      }
    }
    if (this.cameraSelect) {
      this.cameraSelect.value = mode;
    }
  }

  updateScrubUI() {
    if (this.sliderScrub) {
      const len = this.engine.getHistoryLength();
      const idx = this.engine.getHistoryIndex();
      this.sliderScrub.max = Math.max(0, len - 1);
      this.sliderScrub.value = Math.max(0, idx);
      if (this.scrubVal) {
        this.scrubVal.textContent = len > 0 ? `${idx + 1}/${len}` : '0/0';
      }
    }
  }

  updateTelemetry(fps) {
    if (this.bodyCountVal) {
      this.bodyCountVal.textContent = this.engine.getBodies().length;
    }
    if (this.fpsVal) {
      this.fpsVal.textContent = Math.round(fps);
    }
    if (this.sliderScrub && !this.isScrubbing) {
      const len = this.engine.getHistoryLength();
      const idx = this.engine.getHistoryIndex();
      this.sliderScrub.max = Math.max(0, len - 1);
      this.sliderScrub.value = Math.max(0, idx);
      if (this.scrubVal) {
        this.scrubVal.textContent = len > 0 ? `${idx + 1}/${len}` : '0/0';
      }
    }
  }

  showToast(msg) {
    if (!this.toastEl) return;
    this.toastEl.textContent = msg;
    this.toastEl.classList.remove('hidden');
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastEl.classList.add('hidden');
    }, 2800);
  }

  spawnPlayerSpacecraft(pos = null, vel = null) {
    let spawnPos = pos;
    let spawnVel = vel;

    if (!spawnPos) {
      const earth = this.engine.getBody('earth') || this.engine.getBodies().find(b => b.type === 'planet');
      if (earth) {
        // Spawn in prograde hyperbolic injection trajectory outside Earth's orbit
        spawnPos = new Vector2D(earth.position.x + 22, earth.position.y);
        spawnVel = new Vector2D(earth.velocity.x * 1.18, earth.velocity.y * 1.18);
      } else {
        const star = this.engine.getBodies().find(b => b.type === 'star' || b.type === 'pulsar');
        if (star) {
          spawnPos = new Vector2D(star.position.x + 145, star.position.y);
          spawnVel = new Vector2D(0, 10.5);
        } else {
          spawnPos = new Vector2D(0, 120);
          spawnVel = new Vector2D(8.5, 0);
        }
      }
    }

    // Remove existing player spacecraft if any
    const existing = this.engine.getBody('player-spacecraft');
    if (existing) {
      this.engine.removeBody('player-spacecraft');
    }

    this.spacecraftController = new SpacecraftController({
      engine: this.engine,
      id: 'player-spacecraft',
      name: 'Odyssey-1',
      mass: 1.0,
      radius: 4.5,
      position: spawnPos,
      velocity: spawnVel || new Vector2D(0, 0),
      maxDeltaV: 25.0,
      currentDeltaV: 25.0,
      thrustPower: 8.0,
      color: '#00e5ff',
    });

    if (this.spacecraftHud) this.spacecraftHud.classList.remove('hidden');
    this.renderer.camera.targetBody = this.spacecraftController.body;
    this.selectBody(this.spacecraftController.body);
    this.showToast('🛸 Odyssey-1 Probe deployed! Piloting online (WASD / Arrows to burn, R to refuel).');
  }

  applySpacecraftThrust(mode) {
    if (!this.spacecraftController || !this.spacecraftController.body) return;
    const body = this.spacecraftController.body;
    const vel = body.velocity;
    const speed = vel.mag();

    let dir = null;
    if (mode === 'prograde') {
      dir = speed > 0.05 ? new Vector2D(vel.x / speed, vel.y / speed) : new Vector2D(0, -1);
    } else if (mode === 'retrograde') {
      dir = speed > 0.05 ? new Vector2D(-vel.x / speed, -vel.y / speed) : new Vector2D(0, 1);
    } else if (mode === 'radial-in') {
      const star = this.engine.getBodies().find(b => (b.type === 'star' || b.type === 'pulsar') && b.id !== body.id);
      if (star) {
        const dx = star.position.x - body.position.x;
        const dy = star.position.y - body.position.y;
        const d = Math.hypot(dx, dy);
        dir = d > 0 ? new Vector2D(dx / d, dy / d) : new Vector2D(-1, 0);
      } else if (speed > 0.05) {
        dir = new Vector2D(-vel.y / speed, vel.x / speed);
      } else {
        dir = new Vector2D(-1, 0);
      }
    } else if (mode === 'radial-out') {
      const star = this.engine.getBodies().find(b => (b.type === 'star' || b.type === 'pulsar') && b.id !== body.id);
      if (star) {
        const dx = body.position.x - star.position.x;
        const dy = body.position.y - star.position.y;
        const d = Math.hypot(dx, dy);
        dir = d > 0 ? new Vector2D(dx / d, dy / d) : new Vector2D(1, 0);
      } else if (speed > 0.05) {
        dir = new Vector2D(vel.y / speed, -vel.x / speed);
      } else {
        dir = new Vector2D(1, 0);
      }
    }

    if (!dir) return;

    const burned = this.spacecraftController.applyThrust(dir, 0.15);
    if (burned > 0) {
      this.particles.emitThruster(body.position.x, body.position.y, dir.x, dir.y);
      this.audio.playThrusterSound();

      if (this.scThrustStatus) {
        this.scThrustStatus.textContent = mode.toUpperCase();
        this.scThrustStatus.className = 'sc-status-badge firing';
        clearTimeout(this._thrustTimeout);
        this._thrustTimeout = setTimeout(() => {
          if (this.scThrustStatus) {
            this.scThrustStatus.textContent = this.spacecraftController.isPropellantDepleted() ? 'DEPLETED' : 'STANDBY';
            this.scThrustStatus.className = this.spacecraftController.isPropellantDepleted() ? 'sc-status-badge depleted' : 'sc-status-badge';
          }
        }, 250);
      }
    } else if (this.spacecraftController.isPropellantDepleted()) {
      this.showToast('⚠ Propellant depleted! Press [R] to refuel Delta-v budget.');
      if (this.scThrustStatus) {
        this.scThrustStatus.textContent = 'DEPLETED';
        this.scThrustStatus.className = 'sc-status-badge depleted';
      }
    }
  }

  refuelSpacecraft() {
    if (!this.spacecraftController) return;
    this.spacecraftController.refuel();
    this.showToast('⚡ Propellant replenished! Delta-v budget restored to 100%.');
    if (this.scThrustStatus) {
      this.scThrustStatus.textContent = 'STANDBY';
      this.scThrustStatus.className = 'sc-status-badge';
    }
    this.updateSpacecraftHud();
  }

  despawnSpacecraft() {
    if (this.spacecraftController) {
      if (this.renderer.camera.targetBody === this.spacecraftController.body) {
        this.renderer.camera.targetBody = null;
      }
      this.engine.removeBody(this.spacecraftController.id);
      this.spacecraftController = null;
    }
    if (this.spacecraftHud) this.spacecraftHud.classList.add('hidden');
    this.showToast('Odyssey Probe flight session ended.');
  }

  updateSpacecraftHud() {
    if (!this.spacecraftController || !this.spacecraftHud) return;

    const scBody = this.engine.getBody(this.spacecraftController.id);
    if (!scBody) {
      this.spacecraftHud.classList.add('hidden');
      return;
    }

    this.spacecraftHud.classList.remove('hidden');

    if (this.scName) this.scName.textContent = this.spacecraftController.name.toUpperCase();

    const fuelPct = this.spacecraftController.getFuelPercentage();
    if (this.scFuelBar) {
      this.scFuelBar.style.width = `${fuelPct.toFixed(1)}%`;
      if (fuelPct > 50) {
        this.scFuelBar.className = 'sc-fuel-fill';
      } else if (fuelPct > 20) {
        this.scFuelBar.className = 'sc-fuel-fill warning';
      } else {
        this.scFuelBar.className = 'sc-fuel-fill critical';
      }
    }

    if (this.scDeltavVal) {
      this.scDeltavVal.textContent = `${this.spacecraftController.currentDeltaV.toFixed(1)} / ${this.spacecraftController.maxDeltaV.toFixed(1)} AU/s`;
    }

    if (this.scFuelPct) {
      this.scFuelPct.textContent = `${Math.round(fuelPct)}% CAPACITY`;
    }

    const speed = scBody.velocity.mag();
    if (this.scSpeedVal) {
      this.scSpeedVal.textContent = `${speed.toFixed(2)} AU/s`;
    }

    // Trajectory calculation for slingshot info
    const traj = this.spacecraftController.calculateTrajectoryPath({ steps: 250, dt: 0.15 });
    if (traj && traj.closestApproach) {
      const ca = traj.closestApproach;
      if (this.scSlingshotInfo) this.scSlingshotInfo.className = 'sc-slingshot-banner active';
      if (this.scSlingshotText) {
        if (traj.slingshotBoost > 0.05) {
          this.scSlingshotText.textContent = `GRAVITY ASSIST: +${traj.slingshotBoost.toFixed(2)} AU/s (${ca.bodyName})`;
        } else {
          this.scSlingshotText.textContent = `APPROACH: ${ca.bodyName} (${Math.round(ca.distance)} AU)`;
        }
      }
    } else {
      if (this.scSlingshotInfo) this.scSlingshotInfo.className = 'sc-slingshot-banner';
      if (this.scSlingshotText) {
        this.scSlingshotText.textContent = 'TRAJECTORY: HYPERBOLIC DRIFT';
      }
    }
  }
}
