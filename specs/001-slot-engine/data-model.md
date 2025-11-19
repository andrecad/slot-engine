# Data Model: Slot Machine Engine

**Feature**: Slot Machine Engine (001-slot-engine)  
**Date**: 2025-11-19  
**Purpose**: Define core entities and their relationships

## Entity Definitions

### 1. SlotConfiguration

Represents the complete configuration for a slot machine instance.

**Attributes**:
- `assetsPath: string` - Base path to asset folder (e.g., "assets/classic")
- `rows: number` - Number of visible symbol rows (default: 3, fixed for this feature)
- `cols: number` - Number of reels/columns (default: 5, fixed for this feature)
- `symbolSet: Record<string, string>` - Maps symbol IDs to filenames (e.g., {CHERRY: "symbol-CHERRY.png"})
- `reelStrips?: string[][]` - Optional custom reel strips (array of symbol ID arrays, one per reel)
- `paylines: number[][]` - Defines winning line patterns as arrays of [row, col] coordinates
- `payoutTable: Record<string, number>` - Maps symbol patterns to payout multipliers
- `spinDuration: number` - Total spin animation duration in milliseconds (e.g., 2000)
- `reelStopDelay: number` - Delay between each reel stopping in milliseconds (e.g., 300)
- `easingAccelerate: string` - CSS easing function for spin start (e.g., "cubic-bezier(0.55, 0.085, 0.68, 0.53)")
- `easingDecelerate: string` - CSS easing function for reel stop (e.g., "cubic-bezier(0.175, 0.885, 0.32, 1.05)")
- `winningChance: number` - Probability of winning (0.0 to 1.0, e.g., 0.25 = 25%)
- `seed?: number` - Optional seed for deterministic RNG (32-bit unsigned integer)
- `betAmount: number` - Credits deducted per spin (default: 1)
- `initialCredits: number` - Starting credit balance (default: 1000)
- `motionBlur: boolean` - Enable CSS motion blur during spin (default: true, disabled if prefers-reduced-motion)

**Validation Rules**:
- `winningChance` must be between 0 and 1 (inclusive)
- `rows` must equal 3 (fixed requirement)
- `cols` must equal 5 (fixed requirement)
- `symbolSet` must contain at least 8 symbols
- `paylines` must contain at least 1 payline
- `spinDuration` must be > 0
- `reelStopDelay` must be >= 0
- `betAmount` must be > 0
- `seed` if provided must be a positive integer

**Relationships**:
- Referenced by `GameState` (1:1)
- Defines symbols used in `SymbolPosition` entities

---

### 2. Symbol

Represents a single symbol type that can appear on reels.

**Attributes**:
- `id: string` - Unique identifier (e.g., "CHERRY", "BAR", "SEVEN")
- `filename: string` - Asset filename (e.g., "symbol-CHERRY.png")
- `weight: number` - Relative probability weight for reel strip generation (higher = more common)
- `imageElement: HTMLImageElement` - Preloaded image DOM element

**Validation Rules**:
- `id` must be unique within symbolSet
- `filename` must exist in assets folder
- `weight` must be > 0

**Relationships**:
- Defined in `SlotConfiguration.symbolSet`
- Referenced by `SymbolPosition` entities
- Used in `PayoutTable` for matching

---

### 3. SymbolPosition

Represents a single symbol at a specific grid position.

**Attributes**:
- `symbolId: string` - References a symbol from symbolSet
- `row: number` - Row index (0-2 for 3-row grid)
- `col: number` - Column/reel index (0-4 for 5-reel grid)

**Validation Rules**:
- `row` must be 0-2 (3 rows)
- `col` must be 0-4 (5 columns)
- `symbolId` must exist in configuration's symbolSet

**Relationships**:
- Part of `GameState.visibleGrid` (15 total positions for 3×5 grid)
- Part of `SpinResult.matrix`

---

### 4. Reel

Represents one vertical column of spinning symbols.

**Attributes**:
- `index: number` - Reel index (0-4 for 5 reels)
- `strip: string[]` - Array of symbol IDs forming the reel strip (e.g., ["CHERRY", "BAR", "CHERRY", ...])
- `currentOffset: number` - Current scroll position within the strip (in symbol units)
- `targetOffset: number` - Final position after spin completes
- `element: HTMLElement` - DOM container for this reel's symbols
- `state: ReelState` - Current animation state (idle | accelerating | spinning | decelerating | stopped)

**ReelState Enum**:
- `idle` - Not spinning, awaiting input
- `accelerating` - Speed increasing from 0 to full
- `spinning` - Constant spin speed
- `decelerating` - Slowing down to stop position
- `stopped` - Animation complete, symbols locked

