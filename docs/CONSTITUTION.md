# Orbius Constitution

This document is the **governing law** of the Orbius project. All contributors (human and AI) must follow it.

---

## Article I — Specs Are Source of Truth

1. **Machine-readable specs** in `spec/` define contracts that code must satisfy.
2. **Human docs** in `docs/` explain specs for reconstruction and feature work; they must stay aligned with `spec/`.
3. **Application code** in `src/` implements specs; it is not the authority for constants, formulas, or parser behavior.
4. When spec and code disagree, **fix code** (or update spec first, then code and tests together). Never leave drift.

### Canonical spec files

| File | Governs |
|------|---------|
| `spec/manifest.json` | Index of all specs and test suites |
| `spec/exercise-aliases.json` | Smart Parser alias → canonical exercise names |
| `spec/exercise-catalog.json` | Categories, compound lifts, colors, TDEE levels |
| `spec/app-config.json` | Storage key, defaults, chart animation constants |
| `spec/data-model.schema.json` | `ft_v5` localStorage schema |
| `spec/parser-fixtures.json` | `parseWorkoutText()` input/output contract |
| `spec/formula-fixtures.json` | e1RM, session metrics, body comp formulas |
| `spec/resolve-exercise-fixtures.json` | `resolveExercise()` normalization rules |
| `spec/file-tree.json` | Required project files |

---

## Article II — Change Order (Non-Negotiable)

Every feature, fix, or refactor follows this sequence:

```
1. SPEC     → Update or add spec JSON + docs
2. TEST     → Add/update tests in tests/ (fixtures drive assertions)
3. CODE     → Implement in src/
4. VERIFY   → npm run verify (must pass before merge)
5. DOCS     → Update affected docs/*.md if behavior is user-visible
```

**Forbidden:** changing parser logic, formulas, aliases, or persistence without updating the matching spec and tests.

---

## Article III — Testing Requirements

1. **`npm test`** must pass — all fixture-driven tests green.
2. **`npm run spec:check`** must pass — all spec files exist and are valid JSON.
3. **`npm run build`** must pass — production bundle compiles.
4. New parser formats → add case to `spec/parser-fixtures.json` **before** coding.
5. New exercises/aliases → add to `spec/exercise-aliases.json` or `spec/exercise-catalog.json` **before** coding.
6. New formulas → add vectors to `spec/formula-fixtures.json` and implement in `src/domain/metrics.js`.

---

## Article IV — Code Organization

| Layer | Location | Rule |
|-------|----------|------|
| Specs | `spec/` | JSON only; no imports from `src/` |
| Domain logic | `src/domain/` | Pure functions; tested against fixtures |
| UI | `src/components/` | React; imports domain + spec-backed constants via `shared.jsx` |
| Styles | `src/styles/` | CSS modules + theme tokens |
| Tests | `tests/` | Vitest; read fixtures from `spec/` |
| Scripts | `scripts/` | Verification helpers |

Constants that appear in multiple places (aliases, categories, storage key) **must** live in `spec/` and be imported — never duplicated inline.

---

## Article V — Documentation

1. `docs/RECONSTRUCTION.md` — rebuild from zero using specs + docs.
2. `docs/data-model.md` — human-readable companion to `data-model.schema.json`.
3. `docs/SDD-WORKFLOW.md` — daily commands and habits.
4. `docs/source-index.md` — file inventory; update when adding/removing source files and `spec/file-tree.json`.

---

## Article VI — Spec Coverage Map

| Layer | Spec source | Test suite |
|-------|-------------|------------|
| Exercise aliases & catalog | `spec/exercise-*.json` | `resolve-exercise`, `spec-integrity` |
| Theme / CSS variables | `spec/theme-tokens.json` | `theme` |
| Persistence & config | `spec/app-config.json`, `data-model.schema.json` | `spec-integrity`, `parser` |
| Smart Parser | `spec/parser-fixtures.json` (13+ cases) | `parser` |
| Progress formulas | `spec/formula-fixtures.json` | `metrics` |
| 1RM calculator | `spec/one-rm-formulas.json` | `one-rm` |
| Dashboard / Calories / Body sync | `spec/ui-behavior-fixtures.json` | `ui-behavior` |
| Chart domain & animation | `spec/chart-domain.json`, `app-config` | `chart-domain` |
| Keyboard shortcuts | `spec/keyboard-shortcuts.json` | `keyboard-shortcuts` |
| Page layout & titles | `spec/page-layout.json` | `page-layout` |
| CSS module classes | `spec/css-modules.json` | `css-modules` |
| Global.css keyboard/base | `spec/global-styles.json` | `global-styles` |
| Shared UI module | `spec/ui-module.json` | `ui-module` |
| Style helper exports | `spec/style-helpers.json` | `style-helpers` |
| Project layout | `spec/file-tree.json` | `file-tree` |

All definable layers — behavior, constants, layout labels, CSS class contracts, theme tokens, **visual snapshots** — are spec-driven and tested via `npm run verify` (240+ unit tests) and `npm run test:visual` (Playwright pixel diff).

| Visual / QA | `spec/visual-regression.json`, `spec/visual-seed-data.json`, `spec/manual-qa-checklist.json` | Playwright `e2e/visual.spec.js` |

Release gate: **`npm run verify:full`** = verify + visual regression.

---

## Article VII — AI Assistant Rules

1. Read `docs/CONSTITUTION.md` and `spec/manifest.json` before non-trivial changes.
2. Never edit `src/` constants that belong in `spec/` without editing the spec file first.
3. Run `npm run verify` after substantive changes.
4. Prefer extending fixtures over adding one-off test assertions.

---

*Ratified: August 2026. Amend by updating this file and `spec/manifest.json` together.*
