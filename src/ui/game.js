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

    // Load preplaced components
    if (level.preplacedComponents && level.preplacedComponents.length > 0) {
      this.loadPreplacedComponents(level.preplacedComponents);
    }

    // Clear circuit board
    this.clearBoard();

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
    }

    el.innerHTML = `
      <div class="comp-icon">${icons[component.type] || '?'}</div>
      <div class="comp-label">${label}</div>
    `;

    // Click to select
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      this.selectComponent(component.id, el);
    });

    // Drag to move
    el.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      this.startDragPlaced(el, e);
    });

    // Double-click to toggle switch
    if (component.type === ComponentType.SWITCH) {
      el.addEventListener('dblclick', () => {
        component.toggle();
        el.classList.toggle('active', component.isActive());
        this.updateStatus(component.isActive() ? 'Switch closed' : 'Switch opened');
      });
    }

    board.appendChild(el);
    this.placedComponents.push({ component, element: el, x, y });
  }

  clearBoard() {
    const board = document.querySelector('.circuit-board');
    if (!board) return;
    board.querySelectorAll('.placed-component').forEach((el) => el.remove());
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

            // Auto-connect nodes
            const nodeA = this.circuit.createNode();
            const nodeB = this.circuit.createNode();
            this.circuit.connect(id, 'A', nodeA);
            this.circuit.connect(id, 'B', nodeB);

            this.addComponentToBoard(comp, x, y);
            this.updateStatus(`Added ${data.type}`);
          }
        } catch (err) {
          console.warn('Invalid drop data:', err.message);
        }
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
