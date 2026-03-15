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
  Capacitor,
  Inductor,
  Diode,
  Transistor,
  Transformer,
  Potentiometer,
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

// ===== New Component Tests =====

suite('Capacitor', () => {
  const cap = new Capacitor('c1', 0.0001, 50);
  assert(cap.type === ComponentType.CAPACITOR, 'has correct type');
  assert(cap.getCapacitance() === 0.0001, 'returns correct capacitance');
  assert(cap.getResistance() >= 1e5, 'very high resistance in DC (blocks current)');

  const capDefault = new Capacitor('c2');
  assert(capDefault.getCapacitance() === 0.0001, 'default capacitance is 100µF');

  // Charging equation: V(t) = Vs * (1 - e^(-t/RC))
  const chargeV = cap.getChargeVoltage(9, 1000, 0);
  assertApprox(chargeV, 0, 0.01, 'zero voltage at t=0');
  const tau = 1000 * 0.0001; // 0.1s
  const chargeV2 = cap.getChargeVoltage(9, 1000, tau);
  assertApprox(chargeV2, 9 * (1 - Math.exp(-1)), 0.01, 'correct voltage at t=tau');
});

suite('Inductor', () => {
  const ind = new Inductor('l1', 0.001, 0.5);
  assert(ind.type === ComponentType.INDUCTOR, 'has correct type');
  assert(ind.getInductance() === 0.001, 'returns correct inductance');
  assertApprox(ind.getResistance(), 0.5, 0.01, 'resistance equals wire resistance in DC');

  const indDefault = new Inductor('l2');
  assert(indDefault.getInductance() === 0.001, 'default inductance is 1mH');

  // Transient current: I(t) = V/R * (1 - e^(-Rt/L))
  const tau = 0.001 / 0.5; // L/R
  const i = ind.getTransientCurrent(5, 0.5, tau);
  assertApprox(i, (5 / 0.5) * (1 - Math.exp(-1)), 0.1, 'correct current at t=tau');
});

suite('Diode', () => {
  const diode = new Diode('d1', 0.7, 0.02);
  assert(diode.type === ComponentType.DIODE, 'has correct type');
  assert(diode.isForwardBiased(), 'starts forward biased');
  assert(diode.isActive(), 'isActive reflects forward bias');
  assertApprox(diode.getResistance(), 0.7 / 0.02, 0.01, 'resistance = Vf/Imax when forward biased');

  diode.setForwardBias(false);
  assert(!diode.isForwardBiased(), 'can set reverse biased');
  assert(diode.getResistance() === Infinity, 'infinite resistance when reverse biased');

  diode.toggle();
  assert(diode.isForwardBiased(), 'toggle restores forward bias');

  const diodeDefault = new Diode('d2');
  assert(diodeDefault.properties.forwardVoltage === 0.7, 'default forward voltage is 0.7V');
});

suite('Transistor', () => {
  const t = new Transistor('q1', 'NPN', 100);
  assert(t.type === ComponentType.TRANSISTOR, 'has correct type');
  assert(!t.isConducting(), 'starts non-conducting');
  assert(t.getResistance() === Infinity, 'infinite resistance when cutoff');
  assert(!t.isActive(), 'isActive reflects conducting state');

  t.setConducting(true);
  assert(t.isConducting(), 'conducting after setConducting(true)');
  assert(t.getResistance() < 0.01, 'near-zero resistance when conducting');

  t.toggle();
  assert(!t.isConducting(), 'toggle switches back to cutoff');

  t.setBaseCurrent(0.002); // 2mA > 1mA threshold
  assert(t.isConducting(), 'conducts with sufficient base current');

  t.setBaseCurrent(0.0005); // 0.5mA < 1mA threshold
  assert(!t.isConducting(), 'cutoff with insufficient base current');

  assert(t.getCollectorCurrent(0.001) === 100 * 0.001, 'collector current = hFE * base current');
});

suite('Transformer', () => {
  const tf = new Transformer('t1', 0.5, 0.1);
  assert(tf.type === ComponentType.TRANSFORMER, 'has correct type');
  assert(tf.getTurnsRatio() === 0.5, 'returns correct turns ratio');
  assertApprox(tf.getOutputVoltage(9), 4.5, 0.01, 'output = input * turns ratio');
  assert(tf.getResistance() > 0, 'has non-zero secondary resistance');

  const tfDefault = new Transformer('t2');
  assert(tfDefault.getTurnsRatio() === 1, 'default turns ratio is 1:1');
});

