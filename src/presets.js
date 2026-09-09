import { Vector2D } from './physics.js';

export const Presets = {
  solarSystem(engine) {
    engine.clear();
    engine.G = 2.0;
    engine.softening = 4.0;

    const sunMass = 16000;
    // Sun
    engine.addBody({
      id: 'sun',
      name: 'Sun',
      type: 'star',
      mass: sunMass,
      radius: 22,
      position: new Vector2D(0, 0),
      velocity: new Vector2D(0, 0),
      color: '#ffaa00',
      fixed: false,
    });

    const G = engine.G;
    const calcOrbitalVelocity = (r, M = sunMass) => Math.sqrt((G * M) / r);

    const planets = [
      { name: 'Mercury', r: 65, mass: 1.5, radius: 3.5, color: '#a08b7d' },
      { name: 'Venus', r: 100, mass: 4.8, radius: 5.5, color: '#e3bb76' },
      { name: 'Earth', r: 150, mass: 6.0, radius: 6.0, color: '#3f93f1', hasMoon: true },
      { name: 'Mars', r: 205, mass: 2.2, radius: 4.2, color: '#d6512b' },
      { name: 'Jupiter', r: 320, mass: 120, radius: 13.0, color: '#c49969' },
      { name: 'Saturn', r: 440, mass: 70, radius: 11.0, color: '#dfc89e', hasRings: true },
      { name: 'Uranus', r: 560, mass: 35, radius: 8.5, color: '#76d7ea' },
      { name: 'Neptune', r: 670, mass: 35, radius: 8.0, color: '#2753d8' },
    ];

    for (const p of planets) {
      const v = calcOrbitalVelocity(p.r);
      const planetBody = engine.addBody({
        name: p.name,
        type: 'planet',
        mass: p.mass,
        radius: p.radius,
        position: new Vector2D(p.r, 0),
        velocity: new Vector2D(0, v),
        color: p.color,
        hasRings: p.hasRings,
      });

      if (p.hasMoon) {
        const moonDist = 14;
        const moonOrbitalV = Math.sqrt((G * p.mass) / moonDist);
        engine.addBody({
          name: 'Moon',
          type: 'moon',
          mass: 0.2,
          radius: 2.0,
          position: new Vector2D(p.r + moonDist, 0),
          velocity: new Vector2D(0, v + moonOrbitalV),
          color: '#cccccc',
        });
      }
    }

    // Asteroid belt
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 245 + Math.random() * 40;
      const v = calcOrbitalVelocity(r);
      engine.addBody({
        name: `Asteroid ${i + 1}`,
        type: 'debris',
        mass: 0.05,
        radius: 1.5,
        position: new Vector2D(Math.cos(angle) * r, Math.sin(angle) * r),
        velocity: new Vector2D(-Math.sin(angle) * v, Math.cos(angle) * v),
        color: '#8b8378',
        maxTrailLength: 40,
      });
    }
  },

  binaryStars(engine) {
    engine.clear();
    engine.G = 2.5;
    engine.softening = 5.0;

    const starMass = 8000;
    const separation = 140;
    const r = separation / 2;
    // Mutual circular orbit velocity: v = sqrt(G * M / (4 * r))
    const v = Math.sqrt((engine.G * starMass) / (4 * r));

    // Star Alpha
    engine.addBody({
      name: 'Alpha Centauri A',
      type: 'star',
      mass: starMass,
      radius: 18,
      position: new Vector2D(-r, 0),
      velocity: new Vector2D(0, -v),
      color: '#ffbb33',
    });

    // Star Beta
    engine.addBody({
      name: 'Alpha Centauri B',
      type: 'star',
      mass: starMass,
      radius: 16,
      position: new Vector2D(r, 0),
      velocity: new Vector2D(0, v),
      color: '#33aaff',
    });

    // Circumbinary Planet 1
    const cbDist1 = 280;
    const cbV1 = Math.sqrt((engine.G * starMass * 2) / cbDist1);
    engine.addBody({
      name: 'Tatooine Prime',
      type: 'planet',
      mass: 8,
      radius: 6,
      position: new Vector2D(0, cbDist1),
      velocity: new Vector2D(-cbV1, 0),
      color: '#e6a15c',
    });

    // Circumbinary Planet 2
    const cbDist2 = 420;
    const cbV2 = Math.sqrt((engine.G * starMass * 2) / cbDist2);
    engine.addBody({
      name: 'Solaris',
      type: 'planet',
      mass: 15,
      radius: 8,
      position: new Vector2D(cbDist2, 0),
      velocity: new Vector2D(0, cbV2),
      color: '#9876aa',
    });

    // Chaotic asteroid weaving figure-8
    engine.addBody({
      name: 'Chaotic Comet',
      type: 'debris',
      mass: 0.1,
      radius: 2.2,
      position: new Vector2D(0, 110),
      velocity: new Vector2D(6.2, 0),
      color: '#00ffcc',
      maxTrailLength: 200,
    });
  },

  blackHoleFeasting(engine) {
    engine.clear();
    engine.G = 3.0;
    engine.softening = 3.0;

    const bhMass = 35000;
    // Supermassive Black Hole
    engine.addBody({
      name: 'Gargantua',
      type: 'black-hole',
      mass: bhMass,
      radius: 26,
      position: new Vector2D(0, 0),
      velocity: new Vector2D(0, 0),
      fixed: true,
    });

    // Swirling inner accretion disk particles
    for (let i = 0; i < 40; i++) {
      const dist = 50 + Math.random() * 90;
      const angle = Math.random() * Math.PI * 2;
      const v = Math.sqrt((engine.G * bhMass) / dist) * (0.98 + Math.random() * 0.04);
      engine.addBody({
        name: `Accretion Dust`,
        type: 'debris',
        mass: 0.05,
        radius: 1.5,
        position: new Vector2D(Math.cos(angle) * dist, Math.sin(angle) * dist),
        velocity: new Vector2D(-Math.sin(angle) * v, Math.cos(angle) * v),
        color: i % 2 === 0 ? '#ffaa33' : '#44ccff',
        maxTrailLength: 40,
      });
    }

    // Doomed Star on inbound encounter trajectory
    engine.addBody({
      name: 'Doomed Red Giant',
      type: 'star',
      mass: 1200,
      radius: 15,
      position: new Vector2D(-380, 200),
      velocity: new Vector2D(11.5, -4.2),
      color: '#ff3322',
      maxTrailLength: 250,
    });

    // Infalling planetary system
    engine.addBody({
      name: 'Exoplanet A',
      type: 'planet',
      mass: 4,
      radius: 4.5,
      position: new Vector2D(-360, 225),
      velocity: new Vector2D(12.0, -3.8),
      color: '#33ffaa',
      maxTrailLength: 180,
    });
  },

  galaxyCollision(engine) {
    engine.clear();
    engine.G = 2.0;
    engine.softening = 8.0;

    const spawnGalaxy = (center, vel, starColor, numStars) => {
      const coreMass = 12000;
      // Central black hole
      engine.addBody({
        name: `Galactic Core`,
        type: 'black-hole',
        mass: coreMass,
        radius: 18,
        position: center.clone(),
        velocity: vel.clone(),
      });

      // Disc of stars
      for (let i = 0; i < numStars; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = 35 + Math.random() * 140;
        const orbitalV = Math.sqrt((engine.G * coreMass) / r);

        const pos = new Vector2D(
          center.x + Math.cos(angle) * r,
          center.y + Math.sin(angle) * r
        );
        const v = new Vector2D(
          vel.x - Math.sin(angle) * orbitalV,
          vel.y + Math.cos(angle) * orbitalV
        );

        engine.addBody({
          name: `Star`,
          type: 'debris',
          mass: 0.1,
          radius: 1.6,
          position: pos,
          velocity: v,
          color: starColor,
          maxTrailLength: 35,
        });
      }
    };

    spawnGalaxy(new Vector2D(-220, -60), new Vector2D(2.4, 0.9), '#66bbff', 55);
    spawnGalaxy(new Vector2D(220, 60), new Vector2D(-2.4, -0.9), '#ffaa44', 55);
  },

  trojanAsteroids(engine) {
    engine.clear();
    engine.G = 2.5;
    engine.softening = 4.0;

    const sunMass = 20000;
    engine.addBody({
      name: 'Sun',
      type: 'star',
      mass: sunMass,
      radius: 24,
      position: new Vector2D(0, 0),
      velocity: new Vector2D(0, 0),
      color: '#ffbb00',
    });

    const jupiterDist = 280;
    const jupiterMass = 350;
    const jupiterSpeed = Math.sqrt((engine.G * sunMass) / jupiterDist);

    engine.addBody({
      name: 'Jupiter',
      type: 'planet',
      mass: jupiterMass,
      radius: 12,
      position: new Vector2D(jupiterDist, 0),
      velocity: new Vector2D(0, jupiterSpeed),
      color: '#d4a373',
    });

    // L4 and L5 Lagrange points (+60 and -60 degrees)
    const addTrojanCluster = (baseAngle, clusterName, color) => {
      for (let i = 0; i < 14; i++) {
        const dAngle = (Math.random() - 0.5) * 0.18;
        const angle = baseAngle + dAngle;
        const r = jupiterDist + (Math.random() - 0.5) * 16;
        const v = Math.sqrt((engine.G * sunMass) / r);

        engine.addBody({
          name: `${clusterName} ${i + 1}`,
          type: 'debris',
          mass: 0.05,
          radius: 1.8,
          position: new Vector2D(Math.cos(angle) * r, Math.sin(angle) * r),
          velocity: new Vector2D(-Math.sin(angle) * v, Math.cos(angle) * v),
          color: color,
          maxTrailLength: 50,
        });
      }
    };

    addTrojanCluster(Math.PI / 3, 'Trojan', '#00e5ff');
    addTrojanCluster(-Math.PI / 3, 'Greek', '#e040fb');
  },

  pulsarSystem(engine) {
    engine.clear();
    engine.G = 2.0;
    engine.softening = 3.5;

    const pulsarMass = 16000;
    // Central Millisecond Pulsar
    const pulsar = engine.addBody({
      id: 'pulsar-core',
      name: 'PSR B1919+21 (Pulsar)',
      type: 'pulsar',
      mass: pulsarMass,
      radius: 10,
      position: new Vector2D(0, 0),
      velocity: new Vector2D(0, 0),
      color: '#00e5ff',
      magneticTilt: 0.52,
      spinPeriod: 0.8,
    });

    // Orbiting Diamond World
    engine.addBody({
      name: 'PSR J1719b (Diamond World)',
      type: 'planet',
      mass: 14,
      radius: 6,
      position: new Vector2D(135, 0),
      velocity: new Vector2D(0, Math.sqrt((engine.G * pulsarMass) / 135)),
      color: '#c084fc',
      maxTrailLength: 140,
    });

    // Outer Ice Planet
    engine.addBody({
      name: 'Poltergeist (Outer Planet)',
      type: 'planet',
      mass: 22,
      radius: 7.5,
      position: new Vector2D(-230, 0),
      velocity: new Vector2D(0, -Math.sqrt((engine.G * pulsarMass) / 230)),
      color: '#38bdf8',
      maxTrailLength: 160,
    });

    // Relativistic synchrotron debris ring
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2 + (Math.random() - 0.5) * 0.1;
      const dist = 65 + Math.random() * 25;
      const v = Math.sqrt((engine.G * pulsarMass) / dist);
      engine.addBody({
        name: `Synchrotron Debris ${i + 1}`,
        type: 'debris',
        mass: 0.05,
        radius: 1.6,
        position: new Vector2D(Math.cos(angle) * dist, Math.sin(angle) * dist),
        velocity: new Vector2D(-Math.sin(angle) * v, Math.cos(angle) * v),
        color: '#f43f5e',
        maxTrailLength: 45,
      });
    }
  },
};
