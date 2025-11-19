/**
 * Configuration entity with validation and defaults
 */

import { SlotConfiguration, DEFAULT_PAYLINES, DEFAULT_PAYOUT_TABLE } from '../types.js';
import { Validators } from '../utils/Validators.js';

export class Configuration {
  private config: SlotConfiguration;

  constructor(userConfig: Partial<SlotConfiguration>) {
    // Merge with defaults
    this.config = this.mergeWithDefaults(userConfig);

    // Validate complete configuration
    Validators.validateConfig(this.config);
  }

  /**
   * Merge user configuration with default values
   */
  private mergeWithDefaults(userConfig: Partial<SlotConfiguration>): SlotConfiguration {
    const defaultPaylines: number[][] = DEFAULT_PAYLINES.map(p => 
      p.positions.map(pos => [pos[0], pos[1]]).flat()
    );

    const defaults: SlotConfiguration = {
      assetsPath: userConfig.assetsPath || '',
      rows: 3,
      cols: 5,
      symbolSet: userConfig.symbolSet || {},
      paylines: defaultPaylines,
      payoutTable: DEFAULT_PAYOUT_TABLE,
      spinDuration: 2000,
      reelStopDelay: 200,
      easingAccelerate: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
      easingDecelerate: 'cubic-bezier(0.175, 0.885, 0.32, 1.05)',
      winningChance: 0.25,
      betAmount: 10,
      initialCredits: 1000,
      motionBlur: true,
      enableAudio: true,
      audioVolume: 0.7,
    };

    return {
      ...defaults,
      ...userConfig,
      rows: 3,  // Always fixed
      cols: 5,  // Always fixed
    };
  }

  /**
   * Get the current configuration
   */
  get(): SlotConfiguration {
    return { ...this.config };
  }

  /**
   * Update configuration with partial values
   */
  update(partialConfig: Partial<SlotConfiguration>): void {
    Validators.validatePartialConfig(partialConfig);
    this.config = {
      ...this.config,
      ...partialConfig,
      rows: 3,  // Always fixed
      cols: 5,  // Always fixed
    };
  }

  /**
   * Get specific configuration value
   */
  getValue<K extends keyof SlotConfiguration>(key: K): SlotConfiguration[K] {
    return this.config[key];
  }

  /**
   * Check if motion blur should be enabled
   */
  shouldUseMotionBlur(): boolean {
    if (!this.config.motionBlur) return false;

    // Check for prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return false;
    }

    return true;
  }

  /**
   * Get adjusted spin duration based on motion preferences
   */
  getAdjustedSpinDuration(): number {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        return Math.min(this.config.spinDuration, 500); // Reduce to max 500ms
      }
    }
    return this.config.spinDuration;
  }
}
