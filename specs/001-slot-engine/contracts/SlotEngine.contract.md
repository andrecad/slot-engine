# SlotEngine API Contract

**Version**: 1.0.0  
**Date**: 2025-11-19  
**Feature**: Slot Machine Engine (001-slot-engine)

## Overview

The `SlotEngine` class provides a complete client-side slot machine implementation with configurable theming, deterministic behavior, and simulation capabilities.

## Class: SlotEngine

### Constructor

```typescript
constructor(config: SlotConfiguration)
```

**Purpose**: Initialize a new slot machine instance with specified configuration.

**Parameters**:
- `config: SlotConfiguration` - Configuration object (see SlotConfiguration contract)

**Behavior**:
1. Validate configuration (throw errors for invalid values)
2. Initialize seeded/unseeded RNG based on `config.seed`
3. Generate default reel strips if `config.reelStrips` not provided
4. Check `prefers-reduced-motion` CSS media query
5. Begin asynchronous asset preloading
6. Create DOM structure for reels and UI
7. Initialize GameState with `initialCredits`

**Throws**:
- `Error` if configuration validation fails
- `Error` if required assets cannot be loaded
- `Error` if target DOM container not found

**Example**:
```typescript
const engine = new SlotEngine({
  assetsPath: 'assets/classic',
  rows: 3,
  cols: 5,
  symbolSet: {
    CHERRY: 'symbol-CHERRY.png',
    BAR: 'symbol-BAR.png',
    SEVEN: 'symbol-SEVEN.png',
    // ... more symbols
  },
  paylines: [
    [[1,0], [1,1], [1,2], [1,3], [1,4]], // Middle line
    // ... more paylines
  ],
  payoutTable: {
    'SEVEN-SEVEN-SEVEN-SEVEN-SEVEN': 1000,
    'BAR-BAR-BAR-*-*': 50,
    // ... more combinations
  },
  spinDuration: 2000,
  reelStopDelay: 300,
  easingAccelerate: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
  easingDecelerate: 'cubic-bezier(0.175, 0.885, 0.32, 1.05)',
  winningChance: 0.25,
  betAmount: 10,
  initialCredits: 1000
});
```

**Post-Conditions**:
- Engine is ready for `spin()` calls after assets preload
- DOM structure mounted in target container
- Event listeners attached for user interactions

---

### Method: spin

```typescript
async spin(): Promise<SpinResult>
```

**Purpose**: Execute one spin operation with animation.

**Parameters**: None

**Returns**: `Promise<SpinResult>` - Resolves when spin animation completes

**Behavior**:
1. Check `isSpinning` state (reject if already spinning)
2. Check `credits >= betAmount` (reject if insufficient credits)
3. Deduct `betAmount` from `credits`
4. Determine win/loss using `winningChance` and RNG
5. Generate reel stop positions (winning or losing combination)
6. Trigger spin animations (accelerate → constant → decelerate)
7. Play audio effects at appropriate moments
8. Stop reels sequentially with `reelStopDelay` between each
9. Evaluate paylines against final grid
10. Calculate payout and update credits
11. Trigger visual feedback for wins
12. Return SpinResult

**Throws**:
- `Error` if already spinning
- `Error` if insufficient credits

**Events Emitted**:
- `spin-start` - When spin begins
- `reel-stop` - When each reel stops (5 times)
- `spin-complete` - When all reels stopped
- `win` - If spin resulted in win (includes payout amount)

**Example**:
```typescript
try {
  const result = await engine.spin();
  console.log('Win:', result.win);
  console.log('Payout:', result.payout);
  console.log('Matrix:', result.matrix);
} catch (error) {
  console.error('Spin failed:', error.message);
}
```

**Performance Requirements**:
- Initiate within 100ms of call
- Complete animation within `config.spinDuration + (4 * config.reelStopDelay)` ms
- Maintain 60fps throughout animation

---

### Method: stop

```typescript
stop(): void
```

**Purpose**: Immediately halt current spin (for testing/debugging).

**Parameters**: None

**Returns**: `void`

