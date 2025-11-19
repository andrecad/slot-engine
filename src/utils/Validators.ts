/**
 * Configuration validation utility
 * Validates slot engine configuration for correctness and safety
 */

import { SlotConfiguration } from '../types.js';
import { ErrorMessages } from './ErrorMessages.js';

export class Validators {
  /**
   * Validate complete slot configuration
   * @throws Error if configuration is invalid
   */
  static validateConfig(config: Partial<SlotConfiguration>): void {
    // Required fields
    if (!config.assetsPath) {
      throw new Error(ErrorMessages.invalidConfig('assetsPath', 'a non-empty string', config.assetsPath));
    }

    if (!config.symbolSet || Object.keys(config.symbolSet).length === 0) {
      throw new Error(ErrorMessages.invalidConfig('symbolSet', 'a non-empty object', config.symbolSet));
    }

    // Numeric constraints
    if (config.rows !== undefined && config.rows !== 3) {
      throw new Error(ErrorMessages.invalidConfig('rows', 'exactly 3', config.rows));
    }

    if (config.cols !== undefined && config.cols !== 5) {
      throw new Error(ErrorMessages.invalidConfig('cols', 'exactly 5', config.cols));
    }

    if (config.winningChance !== undefined) {
      if (typeof config.winningChance !== 'number' || config.winningChance < 0 || config.winningChance > 1) {
        throw new Error(ErrorMessages.invalidConfig('winningChance', 'between 0 and 1', config.winningChance));
      }
    }

    if (config.betAmount !== undefined) {
      if (typeof config.betAmount !== 'number' || config.betAmount <= 0) {
        throw new Error(ErrorMessages.invalidConfig('betAmount', 'a positive number', config.betAmount));
      }
    }

    if (config.initialCredits !== undefined) {
      if (typeof config.initialCredits !== 'number' || config.initialCredits < 0) {
        throw new Error(ErrorMessages.invalidConfig('initialCredits', 'a non-negative number', config.initialCredits));
      }
    }

    if (config.spinDuration !== undefined) {
      if (typeof config.spinDuration !== 'number' || config.spinDuration <= 0) {
        throw new Error(ErrorMessages.invalidConfig('spinDuration', 'a positive number', config.spinDuration));
      }
    }

    if (config.reelStopDelay !== undefined) {
      if (typeof config.reelStopDelay !== 'number' || config.reelStopDelay < 0) {
        throw new Error(ErrorMessages.invalidConfig('reelStopDelay', 'a non-negative number', config.reelStopDelay));
      }
    }

    // Seed validation
    if (config.seed !== undefined) {
      if (typeof config.seed !== 'number' || !Number.isInteger(config.seed) || config.seed < 0) {
        throw new Error(ErrorMessages.invalidSeed('seed must be a non-negative integer'));
      }
    }

    // Paylines validation
    if (config.paylines !== undefined) {
      if (!Array.isArray(config.paylines) || config.paylines.length === 0) {
        throw new Error(ErrorMessages.invalidConfig('paylines', 'a non-empty array', config.paylines));
      }
    }

    // Payout table validation
    if (config.payoutTable !== undefined) {
      if (typeof config.payoutTable !== 'object' || Object.keys(config.payoutTable).length === 0) {
        throw new Error(ErrorMessages.invalidConfig('payoutTable', 'a non-empty object', config.payoutTable));
      }
    }

    // Reel strips validation (if provided)
    if (config.reelStrips !== undefined) {
      if (!Array.isArray(config.reelStrips) || config.reelStrips.length !== 5) {
        throw new Error(ErrorMessages.invalidConfig('reelStrips', 'an array of 5 arrays', config.reelStrips));
      }
      for (let i = 0; i < config.reelStrips.length; i++) {
        if (!Array.isArray(config.reelStrips[i]) || config.reelStrips[i].length === 0) {
          throw new Error(ErrorMessages.invalidConfig(`reelStrips[${i}]`, 'a non-empty array', config.reelStrips[i]));
        }
      }
    }
  }

  /**
   * Validate partial configuration for runtime updates
   * @throws Error if configuration update is invalid
   */
  static validatePartialConfig(partialConfig: Partial<SlotConfiguration>): void {
    // Only validate fields that are present
    const tempConfig: Partial<SlotConfiguration> = {};
    
    if (partialConfig.assetsPath !== undefined) tempConfig.assetsPath = partialConfig.assetsPath;
    if (partialConfig.symbolSet !== undefined) tempConfig.symbolSet = partialConfig.symbolSet;
    if (partialConfig.rows !== undefined) tempConfig.rows = partialConfig.rows;
    if (partialConfig.cols !== undefined) tempConfig.cols = partialConfig.cols;
    if (partialConfig.winningChance !== undefined) tempConfig.winningChance = partialConfig.winningChance;
    if (partialConfig.betAmount !== undefined) tempConfig.betAmount = partialConfig.betAmount;
    if (partialConfig.initialCredits !== undefined) tempConfig.initialCredits = partialConfig.initialCredits;
    if (partialConfig.spinDuration !== undefined) tempConfig.spinDuration = partialConfig.spinDuration;
    if (partialConfig.reelStopDelay !== undefined) tempConfig.reelStopDelay = partialConfig.reelStopDelay;
    if (partialConfig.seed !== undefined) tempConfig.seed = partialConfig.seed;
    if (partialConfig.paylines !== undefined) tempConfig.paylines = partialConfig.paylines;
    if (partialConfig.payoutTable !== undefined) tempConfig.payoutTable = partialConfig.payoutTable;
    if (partialConfig.reelStrips !== undefined) tempConfig.reelStrips = partialConfig.reelStrips;

    // Use existing validation logic but don't require all fields
    if (Object.keys(tempConfig).length > 0) {
      // Skip required field checks for partial updates
      if (tempConfig.rows !== undefined && tempConfig.rows !== 3) {
        throw new Error(ErrorMessages.invalidConfig('rows', 'exactly 3', tempConfig.rows));
      }

      if (tempConfig.cols !== undefined && tempConfig.cols !== 5) {
        throw new Error(ErrorMessages.invalidConfig('cols', 'exactly 5', tempConfig.cols));
      }

      if (tempConfig.winningChance !== undefined) {
        if (typeof tempConfig.winningChance !== 'number' || tempConfig.winningChance < 0 || tempConfig.winningChance > 1) {
          throw new Error(ErrorMessages.invalidConfig('winningChance', 'between 0 and 1', tempConfig.winningChance));
        }
      }

      if (tempConfig.betAmount !== undefined) {
        if (typeof tempConfig.betAmount !== 'number' || tempConfig.betAmount <= 0) {
          throw new Error(ErrorMessages.invalidConfig('betAmount', 'a positive number', tempConfig.betAmount));
        }
      }

      if (tempConfig.seed !== undefined) {
        if (typeof tempConfig.seed !== 'number' || !Number.isInteger(tempConfig.seed) || tempConfig.seed < 0) {
          throw new Error(ErrorMessages.invalidSeed('seed must be a non-negative integer'));
        }
      }
    }
  }
}
