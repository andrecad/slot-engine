/**
 * ReelController - manages reel positioning for winning and losing spins
 * Implements Bernoulli trial + weighted selection algorithm
 */

import { IRNG } from './RNG.js';
import { Reel } from '../models/Reel.js';
import { PaylineEvaluator } from './PaylineEvaluator.js';

export class ReelController {
  private rng: IRNG;
  private reels: Reel[];
  private paylineEvaluator: PaylineEvaluator;
  private payoutTable: Record<string, number>;

  constructor(
    rng: IRNG,
    reels: Reel[],
    paylineEvaluator: PaylineEvaluator,
    payoutTable: Record<string, number>
  ) {
    this.rng = rng;
    this.reels = reels;
    this.paylineEvaluator = paylineEvaluator;
    this.payoutTable = payoutTable;
  }

  /**
   * Generate reel positions for a winning spin
   * Selects a winning combination and positions reels to create it
   */
  generateWinningPositions(): number[] {
    // Select winning pattern based on weights (prefer lower payouts for realism)
    const patterns = Object.entries(this.payoutTable);
    const pattern = this.selectWeightedPattern(patterns);

    // Generate positions that create this pattern on any payline
    return this.createWinningMatrix(pattern[0]);
  }

  /**
   * Generate reel positions for a losing spin
   * Ensures no accidental winning combinations
   */
  generateLosingPositions(): number[] {
    const maxAttempts = 100;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const positions = this.reels.map(reel => {
        return Math.floor(this.rng.next() * reel.strip.length);
      });

      const matrix = this.positionsToMatrix(positions);
      if (!this.paylineEvaluator.hasWin(matrix)) {
        return positions;
      }

      attempts++;
    }

    // Fallback: force a losing combination
    return this.forceLosingPositions();
  }

  /**
   * Select a pattern from the payout table with weighted probability
   * Lower payouts have higher probability for realistic gameplay
   */
  private selectWeightedPattern(patterns: [string, number][]): [string, number] {
    // Inverse weight: lower payout = higher probability
    const weights = patterns.map(([_, payout]) => 1000 / payout);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    let random = this.rng.next() * totalWeight;

    for (let i = 0; i < patterns.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return patterns[i];
      }
    }

    // Fallback to lowest payout (most common)
    return patterns[patterns.length - 1];
  }

  /**
   * Create reel positions that produce the winning pattern
   */
  private createWinningMatrix(pattern: string): number[] {
    const symbols = pattern.split('-');
    const positions: number[] = [];

    // For each reel, find a position that places the required symbol in a payline
    for (let reelIndex = 0; reelIndex < 5; reelIndex++) {
      const requiredSymbol = symbols[reelIndex];
      const reel = this.reels[reelIndex];

      // Find a position in the strip where this symbol appears
      let position = 0;
      if (requiredSymbol !== '*') {
        const symbolIndices = reel.strip
          .map((s, i) => (s === requiredSymbol ? i : -1))
          .filter(i => i !== -1);

        if (symbolIndices.length > 0) {
          // Pick a random occurrence of this symbol
          const randomIndex = Math.floor(this.rng.next() * symbolIndices.length);
          position = symbolIndices[randomIndex];
        }
      } else {
        // Wildcard - any position is fine
        position = Math.floor(this.rng.next() * reel.strip.length);
      }

      positions.push(position);
    }

    return positions;
  }

  /**
   * Force a losing combination by ensuring mixed symbols
   */
  private forceLosingPositions(): number[] {
    // Create a pattern with no matching symbols on middle row
    return this.reels.map((reel, index) => {
      // Find positions with different symbols
      const targetSymbol = index === 0 ? reel.strip[0] : '!DIFFERENT!';
      
      for (let i = 0; i < reel.strip.length; i++) {
        const visible = [
          reel.strip[i],
          reel.strip[(i + 1) % reel.strip.length],
          reel.strip[(i + 2) % reel.strip.length]
        ];

        // Ensure middle row has varied symbols
        if (index > 0 && visible[1] === targetSymbol) continue;
        return i;
      }

      return 0;  // Fallback
    });
  }

  /**
   * Convert reel positions to 3×5 matrix of symbols
   */
  private positionsToMatrix(positions: number[]): string[][] {
    const matrix: string[][] = [[], [], []];

    for (let reelIndex = 0; reelIndex < 5; reelIndex++) {
      const reel = this.reels[reelIndex];
      const position = positions[reelIndex];
      const strip = reel.strip;

      for (let row = 0; row < 3; row++) {
        const symbolIndex = (position + row) % strip.length;
        matrix[row][reelIndex] = strip[symbolIndex];
      }
    }

    return matrix;
  }

  /**
   * Convert positions to visible matrix (public interface)
   */
  public getMatrixFromPositions(positions: number[]): string[][] {
    return this.positionsToMatrix(positions);
  }
}