**Behavior**:
1. If not spinning, do nothing
2. Stop all reel animations immediately
3. Jump to final positions without easing
4. Skip remaining reel stop delays
5. Evaluate paylines and calculate payout
6. Emit `spin-complete` event

**Use Cases**:
- Debugging animation issues
- Automated testing where animation speed doesn't matter
- User "skip animation" feature (future)

**Example**:
```typescript
await engine.spin(); // Start spin
engine.stop();       // Immediately jump to result
```

**Note**: Not recommended for normal gameplay (breaks immersion).

---

### Method: getState

```typescript
getState(): GameState
```

**Purpose**: Retrieve current game state (credits, spin status, statistics).

**Parameters**: None

**Returns**: `GameState` - Snapshot of current state

**Behavior**:
- Return deep copy of internal GameState
- Ensures caller cannot mutate internal state

**Example**:
```typescript
const state = engine.getState();
console.log('Credits:', state.credits);
console.log('Last Win:', state.lastWin);
console.log('Total Spins:', state.totalSpins);
console.log('Win Rate:', (state.totalWins / state.totalSpins * 100).toFixed(2) + '%');
```

**Performance**: O(1) - returns pre-computed state

---

### Method: setConfig

```typescript
setConfig(partialConfig: Partial<SlotConfiguration>): void
```

**Purpose**: Update configuration at runtime (e.g., change theme, adjust winning chance).

**Parameters**:
- `partialConfig: Partial<SlotConfiguration>` - Configuration properties to update

**Behavior**:
1. Validate new configuration values
2. If `assetsPath` or `symbolSet` changed, trigger asset reload
3. If `winningChance`, `payoutTable`, or `reelStrips` changed, regenerate strips if needed
4. Update internal configuration
5. Preserve current GameState (credits, statistics)

**Throws**:
- `Error` if new configuration is invalid
- `Error` if asset reload fails
- `Error` if called while spinning

**Example**:
```typescript
// Change theme
await engine.setConfig({
  assetsPath: 'assets/vegas-nights',
  symbolSet: {
    CHERRY: 'symbol-CHERRY.png',
    // ... same symbols, different assets
  }
});

// Adjust difficulty
engine.setConfig({
  winningChance: 0.15  // Make it harder
});
```

**Restrictions**:
- Cannot change `rows` or `cols` (fixed at 3×5)
- Cannot call while `isSpinning === true`

---

### Method: dispose

```typescript
dispose(): void
```

**Purpose**: Clean up resources and remove DOM elements.

**Parameters**: None

**Returns**: `void`

**Behavior**:
1. Stop any active animations
2. Remove event listeners
3. Pause and dispose audio elements
4. Remove DOM elements from container
5. Clear internal references for garbage collection

**Example**:
```typescript
// When done with engine
engine.dispose();
```

**Post-Conditions**:
- Engine instance is unusable after disposal
- All DOM elements removed
- Event listeners cleaned up
- Memory released

---

### Method: simulate

```typescript
simulate(spinCount: number, options?: SimulationOptions): SimulationResult
```

**Purpose**: Run multiple spins automatically without animation for statistical analysis.

**Parameters**:
- `spinCount: number` - Number of spins to execute (recommended: 10,000+)
- `options?: SimulationOptions` - Optional simulation settings
  - `skipAnimation: boolean` (default: true) - Skip animation for speed
  - `silent: boolean` (default: true) - Suppress audio
  - `preserveCredits: boolean` (default: false) - Don't modify actual credit balance

**Returns**: `SimulationResult` - Aggregated statistics

**Behavior**:
1. Disable animations and audio
2. Execute `spinCount` spin operations in loop
3. Track statistics: wins, payouts, distribution
4. Calculate win rate, RTP percentage
5. Restore normal mode after completion
6. Return aggregated results

**Example**:
```typescript
const result = engine.simulate(10000);
console.log('Win Rate:', result.winRate.toFixed(2) + '%');
console.log('RTP:', result.rtp.toFixed(2) + '%');
console.log('Largest Win:', result.largestWin);
console.log('Distribution:', result.payoutDistribution);
```

**Performance Requirements**:
- Complete 10,000 spins in <10 seconds
- Memory usage should not grow unbounded