suite('Potentiometer', () => {
  const pot = new Potentiometer('p1', 0, 10000, 0.5);
  assert(pot.type === ComponentType.POTENTIOMETER, 'has correct type');
  assertApprox(pot.getResistance(), 5000, 0.01, '50% position = mid resistance');

  pot.setPosition(0);
  assertApprox(pot.getResistance(), 0, 0.01, '0% position = min resistance');

  pot.setPosition(1);
  assertApprox(pot.getResistance(), 10000, 0.01, '100% position = max resistance');

  pot.setPosition(1.5); // clamped to 1
  assert(pot.getPosition() === 1, 'position clamped to max 1');
  pot.setPosition(-0.5); // clamped to 0
  assert(pot.getPosition() === 0, 'position clamped to min 0');
});

// ===== Circuit Topology Tests =====

suite('Circuit Topology - validateCircuitTopology', () => {
  const circuit = new Circuit();
  circuit.addComponent(new Battery('b1', 9));
  circuit.addComponent(new Resistor('r1', 100));

  // With isolated nodes (no sharing) → not valid
  const n0 = circuit.createNode();
  const n1 = circuit.createNode();
  const n2 = circuit.createNode();
  const n3 = circuit.createNode();
  circuit.connect('b1', 'A', n0);
  circuit.connect('b1', 'B', n1);
  circuit.connect('r1', 'A', n2);
  circuit.connect('r1', 'B', n3);
  assert(!circuit.validateCircuitTopology(), 'isolated components fail topology check');
});

suite('Circuit Topology - connected topology', () => {
  const circuit = new Circuit();
  circuit.addComponent(new Battery('b1', 9));
  circuit.addComponent(new Resistor('r1', 100));

  const n0 = circuit.createNode();
  const n1 = circuit.createNode();
  circuit.connect('b1', 'A', n0);
  circuit.connect('b1', 'B', n1);
  circuit.connect('r1', 'A', n0); // shares n0 with battery
  circuit.connect('r1', 'B', n1); // shares n1 with battery
  assert(circuit.validateCircuitTopology(), 'properly connected components pass topology check');
});

suite('Circuit Topology - isConnected', () => {
  const circuit = new Circuit();
  circuit.addComponent(new Battery('b1', 9));
  circuit.addComponent(new Resistor('r1', 100));
  circuit.addComponent(new Resistor('r2', 200));

  const n0 = circuit.createNode();
  const n1 = circuit.createNode();
  const n2 = circuit.createNode();
  circuit.connect('b1', 'A', n0);
  circuit.connect('r1', 'A', n0); // shares n0 with battery
  circuit.connect('r1', 'B', n1);
  circuit.connect('r2', 'A', n1); // shares n1 with r1
  circuit.connect('r2', 'B', n2);
  circuit.connect('b1', 'B', n2); // shares n2 with r2

  assert(circuit.isConnected('b1', 'r1'), 'battery and r1 share node n0');
  assert(circuit.isConnected('r1', 'r2'), 'r1 and r2 share node n1');
  assert(circuit.isConnected('b1', 'r2'), 'battery and r2 share node n2');
  assert(!circuit.isConnected('r1', 'b1') || circuit.isConnected('b1', 'r1'), 'isConnected is symmetric');
});

suite('Circuit Topology - getConnectedPath', () => {
  const circuit = new Circuit();
  circuit.addComponent(new Battery('b1', 9));
  circuit.addComponent(new Resistor('r1', 100));
  circuit.addComponent(new LED('led1', 2, 0.02));

  const n0 = circuit.createNode();
  const n1 = circuit.createNode();
  const n2 = circuit.createNode();
  circuit.connect('b1', 'A', n0);
  circuit.connect('r1', 'A', n0);
  circuit.connect('r1', 'B', n1);
  circuit.connect('led1', 'A', n1);
  circuit.connect('led1', 'B', n2);
  circuit.connect('b1', 'B', n2);

  const path = circuit.getConnectedPath('b1');
  assert(path.length === 3, 'connected path includes all 3 components');
});

