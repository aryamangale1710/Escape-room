/**
 * Level Manager - Defines and manages game levels, checks solutions,
 * and tracks player progress with adaptive difficulty.
 */

// Use require for Node.js, or assume globals in browser
let engineModule;
if (typeof require !== 'undefined') {
  engineModule = require('./circuit');
}
const _ComponentType = (typeof ComponentType !== 'undefined') ? ComponentType : engineModule.ComponentType;
const _Battery = (typeof Battery !== 'undefined') ? Battery : engineModule.Battery;
const _Resistor = (typeof Resistor !== 'undefined') ? Resistor : engineModule.Resistor;
const _LED = (typeof LED !== 'undefined') ? LED : engineModule.LED;
const _Switch = (typeof Switch !== 'undefined') ? Switch : engineModule.Switch;
const _Wire = (typeof Wire !== 'undefined') ? Wire : engineModule.Wire;
const _LogicGate = (typeof LogicGate !== 'undefined') ? LogicGate : engineModule.LogicGate;
const _Circuit = (typeof Circuit !== 'undefined') ? Circuit : engineModule.Circuit;
const _Capacitor = (typeof Capacitor !== 'undefined') ? Capacitor : engineModule.Capacitor;
const _Inductor = (typeof Inductor !== 'undefined') ? Inductor : engineModule.Inductor;
const _Diode = (typeof Diode !== 'undefined') ? Diode : engineModule.Diode;
const _Transistor = (typeof Transistor !== 'undefined') ? Transistor : engineModule.Transistor;
const _Transformer = (typeof Transformer !== 'undefined') ? Transformer : engineModule.Transformer;
const _Potentiometer = (typeof Potentiometer !== 'undefined') ? Potentiometer : engineModule.Potentiometer;

/**
 * Level difficulty tiers.
 */
const Difficulty = Object.freeze({
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
});

/**
 * Level definitions for the game.
 */
