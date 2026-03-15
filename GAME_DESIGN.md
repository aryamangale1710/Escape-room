# Circuit Escape: The STEM Adventure

## Game Title
**Circuit Escape: The STEM Adventure**

## Game Story / Theme

You are a young electronics engineer trapped inside a mysterious laboratory. The doors are locked by complex electronic circuits, and the only way out is to fix, build, and debug circuits to unlock each door. As you progress through the lab, the puzzles become more challenging, teaching you real-world electronics concepts along the way.

**Setting:** A futuristic laboratory with multiple rooms, each themed around a different electronics concept. Neon-lit walls, glowing circuit boards, and holographic displays create an immersive sci-fi atmosphere.

**Narrative:** Professor Volt, a brilliant but eccentric inventor, has accidentally activated the lab's lockdown system. The AI security system will only release the doors when each room's circuit puzzle is correctly solved. You must use your electronics knowledge to escape!

**Target Audience:** Ages 10–15 years old

## Core Gameplay Mechanics

### Circuit Building
- **Drag-and-drop** electronic components onto a virtual breadboard/circuit board
- Components include: resistors, wires, switches, LEDs, batteries, logic gates (AND, OR, NOT), capacitors, and buzzers
- Connect components by dragging wires between terminals

### Circuit Simulation
- Real-time circuit simulation using Ohm's Law (V = I × R)
- Series and parallel circuit calculations
- Logic gate evaluation (AND, OR, NOT truth tables)
- Instant visual feedback: LEDs light up, meters display readings, sparks fly on short circuits

### Tools
- **Virtual Multimeter:** Measure voltage and current at any point in the circuit
- **Component Inspector:** View component properties (resistance, voltage rating)
- **Hint System:** Progressive hints that guide without giving away solutions

### Puzzle Types
- **Fix the Circuit:** Find and repair broken connections
- **Build from Scratch:** Construct a circuit to meet specific requirements
- **Debug Challenge:** Identify why a circuit isn't working correctly
- **Logic Puzzle:** Use logic gates to create specific output patterns
- **Overheating Alert:** Manage current to prevent component damage

## Level Design

### Beginner Levels (Rooms 1–3)
**Concepts:** Basic circuits, Ohm's Law, simple switches

1. **Room 1 - "The Light Switch"**
   - Learn to connect a battery, switch, and LED
   - Goal: Make the LED light up to unlock the door
   - Teaches: Basic circuit completion, current flow

2. **Room 2 - "Ohm's Challenge"**
   - Select the correct resistor to achieve target current
   - Goal: Use Ohm's Law (V = I × R) to calculate needed resistance
   - Teaches: Ohm's Law, resistance values

3. **Room 3 - "The Brightness Puzzle"**
   - Adjust voltage/resistance to achieve specific LED brightness
   - Goal: Control current to set precise brightness levels
   - Teaches: Relationship between voltage, current, and resistance

### Intermediate Levels (Rooms 4–6)
**Concepts:** Series/parallel circuits, debugging, multimeter usage

4. **Room 4 - "Series Maze"**
   - Build a series circuit with multiple components
   - Goal: Calculate total resistance and ensure correct current flow
   - Teaches: Series circuit rules, voltage division

5. **Room 5 - "Parallel Paths"**
   - Design a parallel circuit to power multiple LEDs
   - Goal: Distribute current correctly across branches
   - Teaches: Parallel circuit rules, current division

6. **Room 6 - "The Broken Lab"**
   - Debug a pre-built circuit with multiple faults
   - Goal: Use the multimeter to find and fix all problems
   - Teaches: Troubleshooting, measurement techniques

### Advanced Levels (Rooms 7–9)
**Concepts:** Logic gates, complex systems, combined challenges

7. **Room 7 - "Logic Lock"**
   - Build AND, OR, NOT gate combinations
   - Goal: Create a specific truth table output to unlock the door
   - Teaches: Logic gates, boolean logic

8. **Room 8 - "The Security System"**
   - Combine analog and digital circuits
   - Goal: Build a circuit that uses sensor inputs with logic gates
   - Teaches: Integration of concepts, system design

9. **Room 9 - "Final Escape"**
   - Multi-stage puzzle combining all learned concepts
   - Goal: Build a complex circuit system to unlock the final door
   - Teaches: Applied electronics, problem-solving under pressure

## Game UI and Visual Elements

### Main Interface
- **Circuit Board Area:** Central workspace for building circuits (grid-based)
- **Component Palette:** Left sidebar with draggable electronic components
- **Tool Bar:** Top bar with multimeter, undo/redo, hint button
- **Info Panel:** Right sidebar showing objectives, score, and hints
- **Status Bar:** Bottom bar with level progress and timer

### Visual Feedback
- **LEDs:** Glow with appropriate colors when powered correctly
- **Sparks:** Animated sparks on short circuits or overloaded components
- **Meters:** Animated voltage/current meters showing real-time readings
- **Wire Colors:** Wires change color based on current flow
- **Door Animation:** Doors unlock with satisfying animation when puzzle is solved
- **Success/Failure Effects:** Particle effects for success, warning indicators for failure

### Adaptive Difficulty
- Track player performance across levels
- Offer additional hints for struggling players
- Provide bonus challenges for advanced players
- Difficulty adjusts based on completion time and hint usage

## Technical Implementation

### Technology Stack
- **Frontend:** HTML5 Canvas + vanilla JavaScript
- **Rendering:** Canvas 2D API for circuit visualization
- **State Management:** Custom event-driven architecture
- **Storage:** LocalStorage for progress saving

### Circuit Simulation Engine
```
CircuitEngine
├── Component (base class)
│   ├── Resistor (resistance value, power rating)
│   ├── Battery (voltage, internal resistance)
│   ├── LED (forward voltage, max current)
│   ├── Switch (open/closed state)
│   ├── Wire (negligible resistance)
│   └── LogicGate (AND, OR, NOT)
├── Circuit
│   ├── nodes[] (connection points)
│   ├── components[] (circuit elements)
│   └── simulate() (calculate voltages and currents)
├── Solver
│   ├── solveOhmsLaw()
│   ├── solveSeries()
│   ├── solveParallel()
│   └── solveLogicGates()
└── LevelManager
    ├── levels[] (level configurations)
    ├── checkSolution()
    └── calculateScore()
```

### Score System
- Base points for completing a level
- Bonus points for speed
- Bonus points for minimal hint usage
- Penalty for incorrect attempts
- Star rating (1-3 stars) per level

## Possible Future Expansions

1. **Multiplayer Mode:** Race against friends to solve circuit puzzles
2. **Custom Level Editor:** Let players create and share their own puzzles
3. **Additional Components:** Transistors, capacitors, inductors, microcontrollers
4. **Real-World Projects:** Guided tutorials connecting game concepts to real electronics projects
5. **Achievement System:** Badges for mastering specific concepts
6. **Tutorial Mode:** Step-by-step guided lessons for each concept
7. **Mobile Support:** Touch-optimized interface for tablets
8. **Accessibility Features:** Screen reader support, colorblind modes
9. **Teacher Dashboard:** Track student progress across a classroom
10. **AR Integration:** Use phone camera to overlay circuits on real breadboards