**Validation Rules**:
- `strip` must contain only symbol IDs from symbolSet
- `strip` length must be >= 20 (minimum for variation)
- `currentOffset` and `targetOffset` must be >= 0

**Relationships**:
- Part of `SlotEngine` (5 Reel instances for 5-column grid)
- Contains `SymbolPosition` entities at visible offsets

---

### 5. PayTable

Represents the winning combinations and their payouts.

**Attributes**:
- `combinations: PayoutCombination[]` - Array of winning patterns

**PayoutCombination**:
- `pattern: string` - Symbol pattern (e.g., "CHERRY-CHERRY-CHERRY-*-*" where * = any)
- `multiplier: number` - Payout as multiple of bet amount
- `paylineIndices: number[]` - Which paylines this pattern applies to (empty = all paylines)
- `weight: number` - Relative probability for this combination when generating wins

**Example PayTable**:
```typescript
{
  combinations: [
    { pattern: "SEVEN-SEVEN-SEVEN-SEVEN-SEVEN", multiplier: 1000, paylineIndices: [], weight: 1 },
    { pattern: "DIAMOND-DIAMOND-DIAMOND-*-*", multiplier: 100, paylineIndices: [], weight: 2 },
    { pattern: "BAR-BAR-BAR-*-*", multiplier: 50, paylineIndices: [], weight: 4 },
    { pattern: "BELL-BELL-BELL-*-*", multiplier: 25, paylineIndices: [], weight: 6 },
    { pattern: "ANY-ANY-ANY-*-*", multiplier: 5, paylineIndices: [], weight: 15 }
  ]
}
```

**Validation Rules**:
- `pattern` must contain valid symbol IDs or wildcard "*"
- `multiplier` must be > 0
- `weight` must be > 0
- Patterns should be sorted by multiplier (descending) for evaluation efficiency

**Relationships**:
- Part of `SlotConfiguration`
- Used by `SpinResult` to calculate payouts

---

### 6. Payline

Represents a path across the grid that defines a winning line.

**Attributes**:
- `index: number` - Payline identifier (0-based)
- `positions: [row: number, col: number][]` - Array of grid coordinates forming the line

**Common Payline Patterns** (5 standard lines):
```typescript
const DEFAULT_PAYLINES = [
  [[1,0], [1,1], [1,2], [1,3], [1,4]],  // Middle horizontal
  [[0,0], [0,1], [0,2], [0,3], [0,4]],  // Top horizontal
  [[2,0], [2,1], [2,2], [2,3], [2,4]],  // Bottom horizontal
  [[0,0], [1,1], [2,2], [1,3], [0,4]],  // V-shape
  [[2,0], [1,1], [0,2], [1,3], [2,4]]   // Inverted V-shape
];
```

**Validation Rules**:
- Must contain exactly 5 positions (one per column)
- Row indices must be 0-2
- Column indices must be 0-4 in order

**Relationships**:
- Defined in `SlotConfiguration.paylines`
- Referenced by `SpinResult.hitLines`

---

### 7. SpinResult

Represents the outcome of a single spin operation.

**Attributes**:
- `matrix: string[][]` - 2D array of symbol IDs (3 rows × 5 columns) showing final reel positions
- `win: boolean` - Whether this spin resulted in a winning combination
- `payout: number` - Total credits won (0 if no win)
- `hitLines: HitLine[]` - Details of winning lines

**HitLine**:
- `paylineIndex: number` - Which payline matched
- `pattern: string` - The matched symbol pattern (e.g., "CHERRY-CHERRY-CHERRY-*-*")
- `multiplier: number` - Payout multiplier for this line
- `symbols: SymbolPosition[]` - Grid positions of matching symbols

**Validation Rules**:
- `matrix` must be exactly 3×5
- All symbol IDs in `matrix` must exist in symbolSet
- `payout` must be 0 if `win` is false
- `hitLines` must be empty if `win` is false

**Relationships**:
- Returned by `SlotEngine.spin()` method
- Updates `GameState.lastSpinResult`

---

### 8. GameState

Represents the current runtime state of the slot machine.

**Attributes**:
- `credits: number` - Current credit balance
- `lastWin: number` - Credits won on most recent spin
- `isSpinning: boolean` - Whether reels are currently animating
- `visibleGrid: string[][]` - Current 3×5 grid of visible symbols
- `lastSpinResult: SpinResult | null` - Result of most recent spin
- `totalSpins: number` - Total number of spins since initialization (for statistics)
- `totalWins: number` - Total number of winning spins (for statistics)
- `totalPaidOut: number` - Total credits paid out (for RTP calculation)

