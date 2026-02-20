# Architecture & Gaps (Baseline Audit)

## 1) Current Architecture Map (as-is)

### Frontend stack
- React 19 + TypeScript + Vite
- Material UI for layout/UI
- `@react-three/fiber` + `@react-three/drei` + Three.js for 3D

### Routing
- `frontend/src/App.tsx`:
  - `/` -> `MainMenu`
  - `/themes` -> `ThemeSelection`
  - `/theme/:id` -> `ThemeContent` (stepper with mixed theory + scene)
  - `/test/:id` -> `TestPage`
  - `/lab/:id` -> `LabPage` (maps id to lab component)

### Theme/content data model
- `frontend/src/data/themes.ts`:
  - `LabTheme = { id, title, subtitle, icon, steps[], quiz[] }`
  - `steps[]` is mixed `type: "theory" | "scene"`
  - no separate model for references/assets/lab wizard/variant tables

### Theory / Test / Lab implementation
- Theory:
  - `ThemeContent.tsx` step-by-step linear navigation
  - no left TOC, no search, no per-formula mini-check, no per-module simulator binding
- Tests:
  - `TestPage.tsx` only single-choice with one correct index
  - no numeric tolerance, no multi-select, no explanation per answer
- Labs:
  - separate hardcoded pages in `frontend/src/pages/labs/*`
  - not wizardized (mostly free sliders)
  - no student variant autoload by ticket digits
  - no generated final report export

### 3D scene system
- `frontend/src/components/SceneViewer.tsx` has hardcoded `sceneId -> component` map
- Scene groups:
  - `LightScenes.tsx`
  - `SoundScenes.tsx`
  - `EMFScenes.tsx`
  - `RadiationScenes.tsx`
- `SafeCanvas.tsx` handles WebGL context loss

### Physics/formulas placement
- formulas are scattered across pages/scenes as inline expressions
- no shared typed formula engine
- no unit tests for formulas

### State and data flow
- `AppContext.tsx` stores only test scores in memory
- no persistent progress or lab datasets
- no lab result table model

## 2) Production UX walkthrough status

- Target reviewed: `https://ls-labs.dragonscode.uz/themes`
- Limitation: current tooling fetches only SPA shell (client-rendered app), so content was validated through local run and source-route parity.

## 3) Critical Gaps vs Teacher Requirements

## Global gaps
- Theme set mismatch: project contains wrong numbering and extra topics (`id: 6`, "radiation/UHF"), while required is exactly 5 lessons.
- Main page does not expose direct "Theory / Lab / Test" actions per lesson card.
- No strong linkage to manual assets/tables/illustrations.
- Formula correctness and units are inconsistent between scenes/labs.
- No formula unit tests or golden-case checks.
- No e2e critical flow tests.

## Lesson-by-lesson baseline gaps

### Lesson 1 (Lighting investigation)
- Partial formulas present, but no strict structure "definition + formula + simulator + mistakes + mini-question".
- Pulsation handling is visual-only and not robustly tied to `Emax/Emin/Eavg`.
- Lab is not multi-step wizard and has no variant table integration.

### Lesson 2 (Lighting calculation)
- Contains only one simplified calculator path.
- Missing explicit side-by-side method comparison (utilization method vs specific power method).
- No student variant table 2.1 mapping by ticket digits.

### Lesson 3 (Noise intensity / sound insulation research)
- Current model uses simplified mass law only.
- Missing proper source-distance model, barrier reduction model from manual anchors, and logarithmic multi-source composition.
- Lab lacks structured experimental workflow and report generation.

### Lesson 4 (Noise calculation)
- Not separated as a dedicated calculation lesson.
- Missing strict algorithmic walkthrough and corrected summation by `LA + ΔL` table logic.

### Lesson 5 (EM radiation types)
- Current implementation mixes EM shielding/UHF/radiation topics.
- Missing required clean spectrum lesson (`λ = c/f`, `ППЭ = E*H`, 3 zones).
- No dedicated interactive zone visualization contract tied to formula block.

## 4) Existing code quality risks

- Existing lint errors in multiple files (unused vars, `any`, no-unused-expressions).
- Large JS bundle (single chunk warning).
- Text encoding issues visible in some source/docs (mojibake output in terminal).

## 5) Refactor targets (to be implemented)

- New strict Theme model:
  - `{ id, title, goal, theoryModules[], labWizard, tests[], assets[], references[] }`
- Dedicated formula engine:
  - `formulas/illumination.ts`
  - `formulas/noise.ts`
  - `formulas/emi.ts`
- New lesson UX:
  - home with 5 lesson cards + direct actions
  - lesson layout with TOC + search + module cards
  - lab wizard (8+ steps) + student variant autoload + report
  - test explanations and numeric tolerance
- Manual asset pipeline:
  - `public/assets/manual/images/*`
  - `public/assets/manual/asset-index.json`

## 6) Baseline Mapping "Current ↔ Required by Manual"

| Lesson | Current state before refactor | Required by manual |
|---|---|---|
| №1 Lighting investigation | Partial theory + simple sliders, no strict module structure, weak pulsation linkage | Full definitions, Φ/E/B formulas, pulsation through Emax/Emin/Eср, step wizard with measurement table |
| №2 Lighting calculation | Single simplified calculator path | Two methods минимум: utilization + specific power, variant table by ticket digit, layout comparison |
| №3 Noise investigation | Simplified scene, incomplete multi-source model | Distance model + barrier model + real-time multi-source effects in scene + table |
| №4 Noise calculation | Separate lesson absent | Dedicated strict algorithmic lesson with LA+ΔL and 1..3 source summation |
| №5 EM radiation types | Mixed with unrelated topics (UHF/radiation) | Clean EM spectrum lesson with λ=c/f, ППЭ=E×H, zone classification and practical cases |
