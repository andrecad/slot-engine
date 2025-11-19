/**
 * SlotEngine - Main slot machine engine class
 */

import {
  ISlotEngine,
  SlotConfiguration,
  GameState as IGameState,
  SpinResult,
  SimulationResult,
  SimulationOptions,
  TestResult,
  SpinStartEvent,
  ReelStopEvent,
  SpinCompleteEvent,
  WinEvent,
  CreditsChangedEvent
} from './types.js';
import { Configuration } from './models/Configuration.js';
import { GameState } from './models/GameState.js';
import { Reel } from './models/Reel.js';
import { AssetLoader } from './core/AssetLoader.js';
import { EventEmitter } from './ui/EventEmitter.js';
import { createRNG, IRNG } from './core/RNG.js';
import { ErrorMessages } from './utils/ErrorMessages.js';
import { ReelStripGenerator } from './utils/ReelStripGenerator.js';
import { PaylineEvaluator } from './core/PaylineEvaluator.js';
import { ReelController } from './core/ReelController.js';
import { DOMRenderer } from './ui/DOMRenderer.js';
import { ReelAnimator } from './animation/ReelAnimator.js';
import { AudioManager } from './audio/AudioManager.js';
import { MotionController } from './animation/MotionController.js';
import { createDefaultAudioAssets } from './models/AudioAssets.js';

export class SlotEngine implements ISlotEngine {
  private config: Configuration;
  private gameState: GameState;
  private assetLoader: AssetLoader;
  private eventEmitter: EventEmitter;
  private rng: IRNG;
  private readyPromise: Promise<void>;
  private reels: Reel[] = [];
  private paylineEvaluator!: PaylineEvaluator;
  private reelController!: ReelController;
  private renderer?: DOMRenderer;
  private animator?: ReelAnimator;
  private audioManager?: AudioManager;
  private motionController?: MotionController;

  /**
   * Create a new SlotEngine instance
   * 
   * @param userConfig - Partial configuration (merged with defaults)
   * 
   * **Deterministic Seeding:**
   * - Provide `seed` parameter (positive integer) for reproducible gameplay
   * - Same seed produces identical spin results across sessions
   * - Useful for testing, debugging, and replay scenarios
   * - Omit `seed` or set to `undefined` for truly random behavior using crypto.getRandomValues()
   * 
   * **Example Usage:**
   * ```typescript
   * // Deterministic gameplay (reproducible)
   * const engine1 = new SlotEngine({ seed: 12345, ...config });
   * 
   * // Random gameplay (different every time)
   * const engine2 = new SlotEngine({ seed: undefined, ...config });
   * ```
   * 
   * **Seed Behavior:**
   * - All randomness (reel positions, win/loss determination) uses the seeded RNG
   * - Seed can be changed at runtime via setConfig({ seed: newSeed })
   * - Changing seed reinitializes the RNG but preserves game state
   */
  constructor(userConfig: Partial<SlotConfiguration>) {
    // Initialize configuration with validation
    this.config = new Configuration(userConfig);

    // Initialize game state
    this.gameState = new GameState(this.config.getValue('initialCredits'));

    // Initialize event emitter
    this.eventEmitter = new EventEmitter();

    // Initialize RNG (seeded or crypto-based)
    // - If seed provided: Mulberry32 algorithm for deterministic sequence
    // - If seed omitted: window.crypto.getRandomValues() for true randomness
    this.rng = createRNG(this.config.getValue('seed'));

    // Initialize asset loader
    this.assetLoader = new AssetLoader(this.config.get());

    // Start preloading assets and initialize game
    this.readyPromise = this.initialize();
  }

