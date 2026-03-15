/**
 * Game UI Controller
 * Manages the interactive game interface: drag-and-drop, circuit board rendering,
 * multimeter tool, level navigation, and visual feedback.
 */

class GameUI {
  constructor() {
    this.circuit = new Circuit();
    this.levelManager = new LevelManager();
    this.currentScreen = 'title';
    this.placedComponents = [];
    this.selectedComponent = null;
    this.draggedItem = null;
    this.dragOffset = { x: 0, y: 0 };
    this.multimeterActive = false;
    this.timerInterval = null;
    this.elapsedTime = 0;
    this.nextComponentId = 0;

    // Wire drawing state
    this.wireStart = null;       // { compId, terminal, element }
    this.drawnWires = [];        // [{ comp1Id, terminal1, comp2Id, terminal2 }]
    this.wirePreviewLine = null; // SVG line element for preview

    this.init();
  }

  init() {
    this.levelManager.loadProgress();
    this.bindTitleScreen();
    this.bindLevelSelect();
    this.bindGameScreen();
  }

  // ===== Screen Navigation =====

  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach((s) => s.style.display = 'none');
    const screen = document.getElementById(screenId);
    if (screen) {
      if (screenId === 'game-screen') {
        screen.style.display = 'grid';
      } else {
        screen.style.display = 'flex';
      }
    }
    this.currentScreen = screenId;
  }

  // ===== Title Screen =====

  bindTitleScreen() {
    const playBtn = document.getElementById('btn-play');
    const levelsBtn = document.getElementById('btn-levels');

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        const progress = this.levelManager.getProgress();
        const nextLevel = progress.currentLevel || 1;
        this.startLevel(nextLevel);
      });
    }

    if (levelsBtn) {
      levelsBtn.addEventListener('click', () => {
        this.showLevelSelect();
      });
    }
  }

  // ===== Level Select =====

  showLevelSelect() {
    this.showScreen('level-select');
    this.renderLevelGrid();
  }

  renderLevelGrid() {
    const grid = document.getElementById('level-grid');
    if (!grid) return;

    const levels = this.levelManager.getAllLevels();
    grid.innerHTML = '';

    levels.forEach((level) => {
      const card = document.createElement('div');
      card.className = `level-card ${level.unlocked ? '' : 'locked'} ${level.completed ? 'completed' : ''}`;

      const starsStr = level.completed
        ? '★'.repeat(level.stars) + '☆'.repeat(3 - level.stars)
        : '☆☆☆';

      card.innerHTML = `
        <div class="level-num">${level.id}</div>
        <div class="level-title">${level.title}</div>
        <div class="level-difficulty">${level.difficulty}</div>
        <div class="stars">${starsStr}</div>
      `;

      if (level.unlocked) {
        card.addEventListener('click', () => this.startLevel(level.id));
      }

      grid.appendChild(card);
    });
  }

  bindLevelSelect() {
    const backBtn = document.getElementById('btn-back-title');
    if (backBtn) {
      backBtn.addEventListener('click', () => this.showScreen('title-screen'));
    }
  }

  // ===== Game Screen =====

  startLevel(levelId) {
    const level = this.levelManager.startLevel(levelId);
    if (!level) {
      // Try starting level 1 if the requested one is locked
      const fallback = this.levelManager.startLevel(1);
      if (!fallback) return;
      this.loadLevel(fallback);
    } else {
      this.loadLevel(level);
    }
    this.showScreen('game-screen');
  }

  loadLevel(level) {
    // Reset state
    this.circuit.reset();
    this.placedComponents = [];
    this.selectedComponent = null;
    this.multimeterActive = false;
    this.elapsedTime = 0;
    this.nextComponentId = 0;
    this.wireStart = null;
    this.drawnWires = [];
    this.wirePreviewLine = null;

    // Update UI text
    const levelInfo = document.querySelector('.level-info');
    if (levelInfo) levelInfo.textContent = `Room ${level.id}: ${level.title}`;

    const storyText = document.getElementById('story-text');
    if (storyText) storyText.textContent = level.story;

    const descText = document.getElementById('desc-text');
    if (descText) descText.textContent = level.description;

    // Render objectives
    const objList = document.getElementById('objectives-list');
    if (objList) {
      objList.innerHTML = '';
      level.objectives.forEach((obj) => {
        const li = document.createElement('li');
        li.className = 'objective-item';
        li.textContent = obj;
        objList.appendChild(li);
      });
    }

    // Render available components
    this.renderComponentPalette(level.availableComponents);

    // Clear circuit board first, then load preplaced components
    this.clearBoard();

    if (level.preplacedComponents && level.preplacedComponents.length > 0) {
      this.loadPreplacedComponents(level.preplacedComponents);
      this.drawPreplacedWires();
    }

    // Hide hint
    const hintBox = document.querySelector('.hint-box');
    if (hintBox) hintBox.classList.remove('visible');

    // Reset multimeter
    this.updateMeasurement(null);

    // Update status
    this.updateStatus('Place components to build the circuit');

    // Start timer
    this.startTimer();
  }

  renderComponentPalette(components) {
    const palette = document.getElementById('component-list');
    if (!palette) return;

    palette.innerHTML = '';

    const icons = {
      [ComponentType.BATTERY]: '🔋',
      [ComponentType.RESISTOR]: '⟋',
      [ComponentType.LED]: '💡',
      [ComponentType.SWITCH]: '🔘',
      [ComponentType.WIRE]: '〰️',
      [ComponentType.AND_GATE]: '&',
      [ComponentType.OR_GATE]: '≥1',
      [ComponentType.NOT_GATE]: '¬',
      [ComponentType.CAPACITOR]: '⊣⊢',
      [ComponentType.INDUCTOR]: '⌇',
      [ComponentType.DIODE]: '▷|',
      [ComponentType.TRANSISTOR]: 'Ƭ',
      [ComponentType.TRANSFORMER]: '⚡',
      [ComponentType.POTENTIOMETER]: '⊸',
    };

    const names = {
      [ComponentType.BATTERY]: 'Battery',
      [ComponentType.RESISTOR]: 'Resistor',
      [ComponentType.LED]: 'LED',
      [ComponentType.SWITCH]: 'Switch',
      [ComponentType.WIRE]: 'Wire',
      [ComponentType.AND_GATE]: 'AND Gate',
      [ComponentType.OR_GATE]: 'OR Gate',
      [ComponentType.NOT_GATE]: 'NOT Gate',
      [ComponentType.CAPACITOR]: 'Capacitor',
      [ComponentType.INDUCTOR]: 'Inductor',
      [ComponentType.DIODE]: 'Diode',
      [ComponentType.TRANSISTOR]: 'Transistor',
      [ComponentType.TRANSFORMER]: 'Transformer',
      [ComponentType.POTENTIOMETER]: 'Potentiometer',
    };

    components.forEach((comp, index) => {
      const item = document.createElement('div');
      item.className = 'component-item';
      item.draggable = true;
      item.dataset.componentIndex = index;
      item.dataset.componentType = comp.type;

      const label = comp.label || names[comp.type] || comp.type;

      item.innerHTML = `
        <div class="component-icon">${icons[comp.type] || '?'}</div>
        <span>${label}</span>
      `;

      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({ index, type: comp.type, props: comp.props }));
        e.dataTransfer.effectAllowed = 'copy';
      });

      palette.appendChild(item);
    });
  }

  loadPreplacedComponents(preplacedComponents) {
    const board = document.querySelector('.circuit-board');
    if (!board) return;

    preplacedComponents.forEach((pc, i) => {
      const comp = this.createComponentInstance(pc.type, pc.id || `pre_${i}`, pc.props);
      if (!comp) return;

      this.circuit.addComponent(comp);

      if (pc.nodeA) {
        if (!this.circuit.nodes.has(pc.nodeA)) {
          this.circuit.nodes.set(pc.nodeA, { id: pc.nodeA, connections: [] });
        }
        this.circuit.connect(comp.id, 'A', pc.nodeA);
      }
      if (pc.nodeB) {
        if (!this.circuit.nodes.has(pc.nodeB)) {
          this.circuit.nodes.set(pc.nodeB, { id: pc.nodeB, connections: [] });
        }
        this.circuit.connect(comp.id, 'B', pc.nodeB);
      }

      const x = 80 + i * 120;
      const y = 150;
      this.addComponentToBoard(comp, x, y);
    });
  }

  createComponentInstance(type, id, props) {
    switch (type) {
      case ComponentType.BATTERY:
        return new Battery(id, props.voltage || 9);
      case ComponentType.RESISTOR:
        return new Resistor(id, props.resistance || 100);
      case ComponentType.LED:
        return new LED(id, props.forwardVoltage || 2, props.maxCurrent || 0.02);
      case ComponentType.SWITCH:
        return new Switch(id, props.closed || false);
      case ComponentType.WIRE:
        return new Wire(id);
      case ComponentType.CAPACITOR:
        return new Capacitor(id, props.capacitance || 0.0001);
      case ComponentType.INDUCTOR:
        return new Inductor(id, props.inductance || 0.001);
      case ComponentType.DIODE:
        return new Diode(id, props.forwardVoltage || 0.7);
      case ComponentType.TRANSISTOR:
        return new Transistor(id, props.transistorType || 'NPN', props.gain || 100);
      case ComponentType.TRANSFORMER:
        return new Transformer(id, props.turnsRatio || 1);
      case ComponentType.POTENTIOMETER:
        return new Potentiometer(id, props.maxResistance || 1000, props.position || 0.5);
      case ComponentType.AND_GATE:
      case ComponentType.OR_GATE:
      case ComponentType.NOT_GATE:
        return new LogicGate(type, id);
      default:
        return null;
    }
  }

  addComponentToBoard(component, x, y) {
    const board = document.querySelector('.circuit-board');
    if (!board) return;

    const icons = {
      [ComponentType.BATTERY]: '🔋',
      [ComponentType.RESISTOR]: '⟋',
      [ComponentType.LED]: '💡',
      [ComponentType.SWITCH]: '🔘',
      [ComponentType.WIRE]: '〰️',
      [ComponentType.AND_GATE]: '&',
      [ComponentType.OR_GATE]: '≥1',
      [ComponentType.NOT_GATE]: '¬',
      [ComponentType.CAPACITOR]: '⊣⊢',
      [ComponentType.INDUCTOR]: '⌇',
      [ComponentType.DIODE]: '▷|',
      [ComponentType.TRANSISTOR]: 'Ƭ',
      [ComponentType.TRANSFORMER]: '⚡',
      [ComponentType.POTENTIOMETER]: '⊸',
    };

    const el = document.createElement('div');
    el.className = 'placed-component';
    el.dataset.componentId = component.id;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    let label = component.type;
    if (component.type === ComponentType.RESISTOR) {
      label = `${component.getResistance()}Ω`;
    } else if (component.type === ComponentType.BATTERY) {
      label = `${component.getVoltage()}V`;
    } else if (component.type === ComponentType.CAPACITOR) {
      label = `${(component.getCapacitance() * 1e6).toFixed(0)}μF`;
    } else if (component.type === ComponentType.INDUCTOR) {
      label = `${(component.getInductance() * 1000).toFixed(1)}mH`;
    } else if (component.type === ComponentType.DIODE) {
      label = `${component.getForwardVoltage()}V`;
    } else if (component.type === ComponentType.TRANSISTOR) {
      label = component.getType();
    } else if (component.type === ComponentType.TRANSFORMER) {
      label = `${component.getTurnsRatio()}:1`;
    } else if (component.type === ComponentType.POTENTIOMETER) {
      label = `${component.getResistance().toFixed(0)}Ω`;
    }

    el.innerHTML = `
      <div class="terminal terminal-a" data-terminal="A" title="Terminal A"></div>
      <div class="comp-icon">${icons[component.type] || '?'}</div>
      <div class="comp-label">${label}</div>
      <div class="terminal terminal-b" data-terminal="B" title="Terminal B"></div>
    `;

    // Click to select
    el.addEventListener('click', (e) => {
      if (e.target.classList.contains('terminal')) return;
      e.stopPropagation();
      this.selectComponent(component.id, el);
    });

    // Drag to move
    el.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if (e.target.classList.contains('terminal')) return;
      this.startDragPlaced(el, e);
    });

    // Double-click to toggle switch or transistor
    if (component.type === ComponentType.SWITCH) {
      el.addEventListener('dblclick', () => {
        component.toggle();
        el.classList.toggle('active', component.isActive());
        this.updateStatus(component.isActive() ? 'Switch closed' : 'Switch opened');
      });
    } else if (component.type === ComponentType.TRANSISTOR) {
      el.addEventListener('dblclick', () => {
        component.toggle();
        el.classList.toggle('active', component.isActive());
        this.updateStatus(component.isActive() ? 'Transistor ON (base activated)' : 'Transistor OFF');
      });
    }

    board.appendChild(el);
    this.placedComponents.push({ component, element: el, x, y });
  }

  clearBoard() {
    const board = document.querySelector('.circuit-board');
    if (!board) return;
    board.querySelectorAll('.placed-component').forEach((el) => el.remove());

    // Clear wire SVG overlay
    const svg = board.querySelector('.wire-svg');
    if (svg) {
      svg.querySelectorAll('line').forEach((l) => l.remove());
    }
    this.drawnWires = [];
    this.wireStart = null;
    this.wirePreviewLine = null;
    board.classList.remove('wire-drawing-mode');
  }

  selectComponent(componentId, element) {
    document.querySelectorAll('.placed-component').forEach((el) => el.classList.remove('selected'));
    if (element) element.classList.add('selected');
    this.selectedComponent = componentId;

    if (this.multimeterActive) {
      this.measureComponent(componentId);
    }
  }

  startDragPlaced(el, e) {
    const rect = el.getBoundingClientRect();
    this.dragOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    const onMove = (ev) => {
      const board = document.querySelector('.circuit-board');
      const boardRect = board.getBoundingClientRect();
      el.style.left = `${ev.clientX - boardRect.left - this.dragOffset.x}px`;
      el.style.top = `${ev.clientY - boardRect.top - this.dragOffset.y}px`;
      this.redrawAllWires();
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  bindGameScreen() {
    // Drop zone
    const board = document.querySelector('.circuit-board');
    if (board) {
      // Create SVG overlay for wires (once)
      if (!board.querySelector('.wire-svg')) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('wire-svg');
        board.appendChild(svg);
      }

      board.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      });

      board.addEventListener('drop', (e) => {
        e.preventDefault();
        try {
          const data = JSON.parse(e.dataTransfer.getData('text/plain'));
          const boardRect = board.getBoundingClientRect();
          const x = e.clientX - boardRect.left - 40;
          const y = e.clientY - boardRect.top - 30;

          const id = `comp_${this.nextComponentId++}`;
          const comp = this.createComponentInstance(data.type, id, data.props || {});
          if (comp) {
            this.circuit.addComponent(comp);
            // No auto-connect: player must draw wires to connect terminals
            this.addComponentToBoard(comp, x, y);
            this.updateStatus(`Added ${data.type} — click a terminal (●) to draw a wire`);
          }
        } catch (err) {
          console.warn('Invalid drop data:', err.message);
        }
      });

      // Wire terminal click (delegated to board)
      board.addEventListener('click', (e) => {
        const terminal = e.target.closest('.terminal');
        if (!terminal) {
          // Click on empty board area cancels wire drawing
          if (this.wireStart) this.cancelWireDraw();
          return;
        }
        e.stopPropagation();
        const compEl = terminal.closest('.placed-component');
        if (!compEl) return;
        const compId = compEl.dataset.componentId;
        const term = terminal.dataset.terminal;

        if (!this.wireStart) {
          this.startWireDraw(compId, term, terminal);
        } else if (compId === this.wireStart.compId && term === this.wireStart.terminal) {
          // Clicked the same terminal — cancel
          this.cancelWireDraw();
        } else {
          this.endWireDraw(compId, term, terminal);
        }
      });

      // Update wire preview line on mouse move
      board.addEventListener('mousemove', (e) => {
        if (!this.wireStart || !this.wirePreviewLine) return;
        const boardRect = board.getBoundingClientRect();
        this.wirePreviewLine.setAttribute('x2', e.clientX - boardRect.left);
        this.wirePreviewLine.setAttribute('y2', e.clientY - boardRect.top);
      });
    }

    // Toolbar buttons
    const multimeterBtn = document.getElementById('btn-multimeter');
    if (multimeterBtn) {
      multimeterBtn.addEventListener('click', () => {
        this.multimeterActive = !this.multimeterActive;
        multimeterBtn.classList.toggle('active', this.multimeterActive);
        this.updateStatus(this.multimeterActive ? 'Multimeter active - click a component to measure' : 'Multimeter off');
      });
    }

    const checkBtn = document.getElementById('btn-check');
    if (checkBtn) {
      checkBtn.addEventListener('click', () => this.checkSolution());
    }

    const hintBtn = document.getElementById('btn-hint');
    if (hintBtn) {
      hintBtn.addEventListener('click', () => this.showHint());
    }

    const resetBtn = document.getElementById('btn-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetLevel());
    }

    const backBtn = document.getElementById('btn-back-levels');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.stopTimer();
        this.showLevelSelect();
      });
    }

    // Modal buttons
    const nextBtn = document.getElementById('btn-next-level');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.hideModal();
        const next = this.levelManager.nextLevel();
        if (next) {
          this.loadLevel(next);
        } else {
          this.showLevelSelect();
        }
      });
    }

    const retryBtn = document.getElementById('btn-retry');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        this.hideModal();
      });
    }

    const modalLevelsBtn = document.getElementById('btn-modal-levels');
    if (modalLevelsBtn) {
      modalLevelsBtn.addEventListener('click', () => {
        this.hideModal();
        this.stopTimer();
        this.showLevelSelect();
      });
    }
  }

  // ===== Wire Drawing =====

  getTerminalPosition(compId, terminal) {
    const board = document.querySelector('.circuit-board');
    if (!board) return null;
    const entry = this.placedComponents.find((e) => e.component.id === compId);
    if (!entry) return null;
    const boardRect = board.getBoundingClientRect();
    const termEl = entry.element.querySelector(`[data-terminal="${terminal}"]`);
    if (!termEl) return null;
    const rect = termEl.getBoundingClientRect();
    return {
      x: rect.left - boardRect.left + rect.width / 2,
      y: rect.top - boardRect.top + rect.height / 2,
    };
  }

  drawWireLine(pos1, pos2, options = {}) {
    const board = document.querySelector('.circuit-board');
    const svg = board && board.querySelector('.wire-svg');
    if (!svg) return null;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', pos1.x);
    line.setAttribute('y1', pos1.y);
    line.setAttribute('x2', pos2.x);
    line.setAttribute('y2', pos2.y);
    line.setAttribute('stroke', options.color || '#ff9800');
    line.setAttribute('stroke-width', options.width || '3');
    line.setAttribute('stroke-linecap', 'round');
    if (options.dashed) line.setAttribute('stroke-dasharray', '6,4');
    if (options.id) line.id = options.id;
    svg.appendChild(line);
    return line;
  }

  redrawAllWires() {
    const board = document.querySelector('.circuit-board');
    const svg = board && board.querySelector('.wire-svg');
    if (!svg) return;
    // Remove only permanent wire lines (keep preview)
    svg.querySelectorAll('line:not(#wire-preview)').forEach((l) => l.remove());
    this.drawnWires.forEach((wire) => {
      const pos1 = this.getTerminalPosition(wire.comp1Id, wire.terminal1);
      const pos2 = this.getTerminalPosition(wire.comp2Id, wire.terminal2);
      if (pos1 && pos2) this.drawWireLine(pos1, pos2);
    });
  }

  drawPreplacedWires() {
    const board = document.querySelector('.circuit-board');
    const processed = new Set();
    for (const [, comp1] of this.circuit.components) {
      for (const [, comp2] of this.circuit.components) {
        if (comp1.id === comp2.id) continue;
        const pairKey = [comp1.id, comp2.id].sort().join('|');
        if (processed.has(pairKey)) continue;
        const t1 = [{ t: 'A', n: comp1.nodeA }, { t: 'B', n: comp1.nodeB }];
        const t2 = [{ t: 'A', n: comp2.nodeA }, { t: 'B', n: comp2.nodeB }];
        for (const a of t1) {
          for (const b of t2) {
            if (a.n && b.n && a.n === b.n) {
              this.drawnWires.push({ comp1Id: comp1.id, terminal1: a.t, comp2Id: comp2.id, terminal2: b.t });
              processed.add(pairKey);
              // Mark terminals visually as connected
              if (board) {
                const el1 = board.querySelector(`[data-component-id="${comp1.id}"] [data-terminal="${a.t}"]`);
                const el2 = board.querySelector(`[data-component-id="${comp2.id}"] [data-terminal="${b.t}"]`);
                if (el1) el1.classList.add('connected');
                if (el2) el2.classList.add('connected');
              }
            }
          }
        }
      }
    }
    this.redrawAllWires();
  }

  startWireDraw(compId, terminal, terminalEl) {
    this.wireStart = { compId, terminal, element: terminalEl };
    terminalEl.classList.add('wire-start');
    const board = document.querySelector('.circuit-board');
    if (board) board.classList.add('wire-drawing-mode');
    const pos = this.getTerminalPosition(compId, terminal);
    if (pos) {
      this.wirePreviewLine = this.drawWireLine(pos, pos, { color: '#00d4ff', dashed: true, id: 'wire-preview' });
    }
    this.updateStatus('Click another terminal to complete the wire — or click here to cancel');
  }

  endWireDraw(compId, terminal, terminalEl) {
    if (!this.wireStart) return;
    const { compId: startId, terminal: startTerm, element: startEl } = this.wireStart;

    // Connect in circuit engine
    this.connectTerminals(startId, startTerm, compId, terminal);

    // Store and draw permanent wire
    this.drawnWires.push({ comp1Id: startId, terminal1: startTerm, comp2Id: compId, terminal2: terminal });
    const pos1 = this.getTerminalPosition(startId, startTerm);
    const pos2 = this.getTerminalPosition(compId, terminal);
    if (pos1 && pos2) this.drawWireLine(pos1, pos2);

    // Mark terminals as connected
    startEl.classList.add('connected');
    terminalEl.classList.add('connected');

    this.cancelWireDraw();
    this.updateStatus('Wire connected! Keep building or click "Check Circuit".');
  }

  cancelWireDraw() {
    if (this.wireStart && this.wireStart.element) {
      this.wireStart.element.classList.remove('wire-start');
    }
    if (this.wirePreviewLine) {
      this.wirePreviewLine.remove();
      this.wirePreviewLine = null;
    }
    this.wireStart = null;
    const board = document.querySelector('.circuit-board');
    if (board) board.classList.remove('wire-drawing-mode');
  }

  connectTerminals(comp1Id, terminal1, comp2Id, terminal2) {
    const comp1 = this.circuit.getComponent(comp1Id);
    const comp2 = this.circuit.getComponent(comp2Id);
    if (!comp1 || !comp2) return;

    const node1 = terminal1 === 'A' ? comp1.nodeA : comp1.nodeB;
    const node2 = terminal2 === 'A' ? comp2.nodeA : comp2.nodeB;

    if (node1 && node2) {
      // Both have nodes — merge removeNode (node2) into keepNode (node1)
      this.circuit.mergeNodes(node1, node2);
    } else if (node1 && !node2) {
      // node2's terminal inherits node1
      this.circuit.connect(comp2Id, terminal2, node1);
    } else if (!node1 && node2) {
      // node1's terminal inherits node2
      this.circuit.connect(comp1Id, terminal1, node2);
    } else {
      // Neither has a node yet — create a shared node
      const newNode = this.circuit.createNode();
      this.circuit.connect(comp1Id, terminal1, newNode);
      this.circuit.connect(comp2Id, terminal2, newNode);
    }
  }

  // ===== Game Actions =====

  checkSolution() {
    const result = this.levelManager.checkSolution(this.circuit);

    if (result.passed) {
      this.stopTimer();
      this.levelManager.saveProgress();
      this.showSuccessModal(result);
      this.updateComponentVisuals(true);
    } else {
      this.showFailureModal(result);
      this.updateComponentVisuals(false);
    }
  }

  showHint() {
    const hint = this.levelManager.getHint();
    const hintBox = document.querySelector('.hint-box');
    if (hintBox && hint) {
      hintBox.textContent = `💡 ${hint}`;
      hintBox.classList.add('visible');
    }
  }

  resetLevel() {
    const level = this.levelManager.getCurrentLevel();
    if (level) {
      this.loadLevel(level);
    }
  }

  measureComponent(componentId) {
    const reading = this.circuit.measure(componentId, 'voltage');
    const currentReading = this.circuit.measure(componentId, 'current');
    const resistReading = this.circuit.measure(componentId, 'resistance');

    this.updateMeasurement({
      voltage: reading ? reading.value : 0,
      current: currentReading ? currentReading.value : 0,
      resistance: resistReading ? resistReading.value : 0,
    });
  }

  updateMeasurement(data) {
    const valueEl = document.getElementById('meter-value');
    const unitEl = document.getElementById('meter-unit');
    const labelEl = document.getElementById('meter-label');

    if (!valueEl) return;

    if (!data) {
      valueEl.textContent = '---';
      unitEl.textContent = '';
      labelEl.textContent = 'Select a component';
      return;
    }

    valueEl.textContent = data.voltage.toFixed(2);
    unitEl.textContent = 'V';
    labelEl.textContent = `${(data.current * 1000).toFixed(1)}mA | ${data.resistance}Ω`;
  }

  updateComponentVisuals(success) {
    this.placedComponents.forEach(({ component, element }) => {
      element.classList.remove('active', 'error', 'led-on');

      if (success) {
        element.classList.add('active');
        if (component instanceof LED && component.isLit()) {
          element.classList.add('led-on');
        }
      } else {
        if (component.current === 0 && component.type !== ComponentType.BATTERY) {
          element.classList.add('error');
        }
      }
    });
  }

  updateStatus(message) {
    const statusEl = document.querySelector('.circuit-status');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = 'circuit-status';
    }
  }

  // ===== Timer =====

  startTimer() {
    this.stopTimer();
    this.elapsedTime = 0;
    this.updateTimerDisplay();
    this.timerInterval = setInterval(() => {
      this.elapsedTime++;
      this.updateTimerDisplay();
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  updateTimerDisplay() {
    const timerEl = document.querySelector('.timer');
    if (timerEl) {
      const mins = Math.floor(this.elapsedTime / 60);
      const secs = this.elapsedTime % 60;
      timerEl.textContent = `⏱ ${mins}:${secs.toString().padStart(2, '0')}`;
    }
  }

  // ===== Modals =====

  showSuccessModal(result) {
    const modal = document.getElementById('result-modal');
    if (!modal) return;

    const content = modal.querySelector('.modal');
    content.className = 'modal success';

    const starsStr = '★'.repeat(result.stars || 0) + '☆'.repeat(3 - (result.stars || 0));

    modal.querySelector('h2').textContent = '🎉 Room Unlocked!';
    modal.querySelector('.modal-message').textContent = result.message;
    modal.querySelector('.stars-display').textContent = starsStr;
    modal.querySelector('.score-text').textContent = `Score: +${result.score || 0}`;

    document.getElementById('btn-next-level').style.display = 'inline-block';
    document.getElementById('btn-retry').style.display = 'none';

    modal.classList.add('visible');
  }

  showFailureModal(result) {
    const modal = document.getElementById('result-modal');
    if (!modal) return;

    const content = modal.querySelector('.modal');
    content.className = 'modal failure';

    modal.querySelector('h2').textContent = '⚡ Not Quite!';
    modal.querySelector('.modal-message').textContent = result.message;
    modal.querySelector('.stars-display').textContent = '';
    modal.querySelector('.score-text').textContent = '';

    document.getElementById('btn-next-level').style.display = 'none';
    document.getElementById('btn-retry').style.display = 'inline-block';

    modal.classList.add('visible');
  }

  hideModal() {
    const modal = document.getElementById('result-modal');
    if (modal) modal.classList.remove('visible');
  }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.game = new GameUI();
});