const LEVELS = [
  {
    id: 1,
    title: 'The Light Switch',
    difficulty: Difficulty.BEGINNER,
    description: 'Connect the battery, switch, and LED to light up the room and unlock the door.',
    story: 'You wake up in a dark laboratory. A single LED sits on the workbench next to a battery and switch. Light up the room to find the exit!',
    objectives: ['Connect all components to form a complete circuit', 'Close the switch to light the LED'],
    availableComponents: [
      { type: _ComponentType.BATTERY, props: { voltage: 9 } },
      { type: _ComponentType.SWITCH, props: { closed: false } },
      { type: _ComponentType.LED, props: { forwardVoltage: 2, maxCurrent: 0.02 } },
      { type: _ComponentType.RESISTOR, props: { resistance: 350 } },
    ],
    preplacedComponents: [],
    checkSolution: function (circuit) {
      const result = circuit.simulate();
      if (!result.isComplete) return { passed: false, message: 'Circuit is not complete.' };
      const leds = [...circuit.components.values()].filter((c) => c instanceof _LED);
      const allLit = leds.length > 0 && leds.every((led) => led.isLit());
      if (!allLit) return { passed: false, message: 'The LED is not lit. Check your connections.' };
      return { passed: true, message: 'The LED lights up! The door unlocks.' };
    },
    hints: [
      'A circuit needs a complete loop for current to flow.',
      'Connect the battery to the resistor, then to the LED, and back to the battery.',
      'Don\'t forget to close the switch!',
    ],
    maxScore: 100,
    timeBonus: 60,
  },
  {
    id: 2,
    title: 'Ohm\'s Challenge',
    difficulty: Difficulty.BEGINNER,
    description: 'Select the correct resistor value so the current through the circuit is exactly 0.02A.',
    story: 'The door panel displays a target current: 20mA. Choose the right resistor to match it!',
    objectives: ['Use Ohm\'s Law (V = I × R) to calculate the needed resistance', 'Target current: 0.02A with a 9V battery'],
    availableComponents: [
      { type: _ComponentType.BATTERY, props: { voltage: 9 } },
      { type: _ComponentType.LED, props: { forwardVoltage: 2, maxCurrent: 0.02 } },
      { type: _ComponentType.RESISTOR, props: { resistance: 100 }, label: '100Ω' },
      { type: _ComponentType.RESISTOR, props: { resistance: 350 }, label: '350Ω' },
      { type: _ComponentType.RESISTOR, props: { resistance: 1000 }, label: '1000Ω' },
    ],
    preplacedComponents: [],
    checkSolution: function (circuit) {
      const result = circuit.simulate();
      if (!result.isComplete) return { passed: false, message: 'Circuit is not complete.' };
      const targetCurrent = 0.02;
      const tolerance = 0.005;
      if (Math.abs(result.totalCurrent - targetCurrent) <= tolerance) {
        return { passed: true, message: `Current is ${(result.totalCurrent * 1000).toFixed(1)}mA. Door unlocked!` };
      }
      return {
        passed: false,
        message: `Current is ${(result.totalCurrent * 1000).toFixed(1)}mA. Target is ${targetCurrent * 1000}mA. Try a different resistor.`,
      };
    },
    hints: [
      'Ohm\'s Law: V = I × R, so R = V / I',
      'The LED has a forward voltage of 2V, leaving 7V across the resistor.',
      'R = 7V / 0.02A = 350Ω',
    ],
    maxScore: 100,
    timeBonus: 90,
  },
  {
    id: 3,
    title: 'Diode Direction',
    difficulty: Difficulty.BEGINNER,
    description: 'Connect a diode in the correct direction to allow current flow and light the LED.',
    story: 'The lab door has a one-way current valve (diode). Connect it correctly — backwards and no current flows!',
    objectives: [
      'Place a battery, resistor (330Ω), diode, and LED',
      'Connect them in series with wires',
      'The diode must face forward for current to flow',
    ],
    availableComponents: [
      { type: _ComponentType.BATTERY, props: { voltage: 9 } },
      { type: _ComponentType.RESISTOR, props: { resistance: 330 }, label: '330Ω' },
      { type: _ComponentType.DIODE, props: { forwardVoltage: 0.7 } },
      { type: _ComponentType.LED, props: { forwardVoltage: 2, maxCurrent: 0.02 } },
    ],
    preplacedComponents: [],
    checkSolution: function (circuit) {
      const diodes = [...circuit.components.values()].filter((c) => c instanceof _Diode);
      if (diodes.length === 0) return { passed: false, message: 'Add a diode to the circuit.' };
      const result = circuit.simulate();
      if (!result.isComplete) return { passed: false, message: 'Circuit is not complete. Connect all components with wires.' };
      const leds = [...circuit.components.values()].filter((c) => c instanceof _LED);
      if (leds.length === 0 || !leds.every((l) => l.isLit())) {
        return { passed: false, message: 'LED is not lit. Check diode direction and wire connections.' };
      }
      return { passed: true, message: `Diode correctly placed! Current: ${(result.totalCurrent * 1000).toFixed(1)}mA. Door opens!` };
    },
    hints: [
      'A diode only allows current in one direction (forward bias).',
      'Connect: Battery(+) → Resistor → Diode(anode→cathode) → LED → Battery(−).',
      'The diode has ~0.7V forward voltage drop, adding to circuit resistance.',
    ],
    maxScore: 100,
    timeBonus: 90,
  },
  {
    id: 4,
    title: 'RC Charging Circuit',
    difficulty: Difficulty.INTERMEDIATE,
    description: 'Build an RC circuit. Choose the correct resistor to set a 1-second time constant (τ = R × C).',
    story: 'The lab timer needs a precise 1-second delay. Only an RC circuit can create this timing!',
    objectives: [
      'Place a battery, resistor, and capacitor (100μF)',
      'Connect all components in series with wires',
      'Target time constant τ = R × C = 1 second → use 10kΩ resistor',
    ],
    availableComponents: [
      { type: _ComponentType.BATTERY, props: { voltage: 9 } },
      { type: _ComponentType.RESISTOR, props: { resistance: 1000 }, label: '1kΩ' },
      { type: _ComponentType.RESISTOR, props: { resistance: 10000 }, label: '10kΩ' },
      { type: _ComponentType.RESISTOR, props: { resistance: 100000 }, label: '100kΩ' },
      { type: _ComponentType.CAPACITOR, props: { capacitance: 0.0001 } },
    ],
    preplacedComponents: [],
    checkSolution: function (circuit) {
      const capacitors = [...circuit.components.values()].filter((c) => c instanceof _Capacitor);
      if (capacitors.length === 0) return { passed: false, message: 'Add a capacitor to the circuit.' };
      const resistors = [...circuit.components.values()].filter((c) => c.type === _ComponentType.RESISTOR);
      if (resistors.length === 0) return { passed: false, message: 'Add a resistor to the circuit.' };
      const batteries = [...circuit.components.values()].filter((c) => c.type === _ComponentType.BATTERY);
      if (batteries.length === 0) return { passed: false, message: 'Add a battery to the circuit.' };
      if (!circuit.validateCircuitTopology()) {
        return { passed: false, message: 'Connect all components with wires.' };
      }
      const totalR = resistors.reduce((sum, r) => sum + r.getResistance(), 0);
      const totalC = capacitors.reduce((sum, c) => sum + c.getCapacitance(), 0);
      const tau = totalR * totalC;
      const targetTau = 1.0;
      if (Math.abs(tau - targetTau) <= 0.1) {
        return { passed: true, message: `RC circuit built! τ = ${tau.toFixed(2)}s. Timer set correctly!` };
      }
      return {
        passed: false,
        message: `Time constant τ = R×C = ${tau.toFixed(2)}s. Target is ${targetTau}s. Try a different resistor.`,
      };
    },
    hints: [
      'Time constant τ = R × C determines how fast the capacitor charges.',
      'With C = 100μF = 0.0001F, you need R = 1s / 0.0001F = 10,000Ω (10kΩ).',
      'Connect: Battery(+) → Resistor → Capacitor → Battery(−).',
    ],
    maxScore: 150,
    timeBonus: 120,
  },
  {
    id: 5,
    title: 'Transistor Switch',
    difficulty: Difficulty.INTERMEDIATE,
    description: 'Use a transistor as an electronic switch. Activate it to allow current to flow through the LED.',
    story: 'The lab has a remote-controlled door. A transistor acts as the switch — activate its base to open the circuit!',
    objectives: [
      'Place battery, resistor (470Ω), NPN transistor, and LED',
      'Connect all in series with wires',
      'Double-click the transistor to activate it (turn ON)',
    ],
    availableComponents: [
      { type: _ComponentType.BATTERY, props: { voltage: 9 } },
      { type: _ComponentType.RESISTOR, props: { resistance: 470 }, label: '470Ω' },
      { type: _ComponentType.TRANSISTOR, props: { transistorType: 'NPN', gain: 100 } },
      { type: _ComponentType.LED, props: { forwardVoltage: 2, maxCurrent: 0.02 } },
    ],
    preplacedComponents: [],
    checkSolution: function (circuit) {
      const transistors = [...circuit.components.values()].filter((c) => c instanceof _Transistor);
      if (transistors.length === 0) return { passed: false, message: 'Add a transistor to the circuit.' };
      if (!transistors.some((t) => t.isActive())) {
        return { passed: false, message: 'Transistor is off. Double-click it to activate the base!' };
      }
      const result = circuit.simulate();
      if (!result.isComplete) return { passed: false, message: 'Circuit is not complete. Connect all components with wires.' };
      const leds = [...circuit.components.values()].filter((c) => c instanceof _LED);
      if (leds.length === 0 || !leds.every((l) => l.isLit())) {
        return { passed: false, message: 'LED is not lit. Check your wire connections.' };
      }
      return { passed: true, message: `Transistor switch ON! Current: ${(result.totalCurrent * 1000).toFixed(1)}mA. Door opens!` };
    },
    hints: [
      'A transistor acts like an electrically controlled switch.',
      'Double-click the transistor component to "apply base current" and turn it ON.',
      'When ON, current flows: Battery → Resistor → Transistor → LED → Battery.',
    ],
    maxScore: 150,
    timeBonus: 120,
  },
  {
    id: 6,
    title: 'The Broken Lab',
    difficulty: Difficulty.INTERMEDIATE,
    description: 'The circuit is broken — draw wires to reconnect the battery and restore power to the LED.',
    story: 'This room\'s circuit was damaged in an explosion. The battery is disconnected! Draw wires to fix it.',
    objectives: [
      'The resistor and LED are already connected',
      'Draw a wire from Battery terminal A to the Resistor terminal A',
      'Draw a wire from Battery terminal B to the LED terminal B',
    ],
    availableComponents: [],
    preplacedComponents: [
      { type: _ComponentType.BATTERY, id: 'bat1', props: { voltage: 9 }, nodeA: 'n0', nodeB: null },
      { type: _ComponentType.RESISTOR, id: 'r1', props: { resistance: 350 }, nodeA: 'n1', nodeB: 'n2' },
      { type: _ComponentType.LED, id: 'led1', props: { forwardVoltage: 2, maxCurrent: 0.02 }, nodeA: 'n2', nodeB: 'n3' },
    ],
    checkSolution: function (circuit) {
      const result = circuit.simulate();
      if (!result.isComplete) return { passed: false, message: 'Circuit still has broken connections.' };
      const leds = [...circuit.components.values()].filter((c) => c instanceof _LED);
      const allLit = leds.length > 0 && leds.every((led) => led.isLit());
      if (!allLit) return { passed: false, message: 'LED is still not working. Keep debugging!' };
      return { passed: true, message: 'Circuit repaired! The emergency lights come back on.' };
    },
    hints: [
      'Click a terminal dot (green circle) on one component to start drawing a wire.',
      'Then click a terminal dot on another component to complete the connection.',
      'Battery A → Resistor A, and Battery B → LED B.',
    ],
    maxScore: 150,
    timeBonus: 150,
  },
  {
    id: 7,
    title: 'Transistor Amplifier',
    difficulty: Difficulty.ADVANCED,
    description: 'Build a transistor amplifier. Choose the correct resistor to achieve a collector current of 15–20mA.',
    story: 'The lab speaker needs a transistor amplifier to boost the unlock signal. Get the current just right!',
    objectives: [
      'Place battery, one resistor, transistor (NPN), and LED',
      'Connect with wires, then activate the transistor',
      'Target collector current: 15–20mA',
    ],
    availableComponents: [
      { type: _ComponentType.BATTERY, props: { voltage: 9 } },
      { type: _ComponentType.RESISTOR, props: { resistance: 100 }, label: '100Ω' },
      { type: _ComponentType.RESISTOR, props: { resistance: 470 }, label: '470Ω' },
      { type: _ComponentType.RESISTOR, props: { resistance: 2000 }, label: '2kΩ' },
      { type: _ComponentType.TRANSISTOR, props: { transistorType: 'NPN', gain: 200 } },
      { type: _ComponentType.LED, props: { forwardVoltage: 2, maxCurrent: 0.02 } },
    ],
    preplacedComponents: [],
    checkSolution: function (circuit) {
      const transistors = [...circuit.components.values()].filter((c) => c instanceof _Transistor);
      if (transistors.length === 0) return { passed: false, message: 'Add a transistor to the circuit.' };
      if (!transistors.some((t) => t.isActive())) {
        return { passed: false, message: 'Transistor is off. Double-click it to activate the base!' };
      }
      const result = circuit.simulate();
      if (!result.isComplete) return { passed: false, message: 'Circuit is not complete. Connect all components with wires.' };
      const leds = [...circuit.components.values()].filter((c) => c instanceof _LED);
      if (leds.length === 0 || !leds.every((l) => l.isLit())) {
        return { passed: false, message: 'LED is not lit. Check your connections.' };
      }
      const targetMin = 0.015;
      const targetMax = 0.020;
      if (result.totalCurrent >= targetMin && result.totalCurrent <= targetMax) {
        return { passed: true, message: `Amplifier tuned! Current: ${(result.totalCurrent * 1000).toFixed(1)}mA. Signal boosted!` };
      }
      return {
        passed: false,
        message: `Current: ${(result.totalCurrent * 1000).toFixed(1)}mA. Target: 15–20mA. Try the 470Ω resistor.`,
      };
    },
    hints: [
      'The transistor amplifies when its base is activated (double-click).',
      'Target 15–20mA: choose the resistor using Ohm\'s Law.',
      'With 9V, 470Ω + transistor(~0.1Ω) + LED(100Ω): I ≈ 9/570 ≈ 16mA.',
    ],
    maxScore: 200,
    timeBonus: 180,
  },
  {
    id: 8,
    title: 'RL Circuit',
    difficulty: Difficulty.ADVANCED,
    description: 'Build an RL (Resistor-Inductor) circuit. The inductor stores energy in its magnetic field.',
    story: 'The lab\'s electromagnetic lock needs an RL circuit to build up the magnetic field gradually!',
    objectives: [
      'Place a battery, resistor (100Ω), inductor, and LED',
      'Connect all in series with wires',
      'The RL time constant τ = L / R determines build-up speed',
    ],
    availableComponents: [
      { type: _ComponentType.BATTERY, props: { voltage: 9 } },
      { type: _ComponentType.RESISTOR, props: { resistance: 100 }, label: '100Ω' },
      { type: _ComponentType.RESISTOR, props: { resistance: 470 }, label: '470Ω' },
      { type: _ComponentType.INDUCTOR, props: { inductance: 0.01 } },
      { type: _ComponentType.LED, props: { forwardVoltage: 2, maxCurrent: 0.02 } },
    ],
    preplacedComponents: [],
    checkSolution: function (circuit) {
      const inductors = [...circuit.components.values()].filter((c) => c instanceof _Inductor);
      if (inductors.length === 0) return { passed: false, message: 'Add an inductor to the circuit.' };
      const result = circuit.simulate();
      if (!result.isComplete) return { passed: false, message: 'Circuit is not complete. Connect all components with wires.' };
      const leds = [...circuit.components.values()].filter((c) => c instanceof _LED);
      if (leds.length === 0 || !leds.every((l) => l.isLit())) {
        return { passed: false, message: 'LED is not lit. Check your connections.' };
      }
      const resistors = [...circuit.components.values()].filter((c) => c.type === _ComponentType.RESISTOR);
      const totalR = resistors.reduce((sum, r) => sum + r.getResistance(), 0);
      const totalL = inductors.reduce((sum, l) => sum + l.getInductance(), 0);
      const tau = totalR > 0 ? totalL / totalR : 0;
      return { passed: true, message: `RL circuit complete! τ = L/R = ${(tau * 1000).toFixed(2)}ms. Magnetic lock engaged!` };
    },
    hints: [
      'RL time constant: τ = L / R (in seconds).',
      'The inductor has very low DC resistance, so it barely limits current.',
      'Connect: Battery(+) → Resistor → Inductor → LED → Battery(−).',
    ],
    maxScore: 200,
    timeBonus: 180,
  },
  {
    id: 9,
    title: 'Final Escape',
    difficulty: Difficulty.ADVANCED,
    description: 'Combine all your knowledge! Build the ultimate circuit using transistor, capacitor, and diode together.',
    story: 'The final vault uses a multi-component protection circuit. Only by mastering all components can you escape!',
    objectives: [
      'Place a battery, resistor, transistor, capacitor, diode, and LED',
      'Connect all components with wires',
      'Activate the transistor to complete the challenge',
    ],
    availableComponents: [
      { type: _ComponentType.BATTERY, props: { voltage: 9 } },
      { type: _ComponentType.RESISTOR, props: { resistance: 470 }, label: '470Ω' },
      { type: _ComponentType.TRANSISTOR, props: { transistorType: 'NPN', gain: 100 } },
      { type: _ComponentType.CAPACITOR, props: { capacitance: 0.0001 } },
      { type: _ComponentType.DIODE, props: { forwardVoltage: 0.7 } },
      { type: _ComponentType.LED, props: { forwardVoltage: 2, maxCurrent: 0.02 } },
    ],
    preplacedComponents: [],
    checkSolution: function (circuit) {
      const batteries = [...circuit.components.values()].filter((c) => c.type === _ComponentType.BATTERY);
      const transistors = [...circuit.components.values()].filter((c) => c instanceof _Transistor);
      const capacitors = [...circuit.components.values()].filter((c) => c instanceof _Capacitor);
      const diodes = [...circuit.components.values()].filter((c) => c instanceof _Diode);
      const leds = [...circuit.components.values()].filter((c) => c instanceof _LED);

      if (batteries.length === 0) return { passed: false, message: 'Add a battery.' };
      if (transistors.length === 0) return { passed: false, message: 'Add a transistor.' };
      if (capacitors.length === 0) return { passed: false, message: 'Add a capacitor.' };
      if (diodes.length === 0) return { passed: false, message: 'Add a diode.' };
      if (leds.length === 0) return { passed: false, message: 'Add an LED.' };

      if (!transistors.some((t) => t.isActive())) {
        return { passed: false, message: 'Activate the transistor (double-click it).' };
      }
      if (!circuit.validateCircuitTopology()) {
        return { passed: false, message: 'Connect all components with wires to form a complete circuit.' };
      }
      return { passed: true, message: 'All components connected! The vault opens. You escape! Congratulations!' };
    },
    hints: [
      'This level combines: battery, resistor, transistor, capacitor, diode, and LED.',
      'Connect them all in a series circuit then double-click the transistor.',
      'The capacitor has high DC resistance but the topology check just requires everything wired.',
    ],
    maxScore: 300,
    timeBonus: 300,
  },
];

