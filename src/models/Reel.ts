/**
 * Reel model - represents a single reel with its state
 */

import { Reel as IReel, ReelState } from '../types.js';

export class Reel implements IReel {
  index: number;
  strip: string[];
  currentOffset: number;
  targetOffset: number;
  element: HTMLElement;
  state: ReelState;

  constructor(index: number, strip: string[]) {
    this.index = index;
    this.strip = strip;
    this.currentOffset = 0;
    this.targetOffset = 0;
    this.state = 'idle';
    this.element = document.createElement('div');
    this.element.className = `reel reel-${index}`;
  }

  /**
   * Get symbols visible at current offset (3 symbols)
   */
  getVisibleSymbols(): string[] {
    const stripLength = this.strip.length;
    const baseIndex = Math.floor(this.currentOffset) % stripLength;

    return [
      this.strip[(baseIndex + stripLength) % stripLength],
      this.strip[(baseIndex + 1 + stripLength) % stripLength],
      this.strip[(baseIndex + 2 + stripLength) % stripLength]
    ];
  }

  /**
   * Set target position for this reel
   */
  setTarget(offset: number): void {
    this.targetOffset = offset;
  }

  /**
   * Update current offset (during animation)
   */
  updateOffset(offset: number): void {
    this.currentOffset = offset;
  }

  /**
   * Check if reel has reached target
   */
  hasReachedTarget(): boolean {
    return Math.abs(this.currentOffset - this.targetOffset) < 0.1;
  }

  /**
   * Set reel state
   */
  setState(state: ReelState): void {
    this.state = state;
  }

  /**
   * Reset reel to idle state
   */
  reset(): void {
    this.state = 'idle';
    this.currentOffset = this.targetOffset;
  }
}
