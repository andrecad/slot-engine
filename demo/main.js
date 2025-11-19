import { SlotEngine } from '../dist/SlotEngine.js';

// Initialize the slot machine
const engine = new SlotEngine({
  assetsPath: 'http://localhost:3000/output/icons',
  symbolSet: {
    'CHERRY': 'icon_0_0.png',
    'LEMON': 'icon_0_1.png',
    'ORANGE': 'icon_0_2.png',
    'WATERMELON': 'icon_1_7.png',
    'BELL': 'icon_1_0.png',
    'BAR': 'icon_1_1.png',
    'DIAMOND': 'icon_1_2.png',
    'SEVEN': 'icon_1_7.png'
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
  
  // Send initial balance to parent window
  const state = engine.getState();
  window.top.postMessage({
    type: 'SLOT_BALANCE_UPDATE',
    balance: state.credits
  }, '*');
});

// Track net win/loss (positive = won, negative = lost)
let sessionNetValue = 0;
let lastSpinNetValue = 0;

// Listen to events
engine.on('spin-start', (data) => {
  console.log('Spin started:', data);
});

engine.on('reel-stop', (data) => {
  console.log('Reel stopped:', data.reelIndex, data.symbols);
});

engine.on('spin-complete', (data) => {
  console.log('Spin complete:', data.result);
  
  // Send spin result to parent window after animation completes
  // Use the value that was captured in credits-changed event
  window.top.postMessage({
    type: 'SLOT_SPIN_RESULT',
    spinNetValue: lastSpinNetValue,
    sessionNetValue: sessionNetValue
  }, '*');
});

engine.on('win', (data) => {
  console.log('WIN!', data.payout, 'credits');
});

engine.on('credits-changed', (data) => {
  console.log('Credits:', data.oldBalance, '->', data.newBalance);
  
  // Capture the actual change (this is the real net value)
  lastSpinNetValue = data.change;
  sessionNetValue += data.change;
  
  // Send updated balance to parent window
  window.top.postMessage({
    type: 'SLOT_BALANCE_UPDATE',
    balance: data.newBalance
  }, '*');
});

// Expose engine to window for manual testing
window.slotEngine = engine;
