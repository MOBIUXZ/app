# Spec-Driven Development — Workflow & Commands

Orbius uses **SDD**: specs in `spec/` define behavior; tests enforce them; code implements them.

Read the governing rules first: [CONSTITUTION.md](./CONSTITUTION.md).

---

## Daily Commands (Learn These)

### Development

| Command | What it does | When to use |
|---------|--------------|-------------|
| `npm install` | Install dependencies | First clone; after pulling package.json changes |
| `npm run dev` | Start Vite dev server (hot reload) | Active UI work |
| `npm run preview` | Serve production build locally | Check build before release |

### Spec & Quality Gate

| Command | What it does | When to use |
|---------|--------------|-------------|
| `npm run spec:check` | Validate all spec JSON files exist and parse | After editing anything in `spec/` |
| `npm run docs:check` | Validate docs reference specs and required files exist | After editing docs |
| `npm run theme:generate` | Regenerate `theme.css` from `spec/theme-tokens.json` | After changing theme tokens |
| `npm test` | Run all Vitest tests once | Before commit; after code/spec changes |
| `npm run test:watch` | Vitest in watch mode | TDD while editing parser/formulas |
| `npm run build` | Production bundle to `dist/` | Release check |
| **`npm run verify`** | **spec:check + docs:check + theme:generate + test + build** | **Always before pushing/merging** |
| `npm run test:visual` | Playwright pixel diff vs committed snapshots | After UI/CSS changes |
| `npm run test:visual:update` | Regenerate visual baselines | After intentional UI changes |
| `npm run test:visual:install` | Install Playwright Chromium | First time / CI setup |
| **`npm run verify:full`** | **verify + test:visual** | **Release gate before merge** |

See [MANUAL-QA.md](./MANUAL-QA.md) for the human exploratory checklist.

### Git (typical flow)

```bash
git status
git diff
git add spec/ tests/ src/ docs/
git commit -m "feat: describe what and why"
```

---

## The SDD Loop (Muscle Memory)

```
┌─────────────┐
│ 1. Edit     │  spec/*.json  (+ docs if user-facing)
│    SPEC     │
└──────┬──────┘
       ▼
┌─────────────┐
│ 2. Edit     │  tests/*.test.js (or rely on existing fixtures)
│    TESTS    │
└──────┬──────┘
       ▼
┌─────────────┐
│ 3. Run      │  npm test  →  see RED
│    npm test │
└──────┬──────┘
       ▼
┌─────────────┐
│ 4. Edit     │  src/domain/ or src/components/
│    CODE     │
└──────┬──────┘
       ▼
┌─────────────┐
│ 5. Run      │  npm run verify  →  all GREEN
│    verify   │
└─────────────┘
```

---

## Common Tasks — Where to Edit

| Task | Spec file | Code file | Test file |
|------|-----------|-----------|-----------|
| Add exercise alias | `spec/exercise-aliases.json` | (auto via `shared.jsx` import) | `tests/resolve-exercise.test.js` |
| Add parser format | `spec/parser-fixtures.json` | `src/components/shared.jsx` | `tests/parser.test.js` |
| Change e1RM formula | `spec/formula-fixtures.json` | `src/domain/metrics.js` | `tests/metrics.test.js` |
| Change body comp math | `spec/formula-fixtures.json` | `src/domain/metrics.js` | `tests/metrics.test.js` |
| Add exercise category | `spec/exercise-catalog.json` | (auto via `shared.jsx`) | `tests/spec-integrity.test.js` |
| Change storage key | `spec/app-config.json` | `src/App.jsx` | `tests/spec-integrity.test.js` |
| Change page title / section | `spec/page-layout.json` | page component | `tests/page-layout.test.js` |
| Change page title icon | `spec/page-icons.json` | `src/components/PageIcon.jsx` | `tests/page-icons.test.js` |
| Add CSS module class | `spec/css-modules.json` | `*.module.css` | `tests/css-modules.test.js` |
| Change keyboard CSS class | `spec/global-styles.json` | `global.css` | `tests/global-styles.test.js` |
| Add visual snapshot | `spec/visual-regression.json` | (Playwright e2e) | `tests/visual-regression.test.js` |
| Manual release checklist item | `spec/manual-qa-checklist.json` | — | `tests/manual-qa-checklist.test.js` |

---

## Project Layout (SDD View)

```
ORBIUS/
├── spec/                 ← SOURCE OF TRUTH (JSON)
│   ├── manifest.json
│   ├── exercise-aliases.json
│   ├── exercise-catalog.json
│   ├── app-config.json
│   ├── data-model.schema.json
│   ├── parser-fixtures.json
│   ├── formula-fixtures.json
│   ├── resolve-exercise-fixtures.json
│   ├── page-layout.json
│   ├── css-modules.json
│   ├── global-styles.json
│   ├── ui-module.json
│   ├── style-helpers.json
│   ├── visual-regression.json
│   ├── visual-seed-data.json
│   ├── manual-qa-checklist.json
│   └── file-tree.json
├── tests/                ← ENFORCEMENT (Vitest, 256 tests)
├── e2e/                  ← VISUAL REGRESSION (Playwright)
├── src/
│   ├── domain/pageLayout.js  ← layout spec loader
│   └── components/         ← UI + parser
├── scripts/
│   └── verify-spec.mjs
└── docs/
    ├── CONSTITUTION.md     ← rules
    └── SDD-WORKFLOW.md     ← this file
```

---

## Vitest Tips

- **Run one file:** `npx vitest run tests/parser.test.js`
- **Filter by name:** `npx vitest run -t "obsidian-date"`
- **Watch mode:** `npm run test:watch` then press `a` to run all, `f` to filter

---

## CI Recommendation (Optional)

Add a GitHub Action that runs on every PR:

```yaml
- run: npm ci
- run: npm run verify
```

---

## Checklist Before Every PR

- [ ] Spec updated (if behavior/constants changed)
- [ ] Tests updated or added
- [ ] `npm run verify` passes
- [ ] `npm run verify:full` passes (if UI/visual changes)
- [ ] `docs/*.md` updated if user-visible
- [ ] `spec/file-tree.json` updated if files added/removed
