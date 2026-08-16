# FitTrack Agent Instructions

Before making non-trivial changes, read:

1. [docs/CONSTITUTION.md](docs/CONSTITUTION.md) — project law
2. [spec/manifest.json](spec/manifest.json) — spec index
3. [docs/SDD-WORKFLOW.md](docs/SDD-WORKFLOW.md) — commands and change order

## Required workflow

1. **Spec first** — edit `spec/*.json` before `src/`
2. **Tests** — extend fixtures in `spec/`; tests in `tests/` assert against them
3. **Code** — implement in `src/domain/` (formulas) or `src/components/` (UI/parser)
4. **Verify** — run `npm run verify` before finishing

## Never

- Duplicate constants from `spec/` inline in source files
- Change parser/formulas/storage without matching spec + test updates
- Skip `npm run verify` after substantive edits

## Key paths

- Constants: `spec/exercise-catalog.json`, `spec/exercise-aliases.json`, `spec/app-config.json`
- Formulas: `src/domain/metrics.js` ↔ `spec/formula-fixtures.json`
- Parser: `parseWorkoutText()` in `shared.jsx` ↔ `spec/parser-fixtures.json`
- Layout: page components ↔ `spec/page-layout.json` via `src/domain/pageLayout.js`
- CSS: `*.module.css` ↔ `spec/css-modules.json`