/**
 * ScoreTracker - Tracks player score and progress.
 */
class ScoreTracker {
  constructor() {
    this.totalScore = 0;
    this.levelScores = new Map();
    this.levelStars = new Map();
    this.hintsUsed = new Map();
    this.attempts = new Map();
    this.completedLevels = new Set();
  }

  recordAttempt(levelId) {
    const current = this.attempts.get(levelId) || 0;
    this.attempts.set(levelId, current + 1);
  }

  recordHintUsed(levelId) {
    const current = this.hintsUsed.get(levelId) || 0;
    this.hintsUsed.set(levelId, current + 1);
  }

  calculateScore(levelId, timeElapsed, maxScore, timeBonus) {
    const attempts = this.attempts.get(levelId) || 1;
    const hints = this.hintsUsed.get(levelId) || 0;

    let score = maxScore;

    // Deduct for extra attempts (first attempt is free)
    score -= Math.max(0, (attempts - 1) * 10);

    // Deduct for hints used
    score -= hints * 15;

    // Time bonus
    if (timeElapsed < timeBonus) {
      score += Math.floor((timeBonus - timeElapsed) / timeBonus * 50);
    }

    score = Math.max(0, score);

    // Star rating
    const starThresholds = [maxScore * 0.3, maxScore * 0.6, maxScore * 0.9];
    let stars = 0;
    if (score >= starThresholds[0]) stars = 1;
    if (score >= starThresholds[1]) stars = 2;
    if (score >= starThresholds[2]) stars = 3;

    this.levelScores.set(levelId, score);
    this.levelStars.set(levelId, stars);
    this.totalScore += score;
    this.completedLevels.add(levelId);

    return { score, stars, totalScore: this.totalScore };
  }

