# Research: Slot Machine Engine

**Feature**: Slot Machine Engine (001-slot-engine)  
**Date**: 2025-11-19  
**Purpose**: Resolve technical unknowns and establish implementation patterns

## Research Tasks Completed

### 1. Motion Preferences (prefers-reduced-motion) Support

**Decision**: Implement CSS media query detection with configurable animation behavior

**Rationale**:
- WCAG 2.1 AA requires respecting user motion preferences
- CSS media query `prefers-reduced-motion: reduce` is well-supported (95%+ browsers)
- Allows graceful degradation without disabling core functionality

**Implementation Approach**:
```typescript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReducedMotion) {
  // Reduce spin duration to 500ms (from 2000ms)
  // Disable motion blur filter
  // Use instant stop instead of easing/bounce
}
```

**Alternatives Considered**:
- Manual toggle in configuration: Too cumbersome for accessibility feature
- Completely disable animations: Breaks core gameplay experience
- Ignore preference: Violates WCAG 2.1 AA compliance

---

### 2. Default Theme Asset Structure

**Decision**: Define standardized asset folder structure with naming conventions

**Rationale**:
- Consistency enables theme portability
- Clear naming prevents asset loading errors
- Documentation provides template for theme creators

**Asset Folder Structure**:
```
assets/[theme-name]/
├── bg.png                    # Background image (1920×1080 recommended)
├── symbol-CHERRY.png         # Symbol images (150×150 recommended)
├── symbol-BAR.png
├── symbol-SEVEN.png
├── symbol-DIAMOND.png
├── symbol-BELL.png
├── symbol-WATERMELON.png
├── symbol-ORANGE.png
├── symbol-LEMON.png
├── spin-button.png           # Spin button graphic (200×200 recommended)
├── spin-button-disabled.png  # Optional disabled state
├── music.mp3                 # Background music (loopable)
├── spin.mp3                  # Spin start sound effect
├── stop.wav                  # Reel stop sound effect
└── win.mp3                   # Win celebration sound
```

**Naming Convention**:
- Symbols: `symbol-{SYMBOL_ID}.{ext}` where SYMBOL_ID matches configuration symbolSet keys
- Audio: Lowercase descriptive names matching config expectations
- File formats: PNG for images (transparency support), MP3/WAV for audio (browser compatibility)

**Validation**:
- Engine validates all required assets exist before initialization
- Missing assets throw descriptive error: `"Missing required asset: assets/classic/symbol-CHERRY.png"`

**Alternatives Considered**:
- JSON manifest file: Adds complexity, folder convention is self-documenting
- Arbitrary naming: Requires too much configuration, error-prone
- Embedded base64 assets: Inflexible, bloats code

---

### 3. Error Message Patterns

**Decision**: Structured error messages with action guidance

**Rationale**:
- Users need clear actionable information to resolve issues
- Consistent error format aids debugging
- Error types map to specific failure scenarios

**Error Message Patterns**:

| Error Type | Pattern | Example |
|------------|---------|---------|
| Missing Asset | `Missing required asset: {path}. Check that {filename} exists in {folder}.` | `Missing required asset: assets/classic/symbol-CHERRY.png. Check that symbol-CHERRY.png exists in assets/classic/.` |
| Invalid Configuration | `Invalid configuration: {field} must be {constraint}. Received: {value}` | `Invalid configuration: winningChance must be between 0 and 1. Received: 1.5` |
| Invalid Seed | `Invalid seed: {reason}. Use a positive integer or omit for random behavior.` | `Invalid seed: seed must be a number. Use a positive integer or omit for random behavior.` |
| Asset Load Failure | `Failed to load {assetType}: {path}. {httpStatus}` | `Failed to load image: assets/classic/bg.png. 404 Not Found` |

**Error Handling Approach**:
- Validation errors thrown during construction (fail-fast)
- Asset loading errors throw before initialization completes
- Runtime errors (already spinning, etc.) logged to console but don't crash
- Simulation errors return error object instead of throwing

**Alternatives Considered**:
- Generic error messages: Unhelpful for debugging
- Error codes: Requires documentation lookup, less user-friendly
- Silent failures: Violates UX principle of clear communication

---

### 4. Animation Easing Functions and Motion Blur

