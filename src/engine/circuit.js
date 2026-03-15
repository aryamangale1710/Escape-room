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

/** Capacitor: stores charge; high DC resistance in steady-state simulation */
class Capacitor extends Component {
  constructor(id, capacitance = 0.0001) {
    super(ComponentType.CAPACITOR, id, { capacitance });
  }

  getResistance() {
    return 1e6; // 1 MΩ — blocks DC in steady-state
  }

  getCapacitance() {
    return this.properties.capacitance;
  }
}

/** Inductor: stores energy in magnetic field; near-zero DC resistance */
class Inductor extends Component {
  constructor(id, inductance = 0.001) {
    super(ComponentType.INDUCTOR, id, { inductance });
  }

  getResistance() {
    return 0.001; // Near-ideal conductor in DC steady-state
  }

  getInductance() {
    return this.properties.inductance;
  }
}

/** Diode: one-way current valve with forward voltage drop */
class Diode extends Component {
  constructor(id, forwardVoltage = 0.7) {
    super(ComponentType.DIODE, id, { forwardVoltage, forward: true });
  }

  getResistance() {
    if (!this.properties.forward) return Infinity;
    // Model forward bias as equivalent resistance: Vf / If (at ~10 mA)
    return this.properties.forwardVoltage / 0.01;
  }

  getForwardVoltage() {
    return this.properties.forwardVoltage;
  }

  isForward() {
    return this.properties.forward;
  }

  setForward(state) {
    this.properties.forward = Boolean(state);
  }
}

/** Transistor (NPN/PNP): acts as electronically controlled switch */
class Transistor extends Component {
  constructor(id, transistorType = 'NPN', gain = 100) {
    super(ComponentType.TRANSISTOR, id, { transistorType, gain, active: false });
  }

  getResistance() {
    return this.properties.active ? 0.1 : Infinity; // ON: ~0.1 Ω; OFF: open circuit
  }

  isActive() {
    return this.properties.active;
  }

  toggle() {
    this.properties.active = !this.properties.active;
    return this.properties.active;
  }

  activate() {
    this.properties.active = true;
  }

  getGain() {
    return this.properties.gain;
  }

  getType() {
    return this.properties.transistorType;
  }
}

/** Transformer: voltage/current transformation via turns ratio */
class Transformer extends Component {
  constructor(id, turnsRatio = 1) {
    super(ComponentType.TRANSFORMER, id, { turnsRatio });
  }

  getResistance() {
    return 0.1; // Small winding resistance
  }

  getTurnsRatio() {
    return this.properties.turnsRatio;
  }

  getVoltageRatio() {
    return this.properties.turnsRatio;
  }
}

/** Potentiometer: variable resistor adjustable via position (0–1) */
class Potentiometer extends Component {
  constructor(id, maxResistance = 1000, position = 0.5) {
    super(ComponentType.POTENTIOMETER, id, { maxResistance, position });
  }

  getResistance() {
    return this.properties.maxResistance * this.properties.position;
  }

  getPosition() {
    return this.properties.position;
  }

  setPosition(pos) {
    this.properties.position = Math.max(0, Math.min(1, pos));
  }

  getMaxResistance() {
    return this.properties.maxResistance;
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

    // Check circuit topology (all components wired into a complete loop)
    if (!this.validateCircuitTopology()) {
      result.errors.push('Circuit is incomplete: connect all components with wires');
      return result;
    }

    // Calculate total voltage from batteries
    result.totalVoltage = batteries.reduce((sum, b) => sum + b.getVoltage(), 0);

    // Calculate total resistance from non-battery components
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

  /**
   * Validate circuit topology via BFS:
   * checks all components have nodes assigned and that the external circuit
   * forms a complete path from battery (+) to battery (-).
   */
  validateCircuitTopology() {
    const batteries = [...this.components.values()].filter(
      (c) => c.type === ComponentType.BATTERY
    );
    if (batteries.length === 0) return false;

    const battery = batteries[0];
    if (battery.nodeA === null || battery.nodeB === null) return false;
    if (battery.nodeA === battery.nodeB) return false;

    // Every component must have both terminals wired
    for (const [, comp] of this.components) {
      if (comp.nodeA === null || comp.nodeB === null) return false;
    }

    // BFS from battery positive terminal through external components only
    const visited = new Set();
    const queue = [battery.nodeA];
    visited.add(battery.nodeA);

    while (queue.length > 0) {
      const currentNode = queue.shift();
      if (currentNode === battery.nodeB) return true;

      for (const [, comp] of this.components) {
        if (comp === battery) continue; // don't traverse through the source

        let nextNode = null;
        if (comp.nodeA === currentNode && comp.nodeB && !visited.has(comp.nodeB)) {
          nextNode = comp.nodeB;
        } else if (comp.nodeB === currentNode && comp.nodeA && !visited.has(comp.nodeA)) {
          nextNode = comp.nodeA;
        }

        if (nextNode !== null) {
          visited.add(nextNode);
          queue.push(nextNode);
        }
      }
    }

    return false;
  }

  /**
   * Merge two nodes: all references to removeNodeId become keepNodeId.
   * Used when a wire connects two previously separate terminals.
   */
  mergeNodes(keepNodeId, removeNodeId) {
    if (keepNodeId === removeNodeId) return;

    for (const [, comp] of this.components) {
      if (comp.nodeA === removeNodeId) comp.nodeA = keepNodeId;
      if (comp.nodeB === removeNodeId) comp.nodeB = keepNodeId;
    }

    this.connections = this.connections.map((c) =>
      c.nodeId === removeNodeId ? { ...c, nodeId: keepNodeId } : c
    );

    const removedNode = this.nodes.get(removeNodeId);
    const keepNode = this.nodes.get(keepNodeId);
    if (removedNode && keepNode) {
      removedNode.connections.forEach((c) => keepNode.connections.push(c));
    }
    this.nodes.delete(removeNodeId);
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
    LogicGate,
    Circuit,
    Capacitor,
    Inductor,
    Diode,
    Transistor,
    Transformer,
    Potentiometer,
  };
}