  getProgress() {
    return {
      totalScore: this.totalScore,
      completedLevels: [...this.completedLevels],
      levelScores: Object.fromEntries(this.levelScores),
      levelStars: Object.fromEntries(this.levelStars),
    };
  }

  isLevelUnlocked(levelId) {
    if (levelId === 1) return true;
    return this.completedLevels.has(levelId - 1);
  }
}

/**
 * AdaptiveDifficulty - Adjusts difficulty based on player performance.
 */
class AdaptiveDifficulty {
  constructor() {
    this.performanceHistory = [];
    this.currentModifier = 1.0;
  }

  recordPerformance(levelId, score, maxScore, attempts, hintsUsed) {
    const performance = score / maxScore;
    this.performanceHistory.push({
      levelId,
      performance,
      attempts,
      hintsUsed,
    });
    this._updateModifier();
  }

  _updateModifier() {
    if (this.performanceHistory.length < 2) return;

    const recent = this.performanceHistory.slice(-3);
    const avgPerformance = recent.reduce((sum, p) => sum + p.performance, 0) / recent.length;
    const avgHints = recent.reduce((sum, p) => sum + p.hintsUsed, 0) / recent.length;

    if (avgPerformance > 0.8 && avgHints < 1) {
      this.currentModifier = Math.min(1.5, this.currentModifier + 0.1);
    } else if (avgPerformance < 0.4 || avgHints > 2) {
      this.currentModifier = Math.max(0.5, this.currentModifier - 0.1);
    }
  }

