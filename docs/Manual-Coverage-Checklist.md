# Manual Coverage Checklist (БЖД_новая_практика_с_содержанием.pdf)

## Source extraction status
- PDF source: `d:\Downloads\БЖД_новая_практика_с_содержанием.pdf`
- Extracted text: `frontend/public/assets/manual/manual_text.txt`
- Extracted images: `frontend/public/assets/manual/images/*` (56 assets)
- Asset index: `frontend/public/assets/manual/asset-index.json`
- Parsed pages: 97

## Coverage rules
- Each key definition/formula must have:
  - plain Russian explanation
  - interactive mini-simulator
  - typical mistakes
  - units block
  - mini-question
- If table values are ambiguous after extraction:
  - mark `TODO: manual confirmation`
  - provide UI fallback for manual value input

## A) Definitions & formulas to transfer

| Block | Manual anchor | Status |
|---|---|---|
| Light flux | `Φ = I·ω` | In progress |
| Illuminance | `E = Φ/S` | In progress |
| Brightness | `B = I/S` | In progress |
| Pulsation coefficient | via `Emax, Emin, Eср` | In progress |
| Room suspension height | `Hp = H - 0.3` | In progress |
| Room index | `i = LB / (Hp(L+B))` | In progress |
| Utilization method `N` | from method formulas | In progress |
| Specific power method | `P = 40·B` + `N` | In progress |
| Noise distance model | `LR` from `L1` and `R` | In progress |
| Barrier reduction | `N` via `lg(G)` | In progress |
| Level composition | `LA + ΔL` (table) | In progress |
| EM wave relation | `λ = c / f` | In progress |
| Power flux density | `ППЭ = E×H` | In progress |
| EM zones | near/intermediate/far | In progress |

## B) Tables and student variants

| Table | Target use in app | Status |
|---|---|---|
| Lesson 2 input table (L, B, H, Φл, Eн by ticket digit) | Variant auto-fill for wizard step 0 | In progress |
| Noise correction table for `ΔL` | Summation helper in lesson 4 | In progress |
| Noise source scenario values (`L1` variants) | Variant seeds for lessons 3-4 | In progress |
| EM spectrum ranges and examples | Lesson 5 spectrum module | In progress |

Notes:
- `TODO: manual confirmation` for cells where extracted PDF text is distorted.
- UI fallback will allow manual editing in "Учебный режим" without blocking flow.

## C) Figures/illustrations from manual

| Requirement | Status |
|---|---|
| Extract all images from PDF to static assets | Done |
| Stable index with paths and metadata | Done |
| Human-readable captions and alt text | In progress (`TODO: manual caption review`) |
| Embed relevant figures in theory modules | In progress |

## D) Lesson-level coverage matrix

| Lesson | Theory modules | Mini simulators | Lab wizard 8+ steps | Variant auto-fill | Result table/report | Test with explanation |
|---|---|---|---|---|---|---|
| №1 Lighting investigation | In progress | In progress | In progress | In progress | In progress | In progress |
| №2 Lighting calculation | In progress | In progress | In progress | In progress | In progress | In progress |
| №3 Noise investigation | In progress | In progress | In progress | In progress | In progress | In progress |
| №4 Noise calculation | In progress | In progress | In progress | In progress | In progress | In progress |
| №5 EM radiation types | In progress | In progress | In progress | In progress | In progress | In progress |

## E) Validation checklist

| Validation | Status |
|---|---|
| Double-check formulas by text + units | In progress |
| Non-negative and range guards (lux/dB/etc.) | In progress |
| Golden cases from manual (3-5) | In progress |
| Unit tests for formulas | In progress |
| e2e critical user path | In progress |

