# ⚡ Circuit Escape: The STEM Adventure

An educational escape-room style game where players solve electronic circuit puzzles to progress through rooms. Learn Ohm's Law, series/parallel circuits, logic gates, and circuit debugging through interactive problem solving.

**Target Age Group:** 10–15 years

## 🎮 How to Play

1. Open `index.html` in a web browser
2. Click **Start Game** or **Select Level**
3. Drag electronic components from the palette onto the circuit board
4. Build circuits to meet each room's objectives
5. Click **Check Circuit** to test your solution
6. Use the **Multimeter** tool to measure voltage, current, and resistance
7. Use **Hints** if you get stuck (costs score points)

## 📚 What You'll Learn

- **Ohm's Law** (V = I × R) — voltage, current, and resistance relationships
- **Series Circuits** — components connected end-to-end
- **Parallel Circuits** — components sharing the same nodes
- **Logic Gates** — AND, OR, NOT boolean operations
- **Circuit Debugging** — finding and fixing broken connections

## 🏗️ Level Structure

| Level | Room | Difficulty | Concept |
|-------|------|------------|---------|
| 1 | The Light Switch | Beginner | Basic circuit completion |
| 2 | Ohm's Challenge | Beginner | Ohm's Law calculation |
| 3 | The Brightness Puzzle | Beginner | Current control |
| 4 | Series Maze | Intermediate | Series resistance |
| 5 | Parallel Paths | Intermediate | Parallel circuits |
| 6 | The Broken Lab | Intermediate | Circuit debugging |
| 7 | Logic Lock | Advanced | Logic gates |
| 8 | The Security System | Advanced | Combined analog + digital |
| 9 | Final Escape | Advanced | All concepts combined |

## 🧪 Running Tests

```bash
node tests/circuit.test.js
```

## 📁 Project Structure

```
├── index.html              # Main game page
├── css/game.css            # Game styles
├── src/
│   ├── engine/
│   │   ├── circuit.js      # Circuit simulation engine
│   │   └── levels.js       # Level definitions and scoring
│   └── ui/
│       └── game.js         # Game UI controller
├── tests/
│   └── circuit.test.js     # Engine and level tests
├── GAME_DESIGN.md          # Full game design document
└── README.md
```

## 🔧 Technical Details

- **Pure HTML/CSS/JavaScript** — no frameworks or build tools required
- **Circuit Engine** — models components (batteries, resistors, LEDs, switches, logic gates), simulates Ohm's Law, and evaluates logic gates
- **Score System** — base points, time bonuses, hint penalties, and 1-3 star ratings
- **Adaptive Difficulty** — tracks player performance and adjusts challenge level
- **Progress Saving** — uses localStorage to save completed levels and scores
