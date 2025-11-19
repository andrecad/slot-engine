/**
 * ReelAnimator - handles reel spin animation with three phases
 * Phase 1: Acceleration (ease-in)
 * Phase 2: Constant spin (linear)
 * Phase 3: Deceleration (ease-out with bounce)
 */

import { Reel } from '../models/Reel.js';
import { DOMRenderer } from '../ui/DOMRenderer.js';
import { easeInQuad, easeOutBack, interpolate } from './EasingFunctions.js';

export interface AnimationConfig {
  spinDuration: number;
  reelStopDelay: number;
  useMotionBlur: boolean;
}

export class ReelAnimator {
  private reels: Reel[];
  private renderer: DOMRenderer;
  private config: AnimationConfig;
  private animationId: number | null = null;
  private startTime: number = 0;
  private lastFrameTime: number = 0;
  private isAnimating: boolean = false;

  // Physics properties for smooth animation
  private reelVelocities: number[] = [];
  private reelStartOffsets: number[] = [];

  // Animation phase durations (increased for smoother feel)
  private readonly ACCEL_DURATION = 400;  // ms
  private readonly DECEL_DURATION = 800;  // ms per reel
  private readonly MAX_SPEED = 30;  // symbols per second
  private readonly MIN_SPEED = 2;   // minimum speed during constant phase

  constructor(reels: Reel[], renderer: DOMRenderer, config: AnimationConfig) {
    this.reels = reels;
    this.renderer = renderer;
    this.config = config;
  }

  /**
   * Start spin animation
   * @param targetPositions - Final reel positions
   * @param onReelStop - Callback when each reel stops
   * @param onComplete - Callback when all reels stop
   */
  async animate(
    targetPositions: number[],
    onReelStop?: (reelIndex: number) => void,
    onComplete?: () => void
  ): Promise<void> {
    return new Promise((resolve) => {
      this.isAnimating = true;
      this.startTime = performance.now();
      this.lastFrameTime = this.startTime;

      // Initialize physics state for each reel
      this.reelVelocities = [];
      this.reelStartOffsets = [];

      // Set target positions for each reel
      this.reels.forEach((reel, index) => {
        reel.setTarget(targetPositions[index]);
        reel.setState('accelerating');
        this.reelVelocities[index] = 0;
        this.reelStartOffsets[index] = reel.currentOffset;
      });

      // Start animation loop
      this.animationId = requestAnimationFrame((time) =>
        this.animationLoop(time, onReelStop, () => {
          if (onComplete) onComplete();
          resolve();
        })
      );
    });
  }

  /**
   * Main animation loop
   */
  private animationLoop(
    currentTime: number,
    onReelStop?: (reelIndex: number) => void,
    onComplete?: () => void
  ): void {
    const elapsed = currentTime - this.startTime;
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    // Cap delta time to prevent huge jumps
    const cappedDelta = Math.min(deltaTime, 50);

    // Update each reel
    let allStopped = true;
    for (let i = 0; i < this.reels.length; i++) {
      const reel = this.reels[i];
      if (reel.state !== 'stopped') {
        this.updateReel(reel, elapsed, i, cappedDelta, onReelStop);
        allStopped = false;
      }
    }

    // Continue animation or complete
    if (allStopped) {
      this.isAnimating = false;
      if (onComplete) onComplete();
    } else {
      this.animationId = requestAnimationFrame((time) =>
        this.animationLoop(time, onReelStop, onComplete)
      );
    }
  }

  /**
   * Update single reel animation state
   */
  private updateReel(reel: Reel, elapsed: number, reelIndex: number, deltaTime: number, onReelStop?: (reelIndex: number) => void): void {
    const reelStopTime = this.config.spinDuration + (reelIndex * this.config.reelStopDelay);
    const decelStartTime = reelStopTime - this.DECEL_DURATION;

    if (elapsed < this.ACCEL_DURATION) {
      // Phase 1: Acceleration
      this.updateAcceleration(reel, elapsed, reelIndex, deltaTime);
    } else if (elapsed < decelStartTime) {
      // Phase 2: Constant spin
      this.updateConstantSpin(reel, reelIndex, deltaTime);
    } else if (elapsed < reelStopTime) {
      // Phase 3: Deceleration
      this.updateDeceleration(reel, elapsed, decelStartTime, reelStopTime, reelIndex, deltaTime);
    } else {
      // Reel stopped - only trigger callback once when transitioning to stopped state
      if (reel.state !== 'stopped') {
        this.stopReel(reel);
        // Call the callback when reel stops (only once)
        if (onReelStop) {
          onReelStop(reelIndex);
        }
      }
    }

    // Update visual position
    this.renderer.updateReelPosition(reel, reel.currentOffset);
  }

