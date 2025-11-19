/**
 * AudioAssets - Entity for audio file configuration
 * 
 * Maps audio event types to their file paths. Used by AudioManager
 * for preloading and playback.
 */

export interface AudioAssets {
  backgroundMusic?: string;
  spinSound?: string;
  reelStopSound?: string;
  winSound?: string;
  bigWinSound?: string;
}

/**
 * Creates a default AudioAssets configuration
 */
export function createDefaultAudioAssets(assetsPath: string): AudioAssets {
  return {
    backgroundMusic: `${assetsPath}/audio/background-music.mp3`,
    spinSound: `${assetsPath}/audio/spin.mp3`,
    reelStopSound: `${assetsPath}/audio/reel-stop.mp3`,
    winSound: `${assetsPath}/audio/win.mp3`,
    bigWinSound: `${assetsPath}/audio/big-win.mp3`,
  };
}

/**
 * Validates that required audio assets are defined
 */
export function validateAudioAssets(assets: AudioAssets): string[] {
  const errors: string[] = [];
  
  if (!assets.spinSound) {
    errors.push('AudioAssets.spinSound is required');
  }
  
  if (!assets.reelStopSound) {
    errors.push('AudioAssets.reelStopSound is required');
  }
  
  if (!assets.winSound) {
    errors.push('AudioAssets.winSound is required');
  }
  
  return errors;
}
