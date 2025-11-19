# Implementation Plan: Slot Machine Engine

**Branch**: `001-slot-engine` | **Date**: 2025-11-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-slot-engine/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a client-side slot machine engine (3×5 grid) with realistic reel animations, configurable winning chance via weighted random selection, asset-based theming, deterministic seeded RNG, and simulation mode for RTP validation. Core engine implemented as TypeScript class with plain DOM/CSS animations using requestAnimationFrame and CSS transforms.

## Technical Context

**Language/Version**: TypeScript 5.3+ (ES2022 target), browser-compatible with no build requirement (optional bundler support)  
**Primary Dependencies**: None (vanilla TypeScript/JavaScript), optional React/Vue/etc. integration supported  
**Storage**: N/A (all state in-memory, configuration via constructor)  
**Testing**: Jest or Vitest for unit tests, Playwright for browser integration tests  
**Target Platform**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
**Project Type**: Single library project (web component/class library)  
**Performance Goals**: 60fps reel animation, <100ms spin initiation, 10,000 simulation spins in <10 seconds  
**Constraints**: <2s initial load, <5MB total assets per theme, client-side only (no server), <100MB memory for 1000 spins  
**Scale/Scope**: Single-page demo application, embeddable library, support for unlimited themes via asset swapping

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### UX Consistency Principles (Post-Phase 1 Re-evaluation)
- [x] **Visual Consistency**: Design tokens/system defined and documented
  - ✅ Theme-based asset system ensures visual consistency within each theme
  - ✅ UI components (button, credits, win display) styled consistently
  - ✅ CSS variables for spacing, colors, typography documented in quickstart.md
  - ✅ Asset structure defined in research.md with naming conventions
- [x] **Interaction Patterns**: UI patterns documented and follow established conventions
  - ✅ Standard slot machine interaction: single-click spin, disabled during animation
  - ✅ Keyboard shortcuts (Space/Enter) follow web conventions (documented in quickstart)
  - ✅ State transitions (idle → spinning → stopped) defined in data-model.md (ReelState enum)
  - ✅ Event system for reactive UI updates specified in contracts
- [x] **Feedback & Communication**: User feedback mechanisms specified for all actions
  - ✅ Immediate visual feedback: button state change on click
  - ✅ Audio feedback: spin start, reel stops, win celebration (AudioAssets entity in data-model)
  - ✅ Visual feedback: reel animation, winning symbol highlights, credit updates
  - ✅ Loading states for asset preloading (quickstart demonstrates loading UI)
  - ✅ Event system emits: spin-start, reel-stop, spin-complete, win, credits-changed
- [x] **Accessibility First**: WCAG 2.1 AA compliance verified (contrast, keyboard nav, screen readers)
  - ✅ Keyboard navigation: Space/Enter for spin button (quickstart example)
  - ✅ Screen reader announcements via aria-live regions (quickstart demonstrates)
  - ✅ Semantic HTML structure (ISlotEngine contract specifies element requirements)
  - ✅ Color contrast requirements in UX-004 specification
  - ✅ Motion preferences (prefers-reduced-motion) fully resolved in research.md with implementation approach
- [x] **Performance as UX**: Performance thresholds defined (<2s load, <100ms interaction, <300ms navigation)
  - ✅ Load time: <2s (SC-006), asset preloading strategy in research.md
  - ✅ Interaction: <100ms spin initiation (UX-005)
  - ✅ Animation: 60fps reel animation (SC-001, UX-005) using requestAnimationFrame + CSS transforms
  - ✅ Simulation: 10,000 spins in <10s (SC-005)

### Standards Compliance (Post-Phase 1 Re-evaluation)
- [x] Design system components identified or new patterns approved
  - ✅ Components: SlotEngine class, reel containers, symbol stacks, spin button, credit/win displays
  - ✅ Asset-based theming allows for theme-specific design systems
  - ✅ Default theme structure fully defined in research.md (asset folder structure with naming conventions)
  - ✅ TypeScript interfaces provide type-safe component contracts (types.ts)
- [x] User testing plan defined for new features
  - ✅ Simulation mode (US5) provides automated testing for game mathematics
  - ✅ Deterministic seeds (US4) enable reproducible test scenarios
  - ✅ selfTest() method for quick validation (returns TestResult with pass/fail)
  - ✅ Accessibility testing approach documented in quickstart (ARIA, keyboard nav examples)
- [x] Content/microcopy follows voice and tone guidelines
  - ✅ Error message patterns fully defined in research.md with examples
  - ✅ Structured error format: context + guidance + received value
  - ✅ Contract documents error scenarios with specific messages

### Feature-Specific Gates (Post-Phase 1 Re-evaluation)
- [x] **Client-Side Architecture**: No server dependency verified
  - ✅ All logic runs in browser (FR-013)
  - ✅ Assets loaded via fetch API from static paths (preloadAssets in research.md)
  - ✅ In-memory state only, no backend communication (GameState entity)
