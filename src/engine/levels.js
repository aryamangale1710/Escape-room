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
const _Capacitor = (typeof Capacitor !== 'undefined') ? Capacitor : engineModule.Capacitor;
const _Inductor = (typeof Inductor !== 'undefined') ? Inductor : engineModule.Inductor;
const _Diode = (typeof Diode !== 'undefined') ? Diode : engineModule.Diode;
const _Transistor = (typeof Transistor !== 'undefined') ? Transistor : engineModule.Transistor;
const _Transformer = (typeof Transformer !== 'undefined') ? Transformer : engineModule.Transformer;
const _Potentiometer = (typeof Potentiometer !== 'undefined') ? Potentiometer : engineModule.Potentiometer;
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
  // ===== Beginner Levels (1-3) =====
  {
    id: 1,
    title: 'RC Charging',
    difficulty: Difficulty.BEGINNER,
    description: 'Connect a battery, resistor, capacitor and switch to build an RC charging circuit.',
    story: 'You wake up in a dark laboratory. A capacitor needs to charge to power the exit sign. Build the RC charging circuit and close the switch!',
    objectives: [
      'Wire all four components together to form a complete circuit',
      'Close the switch to start charging the capacitor',
    ],
    availableComponents: [
      { type: _ComponentType.BATTERY, props: { voltage: 9 } },
      { type: _ComponentType.RESISTOR, props: { resistance: 1000 }, label: '1kΩ' },
      { type: _ComponentType.CAPACITOR, props: { capacitance: 0.0001, voltageRating: 50 }, label: '100µF' },
      { type: _ComponentType.SWITCH, props: { closed: false } },
    ],
    preplacedComponents: [],
    checkSolution: function (circuit) {
      const comps = [...circuit.components.values()];
      const hasBattery = comps.some((c) => c.type === _ComponentType.BATTERY);
      const hasResistor = comps.some((c) => c.type === _ComponentType.RESISTOR);
      const hasCapacitor = comps.some((c) => c instanceof _Capacitor);
      const hasSwitch = comps.some((c) => c.type === _ComponentType.SWITCH);
      if (!hasBattery || !hasResistor || !hasCapacitor || !hasSwitch) {
        return { passed: false, message: 'Missing components. You need: Battery, Resistor, Capacitor, Switch.' };
      }
      const sw = comps.find((c) => c.type === _ComponentType.SWITCH);
      if (!sw.isActive()) {
        return { passed: false, message: 'Close the switch to start charging the capacitor!' };
      }
      if (!circuit.validateCircuitTopology()) {
        return { passed: false, message: 'Components are not wired together. Use the Wire tool to connect them!' };
      }
      return { passed: true, message: 'RC Circuit assembled! The capacitor charges through the resistor. Exit sign powers up!' };
    },
    hints: [
      'Wire each component\'s terminals to the next component to form a loop.',
      'The capacitor connects between the resistor and the battery return.',
      'Close the switch (double-click) after connecting all components.',
    ],
    maxScore: 100,
    timeBonus: 90,
  },
  {
    id: 2,
    title: 'Diode Logic',
    difficulty: Difficulty.BEGINNER,
    description: 'Wire a diode and LED circuit so that current only flows in the correct direction.',
    story: 'The door panel requires a specific current direction. A diode controls which way electrons flow. Orient the diode correctly to light the LED and unlock the door!',
    objectives: [
      'Connect Battery, Resistor, Diode, and LED with wires',
      'Ensure the diode is forward-biased so current lights the LED',
    ],
    availableComponents: [
      { type: _ComponentType.BATTERY, props: { voltage: 9 } },
      { type: _ComponentType.RESISTOR, props: { resistance: 330 }, label: '330Ω' },
      { type: _ComponentType.DIODE, props: { forwardVoltage: 0.7, maxCurrent: 0.02, forwardBiased: true }, label: 'Diode' },
      { type: _ComponentType.LED, props: { forwardVoltage: 2, maxCurrent: 0.02 } },
    ],
    preplacedComponents: [],
    checkSolution: function (circuit) {
      const comps = [...circuit.components.values()];
      const hasDiode = comps.some((c) => c instanceof _Diode);
      const leds = comps.filter((c) => c instanceof _LED);
      if (!hasDiode || leds.length === 0) {
        return { passed: false, message: 'You need a Diode and an LED in the circuit.' };
      }
      if (!circuit.validateCircuitTopology()) {
        return { passed: false, message: 'Components are not fully wired. Connect them all with wires!' };
      }
      const result = circuit.simulate();
      const allLit = leds.every((led) => led.isLit());
      if (!allLit) {
        return { passed: false, message: 'LED is not lit. Check the diode orientation — double-click the diode to flip it.' };
      }
      return { passed: true, message: 'Diode allows forward current! LED lights up. Door unlocked.' };
    },
    hints: [
      'A diode only allows current in one direction (anode → cathode).',
      'Double-click the diode on the board to flip its orientation.',
      'When forward-biased, the diode has ~0.7V voltage drop.',
    ],
    maxScore: 100,
    timeBonus: 90,
  },
  {
    id: 3,
    title: 'Mixed Series Circuit',
    difficulty: Difficulty.BEGINNER,
    description: 'Build a series circuit using five different component types wired together.',
    story: 'The lab\'s diagnostic panel requires all five component types to be present and connected in a valid series circuit. Assemble the circuit to pass the diagnostic!',
    objectives: [
      'Place and wire: Battery, Resistor, Capacitor, Diode, and LED',
      'All components must be connected in one continuous loop',
    ],
    availableComponents: [
      { type: _ComponentType.BATTERY, props: { voltage: 9 } },
      { type: _ComponentType.RESISTOR, props: { resistance: 330 }, label: '330Ω' },
      { type: _ComponentType.CAPACITOR, props: { capacitance: 0.00001, voltageRating: 50 }, label: '10µF' },
      { type: _ComponentType.DIODE, props: { forwardVoltage: 0.7, maxCurrent: 0.02, forwardBiased: true }, label: 'Diode' },
      { type: _ComponentType.LED, props: { forwardVoltage: 2, maxCurrent: 0.02 } },
    ],
    preplacedComponents: [],
    checkSolution: function (circuit) {
      const comps = [...circuit.components.values()];
      const hasBattery = comps.some((c) => c.type === _ComponentType.BATTERY);
      const hasResistor = comps.some((c) => c.type === _ComponentType.RESISTOR);
      const hasCapacitor = comps.some((c) => c instanceof _Capacitor);
      const hasDiode = comps.some((c) => c instanceof _Diode);
      const hasLED = comps.some((c) => c instanceof _LED);
      if (!hasBattery || !hasResistor || !hasCapacitor || !hasDiode || !hasLED) {
        return { passed: false, message: 'Missing components. Need: Battery, Resistor, Capacitor, Diode, and LED.' };
      }
      if (!circuit.validateCircuitTopology()) {
        return { passed: false, message: 'All five components must be wired into one connected circuit.' };
      }
      return { passed: true, message: 'Mixed series circuit assembled! Diagnostic passes. Proceeding to next room.' };
    },
    hints: [
      'Connect components in a chain: Battery → Resistor → Capacitor → Diode → LED → Battery.',
      'Each component needs two wire connections (one per terminal).',
      'Make sure the diode is in the forward direction (double-click to flip if needed).',
    ],
    maxScore: 100,
    timeBonus: 120,
  },

  // ===== Intermediate Levels (4-6) =====
  {
    id: 4,
    title: 'Parallel RC Circuit',
    difficulty: Difficulty.INTERMEDIATE,
    description: 'Build two RC branches in parallel: each branch has its own resistor and capacitor.',
    story: 'Two timing locks protect the next door. Each lock uses its own RC time constant. Build a parallel RC circuit with two different branches and close the switch!',
    objectives: [
      'Wire at least 2 Resistors, 2 Capacitors, and a Switch in a parallel configuration',
      'Both branches must be connected to the same power rails',
    ],
    availableComponents: [
      { type: _ComponentType.BATTERY, props: { voltage: 9 } },
      { type: _ComponentType.RESISTOR, props: { resistance: 1000 }, label: '1kΩ' },
      { type: _ComponentType.RESISTOR, props: { resistance: 2200 }, label: '2.2kΩ' },
      { type: _ComponentType.CAPACITOR, props: { capacitance: 0.0001, voltageRating: 50 }, label: '100µF' },
      { type: _ComponentType.CAPACITOR, props: { capacitance: 0.000047, voltageRating: 50 }, label: '47µF' },
      { type: _ComponentType.SWITCH, props: { closed: false } },
    ],
    preplacedComponents: [],
    checkSolution: function (circuit) {
      const comps = [...circuit.components.values()];
      const resistors = comps.filter((c) => c.type === _ComponentType.RESISTOR);
      const capacitors = comps.filter((c) => c instanceof _Capacitor);
      const hasSwitch = comps.some((c) => c.type === _ComponentType.SWITCH);
      if (resistors.length < 2 || capacitors.length < 2 || !hasSwitch) {
        return { passed: false, message: 'Need at least 2 Resistors, 2 Capacitors, and a Switch.' };
      }
      const sw = comps.find((c) => c.type === _ComponentType.SWITCH);
      if (!sw.isActive()) {
        return { passed: false, message: 'Close the switch to energize the parallel RC circuit.' };
      }
      if (!circuit.validateCircuitTopology()) {
        return { passed: false, message: 'All components must be wired together in a connected circuit.' };
      }
      return { passed: true, message: 'Parallel RC circuit assembled! Two time constants charge simultaneously. Both locks open!' };
    },
    hints: [
      'Connect both RC branches between the same two nodes (power rails).',
      'Each branch: Resistor in series with Capacitor between the rails.',
      'Use the Switch in series with the battery to control the circuit.',
    ],
    maxScore: 150,
    timeBonus: 150,
  },
  {
    id: 5,
    title: 'Transistor Switch',
    difficulty: Difficulty.INTERMEDIATE,
    description: 'Use a transistor as an electronic switch to control an LED.',
    story: 'The exit requires an electronic switch — not a mechanical one! Use an NPN transistor with proper biasing to switch on the LED and unlock the door.',
    objectives: [
      'Wire Battery, Resistor, NPN Transistor, and LED together',
      'Activate the transistor (double-click) so it conducts and lights the LED',
    ],
    availableComponents: [
      { type: _ComponentType.BATTERY, props: { voltage: 9 } },
      { type: _ComponentType.RESISTOR, props: { resistance: 1000 }, label: '1kΩ (Base)' },
      { type: _ComponentType.TRANSISTOR, props: { transistorType: 'NPN', hFE: 100, conducting: false }, label: 'NPN Transistor' },
      { type: _ComponentType.LED, props: { forwardVoltage: 2, maxCurrent: 0.02 } },
    ],
    preplacedComponents: [],
    checkSolution: function (circuit) {
      const comps = [...circuit.components.values()];
      const transistors = comps.filter((c) => c instanceof _Transistor);
      const leds = comps.filter((c) => c instanceof _LED);
      if (transistors.length === 0 || leds.length === 0) {
        return { passed: false, message: 'You need an NPN Transistor and an LED in the circuit.' };
      }
      if (!circuit.validateCircuitTopology()) {
        return { passed: false, message: 'All components must be wired together.' };
      }
      const result = circuit.simulate();
      const allLit = leds.every((led) => led.isLit());
      if (!allLit) {
        return { passed: false, message: 'LED is not lit. Enable the transistor by double-clicking it (simulates base current).' };
      }
      return { passed: true, message: 'Transistor conducting! LED activates. Electronic switch works — door unlocked.' };
    },
    hints: [
      'A transistor conducts when its base current exceeds a threshold.',
      'Double-click the transistor to toggle it between conducting and cutoff.',
      'Connect the resistor to the base to limit base current.',
    ],
    maxScore: 150,
    timeBonus: 150,
  },
  {
    id: 6,
    title: 'Transistor Amplifier',
    difficulty: Difficulty.INTERMEDIATE,
    description: 'Build a transistor amplifier with four bias resistors and a coupling capacitor.',
    story: 'The security intercom is too quiet — you need to amplify the signal! Build a common-emitter amplifier circuit to boost the audio and trigger the door release.',
    objectives: [
      'Wire 2 Batteries, 4 Resistors, 1 NPN Transistor, and 1 Capacitor',
      'All components must form a single connected circuit',
    ],
    availableComponents: [
      { type: _ComponentType.BATTERY, props: { voltage: 9 }, label: 'Vcc (9V)' },
      { type: _ComponentType.BATTERY, props: { voltage: 1.5 }, label: 'Vin (1.5V)' },
      { type: _ComponentType.RESISTOR, props: { resistance: 10000 }, label: 'R1 10kΩ' },
      { type: _ComponentType.RESISTOR, props: { resistance: 4700 }, label: 'R2 4.7kΩ' },
      { type: _ComponentType.RESISTOR, props: { resistance: 1000 }, label: 'Rc 1kΩ' },
      { type: _ComponentType.RESISTOR, props: { resistance: 470 }, label: 'Re 470Ω' },
      { type: _ComponentType.TRANSISTOR, props: { transistorType: 'NPN', hFE: 100, conducting: true }, label: 'NPN Transistor' },
      { type: _ComponentType.CAPACITOR, props: { capacitance: 0.000010, voltageRating: 50 }, label: '10µF (Coupling)' },
    ],
    preplacedComponents: [],
    checkSolution: function (circuit) {
      const comps = [...circuit.components.values()];
      const resistors = comps.filter((c) => c.type === _ComponentType.RESISTOR);
      const transistors = comps.filter((c) => c instanceof _Transistor);
      const capacitors = comps.filter((c) => c instanceof _Capacitor);
      if (resistors.length < 4 || transistors.length < 1 || capacitors.length < 1) {
        return { passed: false, message: 'Need: at least 4 Resistors, 1 Transistor (NPN), and 1 Capacitor.' };
      }
      if (!circuit.validateCircuitTopology()) {
        return { passed: false, message: 'All components must be wired into one connected circuit.' };
      }
      return { passed: true, message: 'Transistor amplifier assembled! Signal amplified — the door release triggers.' };
    },
    hints: [
      'Bias resistors R1 and R2 form a voltage divider to set the base voltage.',
      'Rc (collector resistor) and Re (emitter resistor) set the amplifier operating point.',
      'The coupling capacitor blocks DC while passing the AC signal.',
    ],
    maxScore: 200,
    timeBonus: 180,
  },

  // ===== Advanced Levels (7-9) =====
  {
    id: 7,
    title: 'Logic Gate Circuit',
    difficulty: Difficulty.ADVANCED,
    description: 'Build a discrete AND/OR logic gate using transistors and diodes.',
    story: 'The vault uses a custom logic lock built from discrete components. Replicate the AND/OR gate circuit using transistors and diodes to output the correct signal and open the vault!',
    objectives: [
      'Wire Battery, 3 Resistors, 2 Transistors, 3 Diodes, and an LED',
      'Enable both transistors so the LED (output) lights up',
    ],
    availableComponents: [
      { type: _ComponentType.BATTERY, props: { voltage: 9 } },
      { type: _ComponentType.RESISTOR, props: { resistance: 1000 }, label: 'R1 1kΩ' },
      { type: _ComponentType.RESISTOR, props: { resistance: 1000 }, label: 'R2 1kΩ' },
      { type: _ComponentType.RESISTOR, props: { resistance: 330 }, label: 'R3 330Ω' },
      { type: _ComponentType.TRANSISTOR, props: { transistorType: 'NPN', hFE: 100, conducting: false }, label: 'Q1 NPN' },
      { type: _ComponentType.TRANSISTOR, props: { transistorType: 'NPN', hFE: 100, conducting: false }, label: 'Q2 NPN' },
      { type: _ComponentType.DIODE, props: { forwardVoltage: 0.7, maxCurrent: 0.02, forwardBiased: true }, label: 'D1' },
      { type: _ComponentType.DIODE, props: { forwardVoltage: 0.7, maxCurrent: 0.02, forwardBiased: true }, label: 'D2' },
      { type: _ComponentType.DIODE, props: { forwardVoltage: 0.7, maxCurrent: 0.02, forwardBiased: true }, label: 'D3' },
      { type: _ComponentType.LED, props: { forwardVoltage: 2, maxCurrent: 0.02 } },
    ],
    preplacedComponents: [],
    checkSolution: function (circuit) {
      const comps = [...circuit.components.values()];
      const transistors = comps.filter((c) => c instanceof _Transistor);
      const diodes = comps.filter((c) => c instanceof _Diode);
      const leds = comps.filter((c) => c instanceof _LED);
      if (transistors.length < 2 || diodes.length < 3 || leds.length === 0) {
        return { passed: false, message: 'Need: at least 2 Transistors, 3 Diodes, and 1 LED.' };
      }
      if (!circuit.validateCircuitTopology()) {
        return { passed: false, message: 'All components must be wired into one connected circuit.' };
      }
      const result = circuit.simulate();
      const allLit = leds.every((led) => led.isLit());
      if (!allLit) {
        return { passed: false, message: 'LED not lit. Double-click both transistors to activate them.' };
      }
      return { passed: true, message: 'Discrete logic gate outputs HIGH — vault opens!' };
    },
    hints: [
      'AND logic: both transistors Q1 and Q2 must conduct for output to be HIGH.',
      'Double-click each transistor to enable it (simulates base current input).',
      'Diodes steer current in the logic paths — make sure they are forward-biased.',
    ],
    maxScore: 200,
    timeBonus: 180,
  },
  {
    id: 8,
    title: 'Filter Circuit',
    difficulty: Difficulty.ADVANCED,
    description: 'Build an LC filter circuit with two resistors, a capacitor, an inductor, and a switch.',
    story: 'Noise in the control signal is keeping the door sealed. Build a low-pass LC filter to clean the signal and trigger the release mechanism!',
    objectives: [
      'Wire Battery, 2 Resistors, 1 Capacitor, 1 Inductor, and 1 Switch',
      'Close the switch to activate the filter',
    ],
    availableComponents: [
      { type: _ComponentType.BATTERY, props: { voltage: 9 } },
      { type: _ComponentType.RESISTOR, props: { resistance: 100 }, label: 'R1 100Ω' },
      { type: _ComponentType.RESISTOR, props: { resistance: 100 }, label: 'R2 100Ω' },
      { type: _ComponentType.CAPACITOR, props: { capacitance: 0.000001, voltageRating: 50 }, label: '1µF' },
      { type: _ComponentType.INDUCTOR, props: { inductance: 0.001, wireResistance: 0.5 }, label: '1mH' },
      { type: _ComponentType.SWITCH, props: { closed: false } },
    ],
    preplacedComponents: [],
    checkSolution: function (circuit) {
      const comps = [...circuit.components.values()];
      const resistors = comps.filter((c) => c.type === _ComponentType.RESISTOR);
      const capacitors = comps.filter((c) => c instanceof _Capacitor);
      const inductors = comps.filter((c) => c instanceof _Inductor);
      const hasSwitch = comps.some((c) => c.type === _ComponentType.SWITCH);
      if (resistors.length < 2 || capacitors.length < 1 || inductors.length < 1 || !hasSwitch) {
        return { passed: false, message: 'Need: 2 Resistors, 1 Capacitor, 1 Inductor, and 1 Switch.' };
      }
      const sw = comps.find((c) => c.type === _ComponentType.SWITCH);
      if (!sw.isActive()) {
        return { passed: false, message: 'Close the switch to activate the LC filter.' };
      }
      if (!circuit.validateCircuitTopology()) {
        return { passed: false, message: 'All components must be wired into one connected circuit.' };
      }
      return { passed: true, message: 'LC filter circuit assembled! Signal noise removed — door release triggers!' };
    },
    hints: [
      'Inductors pass DC and block high-frequency AC; capacitors do the opposite.',
      'Connect the inductor in series and the capacitor in parallel for a low-pass filter.',
      'Close the switch after wiring all components.',
    ],
    maxScore: 200,
    timeBonus: 200,
  },
  {
    id: 9,
    title: 'Final Escape: Power Supply',
    difficulty: Difficulty.ADVANCED,
    description: 'Build a complete rectified and filtered power supply using a transformer, diode bridge, capacitors, and resistors.',
    story: 'The final door requires a stable DC power supply built from scratch. Assemble the full-wave rectifier with transformer, 4-diode bridge, filter capacitors, and load resistors to power the final lock!',
    objectives: [
      'Wire: Battery, Transformer, 4 Diodes, 2 Capacitors, and 3 Resistors',
      'All components must form a single connected circuit',
    ],
    availableComponents: [
      { type: _ComponentType.BATTERY, props: { voltage: 9 } },
      { type: _ComponentType.TRANSFORMER, props: { turnsRatio: 0.5, primaryInductance: 0.1 }, label: 'Transformer (1:0.5)' },
      { type: _ComponentType.DIODE, props: { forwardVoltage: 0.7, maxCurrent: 1, forwardBiased: true }, label: 'D1' },
      { type: _ComponentType.DIODE, props: { forwardVoltage: 0.7, maxCurrent: 1, forwardBiased: true }, label: 'D2' },
      { type: _ComponentType.DIODE, props: { forwardVoltage: 0.7, maxCurrent: 1, forwardBiased: true }, label: 'D3' },
      { type: _ComponentType.DIODE, props: { forwardVoltage: 0.7, maxCurrent: 1, forwardBiased: true }, label: 'D4' },
      { type: _ComponentType.CAPACITOR, props: { capacitance: 0.001, voltageRating: 50 }, label: 'C1 1000µF' },
      { type: _ComponentType.CAPACITOR, props: { capacitance: 0.0001, voltageRating: 50 }, label: 'C2 100µF' },
      { type: _ComponentType.RESISTOR, props: { resistance: 100 }, label: 'R1 100Ω' },
      { type: _ComponentType.RESISTOR, props: { resistance: 100 }, label: 'R2 100Ω' },
      { type: _ComponentType.RESISTOR, props: { resistance: 1000 }, label: 'RL 1kΩ (Load)' },
    ],
    preplacedComponents: [],
    checkSolution: function (circuit) {
      const comps = [...circuit.components.values()];
      const transformers = comps.filter((c) => c instanceof _Transformer);
      const diodes = comps.filter((c) => c instanceof _Diode);
      const capacitors = comps.filter((c) => c instanceof _Capacitor);
      const resistors = comps.filter((c) => c.type === _ComponentType.RESISTOR);
      if (transformers.length < 1) {
        return { passed: false, message: 'Missing Transformer. A transformer steps down voltage for the rectifier.' };
      }
      if (diodes.length < 4) {
        return { passed: false, message: `Only ${diodes.length} of 4 required Diodes placed. You need 4 for a full-wave bridge rectifier.` };
      }
      if (capacitors.length < 2) {
        return { passed: false, message: `Only ${capacitors.length} of 2 required Capacitors placed. Capacitors filter the rectified output.` };
      }
      if (resistors.length < 3) {
        return { passed: false, message: `Only ${resistors.length} of 3 required Resistors placed.` };
      }
      if (!circuit.validateCircuitTopology()) {
        return { passed: false, message: 'All components must be wired into one connected circuit.' };
      }
      return { passed: true, message: 'Complete power supply assembled! Rectified, filtered DC powers the final lock. You escape the laboratory! 🎉' };
    },
    hints: [
      'A full-wave bridge rectifier uses 4 diodes arranged in a bridge pattern.',
      'Connect the transformer secondary to the diode bridge input.',
      'Filter capacitors smooth the pulsating DC output from the rectifier.',
      'Load resistors simulate the device being powered by the supply.',
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

    // Deduct for extra attempts (first attempt is free); stored as negative for display
    const extraAttempts = Math.max(0, attempts - 1);
    const attemptDeduction = extraAttempts * 10;
    score -= attemptDeduction;

    // Deduct for hints used; stored as negative for display
    const hintDeduction = hints * 15;
    score -= hintDeduction;

    // Time bonus
    let timeBonusEarned = 0;
    if (timeElapsed < timeBonus) {
      timeBonusEarned = Math.floor((timeBonus - timeElapsed) / timeBonus * 50);
      score += timeBonusEarned;
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

    return {
      score,
      stars,
      totalScore: this.totalScore,
      breakdown: {
        base: maxScore,
        attemptPenalty: extraAttempts > 0 ? -attemptDeduction : 0,
        hintPenalty: hints > 0 ? -hintDeduction : 0,
        timeBonus: timeBonusEarned,
        extraAttempts,
        hints,
      },
    };
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