**Decision**: Cubic bezier easing with optional CSS filter motion blur

**Rationale**:
- Cubic bezier provides realistic acceleration/deceleration
- CSS filter motion blur is GPU-accelerated and performant
- Standard easing curves are well-tested and familiar

**Easing Functions**:

```typescript
const EASING_FUNCTIONS = {
  // Spin acceleration (ease-in)
  accelerate: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',  // easeInQuad
  
  // Constant speed (linear)
  spin: 'linear',
  
  // Deceleration with slight bounce (ease-out with overshoot)
  decelerate: 'cubic-bezier(0.175, 0.885, 0.32, 1.05)',  // easeOutBack (slight bounce)
};
```

**Animation Phases**:
1. **Acceleration** (300ms): ease-in from 0 to full speed
2. **Constant Spin** (1000-2000ms variable): linear motion at full speed
3. **Deceleration** (500ms per reel): ease-out with small bounce at stop
4. **Reel Stop Delay**: 200-400ms between each reel stop (left to right)

**Motion Blur**:
```css
.reel.spinning {
  filter: blur(2px);  /* Applied during constant spin phase only */
}
```

**Performance Consideration**:
- Motion blur only during constant spin phase (not during accel/decel)
- Disabled if prefers-reduced-motion is active
- CSS filter is GPU-accelerated on modern browsers

**Alternatives Considered**:
- requestAnimationFrame manual easing: More control but adds complexity
- Web Animations API: Good alternative but CSS transitions are simpler
- Canvas-based motion blur: Too performance-intensive, not needed

---

### 5. Mulberry32 Seeded PRNG Implementation

**Decision**: Use Mulberry32 algorithm for deterministic seeded random number generation

**Rationale**:
- Mulberry32 is fast, simple, and produces high-quality random numbers
- 32-bit seed makes it easy to share/reproduce test scenarios
- Algorithm is well-documented and widely used in game development

**Implementation**:
```typescript
class SeededRandom {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed >>> 0;  // Ensure 32-bit unsigned integer
  }
  
  next(): number {
    // Mulberry32 algorithm
    let t = this.seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;  // Returns [0, 1)
  }
}
```

**Validation Approach**:
- Unit tests verify same seed produces identical sequences
- Test with known seeds and expected output sequences
- Compare against reference implementation from Game Developer resources

**Alternative Unseeded RNG**:
```typescript
// For unseeded random behavior
const randomFloat = () => {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return array[0] / 4294967296;
};
```

**Alternatives Considered**:
- Math.random(): Not seedable, inconsistent across browsers
- Xorshift128: More complex, no significant quality improvement for this use case
- PCG: Excellent quality but overkill for slot machine simulation
- Mersenne Twister: Too complex and slow for JavaScript implementation

---

### 6. Winning Chance Implementation via Weighted Selection

**Decision**: Bernoulli trial determines win/loss, then weighted symbol selection

**Rationale**:
- Separates "should this spin win" from "what symbols to show"
- Maintains configured winning chance precisely
- Ensures visual believability (no impossible combinations)

**Algorithm**:
```typescript
function generateSpinResult(config: SlotConfig): SpinResult {
  const shouldWin = random.next() < config.winningChance;
  
  if (shouldWin) {
    // Select winning combination from paytable using weights
    const winningCombo = selectWeightedWinningCombo(config.payoutTable);
    // Generate reel positions that create this winning combination
    return buildWinningReelPositions(winningCombo, config);
  } else {
    // Generate random reel positions from reel strips
    // Ensure no accidental winning combinations
    return buildLosingReelPositions(config);
  }
}
```

**Weighting Strategy**:
- High-value symbols (SEVEN, DIAMOND): Lower weight (rare)
- Mid-value symbols (BAR, BELL): Medium weight
- Low-value symbols (fruits): Higher weight (common)

**Example Weights**:
```typescript
const symbolWeights = {
  SEVEN: 1,      // Rarest (jackpot)
  DIAMOND: 2,
  BAR: 4,
  BELL: 6,
  WATERMELON: 8,
  ORANGE: 10,
  LEMON: 12,
  CHERRY: 15     // Most common
};
```

**Validation**:
- Simulation mode verifies actual win rate matches configured winningChance within ±2%
- Distribution histogram verifies payout frequency matches symbol weights