  getModifier() {
    return this.currentModifier;
  }

  shouldShowExtraHint() {
    if (this.performanceHistory.length === 0) return false;
    const last = this.performanceHistory[this.performanceHistory.length - 1];
    return last.performance < 0.3 || last.attempts > 5;
  }

  getDifficultyLabel() {
    if (this.currentModifier > 1.2) return 'Challenge Mode';
    if (this.currentModifier < 0.8) return 'Assisted Mode';
    return 'Normal';
  }
}

/**
 * LevelManager - Central coordinator for game levels.
 */
class LevelManager {
  constructor() {
    this.levels = LEVELS;
    this.currentLevelIndex = 0;
    this.scoreTracker = new ScoreTracker();
    this.adaptiveDifficulty = new AdaptiveDifficulty();
    this.levelStartTime = null;
  }

  getCurrentLevel() {
    return this.levels[this.currentLevelIndex] || null;
  }

  getLevelById(id) {
    return this.levels.find((l) => l.id === id) || null;
  }

  getAllLevels() {
    return this.levels.map((level) => ({
      id: level.id,
      title: level.title,
      difficulty: level.difficulty,
      description: level.description,
      unlocked: this.scoreTracker.isLevelUnlocked(level.id),
      completed: this.scoreTracker.completedLevels.has(level.id),
      stars: this.scoreTracker.levelStars.get(level.id) || 0,
    }));
  }