  /**
   * Initialize game components after assets load
   */
  private async initialize(): Promise<void> {
    // Initialize motion controller
    this.motionController = new MotionController(this.config.shouldUseMotionBlur());

    // Initialize audio manager if enabled
    const enableAudio = this.config.getValue('enableAudio') ?? true;
    if (enableAudio) {
      const audioAssets = createDefaultAudioAssets(this.config.getValue('assetsPath'));
      this.audioManager = new AudioManager(audioAssets, {
        volume: this.config.getValue('audioVolume') ?? 0.7,
        muted: false
      });
      
      // Preload audio in parallel with other assets
      await Promise.all([
        this.assetLoader.preload(),
        this.audioManager.preload()
      ]);

      // Play background music after assets load
      this.audioManager.playBackgroundMusic();
    } else {
      await this.assetLoader.preload();
    }

    // Generate reel strips
    const symbolIds = Object.keys(this.config.getValue('symbolSet'));
    const symbols = ReelStripGenerator.applyDefaultWeights(symbolIds);
    const reelStrips = this.config.getValue('reelStrips') || 
                       ReelStripGenerator.generateDefaultStrips(symbols);

    // Create reels
    this.reels = reelStrips.map((strip, index) => new Reel(index, strip));

    // Initialize payline evaluator
    this.paylineEvaluator = new PaylineEvaluator(
      this.config.getValue('paylines'),
      this.config.getValue('payoutTable')
    );

    // Initialize reel controller
    this.reelController = new ReelController(
      this.rng,
      this.reels,
      this.paylineEvaluator,
      this.config.getValue('payoutTable')
    );

    // Initialize renderer if container provided
    const container = this.config.getValue('container');
    if (container) {
      const symbolMap = new Map();
      this.assetLoader.getAllSymbols().forEach(s => symbolMap.set(s.id, s));
      
      this.renderer = new DOMRenderer(container, symbolMap);
      this.renderer.initializeReels(this.reels);
      this.renderer.updateCredits(this.gameState.credits);

      // Initialize animator
      this.animator = new ReelAnimator(
        this.reels,
        this.renderer,
        {
          spinDuration: this.config.getAdjustedSpinDuration(),
          reelStopDelay: this.config.getValue('reelStopDelay'),
          useMotionBlur: this.config.shouldUseMotionBlur()
        }
      );

      // Bind spin button
      this.renderer.getSpinButton().addEventListener('click', async () => {
        console.log('[CLICK] Button clicked, isSpinning:', this.gameState.isSpinning);
        if (!this.gameState.isSpinning) {
          try {
            await this.spin();
            console.log('[CLICK] Spin completed successfully');
          } catch (err) {
            console.error('[CLICK] Spin error:', err);
            // Ensure button is re-enabled on error
            this.gameState.isSpinning = false;
            this.renderer?.setSpinButtonEnabled(true);
            this.renderer?.setBetButtonsEnabled(true);
          }
        } else {
          console.log('[CLICK] Ignored - already spinning');
        }
      });

      // Bind bet adjustment buttons
      this.renderer.getIncreaseBetButton().addEventListener('click', () => {
        if (!this.gameState.isSpinning) {
          this.increaseBet();
        }
      });

      this.renderer.getDecreaseBetButton().addEventListener('click', () => {
        if (!this.gameState.isSpinning) {
          this.decreaseBet();
        }
      });

      // Initialize bet display
      this.renderer.updateBet(this.config.getValue('betAmount'));
    }
  }

  /**
   * Wait for asset preloading to complete
   */
  async ready(): Promise<void> {
    await this.readyPromise;
  }

  /**
   * Execute one spin operation with animation
   */
  async spin(): Promise<SpinResult> {
    // Check if already spinning
    if (this.gameState.isSpinning) {
      throw new Error(ErrorMessages.stateError('spin', 'spinning', 'idle'));
    }

    // Check if sufficient credits
    const betAmount = this.config.getValue('betAmount');
    if (!this.gameState.hasCredits(betAmount)) {
      throw new Error(ErrorMessages.insufficientCredits(this.gameState.credits, betAmount));
    }

    // Mark as spinning
    this.gameState.isSpinning = true;
    console.log('[SPIN] Set isSpinning = true');

    // Disable spin and bet buttons
    if (this.renderer) {
      this.renderer.setSpinButtonEnabled(false);
      this.renderer.setBetButtonsEnabled(false);
      console.log('[SPIN] Disabled buttons');
    }

    try {
      const result = await this.executeSpin(betAmount);
      console.log('[SPIN] executeSpin completed');
      return result;
    } catch (error) {
      // Ensure cleanup on error
      console.log('[SPIN] Error caught, cleaning up');
      this.gameState.isSpinning = false;
      if (this.renderer) {
        this.renderer.setSpinButtonEnabled(true);
        this.renderer.setBetButtonsEnabled(true);
      }
      throw error;
    }
  }

