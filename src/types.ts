/**
 * TypeScript Interface Definitions for Slot Machine Engine
 * Feature: 001-slot-engine
 * Version: 1.0.0
 * Date: 2025-11-19
 */

// ============================================================================
// Configuration Types
// ============================================================================

export interface SlotConfiguration {
  /** Base path to asset folder (e.g., "assets/classic") */
  assetsPath: string;

  /** Number of visible symbol rows (fixed at 3) */
  rows: 3;

  /** Number of reels/columns (fixed at 5) */
  cols: 5;

  /** Maps symbol IDs to asset filenames */
  symbolSet: Record<string, string>;

  /** Optional custom reel strips (one array per reel) */
  reelStrips?: string[][];

  /** Winning line patterns as [row, col] coordinate arrays */
  paylines: number[][];

  /** Symbol pattern to payout multiplier mapping */
  payoutTable: Record<string, number>;

  /** Total spin animation duration in milliseconds */
  spinDuration: number;

  /** Delay between each reel stopping in milliseconds */
  reelStopDelay: number;

  /** CSS easing function for spin acceleration */
  easingAccelerate: string;

  /** CSS easing function for reel deceleration */
  easingDecelerate: string;

  /** Probability of winning (0.0 to 1.0) */
  winningChance: number;

  /** Optional seed for deterministic RNG */
  seed?: number;

  /** Credits deducted per spin */
  betAmount: number;

  /** Starting credit balance */
  initialCredits: number;

  /** Enable CSS motion blur during spin (auto-disabled for prefers-reduced-motion) */
  motionBlur?: boolean;

  /** Enable audio effects and background music */
  enableAudio?: boolean;

  /** Volume level for audio (0.0 to 1.0) */
  audioVolume?: number;

  /** DOM selector or element for mounting */
  container?: string | HTMLElement;
}

// ============================================================================
// Core Entity Types
// ============================================================================

export interface Symbol {
  /** Unique identifier (e.g., "CHERRY", "BAR") */
  id: string;

  /** Asset filename */
  filename: string;

  /** Relative probability weight for reel generation */
  weight: number;

  /** Preloaded image element */
  imageElement?: HTMLImageElement;
}

export interface SymbolPosition {
  /** Symbol ID from symbolSet */
  symbolId: string;

  /** Row index (0-2) */
  row: number;

  /** Column/reel index (0-4) */
  col: number;
}

export type ReelState = 'idle' | 'accelerating' | 'spinning' | 'decelerating' | 'stopped';

export interface Reel {
  /** Reel index (0-4) */
  index: number;

  /** Array of symbol IDs forming the strip */
  strip: string[];

  /** Current scroll position (in symbol units) */
  currentOffset: number;

  /** Target final position */
  targetOffset: number;

  /** DOM container element */
  element: HTMLElement;

  /** Current animation state */
  state: ReelState;
}

export interface PayoutCombination {
  /** Symbol pattern (e.g., "CHERRY-CHERRY-CHERRY-*-*") */
  pattern: string;

  /** Payout as multiple of bet amount */
  multiplier: number;

  /** Which paylines this applies to (empty = all) */
  paylineIndices: number[];

  /** Relative probability for generating this win */
  weight: number;
}

export interface PayTable {
  /** Array of winning combinations */
  combinations: PayoutCombination[];
}

export interface Payline {
  /** Payline identifier */
  index: number;

  /** Array of [row, col] coordinates */
  positions: [number, number][];
}

// ============================================================================
// Result Types
// ============================================================================

export interface HitLine {
  /** Which payline matched */
  paylineIndex: number;

  /** Matched symbol pattern */
  pattern: string;

  /** Payout multiplier for this line */
  multiplier: number;

  /** Grid positions of matching symbols */
  symbols: SymbolPosition[];
}

export interface SpinResult {
  /** 2D array of symbol IDs (3 rows × 5 columns) */
  matrix: string[][];

  /** Whether this spin won */
  win: boolean;

  /** Total credits won (0 if no win) */
  payout: number;

  /** Details of winning lines */
  hitLines: HitLine[];
}

// ============================================================================
// State Types
// ============================================================================

export interface GameState {
  /** Current credit balance */
  credits: number;

  /** Credits won on most recent spin */
  lastWin: number;

  /** Whether reels are currently animating */
  isSpinning: boolean;

  /** Current 3×5 grid of visible symbols */
  visibleGrid: string[][];

  /** Result of most recent spin */
  lastSpinResult: SpinResult | null;

  /** Total number of spins since initialization */
  totalSpins: number;

  /** Total number of winning spins */
  totalWins: number;

  /** Total credits paid out */
  totalPaidOut: number;
}

// ============================================================================
// Simulation Types
// ============================================================================

export interface SimulationOptions {
  /** Skip animation for speed (default: true) */
  skipAnimation?: boolean;

  /** Suppress audio (default: true) */
  silent?: boolean;

  /** Don't modify actual credit balance (default: false) */
  preserveCredits?: boolean;
}

export interface SimulationResult {
  /** Number of spins executed */
  totalSpins: number;

  /** Number of winning spins */
  totalWins: number;

  /** Percentage of spins that won (0-100) */
  winRate: number;

  /** Total credits bet */
  totalWagered: number;

  /** Total credits paid out */
  totalPaidOut: number;

  /** Return to Player percentage */
  rtp: number;

  /** Histogram of payout amounts and frequencies */
  payoutDistribution: Record<number, number>;

  /** Maximum payout from a single spin */
  largestWin: number;

  /** Time taken in milliseconds */
  duration: number;
}

// ============================================================================
// Testing Types
// ============================================================================

export interface TestResult {
  /** Overall pass/fail status */
  passed: boolean;

  /** List of failed test descriptions */
  failures: string[];