  /**
   * Acceleration phase - smooth ease in from 0 to full speed
   */
  private updateAcceleration(reel: Reel, elapsed: number, reelIndex: number, deltaTime: number): void {
    if (reel.state !== 'accelerating') {
      reel.setState('accelerating');
    }

    const progress = Math.min(1, elapsed / this.ACCEL_DURATION);
    
    // Smooth cubic easing for acceleration
    const easedProgress = progress * progress * (3 - 2 * progress); // smoothstep
    
    // Calculate target velocity (symbols per second)
    const targetVelocity = this.MAX_SPEED;
    this.reelVelocities[reelIndex] = targetVelocity * easedProgress;
    
    // Update position based on velocity and delta time
    const displacement = this.reelVelocities[reelIndex] * (deltaTime / 1000);
    reel.updateOffset(reel.currentOffset + displacement);
  }

  /**
   * Constant spin phase - maintain smooth velocity with slight variation
   */
  private updateConstantSpin(reel: Reel, reelIndex: number, deltaTime: number): void {
    if (reel.state !== 'spinning') {
      reel.setState('spinning');
      
      // Add motion blur during constant spin
      if (this.config.useMotionBlur) {
        this.renderer.addMotionBlur(reel);
      }
    }

    // Maintain constant velocity with tiny variation for organic feel
    const variation = Math.sin(Date.now() / 100) * 0.5;
    this.reelVelocities[reelIndex] = this.MAX_SPEED + variation;
    
    // Update position based on velocity and delta time
    const displacement = this.reelVelocities[reelIndex] * (deltaTime / 1000);
    reel.updateOffset(reel.currentOffset + displacement);
  }

  /**
   * Deceleration phase - smooth ease out with proper inertia
   */
  private updateDeceleration(
    reel: Reel,
    elapsed: number,
    decelStartTime: number,
    _stopTime: number,
    reelIndex: number,
    _deltaTime: number
  ): void {
    if (reel.state !== 'decelerating') {
      reel.setState('decelerating');
      
      // Remove motion blur when decelerating
      this.renderer.removeMotionBlur(reel);
      
      // Calculate where we need to be at the end
      const currentOffset = reel.currentOffset;
      const targetOffset = reel.targetOffset;
      
      // Find the nearest target position ahead of current position
      const stripLength = reel.strip.length;
      let adjustedTarget = targetOffset;
      
      // Make sure we're targeting a position ahead of current
      while (adjustedTarget < currentOffset) {
        adjustedTarget += stripLength;
      }
      
      // Add extra rotations for more dramatic deceleration
      adjustedTarget += stripLength * 2;
      
      // Store the deceleration start offset for smooth interpolation
      if (!this.reelStartOffsets[reelIndex]) {
        this.reelStartOffsets[reelIndex] = currentOffset;
      }
    }

    const decelProgress = Math.min(1, (elapsed - decelStartTime) / this.DECEL_DURATION);
    
    // Smooth deceleration curve (ease-out cubic with slight overshoot)
    const t = decelProgress;
    const easedProgress = 1 - Math.pow(1 - t, 3);
    
    // Calculate velocity based on deceleration curve
    const startVelocity = this.MAX_SPEED;
    const endVelocity = 0;
    
    // Derivative of ease-out cubic for velocity
    const velocityFactor = 3 * Math.pow(1 - t, 2);
    this.reelVelocities[reelIndex] = startVelocity * velocityFactor;
    
    // Calculate target position with extra rotations
    const currentOffset = reel.currentOffset;
    const targetOffset = reel.targetOffset;
    const stripLength = reel.strip.length;
    
    let adjustedTarget = targetOffset;
    while (adjustedTarget < currentOffset) {
      adjustedTarget += stripLength;
    }
    adjustedTarget += stripLength * 2;
    
    // Interpolate position
    const startOffset = this.reelStartOffsets[reelIndex];
    const newOffset = interpolate(startOffset, adjustedTarget, easedProgress, (t) => {
      // Custom easing with slight bounce at end
      if (t < 0.95) {
        return t * t * t; // cubic ease-out
      } else {
        // Slight bounce
        const bounce = (t - 0.95) / 0.05;
        return 0.95 * 0.95 * 0.95 + 0.05 * (1 - Math.pow(1 - bounce, 2) * 0.1);
      }
    });
    
    reel.updateOffset(newOffset);
  }

  /**
   * Stop a reel
   */
  private stopReel(reel: Reel): void {
    reel.setState('stopped');
    // Note: Don't call reset() here as it would change state back to 'idle'
    // Just snap the position directly
    reel.currentOffset = reel.targetOffset;
    this.renderer.removeMotionBlur(reel);
    
    // Snap to exact target position
    this.renderer.updateReelPosition(reel, reel.targetOffset);
  }

  /**
   * Stop animation immediately
   */
  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.isAnimating = false;

    // Stop all reels
    this.reels.forEach(reel => {
      this.stopReel(reel);
    });
  }

  /**
   * Check if animation is running
   */
  isRunning(): boolean {
    return this.isAnimating;
  }
}