**Use Cases**:
- Validate configured `winningChance` matches actual results
- Analyze payout distribution
- Verify RTP calculations
- Automated testing

---

### Method: selfTest

```typescript
selfTest(): TestResult
```

**Purpose**: Run quick validation tests on engine functionality.

**Parameters**: None

**Returns**: `TestResult` - Pass/fail status with details

**Tests Performed**:
1. Configuration validation (correct value ranges)
2. Asset loading verification (all assets present)
3. RNG determinism (if seeded, check reproducibility)
4. Payline evaluation correctness
5. Payout calculation accuracy
6. Win rate approximation (100 spins)

**Example**:
```typescript
const test = engine.selfTest();
if (test.passed) {
  console.log('All tests passed!');
} else {
  console.error('Failed tests:', test.failures);
}
```

**Returns**:
```typescript
interface TestResult {
  passed: boolean;
  failures: string[];
  warnings: string[];
  duration: number;  // ms
}
```

---

## Events

The SlotEngine emits events during gameplay for integration with UI frameworks.

### Event: spin-start

**Emitted**: When spin animation begins

**Payload**:
```typescript
{
  credits: number;      // Credits after bet deducted
  betAmount: number;    // Amount wagered
  timestamp: number;    // Date.now()
}
```

---

### Event: reel-stop

**Emitted**: When each individual reel stops (5 times per spin)

**Payload**:
```typescript
{
  reelIndex: number;    // Which reel stopped (0-4)
  symbols: string[];    // 3 visible symbols on this reel
  timestamp: number;
}
```

---

### Event: spin-complete

**Emitted**: When all reels stopped and result calculated

**Payload**:
```typescript
{
  result: SpinResult;
  timestamp: number;
}
```

---

### Event: win

**Emitted**: When spin results in a win

**Payload**:
```typescript
{
  payout: number;
  hitLines: HitLine[];
  newBalance: number;
  timestamp: number;
}
```

---

### Event: credits-changed

**Emitted**: Whenever credit balance changes

**Payload**:
```typescript
{
  oldBalance: number;
  newBalance: number;
  change: number;       // Positive for wins, negative for bets
  reason: 'bet' | 'win';
  timestamp: number;
}
```

---

## Event Subscription

```typescript
// Subscribe to events
engine.on('spin-start', (data) => {
  console.log('Spin started with bet:', data.betAmount);
});

engine.on('win', (data) => {
  console.log('Won:', data.payout);
});

// Unsubscribe
const handler = (data) => { /* ... */ };
engine.on('spin-complete', handler);
engine.off('spin-complete', handler);
```

---

## Error Handling

All errors thrown by SlotEngine include descriptive messages following patterns from research.md:

**Configuration Errors**:
```
Invalid configuration: winningChance must be between 0 and 1. Received: 1.5
```

**Asset Errors**:
```
Missing required asset: assets/classic/symbol-CHERRY.png. Check that symbol-CHERRY.png exists in assets/classic/.
```

**State Errors**:
```
Cannot spin: already spinning. Wait for current spin to complete.
Cannot spin: insufficient credits (have: 5, need: 10).
```

---

## Type Definitions

See [SlotConfiguration.contract.ts](./SlotConfiguration.contract.ts) for complete TypeScript interfaces.

---

## Integration Example

```typescript
// HTML
<div id="slot-container"></div>

// TypeScript
import { SlotEngine } from './SlotEngine';

const engine = new SlotEngine({
  container: '#slot-container',
  assetsPath: 'assets/classic',
  // ... configuration
});

// Wait for asset loading
await engine.ready();

// Add UI event listener
document.getElementById('spin-button').addEventListener('click', async () => {
  try {
    const result = await engine.spin();
    updateUI(result);
  } catch (error) {
    showError(error.message);
  }
});

// Subscribe to events for reactive UI updates
engine.on('credits-changed', ({ newBalance }) => {
  document.getElementById('credits-display').textContent = newBalance;
});

engine.on('win', ({ payout }) => {
  showWinAnimation(payout);
});
```

---

## Version History

- **1.0.0** (2025-11-19): Initial API contract
