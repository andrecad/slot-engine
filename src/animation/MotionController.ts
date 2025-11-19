/**
 * MotionController - Manages motion blur effects during reel spins
 * 
 * Applies CSS filter for motion blur during constant spin phase.
 * Respects user's prefers-reduced-motion preference.
 */

export class MotionController {
  private prefersReducedMotion: boolean;
  private blurEnabled: boolean;

  constructor(enableBlur: boolean = true) {
    this.blurEnabled = enableBlur;
    this.prefersReducedMotion = this.detectReducedMotionPreference();
  }

  /**
   * Detect if user prefers reduced motion
   */
  private detectReducedMotionPreference(): boolean {
    if (typeof window === 'undefined') return false;
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    return mediaQuery.matches;
  }

  /**
   * Apply motion blur to an element
   * @param element The DOM element to apply blur to
   * @param intensity Blur intensity in pixels (default: 2)
   */
  applyBlur(element: HTMLElement, intensity: number = 2): void {
    if (!this.shouldApplyBlur()) return;

    element.style.filter = `blur(${intensity}px)`;
  }

  /**
   * Remove motion blur from an element
   * @param element The DOM element to remove blur from
   */
  removeBlur(element: HTMLElement): void {
    element.style.filter = '';
  }

  /**
   * Check if blur should be applied based on configuration and user preferences
   */
  shouldApplyBlur(): boolean {
    return this.blurEnabled && !this.prefersReducedMotion;
  }

  /**
   * Enable or disable blur
   */
  setBlurEnabled(enabled: boolean): void {
    this.blurEnabled = enabled;
  }

  /**
   * Check if blur is enabled
   */
  isBlurEnabled(): boolean {
    return this.blurEnabled;
  }

  /**
   * Check if user prefers reduced motion
   */
  getPrefersReducedMotion(): boolean {
    return this.prefersReducedMotion;
  }

  /**
   * Update the reduced motion preference (useful for testing or runtime changes)
   */
  updateReducedMotionPreference(): void {
    this.prefersReducedMotion = this.detectReducedMotionPreference();
  }
}
