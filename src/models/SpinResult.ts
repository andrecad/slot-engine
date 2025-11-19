/**
 * SpinResult entity - contains results of a single spin
 */

import { SpinResult, HitLine } from '../types.js';

export function createSpinResult(
  matrix: string[][],
  hitLines: HitLine[] = []
): SpinResult {
  const win = hitLines.length > 0;
  const payout = hitLines.reduce((sum, line) => sum + line.multiplier, 0);

  return {
    matrix,
    win,
    payout,
    hitLines
  };
}

export function createEmptySpinResult(): SpinResult {
  return {
    matrix: Array.from({ length: 3 }, () => Array(5).fill('')),
    win: false,
    payout: 0,
    hitLines: []
  };
}
