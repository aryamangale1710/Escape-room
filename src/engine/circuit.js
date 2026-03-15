/**
 * Circuit Simulation Engine
 * Handles electronic component modeling, circuit solving (Ohm's Law,
 * series/parallel circuits), and logic gate evaluation.
 */

/** Component types enumeration */
const ComponentType = Object.freeze({
  BATTERY: 'battery',
  RESISTOR: 'resistor',
  LED: 'led',
  SWITCH: 'switch',
  WIRE: 'wire',
  AND_GATE: 'and_gate',
  OR_GATE: 'or_gate',
  NOT_GATE: 'not_gate',
  CAPACITOR: 'capacitor',
  INDUCTOR: 'inductor',
  DIODE: 'diode',
  TRANSISTOR: 'transistor',
  TRANSFORMER: 'transformer',
  POTENTIOMETER: 'potentiometer',
});

/**
 * Base class for all electronic components.
 */
class Component {
  constructor(type, id, properties = {}) {
    this.type = type;
    this.id = id;
    this.nodeA = null;
    this.nodeB = null;
    this.voltage = 0;
    this.current = 0;
    this.properties = { ...properties };
  }

  connect(nodeA, nodeB) {
    this.nodeA = nodeA;
    this.nodeB = nodeB;
  }

  getResistance() {
    return 0;
  }

  isActive() {
    return true;
  }

  toJSON() {
    return {
      type: this.type,
      id: this.id,
      nodeA: this.nodeA,
      nodeB: this.nodeB,
      voltage: this.voltage,
      current: this.current,
      properties: { ...this.properties },
    };
  }
}

class Battery extends Component {
  constructor(id, voltage = 9) {
    super(ComponentType.BATTERY, id, { voltage, internalResistance: 0.5 });
  }

  getVoltage() {
    return this.properties.voltage;
  }

  getResistance() {
    return this.properties.internalResistance;
  }
}

class Resistor extends Component {
  constructor(id, resistance = 100) {
    super(ComponentType.RESISTOR, id, { resistance });
  }

  getResistance() {
    return this.properties.resistance;
  }
}

class LED extends Component {
  constructor(id, forwardVoltage = 2, maxCurrent = 0.02) {
    super(ComponentType.LED, id, { forwardVoltage, maxCurrent, lit: false, brightness: 0 });
  }

  getResistance() {
    return this.properties.forwardVoltage / (this.properties.maxCurrent || 0.02);
  }

  isLit() {
    return this.properties.lit;
  }

  getBrightness() {
    return this.properties.brightness;
  }

  updateState(current) {
    this.current = current;
    if (current > 0.001) {
      this.properties.lit = true;
      this.properties.brightness = Math.min(1, current / this.properties.maxCurrent);
    } else {
      this.properties.lit = false;
      this.properties.brightness = 0;
    }
    return this.properties.lit;
  }
}

class Switch extends Component {
  constructor(id, closed = false) {
    super(ComponentType.SWITCH, id, { closed });
  }

  getResistance() {
    return this.properties.closed ? 0.001 : Infinity;
  }

  isActive() {
    return this.properties.closed;
  }

  toggle() {
    this.properties.closed = !this.properties.closed;
    return this.properties.closed;
  }

  setClosed(state) {
    this.properties.closed = state;
  }
}

class Wire extends Component {
  constructor(id) {
    super(ComponentType.WIRE, id, {});
  }

  getResistance() {
    return 0.001;
  }
}

/**
 * Capacitor - stores electrical charge, blocks DC in steady state.
 */
class Capacitor extends Component {
  constructor(id, capacitance = 0.0001, voltageRating = 50) {
    super(ComponentType.CAPACITOR, id, { capacitance, voltageRating, charge: 0 });
  }

  getCapacitance() {
    return this.properties.capacitance;
  }

  getResistance() {
    // In DC steady-state a capacitor is effectively an open circuit
    return 1e6;
  }

  /** Voltage across capacitor after charging for time t through resistance R from sourceVoltage. */
  getChargeVoltage(sourceVoltage, resistance, time) {
    const tau = resistance * this.properties.capacitance;
    return sourceVoltage * (1 - Math.exp(-time / tau));
  }
}

/**
 * Inductor - stores energy in a magnetic field, passes DC freely.
 */
class Inductor extends Component {
  constructor(id, inductance = 0.001, wireResistance = 0.1) {
    super(ComponentType.INDUCTOR, id, { inductance, wireResistance });
  }

  getInductance() {
    return this.properties.inductance;
  }

  getResistance() {
    // In DC steady-state an ideal inductor is a short (only wire resistance remains)
    return this.properties.wireResistance;
  }

