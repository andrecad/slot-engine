# Slot Machine Engine

A fully functional, browser-based slot machine engine built with TypeScript. Features deterministic gameplay, customizable themes, and comprehensive event system.

## Current Status: MVP Complete ✅

**Phases Completed:**
- ✅ Phase 1: Project Setup (6/6 tasks)
- ✅ Phase 2: Foundation (11/11 tasks)  
- ✅ Phase 3: US1 - Basic Spin MVP (21/28 tasks - implementation complete, tests pending)

**Working Features:**
- 3×5 slot grid with animated reel spins
- Configurable winning chance (Bernoulli trial algorithm)
- Weighted symbol selection for realistic gameplay
- Three-phase animation (acceleration → spin → deceleration)
- Credit management and payout calculation
- Event system (spin-start, reel-stop, spin-complete, win, credits-changed)
- Responsive UI with visual feedback
- Motion blur effects (respects `prefers-reduced-motion`)
- Deterministic RNG with seed support

## Quick Start

### Installation

```bash
npm install
npm run build
```

### Basic Usage

```typescript
import { SlotEngine } from './dist/SlotEngine.js';

const engine = new SlotEngine({
  assetsPath: 'assets/classic',
  symbolSet: {
    'CHERRY': 'symbol-CHERRY.png',
    'SEVEN': 'symbol-SEVEN.png',
    // ... more symbols
  },
  initialCredits: 1000,
  betAmount: 10,
  winningChance: 0.25,
  container: '#game-container',
  seed: 42  // Optional: for deterministic spins
});

// Wait for assets to load
await engine.ready();

// Spin programmatically
const result = await engine.spin();
console.log('Win:', result.win, 'Payout:', result.payout);

// Listen to events
engine.on('win', (data) => {
  console.log('Won', data.payout, 'credits!');
});
```

### Running the Demo

1. Build the project: `npm run build`
2. Generate placeholder symbols: Open `demo/generate-symbols.html` in a browser
3. Save the generated images to `demo/assets/classic/`
4. Serve the demo folder with a local web server
5. Open `demo/index.html` in a browser

## Architecture

### Project Structure

```
src/
├── core/               # Core game logic
│   ├── RNG.ts         # Seeded & crypto-based random number generators
│   ├── AssetLoader.ts # Image preloading with progress
│   ├── PaylineEvaluator.ts  # Win detection logic
│   └── ReelController.ts    # Winning/losing position generation
├── models/            # Data entities
│   ├── Configuration.ts     # Config with validation
│   ├── GameState.ts        # Session state tracking
│   ├── Reel.ts            # Reel state & logic
│   └── SpinResult.ts      # Spin result factory
├── animation/         # Animation system
│   ├── EasingFunctions.ts  # Cubic bezier easing
│   └── ReelAnimator.ts     # 3-phase reel animation
├── ui/                # User interface
│   ├── DOMRenderer.ts      # DOM manipulation & rendering
│   └── EventEmitter.ts     # Pub/sub event system
├── utils/             # Utilities
│   ├── Validators.ts       # Config validation
│   ├── ErrorMessages.ts    # Structured error messages
│   └── ReelStripGenerator.ts  # Default reel strip generation
├── types.ts           # TypeScript interfaces
└── SlotEngine.ts      # Main engine class
```

### Key Algorithms

**Bernoulli Trial for Win/Loss:**
```typescript
const shouldWin = rng.next() < config.winningChance;
const positions = shouldWin
  ? reelController.generateWinningPositions()
  : reelController.generateLosingPositions();
```

**Weighted Symbol Selection:**
```typescript
// Lower payout = higher probability for realism
const weights = patterns.map(([_, payout]) => 1000 / payout);
const selected = weightedRandom(patterns, weights);
```

**Animation Phases:**
1. **Acceleration** (300ms): Ease-in from 0 to full speed
2. **Constant Spin** (configurable): Linear motion with optional blur
3. **Deceleration** (500ms/reel): Ease-out to target with slight bounce

## Configuration

### Required Options

```typescript
{
  assetsPath: string;        // Path to symbol images
  symbolSet: Record<string, string>;  // Symbol ID → filename mapping
  container: HTMLElement | string;    // DOM mount point
}
```

### Optional Configuration

```typescript
{
  initialCredits: number;    // Default: 1000
  betAmount: number;         // Default: 10
  winningChance: number;     // Default: 0.25 (25%)
  spinDuration: number;      // Default: 2000ms
  reelStopDelay: number;     // Default: 200ms
  seed?: number;             // For deterministic RNG
  motionBlur?: boolean;      // Default: true
  rows: 3;                   // Fixed
  cols: 5;                   // Fixed
}
```

## Events

The engine emits the following events:

- `spin-start`: Fired when spin begins (after bet deducted)
- `reel-stop`: Fired for each reel that stops
- `spin-complete`: Fired when all reels stop
- `win`: Fired when spin wins
- `credits-changed`: Fired on bet or win

## Roadmap

### Upcoming Phases

**Phase 4: Audio-Visual Feedback** (17 tasks)
- Background music and sound effects
- Motion blur and win animations
- Loading progress indicator

**Phase 5: Theme Customization** (13 tasks)  
- Runtime theme switching
- Asset validation
- Multiple theme examples

**Phase 6: Deterministic Seeds** (9 tasks)
- Enhanced seed configuration
- Reproducible spin sequences
- Testing utilities

**Phase 7: Simulation Mode** (22 tasks)
- Automated spin simulation
- RTP validation
- Statistical analysis
- Self-test suite

**Phase 8: Polish** (24 tasks)
- WCAG 2.1 AA accessibility
- Keyboard navigation
- Screen reader support
- Performance optimizations
- API documentation
- End-to-end tests

## Testing

```bash
npm test              # Run all tests
npm run test:coverage # Run with coverage report
```

### Test Coverage (Planned)

- Unit tests: RNG, PaylineEvaluator, ReelStripGenerator, Validators
- Integration tests: Full spin cycle, credit updates, sequential reel stops
- Performance tests: Memory stability, simulation speed

## Development

```bash
npm run build    # Compile TypeScript
npm run dev      # Watch mode
```

### Code Quality

- TypeScript strict mode enabled
- ES2022 target for modern browsers
- No framework dependencies (vanilla JS/DOM)
- Browser compatibility: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## Technical Specifications

### Performance Targets
- ✅ 60fps animation
- ✅ <100ms spin initiation
- ⏳ <2s asset loading (depends on network)
- ⏳ <10s for 10K simulation spins (Phase 7)

### Browser Support
- Modern evergreen browsers (2021+)
- ES2022+ support required
- Web Crypto API for unseeded RNG
- RequestAnimationFrame for animation

### Accessibility
- ⏳ WCAG 2.1 AA compliance (Phase 8)
- ✅ Respects `prefers-reduced-motion`
- ⏳ Keyboard navigation (Phase 8)
- ⏳ Screen reader support (Phase 8)

## License

MIT

## Contributing

This project follows the speckit methodology:
1. Constitution → Specification → Planning → Tasks → Implementation
2. Task-driven development with clear checkpoints
3. Test coverage for all user stories
4. Accessibility-first approach

See `specs/001-slot-engine/` for full feature documentation.