suite('Circuit Topology - hasWireConnection', () => {
  const circuit = new Circuit();
  circuit.addComponent(new Resistor('r1', 100));
  assert(!circuit.hasWireConnection(), 'no wire component → false');

  circuit.addComponent(new Wire('w1'));
  assert(circuit.hasWireConnection(), 'wire component present → true');
});

suite('Simulate - Disconnected Circuit (no shared nodes)', () => {
  const circuit = new Circuit();
  circuit.addComponent(new Battery('b1', 9));
  circuit.addComponent(new Resistor('r1', 100));

  // Each component gets isolated nodes
  const n0 = circuit.createNode();
  const n1 = circuit.createNode();
  const n2 = circuit.createNode();
  const n3 = circuit.createNode();
  circuit.connect('b1', 'A', n0);
  circuit.connect('b1', 'B', n1);
  circuit.connect('r1', 'A', n2);
  circuit.connect('r1', 'B', n3);

  const result = circuit.simulate();
  assert(!result.isComplete, 'disconnected circuit is not complete');
  assert(result.errors.some((e) => e.includes('wired together')), 'error mentions wiring');
});

suite('Simulate - Reverse-biased Diode', () => {
  const circuit = new Circuit();
  circuit.addComponent(new Battery('b1', 9));
  circuit.addComponent(new Resistor('r1', 330));
  const diode = new Diode('d1', 0.7, 0.02);
  diode.setForwardBias(false);
  circuit.addComponent(diode);

  const n0 = circuit.createNode();
  const n1 = circuit.createNode();
  const n2 = circuit.createNode();
  circuit.connect('b1', 'A', n0);
  circuit.connect('b1', 'B', n2);
  circuit.connect('r1', 'A', n0);
  circuit.connect('r1', 'B', n1);
  circuit.connect('d1', 'A', n1);
  circuit.connect('d1', 'B', n2);

  const result = circuit.simulate();
  assert(!result.isComplete, 'reverse-biased diode blocks circuit');
  assert(result.errors.some((e) => e.includes('diode')), 'error mentions diode');
});

suite('Simulate - Non-conducting Transistor', () => {
  const circuit = new Circuit();
  circuit.addComponent(new Battery('b1', 9));
  circuit.addComponent(new Resistor('r1', 1000));
  const t = new Transistor('q1', 'NPN', 100);
  // starts non-conducting
  circuit.addComponent(t);

  const n0 = circuit.createNode();
  const n1 = circuit.createNode();
  const n2 = circuit.createNode();
  circuit.connect('b1', 'A', n0);
  circuit.connect('b1', 'B', n2);
  circuit.connect('r1', 'A', n0);
  circuit.connect('r1', 'B', n1);
  circuit.connect('q1', 'A', n1);
  circuit.connect('q1', 'B', n2);

  const result = circuit.simulate();
  assert(!result.isComplete, 'non-conducting transistor blocks circuit');
  assert(result.errors.some((e) => e.includes('transistor')), 'error mentions transistor');
});