- [x] **Animation Performance**: 60fps requirement achievable with chosen approach
  - ✅ requestAnimationFrame for smooth animations
  - ✅ CSS transforms (translateY) for GPU acceleration
  - ✅ Motion blur and easing functions fully researched (cubic-bezier curves defined)
  - ✅ Animation phases documented: accelerate → spin → decelerate with specific timing
- [x] **RNG Determinism**: Seeded PRNG implementation validated
  - ✅ Mulberry32 algorithm fully researched with implementation code
  - ✅ window.crypto.getRandomValues() for unseeded RNG
  - ✅ Validation approach defined: unit tests with known seed sequences
- [x] **Winning Chance Algorithm**: Implementation approach validated
  - ✅ Bernoulli trial + weighted selection researched and documented
  - ✅ Ensures configured winningChance is precise (verifiable via simulation)
  - ✅ Maintains visual believability (no impossible combinations)

**GATE STATUS**: ✅ **FULL PASS**
- All UX consistency principles fully addressed and resolved
- All research items completed (8/8 topics researched)
- Design artifacts complete: data-model.md, contracts/, quickstart.md
- No remaining clarifications or blocking issues
- Ready to proceed to Phase 2 (tasks generation)

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── SlotEngine.ts           # Main engine class implementation
├── types.ts                # TypeScript interfaces and types (from contracts)
├── core/
│   ├── RNG.ts              # Random number generation (Mulberry32 + crypto)
│   ├── ReelController.ts   # Reel animation and state management
│   ├── PaylineEvaluator.ts # Win detection and payout calculation
│   └── AssetLoader.ts      # Asset preloading and caching
├── models/
│   ├── GameState.ts        # Game state entity
│   ├── SpinResult.ts       # Spin result entity
│   └── Configuration.ts    # Configuration entity with validation
├── animation/
│   ├── ReelAnimator.ts     # requestAnimationFrame animation loop
│   ├── EasingFunctions.ts  # Cubic bezier easing implementations
│   └── MotionController.ts # Motion blur and reduced-motion handling
├── audio/
│   ├── AudioManager.ts     # Audio playback and preloading
│   └── SoundEffects.ts     # Sound effect definitions
├── ui/
│   ├── DOMRenderer.ts      # DOM manipulation and rendering
│   ├── EventEmitter.ts     # Event system implementation
│   └── AccessibilityManager.ts # ARIA announcements and keyboard nav
└── utils/
    ├── Validators.ts       # Configuration validation
    ├── ReelStripGenerator.ts # Default reel strip generation
    └── ErrorMessages.ts    # Structured error message helpers

tests/
├── unit/
│   ├── RNG.test.ts         # RNG determinism and distribution tests
│   ├── PaylineEvaluator.test.ts # Win detection accuracy tests
│   ├── ReelStripGenerator.test.ts # Reel strip generation tests
│   ├── Validators.test.ts  # Configuration validation tests
│   └── models/             # Entity validation tests
├── integration/
│   ├── SlotEngine.test.ts  # Full engine integration tests
│   ├── Simulation.test.ts  # Simulation mode validation
│   └── Accessibility.test.ts # WCAG compliance tests
└── fixtures/
    ├── test-assets/        # Mock asset files for testing
    ├── test-configs.ts     # Sample configurations
    └── expected-results.ts # Known good test results

demo/
├── index.html              # Demo page (from quickstart.md)
├── main.js                 # Demo initialization
├── styles.css              # Demo styling
└── assets/
    └── classic/            # Default theme assets
        ├── bg.png
        ├── symbol-*.png
        ├── spin-button.png
        └── *.mp3

docs/
├── api/                    # Generated API documentation
└── examples/               # Additional usage examples
```

**Structure Decision**: Single library project with clear separation of concerns:

- **src/**: Core engine implementation as library
  - `SlotEngine.ts` is the main entry point/public API
  - `core/` contains fundamental engine systems (RNG, payline logic, asset loading)
  - `models/` contains data entities from data-model.md
  - `animation/` handles all visual animation concerns
  - `audio/` manages sound effects and music
  - `ui/` handles DOM rendering and accessibility
  - `utils/` provides shared utilities and helpers

- **tests/**: Comprehensive test coverage
  - `unit/` for isolated component testing
  - `integration/` for full system testing
  - `fixtures/` for test data and mock assets

- **demo/**: Live demonstration matching quickstart.md
  - Serves as both example and manual testing environment

- **docs/**: Generated and written documentation

This structure supports:
- Tree-shaking for minimal bundle size
- Clear module boundaries for maintainability
- Easy testing with isolated units
- Simple integration into any web project

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No complexity violations detected.** Constitution Check passed all gates with no unjustified complexity.

All design decisions align with constitution principles:
- Visual consistency maintained through theme-based asset system
- Interaction patterns follow web standards
- Clear feedback mechanisms throughout
- WCAG 2.1 AA compliance addressed
- Performance requirements met with appropriate technology choices