  /** Current through inductor after time t with voltage V across inductance L. */
  getTransientCurrent(voltage, resistance, time) {
    const tau = this.properties.inductance / (resistance || 1);
    return (voltage / (resistance || 1)) * (1 - Math.exp(-time / tau));
  }
}

/**
 * Diode - allows current in one direction only.
 */
class Diode extends Component {
  constructor(id, forwardVoltage = 0.7, maxCurrent = 1) {
    super(ComponentType.DIODE, id, { forwardVoltage, maxCurrent, forwardBiased: true });
  }

  getResistance() {
    return this.properties.forwardBiased
      ? this.properties.forwardVoltage / this.properties.maxCurrent
      : Infinity;
  }

  isActive() {
    return this.properties.forwardBiased;
  }

  isForwardBiased() {
    return this.properties.forwardBiased;
  }

  setForwardBias(state) {
    this.properties.forwardBiased = state;
  }

  /** Flip diode orientation. */
  toggle() {
    this.properties.forwardBiased = !this.properties.forwardBiased;
    return this.properties.forwardBiased;
  }
}

/**
 * Transistor (NPN or PNP) - acts as an electronic switch or amplifier.
 */
class Transistor extends Component {
  constructor(id, transistorType = 'NPN', hFE = 100) {
    super(ComponentType.TRANSISTOR, id, {
      transistorType,
      hFE,
      Vbe: 0.7,
      Vce_sat: 0.2,
      conducting: false,
      baseCurrent: 0,
    });
  }

  getResistance() {
    return this.properties.conducting ? 0.001 : Infinity;
  }

  isActive() {
    return this.properties.conducting;
  }

  isConducting() {
    return this.properties.conducting;
  }

  setConducting(state) {
    this.properties.conducting = state;
  }

  setBaseCurrent(current) {
    this.properties.baseCurrent = current;
    // Transistor conducts when base current exceeds ~1 mA threshold
    this.properties.conducting = current >= 0.001;
  }

  /** Toggle between conducting and cutoff (useful for game interaction). */
  toggle() {
    this.properties.conducting = !this.properties.conducting;
    return this.properties.conducting;
  }

  getCollectorCurrent(baseCurrent) {
    return this.properties.hFE * baseCurrent;
  }
}

/**
 * Transformer - transfers power between coils with voltage transformation.
 */
class Transformer extends Component {
  constructor(id, turnsRatio = 1, primaryInductance = 0.1) {
    super(ComponentType.TRANSFORMER, id, { turnsRatio, primaryInductance, secondaryResistance: 0.5 });
  }

  getResistance() {
    return this.properties.secondaryResistance;
  }

  getTurnsRatio() {
    return this.properties.turnsRatio;
  }

  /** Output voltage = input voltage × turns ratio. */
  getOutputVoltage(inputVoltage) {
    return inputVoltage * this.properties.turnsRatio;
  }
}

/**
 * Potentiometer - variable resistor adjustable by position (0–1).
 */
class Potentiometer extends Component {
  constructor(id, minResistance = 0, maxResistance = 10000, position = 0.5) {
    super(ComponentType.POTENTIOMETER, id, { minResistance, maxResistance, position });
  }

  getResistance() {
    const { minResistance, maxResistance, position } = this.properties;
    return minResistance + (maxResistance - minResistance) * position;
  }

  /** Set wiper position (0 = min resistance, 1 = max resistance). */
  setPosition(position) {
    this.properties.position = Math.max(0, Math.min(1, position));
  }

  getPosition() {
    return this.properties.position;
  }
}

class LogicGate extends Component {
  constructor(type, id) {
    super(type, id, { inputs: [], output: false });
  }

  evaluate(inputs) {
    this.properties.inputs = inputs;
    switch (this.type) {
      case ComponentType.AND_GATE:
        this.properties.output = inputs.length > 0 && inputs.every(Boolean);
        break;
      case ComponentType.OR_GATE:
        this.properties.output = inputs.some(Boolean);
        break;
      case ComponentType.NOT_GATE:
        this.properties.output = inputs.length > 0 ? !inputs[0] : false;
        break;
      default:
        this.properties.output = false;
    }
    return this.properties.output;
  }

  getOutput() {
    return this.properties.output;
  }
}

/**
 * Circuit class - manages components and connections, runs simulation.
 */
class Circuit {
  constructor() {
    this.components = new Map();
    this.connections = [];
    this.nodes = new Map();
    this.nextNodeId = 0;
  }

  addComponent(component) {
    this.components.set(component.id, component);
    return component;
  }

  removeComponent(id) {
    const component = this.components.get(id);
    if (!component) return false;
    this.connections = this.connections.filter(
      (c) => c.componentId !== id
    );
    this.components.delete(id);
    return true;
  }