**Alternatives Considered**:
- Pure random with rejection sampling: Inefficient, could loop indefinitely
- Forced outcomes every N spins: Predictable, not truly random
- Server-side RNG: Violates client-side requirement

---

### 7. Asset Preloading Strategy

**Decision**: Preload all assets before allowing first spin, with loading indicator

**Rationale**:
- Prevents mid-game loading delays that disrupt UX
- Ensures audio plays immediately when triggered
- Loading screen sets player expectations

**Implementation**:
```typescript
async preloadAssets(config: SlotConfig): Promise<void> {
  const imagePromises = [
    preloadImage(config.assetsPath + '/bg.png'),
    preloadImage(config.assetsPath + '/spin-button.png'),
    ...Object.values(config.symbolSet).map(f => 
      preloadImage(config.assetsPath + '/' + f)
    )
  ];
  
  const audioPromises = [
    preloadAudio(config.assetsPath + '/music.mp3'),
    preloadAudio(config.assetsPath + '/spin.mp3'),
    preloadAudio(config.assetsPath + '/stop.wav'),
    preloadAudio(config.assetsPath + '/win.mp3')
  ];
  
  await Promise.all([...imagePromises, ...audioPromises]);
}
```

**Loading Indicator**:
- Show progress: "Loading assets... X/Y complete"
- Estimated time based on asset count
- Spin button remains disabled until preloading complete

**Error Handling**:
- Failed asset loads throw immediately with specific path
- Partial success not allowed (all-or-nothing)

**Alternatives Considered**:
- Lazy loading: Causes jarring delays during gameplay
- Background loading: Risk of missing assets during gameplay
- Cached loading only: First load would still have delays

---

### 8. Reel Strip Generation

**Decision**: Configurable reel strips with intelligent default generation

**Rationale**:
- Advanced users can define exact reel strips for precise control
- Defaults generate balanced strips automatically
- Both approaches support the weighted winning chance system

**Default Reel Strip Generation**:
```typescript
function generateDefaultReelStrip(symbols: string[], weights: Record<string, number>): string[] {
  const strip: string[] = [];
  const targetLength = 32;  // Standard slot machine strip length
  
  // Fill strip proportionally to symbol weights
  for (const [symbol, weight] of Object.entries(weights)) {
    const count = Math.round((weight / totalWeight) * targetLength);
    for (let i = 0; i < count; i++) {
      strip.push(symbol);
    }
  }
  
  // Shuffle to distribute symbols
  return shuffleArray(strip);
}
```

**Custom Reel Strips**:
- User provides `reelStrips?: string[][]` in configuration
- Each array is one reel's strip (5 reels total)
- Engine validates strips contain only symbols from symbolSet

**Strip Length Recommendations**:
- Minimum: 20 symbols per reel (limited variation)
- Recommended: 32-64 symbols per reel (good balance)
- Maximum: No limit (but diminishing returns after ~100)

**Alternatives Considered**:
- Fixed strip approach: Too rigid, limits game designer control
- Fully random per spin: Can't control symbol distribution precisely
- Virtual reel mapping: Adds complexity without clear benefit for this scope

---

## Summary of Decisions

| Topic | Decision | Impact |
|-------|----------|--------|
| Motion Preferences | CSS media query with graceful degradation | Meets WCAG 2.1 AA, minimal code impact |
| Asset Structure | Standardized folder with naming conventions | Clear documentation, error prevention |
| Error Messages | Structured patterns with action guidance | Better UX, easier debugging |
| Easing Functions | Cubic bezier with motion blur | Realistic feel, good performance |
| Seeded PRNG | Mulberry32 algorithm | Deterministic testing, simple implementation |
| Winning Chance | Bernoulli + weighted selection | Precise control, believable outcomes |
| Asset Preloading | All assets upfront with progress | Smooth gameplay, no mid-game delays |
| Reel Strips | Smart defaults + custom override | Flexibility for game designers |

## Next Steps (Phase 1)

All research items resolved. Ready to proceed to:
1. **data-model.md**: Define entities (Reel, Symbol, PayTable, GameState, Configuration, SpinResult)
2. **contracts/**: Define SlotEngine API contract (constructor, methods, events)
3. **quickstart.md**: Integration guide for HTML page

**No blocking unknowns remain.**