  /**
   * Internal spin execution logic
   */
  private async executeSpin(betAmount: number): Promise<SpinResult> {

    // Deduct bet
    const oldBalance = this.gameState.credits;
    this.gameState.placeBet(betAmount);
    this.gameState.recordSpin();

    // Play spin sound
    if (this.audioManager) {
      this.audioManager.playSound('spinSound');
    }

    // Emit spin-start event
    this.eventEmitter.emit('spin-start', {
      credits: this.gameState.credits,
      betAmount,
      timestamp: Date.now()
    } as SpinStartEvent);

    // Emit credits-changed event
    this.eventEmitter.emit('credits-changed', {
      oldBalance,
      newBalance: this.gameState.credits,
      change: -betAmount,
      reason: 'bet',
      timestamp: Date.now()
    } as CreditsChangedEvent);

    // Update credits display
    if (this.renderer) {
      this.renderer.updateCredits(this.gameState.credits);
    }

    // Determine win/loss using Bernoulli trial
    const shouldWin = this.rng.next() < this.config.getValue('winningChance');
    const targetPositions = shouldWin
      ? this.reelController.generateWinningPositions()
      : this.reelController.generateLosingPositions();

    // Animate reels
    if (this.animator) {
      await this.animator.animate(
        targetPositions,
        (reelIndex) => {
          // Play reel-stop sound
          if (this.audioManager) {
            this.audioManager.playSound('reelStopSound');
          }

          // Emit reel-stop event
          const symbols = this.reels[reelIndex].getVisibleSymbols();
          this.eventEmitter.emit('reel-stop', {
            reelIndex,
            symbols,
            timestamp: Date.now()
          } as ReelStopEvent);
        }
      );
    }

    // Get final matrix and evaluate
    const matrix = this.reelController.getMatrixFromPositions(targetPositions);
    const result = this.paylineEvaluator.evaluate(matrix);

    // Update game state with result
    this.gameState.updateGrid(matrix);
    this.gameState.lastSpinResult = result;

    // Process winnings
    if (result.win) {
      const oldBalanceWin = this.gameState.credits;
      const totalPayout = result.payout * betAmount;
      this.gameState.addWinnings(totalPayout);

      // Play win sound (big win for 10x+ multiplier)
      if (this.audioManager) {
        const isBigWin = result.payout >= 10;
        this.audioManager.playSound(isBigWin ? 'bigWinSound' : 'winSound');
      }

      // Emit win event
      this.eventEmitter.emit('win', {
        payout: totalPayout,
        hitLines: result.hitLines,
        newBalance: this.gameState.credits,
        timestamp: Date.now()
      } as WinEvent);

      // Emit credits-changed event for win
      this.eventEmitter.emit('credits-changed', {
        oldBalance: oldBalanceWin,
        newBalance: this.gameState.credits,
        change: totalPayout,
        reason: 'win',
        timestamp: Date.now()
      } as CreditsChangedEvent);

      // Update displays and trigger win animation
      if (this.renderer) {
        this.renderer.updateCredits(this.gameState.credits);
        this.renderer.updateLastWin(totalPayout);
        this.renderer.highlightWinningSymbols(
          result.hitLines.flatMap(line => line.symbols)
        );
        
        // Trigger win animation (big win at 10x+ payout)
        const isBigWin = result.payout >= 10;
        this.renderer.triggerWinAnimation(isBigWin);
      }
    } else {
      // Update last win to 0
      if (this.renderer) {
        this.renderer.updateLastWin(0);
      }
    }

    // Emit spin-complete event
    this.eventEmitter.emit('spin-complete', {
      result,
      timestamp: Date.now()
    } as SpinCompleteEvent);

    // Mark as not spinning
    this.gameState.isSpinning = false;
    console.log('[EXECUTESPIN] Set isSpinning = false');

    // Enable spin and bet buttons
    if (this.renderer) {
      this.renderer.setSpinButtonEnabled(true);
      this.renderer.setBetButtonsEnabled(true);
      console.log('[EXECUTESPIN] Re-enabled buttons');
    }

    return result;
  }

  /**
   * Immediately halt current spin
   */
  stop(): void {
    if (this.gameState.isSpinning) {
      this.gameState.isSpinning = false;
    }
  }

  /**
   * Retrieve current game state
   */
  getState(): IGameState {
    return this.gameState.getSnapshot();
  }

