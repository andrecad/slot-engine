/**
 * DOMRenderer - renders slot machine UI elements
 */

import { Reel } from '../models/Reel.js';
import { Symbol } from '../types.js';

export class DOMRenderer {
  private container: HTMLElement;
  private reelContainer: HTMLElement;
  private spinButton: HTMLButtonElement;
  private creditsDisplay: HTMLElement;
  private lastWinDisplay: HTMLElement;
  private betDisplay: HTMLElement;
  private decreaseBetButton: HTMLButtonElement;
  private increaseBetButton: HTMLButtonElement;
  private symbols: Map<string, Symbol>;

  constructor(container: HTMLElement | string, symbols: Map<string, Symbol>) {
    // Resolve container
    if (typeof container === 'string') {
      const element = document.querySelector(container);
      if (!element) {
        throw new Error(`Container not found: ${container}`);
      }
      this.container = element as HTMLElement;
    } else {
      this.container = container;
    }

    this.symbols = symbols;

    // Create main structure
    this.container.innerHTML = '';
    this.container.className = 'slot-machine';

    // Create reel container
    this.reelContainer = document.createElement('div');
    this.reelContainer.className = 'reel-container';
    this.container.appendChild(this.reelContainer);

    // Create controls container
    const controls = document.createElement('div');
    controls.className = 'controls';

    // Create credits display
    this.creditsDisplay = document.createElement('div');
    this.creditsDisplay.className = 'credits-display';
    this.creditsDisplay.textContent = 'Credits: 0';
    controls.appendChild(this.creditsDisplay);

    // Create bet controls container
    const betControls = document.createElement('div');
    betControls.className = 'bet-controls';

    this.decreaseBetButton = document.createElement('button');
    this.decreaseBetButton.className = 'bet-button decrease-bet';
    this.decreaseBetButton.textContent = '-';
    this.decreaseBetButton.setAttribute('aria-label', 'Decrease bet');
    betControls.appendChild(this.decreaseBetButton);

    this.betDisplay = document.createElement('div');
    this.betDisplay.className = 'bet-display';
    this.betDisplay.textContent = 'Bet: 10';
    betControls.appendChild(this.betDisplay);

    this.increaseBetButton = document.createElement('button');
    this.increaseBetButton.className = 'bet-button increase-bet';
    this.increaseBetButton.textContent = '+';
    this.increaseBetButton.setAttribute('aria-label', 'Increase bet');
    betControls.appendChild(this.increaseBetButton);

    controls.appendChild(betControls);

    // Create spin button
    this.spinButton = document.createElement('button');
    this.spinButton.className = 'spin-button';
    this.spinButton.textContent = '';
    controls.appendChild(this.spinButton);

    // Create last win display
    this.lastWinDisplay = document.createElement('div');
    this.lastWinDisplay.className = 'last-win-display';
    this.lastWinDisplay.textContent = 'Last Win: 0';
    controls.appendChild(this.lastWinDisplay);

    this.container.appendChild(controls);
  }

  /**
   * Update the symbol map (used when switching themes)
   */
  updateSymbolMap(symbols: Map<string, Symbol>): void {
    this.symbols = symbols;
  }

  /**
   * Initialize reels in the DOM
   */
  initializeReels(reels: Reel[]): void {
    this.reelContainer.innerHTML = '';

    for (const reel of reels) {
      const reelElement = document.createElement('div');
      reelElement.className = `reel reel-${reel.index}`;

      // Create symbol track (longer than visible area for scrolling)
      const symbolTrack = document.createElement('div');
      symbolTrack.className = 'symbol-track';

      // Add symbols to track (repeat strip for smooth scrolling)
      const repeatedStrip = [...reel.strip, ...reel.strip, ...reel.strip];
      for (const symbolId of repeatedStrip) {
        const symbolElement = this.createSymbolElement(symbolId);
        symbolTrack.appendChild(symbolElement);
      }

      reelElement.appendChild(symbolTrack);
      this.reelContainer.appendChild(reelElement);
      
      reel.element = reelElement;
    }
  }

  /**
   * Create a symbol DOM element
   */
  private createSymbolElement(symbolId: string): HTMLElement {
    const symbolElement = document.createElement('div');
    symbolElement.className = 'symbol';
    symbolElement.dataset.symbolId = symbolId;

    const symbol = this.symbols.get(symbolId);
    if (symbol?.imageElement) {
      const img = symbol.imageElement.cloneNode(true) as HTMLImageElement;
      img.alt = symbolId;
      symbolElement.appendChild(img);
    } else {
      // Fallback text rendering
      symbolElement.textContent = symbolId;
    }

    return symbolElement;
  }

