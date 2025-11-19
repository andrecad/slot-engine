/**
 * AudioManager - Manages audio preloading and playback
 * 
 * Handles audio asset loading, caching, and playback with volume control.
 * Supports background music loops and one-shot sound effects.
 */

import { AudioAssets } from '../models/AudioAssets.js';

export interface AudioManagerOptions {
  volume?: number;
  muted?: boolean;
}

export class AudioManager {
  private audioAssets: AudioAssets;
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private backgroundMusic: HTMLAudioElement | null = null;
  private volume: number;
  private muted: boolean;

  constructor(audioAssets: AudioAssets, options: AudioManagerOptions = {}) {
    this.audioAssets = audioAssets;
    this.volume = options.volume ?? 0.7;
    this.muted = options.muted ?? false;
  }

  /**
   * Preload all audio assets
   * @param onProgress Optional callback for loading progress (loaded, total)
   * @returns Promise that resolves when all assets are loaded
   */
  async preload(onProgress?: (loaded: number, total: number) => void): Promise<void> {
    const assets = Object.entries(this.audioAssets).filter(([_, path]) => path !== undefined);
    const total = assets.length;
    let loaded = 0;

    const loadPromises = assets.map(async ([key, path]) => {
      if (!path) return;

      try {
        const audio = new Audio(path);
        audio.volume = this.volume;
        audio.muted = this.muted;

        // Preload the audio data
        await new Promise<void>((resolve, reject) => {
          audio.addEventListener('canplaythrough', () => resolve(), { once: true });
          audio.addEventListener('error', (e) => reject(e), { once: true });
          audio.load();
        });

        this.audioCache.set(key, audio);
        loaded++;
        if (onProgress) {
          onProgress(loaded, total);
        }
      } catch (error) {
        console.warn(`Failed to load audio: ${path}`, error);
        loaded++;
        if (onProgress) {
          onProgress(loaded, total);
        }
      }
    });

    await Promise.all(loadPromises);
  }

  /**
   * Play a sound effect
   * @param key The audio asset key (e.g., 'spinSound', 'winSound')
   */
  playSound(key: keyof AudioAssets): void {
    if (this.muted) return;

    const audio = this.audioCache.get(key);
    if (!audio) {
      console.warn(`Audio not found: ${key}`);
      return;
    }

    // Clone the audio element to allow overlapping sounds
    const clone = audio.cloneNode(true) as HTMLAudioElement;
    clone.volume = this.volume;
    clone.play().catch((error) => {
      console.warn(`Failed to play audio: ${key}`, error);
    });
  }

  /**
   * Play background music in a loop
   */
  playBackgroundMusic(): void {
    if (this.muted || !this.audioAssets.backgroundMusic) return;

    const audio = this.audioCache.get('backgroundMusic');
    if (!audio) {
      console.warn('Background music not found');
      return;
    }

    this.backgroundMusic = audio;
    this.backgroundMusic.loop = true;
    this.backgroundMusic.volume = this.volume * 0.5; // Lower volume for background
    this.backgroundMusic.play().catch((error) => {
      console.warn('Failed to play background music', error);
    });
  }

  /**
   * Stop background music
   */
  stopBackgroundMusic(): void {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
    }
  }

  /**
   * Set volume for all audio
   * @param volume Volume level (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    
    // Update all cached audio elements
    this.audioCache.forEach((audio) => {
      audio.volume = this.volume;
    });

    // Update background music if playing
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = this.volume * 0.5;
    }
  }

  /**
   * Mute or unmute all audio
   */
  setMuted(muted: boolean): void {
    this.muted = muted;
    
    // Update all cached audio elements
    this.audioCache.forEach((audio) => {
      audio.muted = muted;
    });

    // Update background music if playing
    if (this.backgroundMusic) {
      this.backgroundMusic.muted = muted;
    }
  }

  /**
   * Check if audio is muted
   */
  isMuted(): boolean {
    return this.muted;
  }

  /**
   * Get current volume level
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stopBackgroundMusic();
    this.audioCache.clear();
    this.backgroundMusic = null;
  }
}
