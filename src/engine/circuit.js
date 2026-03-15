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

    // Check circuit completeness (all components connected)
    const allConnected = [...this.components.values()].every(
      (c) => c.nodeA !== null && c.nodeB !== null
    );

    if (!allConnected) {
      result.errors.push('Circuit is incomplete: not all components are connected');
      return result;
    }

    // Calculate total voltage from batteries
    result.totalVoltage = batteries.reduce((sum, b) => sum + b.getVoltage(), 0);

    // Calculate total resistance from non-battery components
    const resistances = otherComponents
      .filter((c) => c.type !== ComponentType.WIRE)
      .map((c) => c.getResistance());

    if (resistances.length === 0) {
      result.totalResistance = 0.001;
    } else {
      result.totalResistance = this.calculateSeriesResistance(
        otherComponents.filter((c) => c.type !== ComponentType.WIRE)
      );
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
  };
}