  getComponent(id) {
    return this.components.get(id);
  }

  createNode() {
    const nodeId = `node_${this.nextNodeId++}`;
    this.nodes.set(nodeId, { id: nodeId, connections: [] });
    return nodeId;
  }

  connect(componentId, terminal, nodeId) {
    const component = this.components.get(componentId);
    if (!component) return false;

    if (terminal === 'A') {
      component.nodeA = nodeId;
    } else if (terminal === 'B') {
      component.nodeB = nodeId;
    } else {
      return false;
    }

    const node = this.nodes.get(nodeId);
    if (node) {
      node.connections.push({ componentId, terminal });
    }

    this.connections.push({ componentId, terminal, nodeId });
    return true;
  }

  /**
   * Check whether two components share at least one electrical node.
   */
  isConnected(compIdA, compIdB) {
    const compA = this.components.get(compIdA);
    const compB = this.components.get(compIdB);
    if (!compA || !compB) return false;
    const nodesA = [compA.nodeA, compA.nodeB].filter(Boolean);
    const nodesB = [compB.nodeA, compB.nodeB].filter(Boolean);
    return nodesA.some((n) => nodesB.includes(n));
  }

  /**
   * BFS from startCompId, returning all components reachable via shared nodes.
   */
  getConnectedPath(startCompId) {
    const start = this.components.get(startCompId);
    if (!start) return [];
    const visited = new Set([startCompId]);
    const path = [start];
    const queue = [startCompId];
    while (queue.length > 0) {
      const currId = queue.shift();
      for (const [otherId] of this.components) {
        if (visited.has(otherId)) continue;
        if (this.isConnected(currId, otherId)) {
          visited.add(otherId);
          path.push(this.components.get(otherId));
          queue.push(otherId);
        }
      }
    }
    return path;
  }

  /**
   * Return true if all components are reachable from the first component (single connected graph).
   */
  validateCircuitTopology() {
    if (this.components.size === 0) return false;
    for (const [, comp] of this.components) {
      if (comp.nodeA === null || comp.nodeB === null) return false;
    }
    const firstId = [...this.components.keys()][0];
    const path = this.getConnectedPath(firstId);
    return path.length === this.components.size;
  }

  /**
   * Return true if any Wire component exists in the circuit.
   */
  hasWireConnection() {
    for (const [, comp] of this.components) {
      if (comp.type === ComponentType.WIRE) return true;
    }
    return false;
  }

  /**
   * Find all series-connected components between two nodes.
   */
  findSeriesComponents(startNode, endNode) {
    const visited = new Set();
    const path = [];

    const dfs = (currentNode) => {
      if (currentNode === endNode) return true;
      visited.add(currentNode);

      for (const [, comp] of this.components) {
        if (visited.has(comp.id)) continue;

        let nextNode = null;
        if (comp.nodeA === currentNode) nextNode = comp.nodeB;
        else if (comp.nodeB === currentNode) nextNode = comp.nodeA;

        if (nextNode && !visited.has(nextNode)) {
          visited.add(comp.id);
          path.push(comp);
          if (dfs(nextNode)) return true;
          path.pop();
        }
      }
      return false;
    };

    dfs(startNode);
    return path;
  }

  /**
   * Calculate total resistance of components in series.
   */
  calculateSeriesResistance(components) {
    return components.reduce((total, comp) => total + comp.getResistance(), 0);
  }

  /**
   * Calculate total resistance of components in parallel.
   */
  calculateParallelResistance(resistances) {
    if (resistances.length === 0) return Infinity;
    if (resistances.some((r) => r === 0)) return 0;

    const reciprocalSum = resistances.reduce((sum, r) => {
      if (r === Infinity) return sum;
      return sum + 1 / r;
    }, 0);

    return reciprocalSum === 0 ? Infinity : 1 / reciprocalSum;
  }

