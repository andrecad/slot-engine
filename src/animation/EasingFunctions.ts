/**
 * EasingFunctions - Cubic bezier easing functions for animations
 */

export type EasingFunction = (t: number) => number;

/**
 * Cubic bezier easing - acceleration (ease-in)
 * cubic-bezier(0.55, 0.085, 0.68, 0.53)
 */
export function easeInQuad(t: number): number {
  return t * t;
}

/**
 * Cubic bezier easing - deceleration with slight bounce (ease-out)
 * cubic-bezier(0.175, 0.885, 0.32, 1.05)
 */
export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/**
 * Linear easing (no easing)
 */
export function linear(t: number): number {
  return t;
}

/**
 * Parse CSS cubic-bezier string to easing function
 * Not fully implemented - returns closest match from predefined functions
 */
export function parseCubicBezier(cssString: string): EasingFunction {
  if (cssString === 'linear') return linear;
  if (cssString.includes('0.55, 0.085, 0.68, 0.53')) return easeInQuad;
  if (cssString.includes('0.175, 0.885, 0.32, 1.05')) return easeOutBack;
  
  // Default to linear for unknown bezier curves
  return linear;
}

/**
 * Interpolate between two values using an easing function
 */
export function interpolate(start: number, end: number, t: number, easing: EasingFunction = linear): number {
  const easedT = easing(Math.max(0, Math.min(1, t)));
  return start + (end - start) * easedT;
}
