# FitTrack

Client-side fitness tracking app — React 18, Vite 4, Recharts, localStorage.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm run verify   # spec check + tests + build (run before every commit)
```

## Spec-driven development

FitTrack uses **SDD** — JSON specs in `spec/` are the source of truth; tests enforce them.

| Document | Contents |
|----------|----------|
| **[docs/CONSTITUTION.md](./docs/CONSTITUTION.md)** | Project rules — read first |
| **[docs/SDD-WORKFLOW.md](./docs/SDD-WORKFLOW.md)** | Commands, daily workflow, where to edit |
| [spec/manifest.json](./spec/manifest.json) | Machine-readable spec index |
| [AGENTS.md](./AGENTS.md) | Instructions for AI assistants |

**Key commands:** `npm test` · `npm run spec:check` · `npm run verify` · `npm run test:watch`

## Documentation

**Rebuilding from scratch?** Start here:

### [docs/RECONSTRUCTION.md](./docs/RECONSTRUCTION.md)

Complete guide to reproduce FitTrack identically in any IDE.

| Document | Contents |
|----------|----------|
| [docs/RECONSTRUCTION.md](./docs/RECONSTRUCTION.md) | Bootstrap steps, config files, build order, verification checklist |
| [docs/architecture.md](./docs/architecture.md) | Component hierarchy, data flow, routing, keyboard layers |
| [docs/data-model.md](./docs/data-model.md) | Full localStorage schema, formulas, date rules |
| [docs/source-index.md](./docs/source-index.md) | Every source file, exports, line counts |
| [docs/README.md](./docs/README.md) | Feature documentation index |

### Feature specs

- [Dashboard](./docs/dashboard.md)
- [Workout](./docs/workout.md) — calendar, smart parser, history, 1RM
- [Body Comp](./docs/body-comp.md)
- [Calories](./docs/calories.md)
- [Progress](./docs/progress.md) — charts, animation, session graphs
- [Styling](./docs/styling.md)
- [Shared utilities](./docs/shared-utilities.md)
- [Keyboard navigation](./docs/keyboard-navigation.md)

## Tech stack

- **React 18** + **Vite 4**
- **Recharts 2.8** (Progress page)
- **CSS Modules** + CSS variables
- **localStorage** key `ft_v5` (no backend)

## License

Private project (`package.json`: `"private": true`).
