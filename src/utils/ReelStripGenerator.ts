/**
 * ReelStripGenerator - generates reel strips with weighted symbol distribution
 */

import { Symbol, DEFAULT_SYMBOL_WEIGHTS } from '../types.js';

export class ReelStripGenerator {
  /**
   * Generate default reel strips based on symbol weights
   * Creates 5 reel strips with varied symbol distribution
   * 
   * @param symbols - Available symbols with weights
   * @param stripLength - Desired length of each reel strip (default: 30)
   * @returns Array of 5 reel strips
   */
  static generateDefaultStrips(symbols: Symbol[], stripLength: number = 30): string[][] {
    const strips: string[][] = [];

    for (let reelIndex = 0; reelIndex < 5; reelIndex++) {
      const strip: string[] = [];

      // Generate symbols based on weights
      for (let i = 0; i < stripLength; i++) {
        const symbolId = this.selectWeightedSymbol(symbols);
        strip.push(symbolId);
      }

      strips.push(strip);
    }

    return strips;
  }

  /**
   * Select a random symbol based on weights
   * 
   * @param symbols - Array of symbols with weights
   * @returns Selected symbol ID
   */
  private static selectWeightedSymbol(symbols: Symbol[]): string {
    const totalWeight = symbols.reduce((sum, s) => sum + s.weight, 0);
    let random = Math.random() * totalWeight;

    for (const symbol of symbols) {
      random -= symbol.weight;
      if (random <= 0) {
        return symbol.id;
      }
    }

    // Fallback to first symbol (shouldn't reach here)
    return symbols[0].id;
  }

  /**
   * Apply default weights to symbols if not provided
   * 
   * @param symbolIds - Array of symbol IDs
   * @returns Array of Symbol objects with weights
   */
  static applyDefaultWeights(symbolIds: string[]): Symbol[] {
    return symbolIds.map(id => ({
      id,
      filename: `symbol-${id}.png`,
      weight: DEFAULT_SYMBOL_WEIGHTS[id] || 5  // Default weight if not in table
    }));
  }

  /**
   * Validate that reel strips don't have impossible win patterns
   * 
   * @param strips - Reel strips to validate
   * @returns true if valid
   */
  static validateStrips(strips: string[][]): boolean {
    if (strips.length !== 5) return false;

    for (const strip of strips) {
      if (strip.length < 3) return false;  // Must have at least 3 symbols
      if (new Set(strip).size < 2) return false;  // Must have variety
    }

    return true;
  }
}
