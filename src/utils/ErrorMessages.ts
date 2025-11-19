/**
 * Error message utility for consistent, actionable error reporting
 */

export class ErrorMessages {
  /**
   * Generate error for missing asset file
   */
  static missingAsset(path: string): string {
    const filename = path.split('/').pop();
    const folder = path.substring(0, path.lastIndexOf('/'));
    return `Missing required asset: ${path}. Check that ${filename} exists in ${folder}/.`;
  }

  /**
   * Generate error for invalid configuration field
   */
  static invalidConfig(field: string, constraint: string, received: any): string {
    return `Invalid configuration: ${field} must be ${constraint}. Received: ${JSON.stringify(received)}`;
  }

  /**
   * Generate error for invalid seed
   */
  static invalidSeed(reason: string): string {
    return `Invalid seed: ${reason}. Use a positive integer or omit for random behavior.`;
  }

  /**
   * Generate error for asset load failure
   */
  static assetLoadFailed(assetType: string, path: string, status?: string): string {
    const statusInfo = status ? ` ${status}` : '';
    return `Failed to load ${assetType}: ${path}.${statusInfo}`;
  }

  /**
   * Generate error for runtime state violations
   */
  static stateError(action: string, currentState: string, required: string): string {
    return `Cannot ${action}: engine is ${currentState}. Required state: ${required}.`;
  }

  /**
   * Generate error for insufficient credits
   */
  static insufficientCredits(current: number, required: number): string {
    return `Insufficient credits: have ${current}, need ${required}. Add more credits to continue playing.`;
  }

  /**
   * Generate error for theme validation
   */
  static invalidTheme(themePath: string, reason: string): string {
    return `Invalid theme folder "${themePath}": ${reason}. Ensure all required assets exist.`;
  }
}