**Validation Rules**:
- `credits` must be >= 0
- `lastWin` must be >= 0
- `totalSpins`, `totalWins`, `totalPaidOut` must be >= 0
- `totalWins` must be <= `totalSpins`

**State Transitions**:
1. **Idle**: `isSpinning = false`, awaiting spin() call
2. **Spinning**: `isSpinning = true`, reels animating
3. **Stopped**: `isSpinning = false`, `lastSpinResult` populated, credits updated

**Relationships**:
- Managed by `SlotEngine`
- Updated by spin operations
- Returned by `getState()` method

---

### 9. SimulationResult

Represents the aggregated statistics from running multiple automated spins.

**Attributes**:
- `totalSpins: number` - Number of spins executed
- `totalWins: number` - Number of winning spins
- `winRate: number` - Percentage of spins that won (0-100)
- `totalWagered: number` - Total credits bet (totalSpins × betAmount)
- `totalPaidOut: number` - Total credits paid out
- `rtp: number` - Return to Player percentage ((totalPaidOut / totalWagered) × 100)
- `payoutDistribution: Record<number, number>` - Histogram of payout amounts and their frequencies
- `largestWin: number` - Maximum payout from a single spin
- `duration: number` - Time taken to run simulation in milliseconds

**Validation Rules**:
- `totalSpins` must be > 0
- `totalWins` must be <= `totalSpins`
- `winRate` should equal `(totalWins / totalSpins) × 100`
- `rtp` should equal `(totalPaidOut / totalWagered) × 100`

**Relationships**:
- Returned by `SlotEngine.simulate(n)` method
- Uses `SpinResult` data from each simulated spin

---

### 10. AudioAssets

Represents preloaded audio files for sound effects.

**Attributes**:
- `backgroundMusic: HTMLAudioElement` - Looping background music
- `spinStart: HTMLAudioElement` - Sound when spin begins
- `reelStop: HTMLAudioElement` - Sound when each reel stops
- `winSound: HTMLAudioElement` - Sound when player wins

**Methods**:
- `play(soundName: string): void` - Play specific sound effect
- `stop(soundName: string): void` - Stop specific sound
- `setVolume(soundName: string, volume: number): void` - Adjust volume (0-1)

**Validation Rules**:
- All audio elements must be preloaded before gameplay
- Audio files must be in supported formats (MP3, WAV, OGG)

**Relationships**:
- Managed by `SlotEngine`
- Triggered by game events (spin, stop, win)

---

## Entity Relationship Diagram

```
SlotConfiguration (1) ──────> (N) Symbol
       │
       │ configures
       ↓
  SlotEngine (1) ──────> (5) Reel
       │                      │
       │ manages              │ contains
       ↓                      ↓
  GameState (1)         SymbolPosition (N)
       │
       │ tracks
       ↓
  SpinResult (N)
       │
       │ references
       ↓
  HitLine (N) ──────> Payline
       │
       │ uses
       ↓
  PayTable
```

## Data Flow

### Spin Operation Flow:
1. User triggers `spin()` → deducts `betAmount` from `credits`
2. RNG determines win/loss based on `winningChance`
3. If win: select weighted `PayoutCombination` from `PayTable`
4. Generate `SpinResult.matrix` from `Reel.strip` positions
5. Animate reels (update `Reel.state` through animation phases)
6. Evaluate `Paylines` against final `matrix` to populate `HitLines`
7. Calculate `payout` and update `GameState.credits`
8. Return `SpinResult` to caller

### Simulation Operation Flow:
1. User calls `simulate(n)`
2. Loop n times: execute spin operation (skip animations)
3. Aggregate statistics: `totalWins`, `totalPaidOut`, `payoutDistribution`
4. Calculate `winRate` and `rtp`
5. Return `SimulationResult`

## Storage Considerations

**In-Memory Only**:
- All entities exist only in browser memory
- No persistence between page reloads
- Configuration passed via constructor each session

**State Export** (Future Enhancement):
- Could serialize `GameState` to localStorage
- Could export `SimulationResult` as JSON
- Not required for initial implementation

## Performance Notes

- **Memory**: Each `Reel` contains ~32-64 symbol references (negligible)
- **Grid Operations**: 3×5 = 15 cells, O(1) access time
- **Payline Evaluation**: 5 paylines × 5 positions = 25 comparisons per spin
- **Simulation**: 10,000 spins should complete in <10s (1ms average per spin)
