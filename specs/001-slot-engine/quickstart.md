# Quickstart Guide: Slot Machine Engine

**Feature**: Slot Machine Engine (001-slot-engine)  
**Version**: 1.0.0  
**Date**: 2025-11-19

## Overview

This guide shows you how to integrate the SlotEngine into your HTML page in under 5 minutes.

## Prerequisites

- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Asset folder with required files (symbols, backgrounds, audio)
- Basic HTML/JavaScript knowledge

## Quick Start (3 Steps)

### Step 1: Prepare Assets

Create an assets folder with the following structure:

```
assets/classic/
├── bg.png                    # Background (1920×1080 recommended)
├── symbol-CHERRY.png         # Symbol images (150×150 recommended)
├── symbol-BAR.png
├── symbol-SEVEN.png
├── symbol-DIAMOND.png
├── symbol-BELL.png
├── symbol-WATERMELON.png
├── symbol-ORANGE.png
├── symbol-LEMON.png
├── spin-button.png           # Spin button (200×200)
├── music.mp3                 # Background music (loopable)
├── spin.mp3                  # Spin start sound
├── stop.wav                  # Reel stop sound
└── win.mp3                   # Win celebration
```

---

### Step 2: Create HTML Page

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Slot Machine</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: Arial, sans-serif;
      background: #1a1a2e;
      color: white;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }

    #slot-container {
      background: #16213e;
      border-radius: 10px;
      padding: 30px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }

    #controls {
      text-align: center;
      margin-top: 20px;
    }

    #credits-display, #win-display {
      font-size: 24px;
      margin: 10px 0;
      padding: 10px;
      background: #0f3460;
      border-radius: 5px;
    }

    #spin-button {
      font-size: 20px;
      padding: 15px 40px;
      margin-top: 20px;
      background: #e94560;
      color: white;
      border: none;
      border-radius: 50px;
      cursor: pointer;
      transition: all 0.3s;
    }

    #spin-button:hover:not(:disabled) {
      background: #ff6584;
      transform: scale(1.05);
    }

    #spin-button:disabled {
      background: #666;
      cursor: not-allowed;
      opacity: 0.5;
    }

    #loading {
      text-align: center;
      font-size: 18px;
    }
  </style>
</head>
<body>
  <div id="slot-container">
    <div id="loading">Loading assets...</div>
    <div id="controls" style="display: none;">
      <div id="credits-display">Credits: <span id="credits">1000</span></div>
      <div id="win-display">Last Win: <span id="last-win">0</span></div>
      <button id="spin-button"></button>
    </div>
  </div>

  <script type="module" src="main.js"></script>
</body>
</html>
```

---

### Step 3: Initialize Engine

Create `main.js`:

```javascript
import { SlotEngine } from './SlotEngine.js';

// Configuration
const config = {
  container: '#slot-container',
  assetsPath: 'assets/classic',
  rows: 3,
  cols: 5,
  
  // Symbol definitions
  symbolSet: {
    CHERRY: 'symbol-CHERRY.png',
    LEMON: 'symbol-LEMON.png',
    ORANGE: 'symbol-ORANGE.png',
    WATERMELON: 'symbol-WATERMELON.png',
    BELL: 'symbol-BELL.png',
    BAR: 'symbol-BAR.png',
    DIAMOND: 'symbol-DIAMOND.png',
    SEVEN: 'symbol-SEVEN.png'
  },
  
  // Paylines (5 standard lines)
  paylines: [
    [[1,0], [1,1], [1,2], [1,3], [1,4]], // Middle
    [[0,0], [0,1], [0,2], [0,3], [0,4]], // Top
    [[2,0], [2,1], [2,2], [2,3], [2,4]], // Bottom
    [[0,0], [1,1], [2,2], [1,3], [0,4]], // V
    [[2,0], [1,1], [0,2], [1,3], [2,4]]  // Inverted V
  ],
  
  // Payout table
  payoutTable: {
    'SEVEN-SEVEN-SEVEN-SEVEN-SEVEN': 1000,
    'DIAMOND-DIAMOND-DIAMOND-DIAMOND-DIAMOND': 500,
    'BAR-BAR-BAR-BAR-BAR': 250,
    'BELL-BELL-BELL-BELL-BELL': 100,
    'DIAMOND-DIAMOND-DIAMOND-*-*': 100,
    'BAR-BAR-BAR-*-*': 50,
    'BELL-BELL-BELL-*-*': 25,
    'WATERMELON-WATERMELON-WATERMELON-*-*': 15,
    'ORANGE-ORANGE-ORANGE-*-*': 10,
    'LEMON-LEMON-LEMON-*-*': 8,
    'CHERRY-CHERRY-CHERRY-*-*': 5,
    'CHERRY-CHERRY-*-*-*': 2
  },
  
  // Animation settings
  spinDuration: 2000,
  reelStopDelay: 300,
  easingAccelerate: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
  easingDecelerate: 'cubic-bezier(0.175, 0.885, 0.32, 1.05)',
  
  // Game settings
  winningChance: 0.25,
  betAmount: 10,
  initialCredits: 1000
};