  /**
   * Update configuration at runtime
   * 
   * **Seed Updates:**
   * Changing the seed will reinitialize the RNG, affecting all future spins.
   * This preserves game state (credits, wins) but changes the randomness sequence.
   * 
   * **Example Usage:**
   * ```typescript
   * // Switch to deterministic mode mid-game
   * engine.setConfig({ seed: 99999 });
   * 
   * // Switch to random mode mid-game
   * engine.setConfig({ seed: undefined });
   * 
   * // Change to different seed for different sequence
   * engine.setConfig({ seed: 12345 });
   * ```
   * 
   * **Asset Reloading:**
   * Changing assetsPath or symbolSet triggers asset reload (theme switching).
   * Game state is preserved during theme changes.
   * 
   * @param partialConfig - Configuration properties to update
   * @throws Error if called during an active spin
   */
  async setConfig(partialConfig: Partial<SlotConfiguration>): Promise<void> {
    if (this.gameState.isSpinning) {
      throw new Error(ErrorMessages.stateError('update configuration', 'spinning', 'idle'));
    }

    this.config.update(partialConfig);

    // If assets path or symbol set changed, reload assets
    if (partialConfig.assetsPath || partialConfig.symbolSet) {
      this.assetLoader.updateConfig(this.config.get());
      this.assetLoader.clear();
      this.readyPromise = this.assetLoader.preload();
      
      // Wait for assets to reload
      await this.readyPromise;
      
      // Reinitialize renderer with new assets
      if (this.renderer) {
        const symbolMap = new Map();
        this.assetLoader.getAllSymbols().forEach(s => symbolMap.set(s.id, s));
        this.renderer.updateSymbolMap(symbolMap);
        this.renderer.initializeReels(this.reels);
      }
    }

    // If seed changed, reinitialize RNG
    // This affects all future spins but preserves current game state
    if (partialConfig.seed !== undefined) {
      this.rng = createRNG(partialConfig.seed);
    }
  }

  /**
   * Increase bet amount
   */
  increaseBet(): void {
    const currentBet = this.config.getValue('betAmount');
    const newBet = currentBet + 10;
    const maxBet = Math.min(this.gameState.credits, 100); // Max 100 or current credits
    
    if (newBet <= maxBet) {
      this.config.update({ betAmount: newBet });
      if (this.renderer) {
        this.renderer.updateBet(newBet);
      }
    }
  }

  /**
   * Decrease bet amount
   */
  decreaseBet(): void {
    const currentBet = this.config.getValue('betAmount');
    const newBet = Math.max(10, currentBet - 10); // Min bet of 10
    
    this.config.update({ betAmount: newBet });
    if (this.renderer) {
      this.renderer.updateBet(newBet);
    }
  }

  /**
   * Get current bet amount
   */
  getBetAmount(): number {
    return this.config.getValue('betAmount');
  }

  /**
   * Clean up resources and remove DOM elements
   */
  dispose(): void {
    this.gameState.isSpinning = false;
    this.assetLoader.clear();
    this.eventEmitter.removeAllListeners();
  }