  startLevel(levelId) {
    const level = this.getLevelById(levelId);
    if (!level) return null;
    if (!this.scoreTracker.isLevelUnlocked(levelId)) return null;

    this.currentLevelIndex = this.levels.indexOf(level);
    this.levelStartTime = Date.now();
    return level;
  }

  checkSolution(circuit) {
    const level = this.getCurrentLevel();
    if (!level) return { passed: false, message: 'No active level.' };

    this.scoreTracker.recordAttempt(level.id);
    const result = level.checkSolution(circuit);

    if (result.passed) {
      const timeElapsed = Math.floor((Date.now() - this.levelStartTime) / 1000);
      const scoreResult = this.scoreTracker.calculateScore(
        level.id, timeElapsed, level.maxScore, level.timeBonus
      );
      this.adaptiveDifficulty.recordPerformance(
        level.id,
        scoreResult.score,
        level.maxScore,
        this.scoreTracker.attempts.get(level.id) || 1,
        this.scoreTracker.hintsUsed.get(level.id) || 0
      );
      return { ...result, ...scoreResult };
    }

    return result;
  }

  getHint(levelId) {
    const level = this.getLevelById(levelId || this.getCurrentLevel()?.id);
    if (!level) return null;

    const hintsUsed = this.scoreTracker.hintsUsed.get(level.id) || 0;
    this.scoreTracker.recordHintUsed(level.id);

    if (hintsUsed < level.hints.length) {
      return level.hints[hintsUsed];
    }
    return level.hints[level.hints.length - 1];
  }

