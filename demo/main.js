import { SlotEngine } from '../dist/SlotEngine.js';

// Initialize the slot machine
const engine = new SlotEngine({
  assetsPath: 'assets/classic',
  symbolSet: {
    'CHERRY': 'symbol-CHERRY.png',
    'LEMON': 'symbol-LEMON.png',
    'ORANGE': 'symbol-ORANGE.png',
    'WATERMELON': 'symbol-WATERMELON.png',
    'BELL': 'symbol-BELL.png',
    'BAR': 'symbol-BAR.png',
    'DIAMOND': 'symbol-DIAMOND.png',
    'SEVEN': 'symbol-SEVEN.png'
  },
  initialCredits: 1000,
  betAmount: 10,
  winningChance: 0.25,
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

// Add simulation test button
const simulateBtn = document.createElement('button');
simulateBtn.textContent = 'Run Simulation (10,000 spins)';
simulateBtn.style.cssText = 'padding: 10px 20px; margin: 10px; font-size: 14px; cursor: pointer;';
simulateBtn.onclick = async () => {
  console.log('Starting simulation...');
  const startTime = Date.now();
  
  await engine.ready();
  const result = engine.simulate(10000);
  
  console.log('=== Simulation Results ===');
  console.log(`Total Spins: ${result.totalSpins}`);
  console.log(`Total Wins: ${result.totalWins}`);
  console.log(`Win Rate: ${result.winRate.toFixed(2)}%`);
  console.log(`Total Wagered: ${result.totalWagered} credits`);
  console.log(`Total Paid Out: ${result.totalPaidOut} credits`);
  console.log(`RTP: ${result.rtp.toFixed(2)}%`);
  console.log(`Largest Win: ${result.largestWin} credits`);
  console.log(`Duration: ${result.duration}ms`);
  console.log(`Payout Distribution:`, result.payoutDistribution);
  
  alert(`Simulation Complete!\nWin Rate: ${result.winRate.toFixed(2)}%\nRTP: ${result.rtp.toFixed(2)}%\nDuration: ${result.duration}ms`);
};
document.body.insertBefore(simulateBtn, document.getElementById('game-container'));

// Add self-test button
const selfTestBtn = document.createElement('button');
selfTestBtn.textContent = 'Run Self-Test';
selfTestBtn.style.cssText = 'padding: 10px 20px; margin: 10px; font-size: 14px; cursor: pointer;';
selfTestBtn.onclick = async () => {
  console.log('Running self-test...');
  
  await engine.ready();
  const result = engine.selfTest();
  
  console.log('=== Self-Test Results ===');
  console.log(`Passed: ${result.passed}`);
  console.log(`Duration: ${result.duration}ms`);
  
  if (result.failures.length > 0) {
    console.error('Failures:', result.failures);
  }
  
  if (result.warnings.length > 0) {
    console.warn('Warnings:', result.warnings);
  }
  
  const status = result.passed ? '✅ PASSED' : '❌ FAILED';
  alert(`Self-Test ${status}\nDuration: ${result.duration}ms\nFailures: ${result.failures.length}\nWarnings: ${result.warnings.length}`);
};
document.body.insertBefore(selfTestBtn, document.getElementById('game-container'));