  /**
   * Run multiple spins automatically for statistical analysis
   * 
   * **Purpose:**
   * Executes automated spins to validate game mathematics and RTP.
   * Useful for testing, compliance verification, and game balance analysis.
   * 
   * **Performance:**
   * - Disables animations and audio during simulation
   * - Processes spins synchronously for maximum speed
   * - Typical performance: 10,000 spins in < 2 seconds
   * 
   * **Options:**
   * - `skipAnimation`: If true, bypass animation system (default: true)
   * - `silent`: If true, suppress event emissions (default: true)
   * - `preserveCredits`: If true, restore original balance after simulation (default: true)
   * 
   * **Example Usage:**
   * ```typescript
   * // Validate 25% win rate configuration
   * const result = engine.simulate(10000);
   * console.log(`Win rate: ${result.winRate}%`); // Should be ~25% ±2%
   * console.log(`RTP: ${result.rtp}%`); // Return to player percentage
   * ```
   * 
   * @param spinCount - Number of spins to execute
   * @param options - Simulation configuration options
   * @returns Comprehensive statistics including win rate, RTP, and payout distribution
   */
  simulate(spinCount: number, options?: SimulationOptions): SimulationResult {
    const startTime = Date.now();
    const betAmount = this.config.getValue('betAmount');

    // Store original state
    const originalCredits = this.gameState.credits;
    const originalIsSpinning = this.gameState.isSpinning;
    
    // Apply simulation options (defaults)
    const skipAnimation = options?.skipAnimation ?? true;
    const silent = options?.silent ?? true;
    const preserveCredits = options?.preserveCredits ?? true;

    // Disable animations and audio
    const originalAudioState = this.audioManager;
    if (skipAnimation) {
      this.audioManager = undefined; // Temporarily disable audio
    }

    // Initialize statistics
    let totalWins = 0;
    let totalPaidOut = 0;
    const payoutDistribution: Record<number, number> = {};
    let largestWin = 0;

    // Execute spins
    for (let i = 0; i < spinCount; i++) {
      // Check sufficient credits (or ensure infinite credits for simulation)
      if (!preserveCredits && !this.gameState.hasCredits(betAmount)) {
        break; // Stop if ran out of credits
      }

      // Deduct bet (or skip if preserving credits)
      if (!preserveCredits) {
        this.gameState.placeBet(betAmount);
      }
      this.gameState.recordSpin();

      // Determine win/loss using Bernoulli trial (same logic as regular spin)
      const winningChance = this.config.getValue('winningChance');
      const shouldWin = this.rng.next() < winningChance;

      if (shouldWin) {
        // Generate winning positions
        const positions = this.reelController.generateWinningPositions();
        
        // Get symbol matrix
        const matrix = this.positionsToMatrix(positions);
        
        // Evaluate paylines
        const result = this.paylineEvaluator.evaluate(matrix);

        if (result.win) {
          const payout = result.payout;
          totalWins++;
          totalPaidOut += payout;

          // Update payout distribution
          payoutDistribution[payout] = (payoutDistribution[payout] || 0) + 1;

          // Track largest win
          if (payout > largestWin) {
            largestWin = payout;
          }

          // Add winnings (if not preserving)
          if (!preserveCredits) {
            this.gameState.addWinnings(payout);
          }

          // Emit win event (if not silent)
          if (!silent && result.hitLines.length > 0) {
            this.eventEmitter.emit('win', {
              payout,
              hitLines: result.hitLines,
              newBalance: this.gameState.credits,
              timestamp: Date.now()
            } as WinEvent);
          }
        }
      } else {
        // Generate losing positions (ensures no accidental wins)
        this.reelController.generateLosingPositions();
      }
    }

    // Calculate statistics
    const totalWagered = spinCount * betAmount;
    const winRate = (totalWins / spinCount) * 100;
    const rtp = totalWagered > 0 ? (totalPaidOut / totalWagered) * 100 : 0;
    const duration = Date.now() - startTime;

    // Restore original state
    if (skipAnimation) {
      this.audioManager = originalAudioState; // Restore audio
    }

    if (preserveCredits) {
      this.gameState.credits = originalCredits;
    }

    this.gameState.isSpinning = originalIsSpinning;

    return {
      totalSpins: spinCount,
      totalWins,
      totalPaidOut,
      totalWagered,
      winRate,
      rtp,
      payoutDistribution,
      largestWin,
      duration
    };
  }

  /**
   * Convert reel positions to symbol matrix for payline evaluation
   */
  private positionsToMatrix(positions: number[]): string[][] {
    return positions.map((pos, reelIndex) => {
      const reel = this.reels[reelIndex];
      // Get 3 symbols centered around position
      return [
        reel.strip[(pos - 1 + reel.strip.length) % reel.strip.length],
        reel.strip[pos],
        reel.strip[(pos + 1) % reel.strip.length]
      ];
    });
  }

