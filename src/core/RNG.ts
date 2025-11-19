/**
 * Random Number Generator with Seeded and Crypto-based modes
 * 
 * **Purpose:**
 * Provides deterministic and random RNG modes for slot machine gameplay.
 * 
 * **Seeded Mode (Deterministic):**
 * - Uses Mulberry32 algorithm for fast, high-quality pseudo-random numbers
 * - Same seed produces identical sequence across sessions and browsers
 * - Perfect for testing, debugging, replay scenarios, and demo recordings
 * - Example: seed=12345 always produces the same spin results
 * 
 * **Unseeded Mode (Random):**
 * - Uses Web Crypto API (window.crypto.getRandomValues)
 * - Cryptographically secure randomness
 * - Different results every time (non-reproducible)
 * - Suitable for production gameplay
 * 
 * **Usage Guarantees:**
 * - All slot machine randomness uses the configured RNG instance
 * - Win/loss determination uses RNG
 * - Reel position selection uses RNG
 * - Symbol placement for wins uses RNG
 * 
 * **Thread Safety:**
 * Not thread-safe. Use one RNG instance per SlotEngine instance.
 */

export class SeededRandom {
  private seed: number;

  /**
   * Create a seeded random number generator
   * @param seed - 32-bit unsigned integer seed value
   */
  constructor(seed: number) {
    this.seed = seed >>> 0; // Ensure 32-bit unsigned integer
  }

  /**
   * Generate next random number using Mulberry32 algorithm
   * @returns Random float in range [0, 1)
   */
  next(): number {
    // Mulberry32 algorithm - fast, simple, high-quality PRNG
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

/**
 * Crypto-based random number generator for unseeded mode
 * Uses Web Crypto API for cryptographically secure randomness
 */
export class CryptoRandom {
  /**
   * Generate cryptographically secure random number
   * @returns Random float in range [0, 1)
   */
  next(): number {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] / 4294967296;
  }
}

/**
 * RNG interface for polymorphic usage
 */
export interface IRNG {
  next(): number;
}

/**
 * Create an RNG instance based on seed presence
 * 
 * **Factory Pattern:**
 * Automatically selects appropriate RNG implementation based on configuration.
 * 
 * **Deterministic Mode (seed provided):**
 * ```typescript
 * const rng = createRNG(12345);
 * rng.next(); // Always returns 0.6011037558689713 (first value for seed 12345)
 * rng.next(); // Always returns 0.9218937135394663 (second value for seed 12345)
 * ```
 * 
 * **Random Mode (seed omitted):**
 * ```typescript
 * const rng = createRNG(); // or createRNG(undefined)
 * rng.next(); // Returns different random value each call (cryptographically secure)
 * ```
 * 
 * **Testing Scenarios:**
 * - Unit tests: Use fixed seed for reproducible assertions
 * - Integration tests: Use known seed sequences to verify game logic
 * - Production: Omit seed for genuine randomness
 * - Demo/replay: Use specific seed to demonstrate features
 * 
 * @param seed - Optional seed for deterministic behavior (positive integer)
 * @returns Seeded or crypto-based RNG instance implementing IRNG interface
 */
export function createRNG(seed?: number): IRNG {
  if (seed !== undefined) {
    return new SeededRandom(seed);
  }
  return new CryptoRandom();
}