// Initialize engine
const engine = new SlotEngine(config);

// Wait for assets to load
await engine.ready();

// Hide loading, show controls
document.getElementById('loading').style.display = 'none';
document.getElementById('controls').style.display = 'block';

// Get UI elements
const spinButton = document.getElementById('spin-button');
const creditsDisplay = document.getElementById('credits');
const lastWinDisplay = document.getElementById('last-win');

// Handle spin button click
spinButton.addEventListener('click', async () => {
  try {
    spinButton.disabled = true;
    const result = await engine.spin();
    
    // Update displays
    const state = engine.getState();
    creditsDisplay.textContent = state.credits;
    lastWinDisplay.textContent = result.payout;
    
    spinButton.disabled = false;
  } catch (error) {
    console.error('Spin failed:', error.message);
    alert(error.message);
    spinButton.disabled = false;
  }
});

// Subscribe to events for reactive UI updates
engine.on('credits-changed', ({ newBalance }) => {
  creditsDisplay.textContent = newBalance;
});

engine.on('win', ({ payout }) => {
  lastWinDisplay.textContent = payout;
  lastWinDisplay.style.color = '#4ecca3';
  setTimeout(() => {
    lastWinDisplay.style.color = 'white';
  }, 1000);
});
```

---

## Advanced Usage

### Deterministic Testing with Seeds

```javascript
const engine = new SlotEngine({
  ...config,
  seed: 12345  // Same seed = same results
});

// Run 10 spins - results will be identical every time
for (let i = 0; i < 10; i++) {
  const result = await engine.spin();
  console.log(`Spin ${i + 1}:`, result);
}
```

---

### Simulation Mode

```javascript
// Run 10,000 spins to validate configuration
const stats = engine.simulate(10000);

console.log('Win Rate:', stats.winRate.toFixed(2) + '%');
console.log('RTP:', stats.rtp.toFixed(2) + '%');
console.log('Largest Win:', stats.largestWin);
console.log('Payout Distribution:', stats.payoutDistribution);
```

---

### Theme Switching

```javascript
// Switch to different theme at runtime
await engine.setConfig({
  assetsPath: 'assets/vegas-nights',
  // symbolSet stays the same, but different image files
});
```

---

### Keyboard Control

```javascript
// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault();
    spinButton.click();
  }
});
```

---

### Accessibility Enhancements

```javascript
// Add ARIA live regions for screen reader announcements
const creditsAria = document.createElement('div');
creditsAria.setAttribute('aria-live', 'polite');
creditsAria.setAttribute('aria-atomic', 'true');
creditsAria.className = 'sr-only';  // Visually hidden
document.body.appendChild(creditsAria);