  /**
   * Run quick validation tests on the slot engine
   * 
   * **Purpose:**
   * Performs self-diagnostics to verify engine configuration and functionality.
   * Useful for CI/CD pipelines, pre-deployment validation, and debugging.
   * 
   * **Tests Performed:**
   * 1. Configuration validation (ranges, consistency)
   * 2. Asset loading verification (all required assets present)
   * 3. RNG determinism (seed produces consistent results)
   * 4. Payline evaluation (basic win detection works)
   * 5. Win rate approximation (quick statistical sanity check)
   * 
   * **Example Usage:**
   * ```typescript
   * const result = engine.selfTest();
   * if (!result.passed) {
   *   console.error('Self-test failed:', result.failures);
   * }
   * ```
   * 
   * @returns Test result with pass/fail status and detailed failures/warnings
   */
  selfTest(): TestResult {
    const startTime = Date.now();
    const failures: string[] = [];
    const warnings: string[] = [];

    // Test 1: Configuration validation
    try {
      const winningChance = this.config.getValue('winningChance');
      if (winningChance < 0 || winningChance > 1) {
        failures.push(`Invalid winningChance: ${winningChance} (must be 0-1)`);
      }

      const betAmount = this.config.getValue('betAmount');
      if (betAmount <= 0) {
        failures.push(`Invalid betAmount: ${betAmount} (must be positive)`);
      }

      const initialCredits = this.config.getValue('initialCredits');
      if (initialCredits < betAmount) {
        warnings.push(`Initial credits (${initialCredits}) less than bet amount (${betAmount})`);
      }

      const symbolSet = this.config.getValue('symbolSet');
      if (Object.keys(symbolSet).length < 3) {
        failures.push(`Insufficient symbols: ${Object.keys(symbolSet).length} (need at least 3)`);
      }
    } catch (error) {
      failures.push(`Configuration validation error: ${(error as Error).message}`);
    }

    // Test 2: Asset loading verification
    try {
      const symbols = this.assetLoader.getAllSymbols();
      if (symbols.length === 0) {
        failures.push('No assets loaded - call ready() before selfTest()');
      }

      const expectedSymbolCount = Object.keys(this.config.getValue('symbolSet')).length;
      if (symbols.length !== expectedSymbolCount) {
        failures.push(`Asset count mismatch: loaded ${symbols.length}, expected ${expectedSymbolCount}`);
      }
    } catch (error) {
      failures.push(`Asset verification error: ${(error as Error).message}`);
    }

    // Test 3: RNG determinism test (if seeded)
    const seed = this.config.getValue('seed');
    if (seed !== undefined) {
      try {
        const testRng1 = createRNG(seed);
        const testRng2 = createRNG(seed);
        
        const sequence1 = [testRng1.next(), testRng1.next(), testRng1.next()];
        const sequence2 = [testRng2.next(), testRng2.next(), testRng2.next()];

        for (let i = 0; i < 3; i++) {
          if (sequence1[i] !== sequence2[i]) {
            failures.push(`RNG determinism failed: seed ${seed} produced different sequences`);
            break;
          }
        }
      } catch (error) {
        failures.push(`RNG determinism test error: ${(error as Error).message}`);
      }
    }

    // Test 4: Payline evaluation test
    try {
      // Create a simple winning matrix (all same symbol)
      const firstSymbol = Object.keys(this.config.getValue('symbolSet'))[0];
      const testMatrix: string[][] = Array(5).fill(null).map(() => [firstSymbol, firstSymbol, firstSymbol]);
      
      const result = this.paylineEvaluator.evaluate(testMatrix);
      if (!result.win || result.payout <= 0) {
        failures.push('Payline evaluation failed: identical symbols did not produce win');
      }
    } catch (error) {
      failures.push(`Payline evaluation test error: ${(error as Error).message}`);
    }

    // Test 5: Win rate approximation (100 quick spins)
    try {
      const quickSim = this.simulate(100, {
        skipAnimation: true,
        silent: true,
        preserveCredits: true
      });

      const expectedWinRate = this.config.getValue('winningChance') * 100;
      const actualWinRate = quickSim.winRate;
      const tolerance = 20; // ±20% for 100 spins (loose tolerance)

      if (Math.abs(actualWinRate - expectedWinRate) > tolerance) {
        warnings.push(
          `Win rate approximation: ${actualWinRate.toFixed(1)}% vs expected ${expectedWinRate.toFixed(1)}% ` +
          `(${tolerance}% tolerance on 100 spins)`
        );
      }

      if (quickSim.totalWins > 0 && quickSim.rtp === 0) {
        failures.push('RTP calculation error: wins recorded but RTP is 0');
      }
    } catch (error) {
      failures.push(`Win rate approximation test error: ${(error as Error).message}`);
    }

    const duration = Date.now() - startTime;
    const passed = failures.length === 0;

    return {
      passed,
      failures,
      warnings,
      duration
    };
  }

  /**
   * Subscribe to engine events
   */
  on(event: 'spin-start', handler: (data: SpinStartEvent) => void): void;
  on(event: 'reel-stop', handler: (data: ReelStopEvent) => void): void;
  on(event: 'spin-complete', handler: (data: SpinCompleteEvent) => void): void;
  on(event: 'win', handler: (data: WinEvent) => void): void;
  on(event: 'credits-changed', handler: (data: CreditsChangedEvent) => void): void;
  on(event: string, handler: Function): void {
    this.eventEmitter.on(event, handler as any);
  }

  /**
   * Unsubscribe from engine events
   */
  off(event: string, handler: Function): void {
    this.eventEmitter.off(event, handler as any);
  }
}