  /** List of warning messages */
  warnings: string[];

  /** Test execution time in milliseconds */
  duration: number;
}

// ============================================================================
// Event Types
// ============================================================================

export interface SpinStartEvent {
  /** Credits after bet deducted */
  credits: number;

  /** Amount wagered */
  betAmount: number;

  /** Timestamp */
  timestamp: number;
}

export interface ReelStopEvent {
  /** Which reel stopped (0-4) */
  reelIndex: number;

  /** 3 visible symbols on this reel */
  symbols: string[];

  /** Timestamp */
  timestamp: number;
}

export interface SpinCompleteEvent {
  /** Spin result */
  result: SpinResult;

  /** Timestamp */
  timestamp: number;
}

export interface WinEvent {
  /** Credits won */
  payout: number;

  /** Winning line details */
  hitLines: HitLine[];

  /** New credit balance */
  newBalance: number;

  /** Timestamp */
  timestamp: number;
}

export interface CreditsChangedEvent {
  /** Previous balance */
  oldBalance: number;

  /** New balance */
  newBalance: number;

  /** Change amount (positive for wins, negative for bets) */
  change: number;

  /** Reason for change */
  reason: 'bet' | 'win';

  /** Timestamp */
  timestamp: number;
}

// ============================================================================
// Audio Types
// ============================================================================

export interface AudioAssets {
  /** Looping background music */
  backgroundMusic: HTMLAudioElement;

  /** Spin start sound */
  spinStart: HTMLAudioElement;

  /** Reel stop sound */
  reelStop: HTMLAudioElement;

  /** Win celebration sound */
  winSound: HTMLAudioElement;
}

// ============================================================================
// Main Engine Interface
// ============================================================================

export interface ISlotEngine {
  /**
   * Execute one spin operation with animation
   * @returns Promise that resolves to SpinResult when animation completes
   * @throws Error if already spinning or insufficient credits
   */
  spin(): Promise<SpinResult>;

  /**
   * Immediately halt current spin (for testing/debugging)
   */
  stop(): void;

  /**
   * Retrieve current game state
   * @returns Snapshot of current GameState
   */
  getState(): GameState;

  /**
   * Update configuration at runtime
   * @param partialConfig - Configuration properties to update
   * @throws Error if invalid configuration or called while spinning
   */
  setConfig(partialConfig: Partial<SlotConfiguration>): void;

  /**
   * Clean up resources and remove DOM elements
   */
  dispose(): void;

  /**
   * Run multiple spins automatically for statistical analysis
   * @param spinCount - Number of spins to execute
   * @param options - Optional simulation settings
   * @returns Aggregated statistics
   */
  simulate(spinCount: number, options?: SimulationOptions): SimulationResult;

  /**
   * Run quick validation tests
   * @returns Test results with pass/fail status
   */
  selfTest(): TestResult;

  /**
   * Subscribe to engine events
   * @param event - Event name
   * @param handler - Event handler function
   */
  on(event: 'spin-start', handler: (data: SpinStartEvent) => void): void;
  on(event: 'reel-stop', handler: (data: ReelStopEvent) => void): void;
  on(event: 'spin-complete', handler: (data: SpinCompleteEvent) => void): void;
  on(event: 'win', handler: (data: WinEvent) => void): void;
  on(event: 'credits-changed', handler: (data: CreditsChangedEvent) => void): void;

  /**
   * Unsubscribe from engine events
   * @param event - Event name
   * @param handler - Event handler function to remove
   */
  off(event: string, handler: Function): void;

  /**
   * Wait for asset preloading to complete
   * @returns Promise that resolves when engine is ready
   */
  ready(): Promise<void>;
}

// ============================================================================
// Utility Types
// ============================================================================

export type SymbolMatrix = string[][];
export type PaylinePattern = [number, number][];

/**
 * Default payline configurations (5 standard lines)
 */
export const DEFAULT_PAYLINES: Payline[] = [
  { index: 0, positions: [[1, 0], [1, 1], [1, 2], [1, 3], [1, 4]] }, // Middle horizontal
  { index: 1, positions: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] }, // Top horizontal
  { index: 2, positions: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]] }, // Bottom horizontal
  { index: 3, positions: [[0, 0], [1, 1], [2, 2], [1, 3], [0, 4]] }, // V-shape
  { index: 4, positions: [[2, 0], [1, 1], [0, 2], [1, 3], [2, 4]] }  // Inverted V
];

/**
 * Default symbol weights for reel generation
 */
export const DEFAULT_SYMBOL_WEIGHTS: Record<string, number> = {
  SEVEN: 1,
  DIAMOND: 2,
  BAR: 4,
  BELL: 6,
  WATERMELON: 8,
  ORANGE: 10,
  LEMON: 12,
  CHERRY: 15
};

/**
 * Default payout table
 */
export const DEFAULT_PAYOUT_TABLE: Record<string, number> = {
  'SEVEN-SEVEN-SEVEN-SEVEN-SEVEN': 1000,
  'DIAMOND-DIAMOND-DIAMOND-DIAMOND-DIAMOND': 500,
  'BAR-BAR-BAR-BAR-BAR': 250,
  'BELL-BELL-BELL-BELL-BELL': 100,
  'DIAMOND-DIAMOND-DIAMOND-*-*': 100,
  'BAR-BAR-BAR-*-*': 50,
  'BELL-BELL-BELL-*-*': 25,
  'WATERMELON-WATERMELON-WATERMELON-*-*': 15,
  'ORANGE-ORANGE-ORANGE-*-*': 10,
  'LEMON-LEMON-LEMON-*-*': 8,
  'CHERRY-CHERRY-CHERRY-*-*': 5,
  'CHERRY-CHERRY-*-*-*': 2
};
