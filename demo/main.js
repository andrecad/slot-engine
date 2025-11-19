import { SlotEngine } from '../dist/SlotEngine.js';

// Initialize the slot machine
const engine = new SlotEngine({
  assetsPath: 'http://localhost:3000/output/icons',
  symbolSet: {
    'CHERRY': 'icon_0_0.png',
    'LEMON': 'icon_0_1.png',
    'ORANGE': 'icon_0_2.png',
    'WATERMELON': 'icon_0_3.png',
    'BELL': 'icon_1_0.png',
    'BAR': 'icon_1_1.png',
    'DIAMOND': 'icon_1_2.png',
    'SEVEN': 'icon_1_3.png'
  },
  initialCredits: 1000,
  betAmount: 10,
  winningChance: 0.50,
  spinDuration: 2000,
  reelStopDelay: 200,
  container: '#game-container',
  seed: 42,  // Deterministic for testing
  enableAudio: false,  // Disabled by default (browser autoplay restrictions)
  motionBlur: true
});

// Wait for engine to be ready
engine.ready().then(() => {
  console.log('Slot engine ready!');
  console.log('Initial state:', engine.getState());
});

// Listen to events
engine.on('spin-start', (data) => {
  console.log('Spin started:', data);
});

engine.on('reel-stop', (data) => {
  console.log('Reel stopped:', data.reelIndex, data.symbols);
});

engine.on('spin-complete', (data) => {
  console.log('Spin complete:', data.result);
});

engine.on('win', (data) => {
  console.log('WIN!', data.payout, 'credits');
});

engine.on('credits-changed', (data) => {
  console.log('Credits:', data.oldBalance, '->', data.newBalance);
});

// Expose engine to window for manual testing
window.slotEngine = engine;
