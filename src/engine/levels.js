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
    title: 'The Brightness Puzzle',
    difficulty: Difficulty.BEGINNER,
    description: 'Adjust the resistance to make the LED glow at exactly 50% brightness.',
    story: 'The security scanner requires a specific light level. Too bright or too dim and the alarm sounds!',
    objectives: ['Control LED brightness by adjusting resistance', 'Target: 50% brightness (half of maximum current)'],
    availableComponents: [
      { type: _ComponentType.BATTERY, props: { voltage: 9 } },
      { type: _ComponentType.LED, props: { forwardVoltage: 2, maxCurrent: 0.02 } },
      { type: _ComponentType.RESISTOR, props: { resistance: 700 }, label: '700Ω' },
      { type: _ComponentType.RESISTOR, props: { resistance: 350 }, label: '350Ω' },
      { type: _ComponentType.RESISTOR, props: { resistance: 175 }, label: '175Ω' },
    ],
    preplacedComponents: [],
    checkSolution: function (circuit) {
      const result = circuit.simulate();
      if (!result.isComplete) return { passed: false, message: 'Circuit is not complete.' };
      const leds = [...circuit.components.values()].filter((c) => c instanceof _LED);
      if (leds.length === 0) return { passed: false, message: 'No LED in the circuit.' };
      const brightness = leds[0].getBrightness();
      if (Math.abs(brightness - 0.5) <= 0.1) {
        return { passed: true, message: `LED brightness: ${(brightness * 100).toFixed(0)}%. Scanner accepts! Door unlocked.` };
      }
      return {
        passed: false,
        message: `LED brightness: ${(brightness * 100).toFixed(0)}%. Target is 50%. Adjust the resistance.`,
      };
    },
    hints: [
      'LED brightness depends on current flow.',
      'For 50% brightness, you need 50% of maximum current (0.01A).',
      'R = (9V - 2V) / 0.01A = 700Ω',
    ],
    maxScore: 100,
    timeBonus: 90,
  },
  {
    id: 4,
    title: 'Series Maze',
    difficulty: Difficulty.INTERMEDIATE,
    description: 'Build a series circuit with two resistors to achieve the target current.',
    story: 'Two locked doors ahead! You need to power LEDs on both doors simultaneously with a series circuit.',
    objectives: ['Connect two resistors in series', 'Total resistance should limit current to ~10mA'],
    availableComponents: [
      { type: _ComponentType.BATTERY, props: { voltage: 9 } },
      { type: _ComponentType.RESISTOR, props: { resistance: 200 }, label: '200Ω' },
      { type: _ComponentType.RESISTOR, props: { resistance: 500 }, label: '500Ω' },
      { type: _ComponentType.LED, props: { forwardVoltage: 2, maxCurrent: 0.02 } },
    ],
    preplacedComponents: [],
    checkSolution: function (circuit) {
      const result = circuit.simulate();
      if (!result.isComplete) return { passed: false, message: 'Circuit is not complete.' };
      const resistors = [...circuit.components.values()].filter((c) => c.type === _ComponentType.RESISTOR);
      if (resistors.length < 2) return { passed: false, message: 'You need at least 2 resistors in the circuit.' };
      const targetCurrent = 0.01;
      const tolerance = 0.003;
      if (Math.abs(result.totalCurrent - targetCurrent) <= tolerance) {
        return { passed: true, message: `Series circuit complete! Current: ${(result.totalCurrent * 1000).toFixed(1)}mA. Both doors unlock!` };
      }
      return {
        passed: false,
        message: `Current: ${(result.totalCurrent * 1000).toFixed(1)}mA. Target is ~${targetCurrent * 1000}mA.`,
      };
    },
    hints: [
      'In a series circuit, total resistance = R1 + R2.',
      'You need total resistance of about 700Ω (including LED).',
      'Try 200Ω + 500Ω = 700Ω. With LED: ~10mA current.',
    ],
    maxScore: 150,
    timeBonus: 120,
  },
  {
    id: 5,
    title: 'Parallel Paths',
    difficulty: Difficulty.INTERMEDIATE,
    description: 'Design a parallel circuit to power two LEDs with correct current distribution.',
    story: 'The exit splits into two corridors. Each needs its own LED powered from a single battery!',
    objectives: ['Build a parallel circuit with two LED branches', 'Both LEDs must be lit'],
    availableComponents: [
      { type: _ComponentType.BATTERY, props: { voltage: 9 } },
      { type: _ComponentType.RESISTOR, props: { resistance: 350 }, label: '350Ω' },
      { type: _ComponentType.RESISTOR, props: { resistance: 350 }, label: '350Ω' },
      { type: _ComponentType.LED, props: { forwardVoltage: 2, maxCurrent: 0.02 } },
      { type: _ComponentType.LED, props: { forwardVoltage: 2, maxCurrent: 0.02 } },
    ],
    preplacedComponents: [],
    checkSolution: function (circuit) {
      const result = circuit.simulate();
      if (!result.isComplete) return { passed: false, message: 'Circuit is not complete.' };
      const leds = [...circuit.components.values()].filter((c) => c instanceof _LED);
      if (leds.length < 2) return { passed: false, message: 'You need 2 LEDs in the circuit.' };
      const allLit = leds.every((led) => led.isLit());
      if (!allLit) return { passed: false, message: 'Not all LEDs are lit.' };
      return { passed: true, message: 'Both corridors are illuminated! Choose your path forward.' };
    },
    hints: [
      'In parallel, each branch gets the full battery voltage.',
      'Each LED branch needs its own resistor for current limiting.',
      'Connect both LED+resistor branches between the same two nodes.',
    ],
    maxScore: 150,
    timeBonus: 120,
  },
  {
    id: 6,
    title: 'The Broken Lab',
    difficulty: Difficulty.INTERMEDIATE,
    description: 'Debug the pre-built circuit to find and fix the faults.',
    story: 'This room\'s circuit was damaged in an explosion. Use the multimeter to find what\'s wrong!',
    objectives: ['Use the multimeter to identify problems', 'Fix the broken connections to restore power'],
    availableComponents: [
      { type: _ComponentType.WIRE, props: {} },
    ],
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
      'Use the multimeter to check for voltage at each node.',
      'Look for disconnected components - the battery and first resistor seem separated.',
      'A wire can bridge the gap between disconnected nodes.',
    ],
    maxScore: 150,
    timeBonus: 150,
  },
  {
    id: 7,
    title: 'Logic Lock',
    difficulty: Difficulty.ADVANCED,
    description: 'Build a logic gate combination to produce the correct output and unlock the door.',
    story: 'The final security system uses digital logic. You need AND, OR, and NOT gates to crack the code!',
    objectives: ['Create a circuit where: (A AND B) OR (NOT C) = true', 'Set inputs: A=true, B=true, C=true'],
    availableComponents: [
      { type: _ComponentType.AND_GATE, props: {} },
      { type: _ComponentType.OR_GATE, props: {} },
      { type: _ComponentType.NOT_GATE, props: {} },
    ],
    preplacedComponents: [],
    checkSolution: function (circuit) {
      const gates = [...circuit.components.values()].filter((c) => c instanceof _LogicGate);
      if (gates.length < 2) return { passed: false, message: 'You need at least 2 logic gates.' };

      const andGate = gates.find((g) => g.type === _ComponentType.AND_GATE);
      const orGate = gates.find((g) => g.type === _ComponentType.OR_GATE);

      if (!andGate || !orGate) {
        return { passed: false, message: 'You need both AND and OR gates.' };
      }

      // Evaluate: (A AND B) OR (NOT C) with A=true, B=true, C=true
      const andResult = andGate.evaluate([true, true]);
      const notResult = gates.find((g) => g.type === _ComponentType.NOT_GATE);
      const notOutput = notResult ? notResult.evaluate([true]) : false;
      const finalOutput = orGate.evaluate([andResult, notOutput]);

      if (finalOutput) {
        return { passed: true, message: 'Logic sequence accepted! The vault door opens.' };
      }
      return { passed: false, message: 'Output is false. Check your logic gate connections.' };
    },
    hints: [
      'AND gate: both inputs must be true for output to be true.',
      'NOT gate: inverts the input (true→false, false→true).',
      '(true AND true) = true, OR anything = true. The answer should be true!',
    ],
    maxScore: 200,
    timeBonus: 180,
  },
  {
    id: 8,
    title: 'The Security System',
    difficulty: Difficulty.ADVANCED,
    description: 'Combine analog and digital circuits to bypass the security system.',
    story: 'The master security panel requires both correct current levels AND logic sequences.',
    objectives: ['Set up an analog circuit with correct current (20mA)', 'Configure logic gates: A AND (B OR C) = true'],
    availableComponents: [
      { type: _ComponentType.BATTERY, props: { voltage: 9 } },
      { type: _ComponentType.RESISTOR, props: { resistance: 350 }, label: '350Ω' },
      { type: _ComponentType.LED, props: { forwardVoltage: 2, maxCurrent: 0.02 } },
      { type: _ComponentType.AND_GATE, props: {} },
      { type: _ComponentType.OR_GATE, props: {} },
    ],
    preplacedComponents: [],
    checkSolution: function (circuit) {
      // Check analog part
      const result = circuit.simulate();
      const leds = [...circuit.components.values()].filter((c) => c instanceof _LED);
      const analogOk = leds.length > 0 && leds.every((led) => led.isLit());

      // Check digital part
      const andGate = [...circuit.components.values()].find((c) => c.type === _ComponentType.AND_GATE);
      const orGate = [...circuit.components.values()].find((c) => c.type === _ComponentType.OR_GATE);

      if (!andGate || !orGate) {
        return { passed: false, message: 'You need both AND and OR gates.' };
      }

      const orResult = orGate.evaluate([true, false]);
      const andResult = andGate.evaluate([true, orResult]);

      if (analogOk && andResult) {
        return { passed: true, message: 'Security system bypassed! Almost free!' };
      }
      if (!analogOk) return { passed: false, message: 'Analog circuit not working. Check the LED circuit.' };
      return { passed: false, message: 'Logic gate sequence incorrect.' };
    },
    hints: [
      'This level has two parts: analog (LED circuit) and digital (logic gates).',
      'For the analog part, use the 350Ω resistor with the 9V battery and LED.',
      'For logic: OR(true, false)=true, AND(true, true)=true.',
    ],
    maxScore: 200,
    timeBonus: 180,
  },
  {
    id: 9,
    title: 'Final Escape',
    difficulty: Difficulty.ADVANCED,
    description: 'Solve the ultimate multi-stage puzzle to escape the laboratory!',
    story: 'The final door has three locks. Each requires a different electronics skill to open.',
    objectives: [
      'Lock 1: Build a circuit with correct current (20mA)',
      'Lock 2: Use series resistors totaling 700Ω',
      'Lock 3: Logic gate: (A AND B) = true',
    ],
    availableComponents: [
      { type: _ComponentType.BATTERY, props: { voltage: 9 } },
      { type: _ComponentType.RESISTOR, props: { resistance: 350 }, label: '350Ω' },
      { type: _ComponentType.RESISTOR, props: { resistance: 350 }, label: '350Ω' },
      { type: _ComponentType.LED, props: { forwardVoltage: 2, maxCurrent: 0.02 } },
      { type: _ComponentType.AND_GATE, props: {} },
    ],
    preplacedComponents: [],
    checkSolution: function (circuit) {
      const result = circuit.simulate();
      const checks = { current: false, resistance: false, logic: false };

      // Check current
      if (result.isComplete) {
        const targetCurrent = 0.01;
        if (Math.abs(result.totalCurrent - targetCurrent) <= 0.003) {
          checks.current = true;
        }
      }

      // Check series resistance
      const resistors = [...circuit.components.values()].filter((c) => c.type === _ComponentType.RESISTOR);
      const totalR = resistors.reduce((sum, r) => sum + r.getResistance(), 0);
      if (Math.abs(totalR - 700) <= 10) {
        checks.resistance = true;
      }

      // Check logic
      const andGate = [...circuit.components.values()].find((c) => c.type === _ComponentType.AND_GATE);
      if (andGate) {
        const output = andGate.evaluate([true, true]);
        if (output) checks.logic = true;
      }

      const allPassed = checks.current && checks.resistance && checks.logic;
      if (allPassed) {
        return { passed: true, message: 'All three locks open! You escape the laboratory! Congratulations!' };
      }
      const failed = [];
      if (!checks.current) failed.push('Lock 1 (current)');
      if (!checks.resistance) failed.push('Lock 2 (resistance)');
      if (!checks.logic) failed.push('Lock 3 (logic)');
      return { passed: false, message: `Still locked: ${failed.join(', ')}` };
    },
    hints: [
      'This puzzle has three parts - tackle them one at a time.',
      'Two 350Ω resistors in series = 700Ω total.',
      'With 700Ω + LED(2V): I = 7V/700Ω = 10mA. AND(true, true) = true.',
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