  /**
   * Update reel visual position
   */
  updateReelPosition(reel: Reel, offset: number): void {
    const symbolTrack = reel.element.querySelector('.symbol-track') as HTMLElement;
    if (symbolTrack) {
      // Each symbol is 100px tall (configurable via CSS)
      const symbolHeight = 100;
      
      // Wrap offset within the repeated strip range (3x strip length)
      // This prevents the offset from growing too large and causing rendering issues
      const stripLength = reel.strip.length;
      const wrappedOffset = ((offset % stripLength) + stripLength) % stripLength;
      
      const translateY = -(wrappedOffset * symbolHeight);
      symbolTrack.style.transform = `translateY(${translateY}px)`;
    }
  }

  /**
   * Add motion blur effect to reel
   */
  addMotionBlur(reel: Reel): void {
    reel.element.style.filter = 'blur(2px)';
  }

  /**
   * Remove motion blur effect from reel
   */
  removeMotionBlur(reel: Reel): void {
    reel.element.style.filter = 'none';
  }

  /**
   * Highlight winning symbols
   */
  highlightWinningSymbols(positions: Array<{ row: number; col: number }>): void {
    // Remove previous highlights
    this.clearHighlights();

    // Add highlight class to winning positions
    for (const { row, col } of positions) {
      const reel = this.reelContainer.children[col] as HTMLElement;
      const symbolTrack = reel?.querySelector('.symbol-track');
      if (symbolTrack) {
        const symbols = symbolTrack.querySelectorAll('.symbol');
        const visibleStart = 0; // Adjust based on current offset
        const targetSymbol = symbols[visibleStart + row] as HTMLElement;
        if (targetSymbol) {
          targetSymbol.classList.add('winning');
        }
      }
    }
  }

  /**
   * Clear all winning highlights
   */
  clearHighlights(): void {
    const winningSymbols = this.reelContainer.querySelectorAll('.symbol.winning');
    winningSymbols.forEach(symbol => symbol.classList.remove('winning'));
  }

  /**
   * Update credits display
   */
  updateCredits(credits: number): void {
    this.creditsDisplay.textContent = `Credits: ${credits}`;
  }

  /**
   * Update last win display
   */
  updateLastWin(amount: number): void {
    this.lastWinDisplay.textContent = `Last Win: ${amount}`;
    if (amount > 0) {
      this.lastWinDisplay.classList.add('win-highlight');
      setTimeout(() => {
        this.lastWinDisplay.classList.remove('win-highlight');
      }, 2000);
    }
  }

  /**
   * Enable/disable spin button
   */
  setSpinButtonEnabled(enabled: boolean): void {
    this.spinButton.disabled = !enabled;
  }

  /**
   * Get spin button element for event binding
   */
  getSpinButton(): HTMLButtonElement {
    return this.spinButton;
  }

  /**
   * Get container element
   */
  getContainer(): HTMLElement {
    return this.container;
  }

  /**
   * Update bet display
   */
  updateBet(amount: number): void {
    this.betDisplay.textContent = `Bet: ${amount}`;
  }

  /**
   * Get decrease bet button for event binding
   */
  getDecreaseBetButton(): HTMLButtonElement {
    return this.decreaseBetButton;
  }

  /**
   * Get increase bet button for event binding
   */
  getIncreaseBetButton(): HTMLButtonElement {
    return this.increaseBetButton;
  }

  /**
   * Enable/disable bet buttons
   */
  setBetButtonsEnabled(enabled: boolean): void {
    this.decreaseBetButton.disabled = !enabled;
    this.increaseBetButton.disabled = !enabled;
  }

  /**
   * Trigger win animation with differentiation for big wins
   */
  triggerWinAnimation(isBigWin: boolean = false): void {
    const animationClass = isBigWin ? 'big-win-animation' : 'win-animation';
    this.container.classList.add(animationClass);

    // Remove animation class after animation completes
    setTimeout(() => {
      this.container.classList.remove(animationClass);
    }, 2000);

    // Add pulsing effect to winning symbols
    const winningSymbols = this.reelContainer.querySelectorAll('.symbol.winning');
    winningSymbols.forEach(symbol => {
      symbol.classList.add('pulse');
    });

    // Remove pulse after animation
    setTimeout(() => {
      winningSymbols.forEach(symbol => {
        symbol.classList.remove('pulse');
      });
    }, 1500);
  }

  /**
   * Show loading indicator during asset preload
   */
  showLoadingIndicator(progress: number): void {
    let loadingElement = this.container.querySelector('.loading-indicator') as HTMLElement;
    
    if (!loadingElement) {
      loadingElement = document.createElement('div');
      loadingElement.className = 'loading-indicator';
      loadingElement.innerHTML = `
        <div class="loading-spinner"></div>
        <div class="loading-progress">Loading: <span class="progress-value">0%</span></div>
      `;
      this.container.appendChild(loadingElement);
    }

    const progressValue = loadingElement.querySelector('.progress-value');
    if (progressValue) {
      progressValue.textContent = `${Math.round(progress * 100)}%`;
    }
  }

  /**
   * Hide loading indicator
   */
  hideLoadingIndicator(): void {
    const loadingElement = this.container.querySelector('.loading-indicator');
    if (loadingElement) {
      loadingElement.remove();
    }
  }
}
