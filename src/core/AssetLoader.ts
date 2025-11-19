/**
 * AssetLoader - preloads images and audio files for the slot engine
 */

import { SlotConfiguration, Symbol } from '../types.js';
import { ErrorMessages } from '../utils/ErrorMessages.js';

export interface AssetLoadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export type ProgressCallback = (progress: AssetLoadProgress) => void;

export class AssetLoader {
  private config: SlotConfiguration;
  private symbols: Map<string, Symbol> = new Map();
  private progressCallback?: ProgressCallback;

  constructor(config: SlotConfiguration) {
    this.config = config;
  }

  /**
   * Set progress callback for loading updates
   */
  onProgress(callback: ProgressCallback): void {
    this.progressCallback = callback;
  }

  /**
   * Preload all assets (images and audio)
   * @returns Promise that resolves when all assets are loaded
   */
  async preload(): Promise<void> {
    // Validate theme folder structure before loading
    await this.validateThemeFolderStructure();

    const symbolIds = Object.keys(this.config.symbolSet);
    const total = symbolIds.length;
    let loaded = 0;

    // Report initial progress
    this.reportProgress(loaded, total);

    // Load all symbol images
    const loadPromises = symbolIds.map(async (symbolId) => {
      const filename = this.config.symbolSet[symbolId];
      const path = `${this.config.assetsPath}/${filename}`;

      try {
        const imageElement = await this.loadImage(path);
        
        this.symbols.set(symbolId, {
          id: symbolId,
          filename,
          weight: 1, // Will be set later by ReelStripGenerator
          imageElement
        });

        loaded++;
        this.reportProgress(loaded, total);
      } catch (error) {
        throw new Error(ErrorMessages.assetLoadFailed('image', path, (error as Error).message));
      }
    });

    await Promise.all(loadPromises);
  }

  /**
   * Load a single image
   */
  private loadImage(path: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image at ${path}`));
      
      img.src = path;
    });
  }

  /**
   * Report loading progress
   */
  private reportProgress(loaded: number, total: number): void {
    if (this.progressCallback) {
      this.progressCallback({
        loaded,
        total,
        percentage: Math.round((loaded / total) * 100)
      });
    }
  }

  /**
   * Get loaded symbol by ID
   */
  getSymbol(symbolId: string): Symbol | undefined {
    return this.symbols.get(symbolId);
  }

  /**
   * Get all loaded symbols
   */
  getAllSymbols(): Symbol[] {
    return Array.from(this.symbols.values());
  }

  /**
   * Validate theme folder structure before loading
   */
  private async validateThemeFolderStructure(): Promise<void> {
    const symbolIds = Object.keys(this.config.symbolSet);
    const missingAssets: string[] = [];

    // Check each required symbol asset
    for (const symbolId of symbolIds) {
      const filename = this.config.symbolSet[symbolId];
      const path = `${this.config.assetsPath}/${filename}`;

      try {
        // Validate asset exists by fetching it
        const response = await fetch(path, { method: 'HEAD' });
        if (!response.ok) {
          missingAssets.push(path);
        }
      } catch (error) {
        missingAssets.push(path);
      }
    }

    if (missingAssets.length > 0) {
      const assetList = missingAssets.map(p => `  - ${p}`).join('\n');
      throw new Error(
        `Theme validation failed. Missing ${missingAssets.length} required asset(s):\n${assetList}\n\n` +
        `Check that all symbol files exist in the theme folder: ${this.config.assetsPath}/`
      );
    }
  }

  /**
   * Validate that all required assets exist (for theme switching)
   */
  async validateAssets(): Promise<void> {
    await this.validateThemeFolderStructure();
  }

  /**
   * Clear all loaded assets from memory
   */
  clear(): void {
    this.symbols.clear();
  }

  /**
   * Update configuration for theme switching
   */
  updateConfig(config: SlotConfiguration): void {
    this.config = config;
  }
}
