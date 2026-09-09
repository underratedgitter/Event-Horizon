/**
 * CosmicAudio - Procedural Web Audio synthesizer for cosmic atmosphere & collisions
 */
export class CosmicAudio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.droneGain = null;
    this.droneFilter = null;
    this.crackleGain = null;
    this.crackleSource = null;
    this.isMuted = false;
    this.initialized = false;

    // Mixer Settings
    this.droneLevel = 0.08;
    this.droneResonance = 140; // Hz
    this.crackleLevel = 0.03;
    this.boomGainLevel = 1.0;
  }

  init() {
    if (this.initialized) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.setupAmbientDrone();
      this.setupRadioCrackle();
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio could not be initialized:', e);
    }
  }

  setupAmbientDrone() {
    if (!this.ctx) return;

    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(this.droneLevel, this.ctx.currentTime);

    // Filter for warm dark celestial sound
    this.droneFilter = this.ctx.createBiquadFilter();
    this.droneFilter.type = 'lowpass';
    this.droneFilter.frequency.setValueAtTime(this.droneResonance, this.ctx.currentTime);
    this.droneFilter.Q.setValueAtTime(2.0, this.ctx.currentTime);

    // Osc 1: Sub-bass fundamental (55 Hz - A1)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(55, this.ctx.currentTime);

    // Osc 2: Harmonic fifth (82.5 Hz - E2)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(82.4, this.ctx.currentTime);

    // LFO to slowly sweep filter cutoff
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.08, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(50, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(this.droneFilter.frequency);

    osc1.connect(this.droneFilter);
    osc2.connect(this.droneFilter);
    this.droneFilter.connect(this.droneGain);
    this.droneGain.connect(this.masterGain);

    osc1.start();
    osc2.start();
    lfo.start();
  }

  setupRadioCrackle() {
    if (!this.ctx) return;

    // Generate 2 seconds of procedural stellar radio cosmic noise buffer
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    let lastVal = 0;
    for (let i = 0; i < bufferSize; i++) {
      // Brown noise with micro static spikes (simulating interstellar radio bursts)
      const white = Math.random() * 2 - 1;
      lastVal = (lastVal + 0.04 * white) / 1.04;
      const spike = Math.random() > 0.985 ? (Math.random() * 2 - 1) * 0.4 : 0;
      data[i] = (lastVal * 0.6 + spike);
    }

    this.crackleSource = this.ctx.createBufferSource();
    this.crackleSource.buffer = buffer;
    this.crackleSource.loop = true;

    // Resonant bandpass filter to mimic celestial radio telescope signal
    const crackleFilter = this.ctx.createBiquadFilter();
    crackleFilter.type = 'bandpass';
    crackleFilter.frequency.setValueAtTime(1600, this.ctx.currentTime);
    crackleFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);

    this.crackleGain = this.ctx.createGain();
    this.crackleGain.gain.setValueAtTime(this.crackleLevel, this.ctx.currentTime);

    this.crackleSource.connect(crackleFilter);
    crackleFilter.connect(this.crackleGain);
    this.crackleGain.connect(this.masterGain);

    this.crackleSource.start();
  }

  setDroneGain(val) {
    const v = (typeof val === 'number' && !Number.isNaN(val)) ? val : 0;
    this.droneLevel = Math.max(0, Math.min(1.0, v));
    if (this.droneGain && this.ctx && this.droneGain.gain) {
      this.droneGain.gain.setValueAtTime(this.droneLevel, this.ctx.currentTime);
    }
  }

  setDroneResonance(freq) {
    const v = (typeof freq === 'number' && !Number.isNaN(freq)) ? freq : 140;
    this.droneResonance = Math.max(50, Math.min(600, v));
    if (this.droneFilter && this.ctx && this.droneFilter.frequency) {
      this.droneFilter.frequency.setValueAtTime(this.droneResonance, this.ctx.currentTime);
    }
  }

  setCrackleGain(val) {
    const v = (typeof val === 'number' && !Number.isNaN(val)) ? val : 0;
    this.crackleLevel = Math.max(0, Math.min(1.0, v));
    if (this.crackleGain && this.ctx && this.crackleGain.gain) {
      this.crackleGain.gain.setValueAtTime(this.crackleLevel, this.ctx.currentTime);
    }
  }

  setBoomGain(val) {
    if (Number.isNaN(val)) {
      this.boomGainLevel = 1.0;
    } else if (val === Infinity) {
      this.boomGainLevel = 3.0;
    } else if (val === -Infinity) {
      this.boomGainLevel = 0;
    } else {
      this.boomGainLevel = Math.max(0, Math.min(3.0, Number(val) || 1.0));
    }
  }

  playCollisionSound(intensity = 1.0) {
    if (!this.ctx || this.isMuted) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;
    const safeIntensity = Number.isFinite(intensity) ? Math.max(0, intensity) : 1.0;
    const safeBoom = Number.isFinite(this.boomGainLevel) ? Math.max(0, this.boomGainLevel) : 1.0;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Pitch sweep downwards (cosmic impact boom)
    const startFreq = Math.max(20, Math.min(220, 90 + safeIntensity * 20));
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(32, t + 0.6);

    const baseGain = Math.max(0.001, Math.min(0.5, 0.15 * Math.log10(1 + safeIntensity))) * safeBoom;
    gain.gain.setValueAtTime(baseGain, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch (e) {}
    };

    osc.start(t);
    osc.stop(t + 0.7);
  }

  playTidalSound() {
    if (!this.ctx || this.isMuted) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;
    const safeBoom = Number.isFinite(this.boomGainLevel) ? Math.max(0, this.boomGainLevel) : 1.0;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(360, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.4);

    gain.gain.setValueAtTime(Math.max(0.001, 0.12 * safeBoom), t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, t);
    filter.Q.setValueAtTime(4, t);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.onended = () => {
      try {
        osc.disconnect();
        filter.disconnect();
        gain.disconnect();
      } catch (e) {}
    };

    osc.start(t);
    osc.stop(t + 0.5);
  }

  playSupernovaSound() {
    if (!this.ctx || this.isMuted) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;
    const safeBoom = Number.isFinite(this.boomGainLevel) ? Math.max(0, this.boomGainLevel) : 1.0;

    // 1. Sub-Bass Fundamental Rumble Sweep (50 Hz down to 18 Hz infrasound)
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(54, t);
    subOsc.frequency.exponentialRampToValueAtTime(18, t + 2.2);

    const subLevel = Math.max(0.001, Math.min(0.85, 0.45 * safeBoom));
    subGain.gain.setValueAtTime(subLevel, t);
    subGain.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);

    subOsc.onended = () => {
      try {
        subOsc.disconnect();
        subGain.disconnect();
      } catch (e) {}
    };

    subOsc.start(t);
    subOsc.stop(t + 2.5);

    // 2. High-energy Relativistic Plasma Shock Front (Sawtooth through resonant Lowpass)
    const plasmaOsc = this.ctx.createOscillator();
    const plasmaFilter = this.ctx.createBiquadFilter();
    const plasmaGain = this.ctx.createGain();

    plasmaOsc.type = 'sawtooth';
    plasmaOsc.frequency.setValueAtTime(140, t);
    plasmaOsc.frequency.exponentialRampToValueAtTime(26, t + 1.8);

    plasmaFilter.type = 'lowpass';
    plasmaFilter.frequency.setValueAtTime(900, t);
    plasmaFilter.frequency.exponentialRampToValueAtTime(45, t + 1.6);
    plasmaFilter.Q.setValueAtTime(3.5, t);

    plasmaGain.gain.setValueAtTime(Math.max(0.001, Math.min(0.5, 0.3 * safeBoom)), t);
    plasmaGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);

    plasmaOsc.connect(plasmaFilter);
    plasmaFilter.connect(plasmaGain);
    plasmaGain.connect(this.masterGain);

    plasmaOsc.onended = () => {
      try {
        plasmaOsc.disconnect();
        plasmaFilter.disconnect();
        plasmaGain.disconnect();
      } catch (e) {}
    };

    plasmaOsc.start(t);
    plasmaOsc.stop(t + 1.9);

    // 3. Detonation Noise Impact Transient
    try {
      const sampleRate = this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, Math.floor(sampleRate * 1.2), sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < noiseBuffer.length; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.08 * white) / 1.08;
        output[i] = last;
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(650, t);
      noiseFilter.frequency.exponentialRampToValueAtTime(40, t + 1.2);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(Math.max(0.001, Math.min(0.6, 0.35 * safeBoom)), t);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      noiseSource.onended = () => {
        try {
          noiseSource.disconnect();
          noiseFilter.disconnect();
          noiseGain.disconnect();
        } catch (e) {}
      };

      noiseSource.start(t);
      noiseSource.stop(t + 1.3);
    } catch (e) {
      // Noise buffer fallback
    }
  }

  playVictorySound() {
    if (!this.ctx || this.isMuted) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, idx) => {
      const noteTime = t + idx * 0.09;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.18, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.6);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch (e) {}
      };

      osc.start(noteTime);
      osc.stop(noteTime + 0.65);
    });
  }

  playFailureSound() {
    if (!this.ctx || this.isMuted) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;
    // Dissonant warning tritone klaxon (F#3 and C4)
    const tones = [185.0, 261.63];

    for (let cycle = 0; cycle < 2; cycle++) {
      const pulseTime = t + cycle * 0.22;
      tones.forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, pulseTime);

        gain.gain.setValueAtTime(0.15, pulseTime);
        gain.gain.exponentialRampToValueAtTime(0.001, pulseTime + 0.18);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, pulseTime);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.onended = () => {
          try {
            osc.disconnect();
            filter.disconnect();
            gain.disconnect();
          } catch (e) {}
        };

        osc.start(pulseTime);
        osc.stop(pulseTime + 0.2);
      });
    }
  }

  playThrusterSound() {
    if (!this.ctx || this.isMuted) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(85, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.08);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, t);
    filter.Q.setValueAtTime(2.0, t);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.onended = () => {
      try {
        osc.disconnect();
        filter.disconnect();
        gain.disconnect();
      } catch (e) {}
    };

    osc.start(t);
    osc.stop(t + 0.09);
  }

  toggleMute() {
    this.init();
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
    return this.isMuted;
  }
}