  nextLevel() {
    if (this.currentLevelIndex < this.levels.length - 1) {
      this.currentLevelIndex++;
      this.levelStartTime = Date.now();
      return this.getCurrentLevel();
    }
    return null;
  }

  getProgress() {
    return {
      ...this.scoreTracker.getProgress(),
      currentLevel: this.currentLevelIndex + 1,
      totalLevels: this.levels.length,
      difficultyMode: this.adaptiveDifficulty.getDifficultyLabel(),
    };
  }

  saveProgress() {
    if (typeof localStorage === 'undefined') return false;
    const data = JSON.stringify(this.getProgress());
    localStorage.setItem('circuitEscape_progress', data);
    return true;
  }

  loadProgress() {
    if (typeof localStorage === 'undefined') return false;
    const data = localStorage.getItem('circuitEscape_progress');
    if (!data) return false;
    try {
      const progress = JSON.parse(data);
      for (const levelId of progress.completedLevels || []) {
        this.scoreTracker.completedLevels.add(levelId);
      }
      for (const [id, score] of Object.entries(progress.levelScores || {})) {
        this.scoreTracker.levelScores.set(Number(id), score);
      }
      for (const [id, stars] of Object.entries(progress.levelStars || {})) {
        this.scoreTracker.levelStars.set(Number(id), stars);
      }
      this.scoreTracker.totalScore = progress.totalScore || 0;
      return true;
    } catch {
      return false;
    }
  }
}

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Difficulty,
    LEVELS,
    ScoreTracker,
    AdaptiveDifficulty,
    LevelManager,
  };
}