engine.on('credits-changed', ({ newBalance, change, reason }) => {
  if (reason === 'win') {
    creditsAria.textContent = `You won ${change} credits! New balance: ${newBalance}`;
  } else {
    creditsAria.textContent = `Bet placed. Credits remaining: ${newBalance}`;
  }
});
```

---

## Configuration Options

### Required Options

| Option | Type | Description |
|--------|------|-------------|
| `assetsPath` | `string` | Path to asset folder |
| `symbolSet` | `Record<string, string>` | Symbol ID to filename mapping |
| `paylines` | `number[][]` | Winning line coordinate patterns |
| `payoutTable` | `Record<string, number>` | Pattern to multiplier mapping |
| `winningChance` | `number` | Win probability (0.0 - 1.0) |

### Optional Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `rows` | `number` | `3` | Number of symbol rows (fixed) |
| `cols` | `number` | `5` | Number of reels (fixed) |
| `spinDuration` | `number` | `2000` | Animation duration (ms) |
| `reelStopDelay` | `number` | `300` | Delay between reel stops (ms) |
| `betAmount` | `number` | `1` | Credits per spin |
| `initialCredits` | `number` | `1000` | Starting balance |
| `seed` | `number` | `undefined` | RNG seed (deterministic if set) |
| `motionBlur` | `boolean` | `true` | Enable motion blur effect |
| `reelStrips` | `string[][]` | `auto` | Custom reel strips |

---

## How Winning Chance Works

The `winningChance` parameter controls the probability of any spin resulting in a win:

- **0.25** = 25% of spins win (recommended starting point)
- **0.10** = 10% of spins win (harder)
- **0.50** = 50% of spins win (easier)

**Implementation**:
1. Engine runs Bernoulli trial: `random() < winningChance`
2. If win: selects weighted combination from `payoutTable`
3. If loss: generates random non-winning symbol positions

**Validation**: Use `simulate(10000)` to verify actual win rate matches configuration within ±2%.

---

## Troubleshooting

### Assets Not Loading

**Error**: `Missing required asset: assets/classic/symbol-CHERRY.png`

**Solution**: 
1. Check file exists at specified path
2. Verify filename matches exactly (case-sensitive)
3. Ensure web server serves assets (CORS issues if using file://)

---

### Insufficient Credits

**Error**: `Cannot spin: insufficient credits (have: 5, need: 10)`

**Solution**: 
- Reduce `betAmount` in configuration
- Reset credits: `engine.setConfig({ initialCredits: 1000 })`

---

### Performance Issues

**Symptoms**: Choppy animations, low frame rate

**Solutions**:
1. Reduce asset file sizes (optimize PNGs)
2. Disable motion blur: `motionBlur: false`
3. Reduce `spinDuration` for faster spins
4. Check browser GPU acceleration enabled

---

### Accessibility Warning

**Issue**: Motion sensitivity users affected

**Solution**: Engine auto-detects `prefers-reduced-motion`, but you can also:
```javascript
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  config.spinDuration = 500;  // Faster
  config.motionBlur = false;
}
```

---

## Next Steps

- **Customization**: Read [data-model.md](./data-model.md) for entity details
- **API Reference**: See [SlotEngine.contract.md](./contracts/SlotEngine.contract.md)
- **Testing**: Check [research.md](./research.md) for validation approaches
- **Implementation**: Proceed to tasks.md (generated by `/speckit.tasks`)

---

## Example Folder Structure

```
slot-machine-demo/
├── index.html              # Your HTML page
├── main.js                 # Your initialization code
├── SlotEngine.js           # Engine implementation (to be built)
├── assets/
│   ├── classic/            # Default theme
│   │   ├── bg.png
│   │   ├── symbol-*.png
│   │   └── *.mp3
│   └── vegas-nights/       # Alternative theme
│       ├── bg.png
│       └── ...
└── styles/
    └── custom.css          # Additional styling
```

---

## Support & Feedback

For issues, questions, or contributions:
- Review specification: [spec.md](./spec.md)
- Check implementation plan: [plan.md](./plan.md)
- Run self-test: `engine.selfTest()`

**Ready to build?** Generate implementation tasks with `/speckit.tasks`