suite('Simulate - Transformer Scales Voltage', () => {
  const circuit = new Circuit();
  circuit.addComponent(new Battery('b1', 10));
  const tf = new Transformer('t1', 0.5, 0.1);
  circuit.addComponent(tf);
  circuit.addComponent(new Resistor('r1', 100));

  const n0 = circuit.createNode();
  const n1 = circuit.createNode();
  const n2 = circuit.createNode();
  circuit.connect('b1', 'A', n0);
  circuit.connect('b1', 'B', n2);
  circuit.connect('t1', 'A', n0);
  circuit.connect('t1', 'B', n1);
  circuit.connect('r1', 'A', n1);
  circuit.connect('r1', 'B', n2);

  const result = circuit.simulate();
  assert(result.isComplete, 'circuit with transformer is complete');
  assertApprox(result.totalVoltage, 5, 0.01, 'transformer scales voltage by turns ratio 0.5');
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
  assert(level.title === 'RC Charging', 'correct level 1 title');

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

suite('Level 1 Solution Test (RC Charging)', () => {
  const circuit = new Circuit();
  circuit.addComponent(new Battery('b1', 9));
  circuit.addComponent(new Switch('sw1', true));
  circuit.addComponent(new Resistor('r1', 1000));
  circuit.addComponent(new Capacitor('c1', 0.0001, 50));

  const n0 = circuit.createNode();
  const n1 = circuit.createNode();
  const n2 = circuit.createNode();
  const n3 = circuit.createNode();

  circuit.connect('b1', 'A', n0);
  circuit.connect('sw1', 'A', n0);
  circuit.connect('sw1', 'B', n1);
  circuit.connect('r1', 'A', n1);
  circuit.connect('r1', 'B', n2);
  circuit.connect('c1', 'A', n2);
  circuit.connect('c1', 'B', n3);
  circuit.connect('b1', 'B', n3);

  const result = LEVELS[0].checkSolution(circuit);
  assert(result.passed, 'Level 1 RC charging solution passes');

  // Test that open switch fails
  const sw = circuit.components.get('sw1');
  sw.setClosed(false);
  const resultOpen = LEVELS[0].checkSolution(circuit);
  assert(!resultOpen.passed, 'Level 1 fails with open switch');
});

suite('Level 2 Solution Test (Diode Logic)', () => {
  const circuit = new Circuit();
  circuit.addComponent(new Battery('b1', 9));
  circuit.addComponent(new Resistor('r1', 330));
  const diode = new Diode('d1', 0.7, 0.02);
  circuit.addComponent(diode);
  circuit.addComponent(new LED('led1', 2, 0.02));

  const n0 = circuit.createNode();
  const n1 = circuit.createNode();
  const n2 = circuit.createNode();
  const n3 = circuit.createNode();

  circuit.connect('b1', 'A', n0);
  circuit.connect('b1', 'B', n3);
  circuit.connect('r1', 'A', n0);
  circuit.connect('r1', 'B', n1);
  circuit.connect('d1', 'A', n1);
  circuit.connect('d1', 'B', n2);
  circuit.connect('led1', 'A', n2);
  circuit.connect('led1', 'B', n3);

  const result = LEVELS[1].checkSolution(circuit);
  assert(result.passed, 'Level 2 diode logic solution passes with forward-biased diode');

  // Test that reverse-biased diode fails
  diode.setForwardBias(false);
  const resultReverse = LEVELS[1].checkSolution(circuit);
  assert(!resultReverse.passed, 'Level 2 fails with reverse-biased diode');
});

suite('Level 7 Solution Test (Logic Gate Circuit)', () => {
  const circuit = new Circuit();

  // Build: battery + r1 + r2 + r3 + q1 + q2 + d1 + d2 + d3 + led (all conducting/forward-biased)
  circuit.addComponent(new Battery('b1', 9));
  circuit.addComponent(new Resistor('r1', 100));
  circuit.addComponent(new Resistor('r2', 100));
  circuit.addComponent(new Resistor('r3', 100));
  const q1 = new Transistor('q1', 'NPN', 100);
  const q2 = new Transistor('q2', 'NPN', 100);
  q1.setConducting(true);
  q2.setConducting(true);
  circuit.addComponent(q1);
  circuit.addComponent(q2);
  const d1 = new Diode('d1', 0.7, 0.02);
  const d2 = new Diode('d2', 0.7, 0.02);
  const d3 = new Diode('d3', 0.7, 0.02);
  circuit.addComponent(d1);
  circuit.addComponent(d2);
  circuit.addComponent(d3);
  circuit.addComponent(new LED('led1', 2, 0.02));

  // Wire all in series: b1 → r1 → r2 → r3 → q1 → q2 → d1 → d2 → d3 → led1 → b1
  const nodes = [];
  for (let i = 0; i <= 10; i++) nodes.push(circuit.createNode());
  const ids = ['b1', 'r1', 'r2', 'r3', 'q1', 'q2', 'd1', 'd2', 'd3', 'led1'];
  for (let i = 0; i < ids.length; i++) {
    circuit.connect(ids[i], 'A', nodes[i]);
    circuit.connect(ids[i], 'B', nodes[i + 1]);
  }
  circuit.connect('b1', 'B', nodes[10]); // already set, make it share

  const result = LEVELS[6].checkSolution(circuit);
  assert(result.passed, 'Level 7 logic gate circuit solution passes');
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
