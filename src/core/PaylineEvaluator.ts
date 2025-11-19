/**
 * PaylineEvaluator - evaluates spin results for winning combinations
 */

import { SpinResult, HitLine, SymbolPosition } from '../types.js';

export class PaylineEvaluator {
  private paylines: number[][];
  private payoutTable: Record<string, number>;

  constructor(paylines: number[][], payoutTable: Record<string, number>) {
    this.paylines = paylines;
    this.payoutTable = payoutTable;
  }

  /**
   * Evaluate a spin result matrix for wins
   * 
   * @param matrix - 3×5 grid of symbol IDs
   * @returns SpinResult with win information
   */
  evaluate(matrix: string[][]): SpinResult {
    const hitLines: HitLine[] = [];

    // Check each payline
    for (let i = 0; i < this.paylines.length; i++) {
      const payline = this.paylines[i];
      const symbols: SymbolPosition[] = [];

      // Extract symbols along this payline
      // Payline format: flat array [row, col, row, col, ...] for 5 positions
      for (let j = 0; j < payline.length; j += 2) {
        const row = payline[j];
        const col = payline[j + 1];
        symbols.push({
          symbolId: matrix[row][col],
          row,
          col
        });
      }

      // Check if this payline matches any pattern in payout table
      const hitLine = this.checkPayline(i, symbols);
      if (hitLine) {
        hitLines.push(hitLine);
      }
    }

    const win = hitLines.length > 0;
    const payout = hitLines.reduce((sum, line) => sum + line.multiplier, 0);

    return {
      matrix,
      win,
      payout,
      hitLines
    };
  }

  /**
   * Check if a payline matches any winning pattern
   */
  private checkPayline(paylineIndex: number, symbols: SymbolPosition[]): HitLine | null {
    const symbolIds = symbols.map(s => s.symbolId);

    // Check all patterns in payout table
    for (const [pattern, multiplier] of Object.entries(this.payoutTable)) {
      if (this.matchesPattern(symbolIds, pattern)) {
        return {
          paylineIndex,
          pattern,
          multiplier,
          symbols: this.getMatchingSymbols(symbols, pattern)
        };
      }
    }

    return null;
  }

  /**
   * Check if symbol sequence matches a pattern
   * Pattern format: "CHERRY-CHERRY-CHERRY-*-*"
   * Where * means wildcard (any symbol)
   */
  private matchesPattern(symbolIds: string[], pattern: string): boolean {
    const patternParts = pattern.split('-');

    if (patternParts.length !== symbolIds.length) {
      return false;
    }

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      if (patternPart !== '*' && patternPart !== symbolIds[i]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get symbols that contribute to the match
   */
  private getMatchingSymbols(symbols: SymbolPosition[], pattern: string): SymbolPosition[] {
    const patternParts = pattern.split('-');
    return symbols.filter((_, index) => patternParts[index] !== '*');
  }

  /**
   * Check if a matrix has any winning combinations
   */
  hasWin(matrix: string[][]): boolean {
    return this.evaluate(matrix).win;
  }

  /**
   * Calculate total payout for a matrix
   */
  calculatePayout(matrix: string[][]): number {
    return this.evaluate(matrix).payout;
  }
}
