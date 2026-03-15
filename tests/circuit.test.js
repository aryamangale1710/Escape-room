/**
 * Tests for the Circuit Simulation Engine
 * Tests Ohm's Law calculations, series/parallel circuits,
 * logic gates, component behaviors, and level solutions.
 */

const {
  ComponentType,
  Battery,
  Resistor,
  LED,
  Switch,
  Wire,
  LogicGate,
  Circuit,
  Capacitor,
  Inductor,
  Diode,
  Transistor,
  Transformer,
  Potentiometer,
} = require('../src/engine/circuit');

const {
  Difficulty,
  LEVELS,
  ScoreTracker,
  AdaptiveDifficulty,
  LevelManager,
} = require('../src/engine/levels');

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, testName) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${testName}`);
  } else {
    failed++;
    failures.push(testName);
    console.log(`  ✗ ${testName}`);
  }
}

function assertApprox(actual, expected, tolerance, testName) {
  const diff = Math.abs(actual - expected);
  assert(diff <= tolerance, `${testName} (got ${actual}, expected ~${expected})`);
}

function suite(name, fn) {
  console.log(`\n${name}`);
  fn();
}

// ===== Component Tests =====

suite('Battery', () => {
  const battery = new Battery('b1', 9);
  assert(battery.type === ComponentType.BATTERY, 'has correct type');
  assert(battery.getVoltage() === 9, 'returns correct voltage');
  assert(battery.getResistance() === 0.5, 'has internal resistance');
  assert(battery.id === 'b1', 'has correct id');
});

suite('Resistor', () => {
  const r = new Resistor('r1', 470);
  assert(r.type === ComponentType.RESISTOR, 'has correct type');
  assert(r.getResistance() === 470, 'returns correct resistance');
  const r2 = new Resistor('r2');
  assert(r2.getResistance() === 100, 'default resistance is 100');
});

suite('LED', () => {
  const led = new LED('led1', 2, 0.02);
  assert(led.type === ComponentType.LED, 'has correct type');
  assert(!led.isLit(), 'starts unlit');
  assert(led.getBrightness() === 0, 'starts at 0 brightness');

  led.updateState(0.02);
  assert(led.isLit(), 'lights up with sufficient current');
  assertApprox(led.getBrightness(), 1.0, 0.01, 'full brightness at max current');

  led.updateState(0.01);
  assertApprox(led.getBrightness(), 0.5, 0.01, 'half brightness at half current');

  led.updateState(0.0005);
  assert(!led.isLit(), 'not lit with very low current');
});

suite('Switch', () => {
  const sw = new Switch('sw1', false);
  assert(sw.type === ComponentType.SWITCH, 'has correct type');
  assert(!sw.isActive(), 'starts open');
  assert(sw.getResistance() === Infinity, 'infinite resistance when open');

  sw.toggle();
  assert(sw.isActive(), 'closed after toggle');
  assertApprox(sw.getResistance(), 0.001, 0.001, 'near-zero resistance when closed');

  sw.setClosed(false);
  assert(!sw.isActive(), 'open after setClosed(false)');
});

suite('Wire', () => {
  const w = new Wire('w1');
  assert(w.type === ComponentType.WIRE, 'has correct type');
  assertApprox(w.getResistance(), 0.001, 0.001, 'near-zero resistance');
});

// ===== Logic Gate Tests =====

suite('AND Gate', () => {
  const gate = new LogicGate(ComponentType.AND_GATE, 'and1');
  assert(gate.evaluate([true, true]) === true, 'true AND true = true');
  assert(gate.evaluate([true, false]) === false, 'true AND false = false');
  assert(gate.evaluate([false, true]) === false, 'false AND true = false');
  assert(gate.evaluate([false, false]) === false, 'false AND false = false');
  assert(gate.evaluate([]) === false, 'empty inputs = false');
  assert(gate.evaluate([true, true, true]) === true, 'all true = true');
  assert(gate.evaluate([true, true, false]) === false, 'one false = false');
});

suite('OR Gate', () => {
  const gate = new LogicGate(ComponentType.OR_GATE, 'or1');
  assert(gate.evaluate([true, true]) === true, 'true OR true = true');
  assert(gate.evaluate([true, false]) === true, 'true OR false = true');
  assert(gate.evaluate([false, true]) === true, 'false OR true = true');
  assert(gate.evaluate([false, false]) === false, 'false OR false = false');
  assert(gate.evaluate([]) === false, 'empty inputs = false');
});

suite('NOT Gate', () => {
  const gate = new LogicGate(ComponentType.NOT_GATE, 'not1');
  assert(gate.evaluate([true]) === false, 'NOT true = false');
  assert(gate.evaluate([false]) === true, 'NOT false = true');
  assert(gate.evaluate([]) === false, 'empty input = false');
});

// ===== Circuit Simulation Tests =====

suite('Simple Circuit - Ohm\'s Law', () => {
  const circuit = new Circuit();
  const battery = new Battery('b1', 9);
  const resistor = new Resistor('r1', 450);
  const led = new LED('led1', 2, 0.02);

  circuit.addComponent(battery);
  circuit.addComponent(resistor);
  circuit.addComponent(led);

  const n0 = circuit.createNode();
  const n1 = circuit.createNode();
  const n2 = circuit.createNode();
  const n3 = circuit.createNode();

  circuit.connect('b1', 'A', n0);
  circuit.connect('b1', 'B', n3);
  circuit.connect('r1', 'A', n0);
  circuit.connect('r1', 'B', n1);
  circuit.connect('led1', 'A', n1);
  circuit.connect('led1', 'B', n3);

  const result = circuit.simulate();
  assert(result.isComplete, 'circuit is complete');
  assert(result.totalVoltage === 9, 'total voltage is 9V');
  assertApprox(result.totalCurrent, 9 / (450 + 100), 0.001, 'current follows Ohm\'s Law');
  assert(result.errors.length === 0 || result.errors[0].includes('Warning'), 'no critical errors');
});

suite('Circuit with Open Switch', () => {
  const circuit = new Circuit();
  circuit.addComponent(new Battery('b1', 9));
  circuit.addComponent(new Resistor('r1', 450));
  circuit.addComponent(new Switch('sw1', false));

  const n0 = circuit.createNode();
  const n1 = circuit.createNode();
  const n2 = circuit.createNode();

  circuit.connect('b1', 'A', n0);
  circuit.connect('b1', 'B', n2);
  circuit.connect('r1', 'A', n0);
  circuit.connect('r1', 'B', n1);
  circuit.connect('sw1', 'A', n1);
  circuit.connect('sw1', 'B', n2);

  const result = circuit.simulate();
  assert(!result.isComplete, 'circuit is incomplete with open switch');
  assert(result.errors.some((e) => e.includes('switch')), 'error mentions switch');
});

suite('Circuit with Closed Switch', () => {
  const circuit = new Circuit();
  circuit.addComponent(new Battery('b1', 9));
  circuit.addComponent(new Resistor('r1', 450));
  circuit.addComponent(new Switch('sw1', true));

  const n0 = circuit.createNode();
  const n1 = circuit.createNode();
  const n2 = circuit.createNode();

  circuit.connect('b1', 'A', n0);
  circuit.connect('b1', 'B', n2);
  circuit.connect('r1', 'A', n0);
  circuit.connect('r1', 'B', n1);
  circuit.connect('sw1', 'A', n1);
  circuit.connect('sw1', 'B', n2);

  const result = circuit.simulate();
  assert(result.isComplete, 'circuit is complete with closed switch');
  assert(result.totalCurrent > 0, 'current flows');
});

suite('No Battery', () => {
  const circuit = new Circuit();
  circuit.addComponent(new Resistor('r1', 100));
  const n0 = circuit.createNode();
  const n1 = circuit.createNode();
  circuit.connect('r1', 'A', n0);
  circuit.connect('r1', 'B', n1);

  const result = circuit.simulate();
  assert(!result.isComplete, 'no circuit without battery');
  assert(result.errors.some((e) => e.includes('power')), 'error mentions power source');
});

suite('Series Resistance Calculation', () => {
  const circuit = new Circuit();
  const r1 = new Resistor('r1', 200);
  const r2 = new Resistor('r2', 300);
  const total = circuit.calculateSeriesResistance([r1, r2]);
  assertApprox(total, 500, 0.01, 'series total = R1 + R2');
});

suite('Parallel Resistance Calculation', () => {
  const circuit = new Circuit();
  const result = circuit.calculateParallelResistance([200, 200]);
  assertApprox(result, 100, 0.01, 'two equal 200Ω in parallel = 100Ω');

  const result2 = circuit.calculateParallelResistance([300, 600]);
  assertApprox(result2, 200, 0.01, '300Ω and 600Ω in parallel = 200Ω');

  const result3 = circuit.calculateParallelResistance([]);
  assert(result3 === Infinity, 'empty parallel = Infinity');
});

suite('Virtual Multimeter', () => {
  const circuit = new Circuit();
  const battery = new Battery('b1', 9);
  const resistor = new Resistor('r1', 450);

  circuit.addComponent(battery);
  circuit.addComponent(resistor);

  const n0 = circuit.createNode();
  const n1 = circuit.createNode();
  circuit.connect('b1', 'A', n0);
  circuit.connect('b1', 'B', n1);
  circuit.connect('r1', 'A', n0);
  circuit.connect('r1', 'B', n1);

  circuit.simulate();

  const voltReading = circuit.measure('r1', 'voltage');
  assert(voltReading !== null, 'voltage reading exists');
  assert(voltReading.unit === 'V', 'voltage unit is V');

  const currentReading = circuit.measure('r1', 'current');
  assert(currentReading !== null, 'current reading exists');
  assert(currentReading.unit === 'A', 'current unit is A');

  const resistReading = circuit.measure('r1', 'resistance');
  assert(resistReading !== null, 'resistance reading exists');
  assert(resistReading.value === 450, 'resistance value correct');

  const nullReading = circuit.measure('nonexistent');
  assert(nullReading === null, 'null for nonexistent component');
});

suite('Circuit Reset', () => {
  const circuit = new Circuit();
  circuit.addComponent(new Battery('b1', 9));
  circuit.addComponent(new Resistor('r1', 100));
  assert(circuit.components.size === 2, 'has 2 components before reset');

  circuit.reset();
  assert(circuit.components.size === 0, 'empty after reset');
  assert(circuit.connections.length === 0, 'no connections after reset');
});

suite('Component JSON Serialization', () => {
  const battery = new Battery('b1', 12);
  const json = battery.toJSON();
  assert(json.type === ComponentType.BATTERY, 'JSON has correct type');
  assert(json.id === 'b1', 'JSON has correct id');
  assert(json.properties.voltage === 12, 'JSON has correct voltage');
});

suite('Remove Component', () => {
  const circuit = new Circuit();
  circuit.addComponent(new Battery('b1', 9));
  circuit.addComponent(new Resistor('r1', 100));
  assert(circuit.components.size === 2, 'starts with 2');

  const removed = circuit.removeComponent('r1');
  assert(removed, 'returns true on success');
  assert(circuit.components.size === 1, 'has 1 after removal');

  const notFound = circuit.removeComponent('nonexistent');
  assert(!notFound, 'returns false for nonexistent');
});

// ===== ScoreTracker Tests =====

suite('ScoreTracker', () => {
  const tracker = new ScoreTracker();

  assert(tracker.isLevelUnlocked(1), 'level 1 always unlocked');
  assert(!tracker.isLevelUnlocked(2), 'level 2 locked initially');

  tracker.recordAttempt(1);
  tracker.recordAttempt(1);
  const result = tracker.calculateScore(1, 30, 100, 60);
  assert(result.score > 0, 'score is positive');
  assert(result.stars >= 1, 'at least 1 star');
  assert(tracker.completedLevels.has(1), 'level 1 completed');
  assert(tracker.isLevelUnlocked(2), 'level 2 unlocked after completing 1');

  tracker.recordHintUsed(2);
  tracker.recordHintUsed(2);
  const result2 = tracker.calculateScore(2, 200, 100, 90);
  assert(result2.score < 100, 'score reduced by hints and time');
});

suite('ScoreTracker Progress', () => {
  const tracker = new ScoreTracker();
  tracker.calculateScore(1, 10, 100, 60);
  const progress = tracker.getProgress();
  assert(progress.completedLevels.length === 1, '1 level completed');
  assert(progress.totalScore > 0, 'total score > 0');
});

// ===== AdaptiveDifficulty Tests =====

suite('AdaptiveDifficulty', () => {
  const ad = new AdaptiveDifficulty();
  assert(ad.getModifier() === 1.0, 'starts at 1.0');
  assert(ad.getDifficultyLabel() === 'Normal', 'starts as Normal');

  // Record high performance
  ad.recordPerformance(1, 90, 100, 1, 0);
  ad.recordPerformance(2, 95, 100, 1, 0);
  ad.recordPerformance(3, 92, 100, 1, 0);
  assert(ad.getModifier() > 1.0, 'modifier increases with good performance');

  assert(!ad.shouldShowExtraHint(), 'no extra hint for good performance');
});

suite('AdaptiveDifficulty - Low Performance', () => {
  const ad = new AdaptiveDifficulty();
  ad.recordPerformance(1, 20, 100, 6, 3);
  ad.recordPerformance(2, 15, 100, 5, 3);
  ad.recordPerformance(3, 10, 100, 7, 4);
  ad.recordPerformance(4, 10, 100, 8, 5);
  assert(ad.getModifier() < 1.0, 'modifier decreases with poor performance');
  assert(ad.shouldShowExtraHint(), 'shows extra hint for struggling player');
  assert(ad.getDifficultyLabel() === 'Assisted Mode', 'shows Assisted Mode');
});

// ===== LevelManager Tests =====

suite('LevelManager', () => {
  const lm = new LevelManager();
  assert(lm.levels.length === 9, 'has 9 levels');
  assert(lm.getCurrentLevel().id === 1, 'starts at level 1');

  const allLevels = lm.getAllLevels();
  assert(allLevels[0].unlocked, 'level 1 is unlocked');
  assert(!allLevels[1].unlocked, 'level 2 is locked');
});

suite('LevelManager - Start Level', () => {
  const lm = new LevelManager();
  const level = lm.startLevel(1);
  assert(level !== null, 'can start level 1');
  assert(level.title === 'The Light Switch', 'correct level title');

  const locked = lm.startLevel(5);
  assert(locked === null, 'cannot start locked level');
});

suite('LevelManager - Get Hint', () => {
  const lm = new LevelManager();
  lm.startLevel(1);
  const hint1 = lm.getHint(1);
  assert(typeof hint1 === 'string', 'hint is a string');
  assert(hint1.length > 0, 'hint is not empty');
});

suite('Level Difficulty Distribution', () => {
  const beginnerLevels = LEVELS.filter((l) => l.difficulty === Difficulty.BEGINNER);
  const intermediateLevels = LEVELS.filter((l) => l.difficulty === Difficulty.INTERMEDIATE);
  const advancedLevels = LEVELS.filter((l) => l.difficulty === Difficulty.ADVANCED);

  assert(beginnerLevels.length === 3, '3 beginner levels');
  assert(intermediateLevels.length === 3, '3 intermediate levels');
  assert(advancedLevels.length === 3, '3 advanced levels');
});

suite('Level 1 Solution Test', () => {
  const circuit = new Circuit();
  circuit.addComponent(new Battery('b1', 9));
  circuit.addComponent(new Switch('sw1', true));
  circuit.addComponent(new Resistor('r1', 350));
  circuit.addComponent(new LED('led1', 2, 0.02));

  const n0 = circuit.createNode();
  const n1 = circuit.createNode();
  const n2 = circuit.createNode();
  const n3 = circuit.createNode();

  circuit.connect('b1', 'A', n0);
  circuit.connect('sw1', 'A', n0);
  circuit.connect('sw1', 'B', n1);
  circuit.connect('r1', 'A', n1);
  circuit.connect('r1', 'B', n2);
  circuit.connect('led1', 'A', n2);
  circuit.connect('led1', 'B', n3);
  circuit.connect('b1', 'B', n3);

  const result = LEVELS[0].checkSolution(circuit);
  assert(result.passed, 'Level 1 solution passes');
});

suite('Level 2 Solution Test (Ohm\'s Law)', () => {
  const circuit = new Circuit();
  circuit.addComponent(new Battery('b1', 9));
  circuit.addComponent(new Resistor('r1', 350));
  circuit.addComponent(new LED('led1', 2, 0.02));

  const n0 = circuit.createNode();
  const n1 = circuit.createNode();
  const n2 = circuit.createNode();

  circuit.connect('b1', 'A', n0);
  circuit.connect('b1', 'B', n2);
  circuit.connect('r1', 'A', n0);
  circuit.connect('r1', 'B', n1);
  circuit.connect('led1', 'A', n1);
  circuit.connect('led1', 'B', n2);

  const result = LEVELS[1].checkSolution(circuit);
  assert(result.passed, 'Level 2 with 350Ω resistor passes');
});

suite('Level 7 Solution Test (Transistor Amplifier)', () => {
  const circuit = new Circuit();
  const battery = new Battery('b1', 9);
  const resistor = new Resistor('r1', 470);
  const transistor = new Transistor('t1', 'NPN', 200);
  const led = new LED('led1', 2, 0.02);

  transistor.activate(); // double-click equivalent

  circuit.addComponent(battery);
  circuit.addComponent(resistor);
  circuit.addComponent(transistor);
  circuit.addComponent(led);

  const n0 = circuit.createNode();
  const n1 = circuit.createNode();
  const n2 = circuit.createNode();
  const n3 = circuit.createNode();

  circuit.connect('b1', 'A', n0);
  circuit.connect('r1', 'A', n0);
  circuit.connect('r1', 'B', n1);
  circuit.connect('t1', 'A', n1);
  circuit.connect('t1', 'B', n2);
  circuit.connect('led1', 'A', n2);
  circuit.connect('led1', 'B', n3);
  circuit.connect('b1', 'B', n3);

  const result = LEVELS[6].checkSolution(circuit);
  assert(result.passed, 'Level 7 transistor amplifier solution passes');
});

suite('Level 3 Solution Test (Diode Direction)', () => {
  const circuit = new Circuit();
  const battery = new Battery('b1', 9);
  const resistor = new Resistor('r1', 330);
  const diode = new Diode('d1', 0.7);
  const led = new LED('led1', 2, 0.02);

  circuit.addComponent(battery);
  circuit.addComponent(resistor);
  circuit.addComponent(diode);
  circuit.addComponent(led);

  const n0 = circuit.createNode();
  const n1 = circuit.createNode();
  const n2 = circuit.createNode();
  const n3 = circuit.createNode();

  circuit.connect('b1', 'A', n0);
  circuit.connect('r1', 'A', n0);
  circuit.connect('r1', 'B', n1);
  circuit.connect('d1', 'A', n1);
  circuit.connect('d1', 'B', n2);
  circuit.connect('led1', 'A', n2);
  circuit.connect('led1', 'B', n3);
  circuit.connect('b1', 'B', n3);

  const result = LEVELS[2].checkSolution(circuit);
  assert(result.passed, 'Level 3 diode circuit solution passes');
});

suite('Level 4 Solution Test (RC Charging Circuit)', () => {
  const circuit = new Circuit();
  const battery = new Battery('b1', 9);
  const resistor = new Resistor('r1', 10000);
  const capacitor = new Capacitor('c1', 0.0001);

  circuit.addComponent(battery);
  circuit.addComponent(resistor);
  circuit.addComponent(capacitor);

  const n0 = circuit.createNode();
  const n1 = circuit.createNode();
  const n2 = circuit.createNode();

  circuit.connect('b1', 'A', n0);
  circuit.connect('r1', 'A', n0);
  circuit.connect('r1', 'B', n1);
  circuit.connect('c1', 'A', n1);
  circuit.connect('c1', 'B', n2);
  circuit.connect('b1', 'B', n2);

  const result = LEVELS[3].checkSolution(circuit);
  assert(result.passed, 'Level 4 RC circuit (10kΩ, 100μF → τ=1s) passes');
});

suite('Level 5 Solution Test (Transistor Switch)', () => {
  const circuit = new Circuit();
  const battery = new Battery('b1', 9);
  const resistor = new Resistor('r1', 470);
  const transistor = new Transistor('t1', 'NPN', 100);
  const led = new LED('led1', 2, 0.02);

  transistor.activate();

  circuit.addComponent(battery);
  circuit.addComponent(resistor);
  circuit.addComponent(transistor);
  circuit.addComponent(led);

  const n0 = circuit.createNode();
  const n1 = circuit.createNode();
  const n2 = circuit.createNode();
  const n3 = circuit.createNode();

  circuit.connect('b1', 'A', n0);
  circuit.connect('r1', 'A', n0);
  circuit.connect('r1', 'B', n1);
  circuit.connect('t1', 'A', n1);
  circuit.connect('t1', 'B', n2);
  circuit.connect('led1', 'A', n2);
  circuit.connect('led1', 'B', n3);
  circuit.connect('b1', 'B', n3);

  const result = LEVELS[4].checkSolution(circuit);
  assert(result.passed, 'Level 5 transistor switch solution passes');
});

suite('Level 8 Solution Test (RL Circuit)', () => {
  const circuit = new Circuit();
  const battery = new Battery('b1', 9);
  const resistor = new Resistor('r1', 100);
  const inductor = new Inductor('l1', 0.01);
  const led = new LED('led1', 2, 0.02);

  circuit.addComponent(battery);
  circuit.addComponent(resistor);
  circuit.addComponent(inductor);
  circuit.addComponent(led);

  const n0 = circuit.createNode();
  const n1 = circuit.createNode();
  const n2 = circuit.createNode();
  const n3 = circuit.createNode();

  circuit.connect('b1', 'A', n0);
  circuit.connect('r1', 'A', n0);
  circuit.connect('r1', 'B', n1);
  circuit.connect('l1', 'A', n1);
  circuit.connect('l1', 'B', n2);
  circuit.connect('led1', 'A', n2);
  circuit.connect('led1', 'B', n3);
  circuit.connect('b1', 'B', n3);

  const result = LEVELS[7].checkSolution(circuit);
  assert(result.passed, 'Level 8 RL circuit solution passes');
});

suite('Level 9 Solution Test (Final Escape)', () => {
  const circuit = new Circuit();
  const battery = new Battery('b1', 9);
  const resistor = new Resistor('r1', 470);
  const transistor = new Transistor('t1', 'NPN', 100);
  const capacitor = new Capacitor('c1', 0.0001);
  const diode = new Diode('d1', 0.7);
  const led = new LED('led1', 2, 0.02);

  transistor.activate();

  circuit.addComponent(battery);
  circuit.addComponent(resistor);
  circuit.addComponent(transistor);
  circuit.addComponent(capacitor);
  circuit.addComponent(diode);
  circuit.addComponent(led);

  const n0 = circuit.createNode();
  const n1 = circuit.createNode();
  const n2 = circuit.createNode();
  const n3 = circuit.createNode();
  const n4 = circuit.createNode();
  const n5 = circuit.createNode();

  circuit.connect('b1', 'A', n0);
  circuit.connect('r1', 'A', n0);
  circuit.connect('r1', 'B', n1);
  circuit.connect('t1', 'A', n1);
  circuit.connect('t1', 'B', n2);
  circuit.connect('c1', 'A', n2);
  circuit.connect('c1', 'B', n3);
  circuit.connect('d1', 'A', n3);
  circuit.connect('d1', 'B', n4);
  circuit.connect('led1', 'A', n4);
  circuit.connect('led1', 'B', n5);
  circuit.connect('b1', 'B', n5);

  const result = LEVELS[8].checkSolution(circuit);
  assert(result.passed, 'Level 9 final escape solution passes');
});

// ===== New Component Tests =====

suite('Capacitor', () => {
  const cap = new Capacitor('c1', 0.0001);
  assert(cap.type === ComponentType.CAPACITOR, 'has correct type');
  assert(cap.getCapacitance() === 0.0001, 'returns correct capacitance (100μF)');
  assert(cap.getResistance() === 1e6, 'models high DC resistance (1MΩ)');
});

suite('Inductor', () => {
  const ind = new Inductor('l1', 0.01);
  assert(ind.type === ComponentType.INDUCTOR, 'has correct type');
  assert(ind.getInductance() === 0.01, 'returns correct inductance (10mH)');
  assert(ind.getResistance() < 0.01, 'has near-zero DC resistance');
});

suite('Diode', () => {
  const diode = new Diode('d1', 0.7);
  assert(diode.type === ComponentType.DIODE, 'has correct type');
  assert(diode.getForwardVoltage() === 0.7, 'returns correct forward voltage');
  assert(diode.isForward() === true, 'defaults to forward bias');
  assert(diode.getResistance() > 0, 'has positive forward resistance');
  diode.setForward(false);
  assert(diode.getResistance() === Infinity, 'reverse bias has infinite resistance');
  diode.setForward(true);
  assert(diode.isForward() === true, 'can be reset to forward');
});

suite('Transistor', () => {
  const t = new Transistor('t1', 'NPN', 100);
  assert(t.type === ComponentType.TRANSISTOR, 'has correct type');
  assert(t.getType() === 'NPN', 'returns transistor type');
  assert(t.getGain() === 100, 'returns correct gain');
  assert(t.isActive() === false, 'starts inactive (OFF)');
  assert(t.getResistance() === Infinity, 'OFF state has infinite resistance');
  t.toggle();
  assert(t.isActive() === true, 'toggle activates transistor');
  assert(t.getResistance() < 1, 'ON state has low resistance');
  t.toggle();
  assert(t.isActive() === false, 'toggle deactivates transistor');
  const t2 = new Transistor('t2');
  t2.activate();
  assert(t2.isActive() === true, 'activate() turns on transistor');
});

suite('Transformer', () => {
  const xfmr = new Transformer('x1', 2);
  assert(xfmr.type === ComponentType.TRANSFORMER, 'has correct type');
  assert(xfmr.getTurnsRatio() === 2, 'returns correct turns ratio');
  assert(xfmr.getVoltageRatio() === 2, 'voltage ratio equals turns ratio');
  assert(xfmr.getResistance() > 0, 'has small winding resistance');
});

suite('Potentiometer', () => {
  const pot = new Potentiometer('p1', 1000, 0.5);
  assert(pot.type === ComponentType.POTENTIOMETER, 'has correct type');
  assert(pot.getMaxResistance() === 1000, 'returns max resistance');
  assert(pot.getPosition() === 0.5, 'starts at midpoint');
  assertApprox(pot.getResistance(), 500, 0.01, 'resistance at 50% position');
  pot.setPosition(0.25);
  assertApprox(pot.getResistance(), 250, 0.01, 'resistance at 25% position');
  pot.setPosition(1.5); // out of range
  assert(pot.getPosition() === 1, 'position clamped to max 1');
  pot.setPosition(-0.5); // out of range
  assert(pot.getPosition() === 0, 'position clamped to min 0');
});

suite('Circuit - validateCircuitTopology', () => {
  // Valid circuit: battery + resistor + LED
  const c1 = new Circuit();
  c1.addComponent(new Battery('b1', 9));
  c1.addComponent(new Resistor('r1', 100));
  c1.addComponent(new LED('led1', 2, 0.02));
  const n0 = c1.createNode(); const n1 = c1.createNode(); const n2 = c1.createNode();
  c1.connect('b1', 'A', n0); c1.connect('b1', 'B', n2);
  c1.connect('r1', 'A', n0); c1.connect('r1', 'B', n1);
  c1.connect('led1', 'A', n1); c1.connect('led1', 'B', n2);
  assert(c1.validateCircuitTopology() === true, 'valid series circuit passes topology check');

  // Invalid: battery terminal not connected
  const c2 = new Circuit();
  c2.addComponent(new Battery('b1', 9));
  c2.addComponent(new Resistor('r1', 100));
  assert(c2.validateCircuitTopology() === false, 'disconnected components fail topology check');

  // Invalid: no battery
  const c3 = new Circuit();
  c3.addComponent(new Resistor('r1', 100));
  assert(c3.validateCircuitTopology() === false, 'no battery fails topology check');

  // Invalid: battery short (same node A and B)
  const c4 = new Circuit();
  c4.addComponent(new Battery('b1', 9));
  const nx = c4.createNode();
  c4.connect('b1', 'A', nx); c4.connect('b1', 'B', nx);
  assert(c4.validateCircuitTopology() === false, 'battery short-circuit fails topology check');
});

suite('Circuit - mergeNodes', () => {
  const circuit = new Circuit();
  circuit.addComponent(new Battery('b1', 9));
  circuit.addComponent(new Resistor('r1', 100));
  const n0 = circuit.createNode();
  const n1 = circuit.createNode();
  const n2 = circuit.createNode();
  circuit.connect('b1', 'A', n0);
  circuit.connect('b1', 'B', n2);
  circuit.connect('r1', 'A', n1); // intentionally separate node
  circuit.connect('r1', 'B', n2);
  // Before merge: r1.nodeA = n1, b1.nodeA = n0
  assert(circuit.getComponent('r1').nodeA === n1, 'r1 nodeA is n1 before merge');
  // Merge n1 into n0 (simulate drawing a wire battery-A to resistor-A)
  circuit.mergeNodes(n0, n1);
  assert(circuit.getComponent('r1').nodeA === n0, 'r1 nodeA becomes n0 after merge');
  assert(!circuit.nodes.has(n1), 'n1 node is removed after merge');
});

// ===== Report =====

console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.log(`\nFailed tests:`);
  failures.forEach((f) => console.log(`  - ${f}`));
}
console.log(`${'='.repeat(50)}`);

process.exit(failed > 0 ? 1 : 0);