  /**
   * Simulate the circuit: compute voltages and currents using Ohm's Law.
   */
  simulate() {
    const result = {
      totalVoltage: 0,
      totalResistance: 0,
      totalCurrent: 0,
      componentStates: new Map(),
      isComplete: false,
      hasShortCircuit: false,
      errors: [],
    };

    // Find batteries
    const batteries = [];
    const otherComponents = [];
    for (const [, comp] of this.components) {
      if (comp.type === ComponentType.BATTERY) {
        batteries.push(comp);
      } else {
        otherComponents.push(comp);
      }
    }

    if (batteries.length === 0) {
      result.errors.push('No power source found');
      return result;
    }

    // Check all switches are active
    const hasOpenSwitch = otherComponents.some(
      (c) => c.type === ComponentType.SWITCH && !c.isActive()
    );

    if (hasOpenSwitch) {
      result.errors.push('Circuit is open: switch is off');
      this._resetComponents(otherComponents);
      return result;
    }

    // Check for reverse-biased diodes blocking current
    const hasBlockingDiode = otherComponents.some(
      (c) => c instanceof Diode && !c.isForwardBiased()
    );

    if (hasBlockingDiode) {
      result.errors.push('Circuit is blocked: diode is reverse biased');
      this._resetComponents(otherComponents);
      return result;
    }

    // Check for non-conducting transistors blocking current
    const hasNonConductingTransistor = otherComponents.some(
      (c) => c instanceof Transistor && !c.isConducting()
    );

    if (hasNonConductingTransistor) {
      result.errors.push('Circuit is blocked: transistor is not conducting');
      this._resetComponents(otherComponents);
      return result;
    }

    // Check circuit completeness (all components have connections assigned)
    const allConnected = [...this.components.values()].every(
      (c) => c.nodeA !== null && c.nodeB !== null
    );

    if (!allConnected) {
      result.errors.push('Circuit is incomplete: not all components are connected');
      return result;
    }

    // Validate topology: all components must be in one connected graph
    if (!this.validateCircuitTopology()) {
      result.errors.push('Circuit is incomplete: components are not all wired together');
      return result;
    }

    // Calculate total voltage from batteries
    result.totalVoltage = batteries.reduce((sum, b) => sum + b.getVoltage(), 0);

    // Transformers scale the effective voltage
    const transformers = otherComponents.filter((c) => c instanceof Transformer);
    if (transformers.length > 0) {
      result.totalVoltage *= transformers[0].getTurnsRatio();
    }

    // Calculate total resistance from non-battery, non-wire components
    const resistiveComponents = otherComponents.filter((c) => c.type !== ComponentType.WIRE);

    if (resistiveComponents.length === 0) {
      result.totalResistance = 0.001;
    } else {
      result.totalResistance = this.calculateSeriesResistance(resistiveComponents);
    }

    // Check for short circuit
    if (result.totalResistance < 1) {
      result.hasShortCircuit = true;
      result.errors.push('Warning: Very low resistance - possible short circuit');
    }

    // Capacitors with very high resistance effectively open the DC path
    if (result.totalResistance >= 1e5) {
      const hasCapacitor = otherComponents.some((c) => c instanceof Capacitor);
      const msg = hasCapacitor
        ? 'Circuit appears open: capacitor is blocking DC current'
        : 'Circuit appears open: very high resistance detected';
      result.errors.push(msg);
      this._resetComponents(otherComponents);
      return result;
    }

    // Apply Ohm's Law: I = V / R
    result.totalCurrent = result.totalResistance > 0
      ? result.totalVoltage / result.totalResistance
      : 0;

    // Update component states
    for (const comp of otherComponents) {
      const compResistance = comp.getResistance();
      const compVoltage = result.totalCurrent * compResistance;
      comp.voltage = compVoltage;
      comp.current = result.totalCurrent;

      if (comp instanceof LED) {
        comp.updateState(result.totalCurrent);
      }

      result.componentStates.set(comp.id, {
        voltage: compVoltage,
        current: result.totalCurrent,
        resistance: compResistance,
        active: comp.isActive(),
      });
    }

    result.isComplete = true;
    return result;
  }

  _resetComponents(components) {
    for (const comp of components) {
      comp.voltage = 0;
      comp.current = 0;
      if (comp instanceof LED) {
        comp.updateState(0);
      }
    }
  }

  /**
   * Evaluate logic gate circuits.
   */
  evaluateLogicGates(inputValues) {
    const results = new Map();
    for (const [id, comp] of this.components) {
      if (comp instanceof LogicGate) {
        const inputs = inputValues.get(id) || [];
        const output = comp.evaluate(inputs);
        results.set(id, output);
      }
    }
    return results;
  }

  /**
   * Read a measurement at a specific component (virtual multimeter).
   */
  measure(componentId, type = 'voltage') {
    const comp = this.components.get(componentId);
    if (!comp) return null;

    switch (type) {
      case 'voltage':
        return { value: comp.voltage, unit: 'V' };
      case 'current':
        return { value: comp.current, unit: 'A' };
      case 'resistance':
        return { value: comp.getResistance(), unit: 'Ω' };
      default:
        return null;
    }
  }

  reset() {
    this.components.clear();
    this.connections = [];
    this.nodes.clear();
    this.nextNodeId = 0;
  }

  toJSON() {
    const components = [];
    for (const [, comp] of this.components) {
      components.push(comp.toJSON());
    }
    return { components, connections: this.connections };
  }
}

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ComponentType,
    Component,
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
  };
}
