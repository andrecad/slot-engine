/**
 * GameState entity - tracks current game session state
 */

import { SpinResult } from '../types.js';

export class GameState {
  credits: number;
  lastWin: number;
  isSpinning: boolean;
  visibleGrid: string[][];
  lastSpinResult: SpinResult | null;
  totalSpins: number;
  totalWins: number;
  totalPaidOut: number;

  constructor(initialCredits: number = 1000) {
    this.credits = initialCredits;
    this.lastWin = 0;
    this.isSpinning = false;
    this.visibleGrid = this.createEmptyGrid();
    this.lastSpinResult = null;
    this.totalSpins = 0;
    this.totalWins = 0;
    this.totalPaidOut = 0;
  }

  /**
   * Create a 3×5 empty grid
   */
  private createEmptyGrid(): string[][] {
    return Array.from({ length: 3 }, () => Array(5).fill(''));
  }

  /**
   * Get a deep copy of the current state
   */
  getSnapshot(): GameState {
    const snapshot = new GameState(this.credits);
    snapshot.credits = this.credits;
    snapshot.lastWin = this.lastWin;
    snapshot.isSpinning = this.isSpinning;
    snapshot.visibleGrid = this.visibleGrid.map(row => [...row]);
    snapshot.lastSpinResult = this.lastSpinResult ? { ...this.lastSpinResult } : null;
    snapshot.totalSpins = this.totalSpins;
    snapshot.totalWins = this.totalWins;
    snapshot.totalPaidOut = this.totalPaidOut;
    return snapshot;
  }

  /**
   * Update visible grid from spin result
   */
  updateGrid(matrix: string[][]): void {
    this.visibleGrid = matrix.map(row => [...row]);
  }

  /**
   * Deduct bet amount from credits
   */
  placeBet(amount: number): void {
    this.credits -= amount;
  }

  /**
   * Add winnings to credits
   */
  addWinnings(amount: number): void {
    this.credits += amount;
    this.lastWin = amount;
    this.totalWins++;
    this.totalPaidOut += amount;
  }

  /**
   * Record a spin
   */
  recordSpin(): void {
    this.totalSpins++;
  }

  /**
   * Check if player has sufficient credits
   */
  hasCredits(amount: number): boolean {
    return this.credits >= amount;
  }
}
