# Orbius — Full Reconstruction Guide

Use this document to rebuild Orbius **identically** in any IDE, with or without prior context. It is the **master index** for all specifications.

> **Canonical rule:** If this guide conflicts with a feature doc, **feature docs win for behavior** and **source files win for exact code**. When in doubt, compare against the file tree in [source-index.md](./source-index.md).

---

## 1. What You Are Building

| Property | Value |
|----------|-------|
| Name | Orbius |
| Type | Single-page React app (no backend, no router library) |
| Storage | Browser `localStorage` key `ft_v5` |
| Pages | Dashboard, Workout, Body Comp, Calories, Progress |
| Charts | Recharts 2.x on Progress page only |
| Styling | CSS Modules + CSS variables (`theme.css`) |

---

## 2. Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ recommended |
| npm | 9+ (ships with Node) |

No database, env file, or API keys required.

---

## 3. Bootstrap (Empty → Runnable)

### Step 1 — Create project folder

```bash
mkdir orbius && cd orbius
```

### Step 2 — Create root config files

Create these **exactly** (see [Root config files](#root-config-files) below):

- `package.json`
- `vite.config.js`
- `index.html`
- `.gitignore`

### Step 3 — Install dependencies

```bash
npm install
```

Expected packages: `react@^18.2.0`, `react-dom@^18.2.0`, `recharts@^2.8.0`, `vite@^4.4.0`, `@vitejs/plugin-react@^4.0.0`.

### Step 4 — Create source tree

Create every file listed in [source-index.md](./source-index.md) under `src/`. **Build order matters:**

```
1. src/styles/theme.css
2. src/styles/global.css
3. src/styles/styleHelpers.js
4. src/styles/ui.module.css
5. src/components/shared.jsx          ← largest shared dependency
6. src/App.module.css
7. src/App.jsx
8. src/main.jsx
9. Page components (any order, but WorkoutPage last is fine):
   - DashboardPage.module.css + DashboardPage.jsx
   - BodyCompPage.module.css + BodyCompPage.jsx
   - CaloriePage.module.css + CaloriePage.jsx
   - ProgressPage.module.css + ProgressPage.jsx  ← largest page
   - WorkoutPage.module.css + WorkoutPage.jsx    ← largest page
```

Each `.jsx` file imports its co-located `.module.css` and shared utilities from `shared.jsx`.

### Step 5 — Verify

```bash
npm run dev      # http://localhost:5173 — all 5 tabs load
npm run build    # exits 0, outputs dist/
npm run preview  # serves production build
```

Use the [Verification checklist](#verification-checklist) before considering the rebuild complete.

---

## Root config files

### `package.json`

```json
{
  "name": "orbius",
  "version": "1.0.0",
  "description": "A comprehensive fitness tracking application",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.8.0"
  },
  "devDependencies": {
    "vite": "^4.4.0",
    "@vitejs/plugin-react": "^4.0.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### `vite.config.js`

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

### `index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Orbius — Always in orbit. Always evolving.</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### `.gitignore`

```
node_modules/
dist/
.env
```

---

## 4. Application Entry & Shell

Documented in [architecture.md](./architecture.md). Critical behaviors:

| Concern | Implementation |
|---------|----------------|
| Mount | `main.jsx` → `StrictMode` → `KeyboardLayerProvider` → `App` |
| Global CSS | `import './styles/global.css'` in `main.jsx` only |
| Navigation | `App.jsx` conditional render by `tab` string (not React Router) |
| Persistence | `loadData()` / `persistStoredData()` via `save()` in `App.jsx`, key `ft_v5` |
| Progress perf | `progressMounted` — Progress page stays in DOM after first visit |

---

## 5. Data & Business Logic

| Topic | Document |
|-------|----------|
| Full schema, formulas, date quirks | [data-model.md](./data-model.md) |
| Smart parser, exercises, keyboard | [shared-utilities.md](./shared-utilities.md) |
| Per-page features | Feature docs (see §6) |

**Critical quirk:** Workouts and body comp use `DD-MM-YYYY` via `formatDate()`. Calorie entries and Dashboard "today" use `toLocaleDateString()` (browser locale). Progress charts accept both via `parseChartDate()`.

---

## 6. Feature Documentation Map

Read these for **every UI behavior, formula, and edge case**:

| Page / Area | Document |
|-------------|----------|
| Overview & conventions | [README.md](./README.md) |
| System design | [architecture.md](./architecture.md) |
| Every source file | [source-index.md](./source-index.md) |
| Dashboard | [dashboard.md](./dashboard.md) |
| Workout (calendar, parser, history, 1RM) | [workout.md](./workout.md) |
| Body composition | [body-comp.md](./body-comp.md) |
| Calories & TDEE | [calories.md](./calories.md) |
| Progress charts | [progress.md](./progress.md) |
| CSS architecture | [styling.md](./styling.md) |
| Keyboard & layers | [keyboard-navigation.md](./keyboard-navigation.md) |

---

## 7. Styling System

Orbius uses **CSS Modules** (not Tailwind, not inline-only).

| Layer | File | Role |
|-------|------|------|
| Tokens | `src/styles/theme.css` | All `--ft-*` CSS variables |
| Global | `src/styles/global.css` | Reset, keyboard classes, number-input rules |
| Shared UI | `src/styles/ui.module.css` | Buttons, inputs, cards, modals, utilities |
| Helpers | `src/styles/styleHelpers.js` | `cx()`, `btnPrimaryClass()`, `inputClass()`, etc. |
| Page-specific | `*.module.css` next to each page component | Layout unique to that page |
| App shell | `src/App.module.css` | Header (logo + settings gear), nav pill track |

Import pattern in JSX:

```javascript
import ui, { cx, btnPrimary, inp } from "./shared.jsx";  // re-exports style helpers
import s from "./WorkoutPage.module.css";
```

Full class inventory: [styling.md](./styling.md).

---

## 8. Shared Module (`shared.jsx`)

Single file (~720 lines) exporting:

- Color constants (`ACCENT`, `GREEN`, `PINK`, `ORANGE`, `BLUE`)
- Exercise catalogs (`EXERCISE_CATEGORIES`, `COMPOUND_LIFTS`, `NO_SPLIT_LIFTS`, `ALL_EXERCISES`)
- `EXERCISE_CHART_COLORS`, `ACTIVITY`, `MONTH_MAP`
- Exercise helpers: `resolveExercise`, `formatExerciseName`, `isCompoundLift`, `isNoSplitLift`, `getExerciseChartColor`
- Smart parser: `parseWorkoutText`, `formatDate`, `restStr`
- Keyboard system: `KeyboardLayerProvider`, `useKeyboardLayer`, `useAppNavKeyboard`, `useKeyboardListNav`, `useConfirmDialogKeyboard`, etc.
- UI components: `Card`, `StatBox`, `Collapse`

**The alias table (`EXERCISE_ALIASES`) and parser logic live only in source** — see [shared-utilities.md](./shared-utilities.md) for behavior spec; copy `shared.jsx` verbatim for exact alias coverage.

Complete export list: [source-index.md](./source-index.md#sharedjsx).

---

## 9. Progress Page (Most Complex)

`ProgressPage.jsx` (~1109 lines) — specifications split across:

- [progress.md](./progress.md) — user-facing features, chart colors, animation
- [architecture.md](./architecture.md) — component hierarchy inside Progress
- [source-index.md](./source-index.md#progresspagejsx) — internal helpers

Key implementation facts:

- `MemoExerciseChart` = `memo(ExerciseChart)`
- Lazy mount via `useInView()` + `.chartPlaceholder`
- Metric morph: `withTrendPlotValue()` + `animationId={metric}` + `useTrendChartAnimation()`
- e1RM everywhere on Progress uses **Epley only**: `weight × (1 + reps/30)`
- 1RM Calculator on Workout page supports 5 formulas (separate from Progress)

---

## 10. Verification Checklist

After rebuild, confirm **all** of the following:

### Spec-driven gate (required)
- [ ] `npm run verify` passes (spec check + 73 tests + production build)
- [ ] `spec/manifest.json` lists all JSON specs; code imports from `spec/` (not inline constants)

### Build & boot
- [ ] `npm run build` succeeds with no errors
- [ ] App loads at `localhost:5173` with dark theme and 5 nav tabs

### Persistence
- [ ] Log a workout → refresh → data persists
- [ ] `localStorage.getItem("ft_v5")` returns valid JSON with four arrays

### Dashboard
- [ ] Shows body weight, BF%, today cals, workout count
- [ ] PR list sorted by max weight per exercise
- [ ] Recent workouts (last 3)

### Workout
- [ ] Manual log with sets saves correctly
- [ ] Smart Parser parses date + exercise + sets (test: `ohp` alias → Overhead Press)
- [ ] Calendar opens, shows logged days
- [ ] History search, edit, delete, clear-with-confirm
- [ ] 1RM calculator with formula picker + logged-set picker

### Body Comp
- [ ] Live computed metrics (BMI, FFMI, BMR) update as you type
- [ ] Entry saves to `bodyComp` and appends matching `bodyLogs` row
- [ ] Edit/delete syncs `bodyLogs`
- [ ] Import InBody CSV merges scans by date (workouts stay)

### Calories
- [ ] BMR from latest body comp entry
- [ ] Activity level changes TDEE
- [ ] Food log for selected date, macro totals, goal progress bar

### Progress
- [ ] Compound lifts section (ALL CAPS names, compound badge)
- [ ] Isolation lifts section
- [ ] Combined compound overlay (when ≥2 compounds logged)
- [ ] Metric toggles morph 600ms; first scroll-in is instant
- [ ] Click chart point → Workout Details → Session Performance graph
- [ ] Footer: body weight, body fat (if data), InBody trends (SMM / FM / visceral / score when present), 7-day calories

### Keyboard
- [ ] `1`–`5` switches tabs (when no popup open)
- [ ] `Esc` closes popups in order (session graph before day modal)
- [ ] Confirm dialogs: arrow keys switch Cancel/Clear

### Styling
- [ ] Number inputs: no wheel change while focused, no spinner arrows
- [ ] Nav active tab = purple gradient pill

---

## 11. Reconstruction Strategies

| Strategy | When to use | Fidelity |
|----------|-------------|----------|
| **Git clone / copy repo** | Fastest, production use | 100% |
| **Copy `src/` tree from known-good commit** | Rebuild tooling from scratch | 100% code |
| **Follow this guide + feature docs** | No source available | Requires implementing each file per specs |
| **Hybrid** | New Vite project + paste `src/` + root configs | 100% |

For **zero data loss** of *behavior*, you need: all files in [source-index.md](./source-index.md) + all docs in §6.

---

## 12. What Is NOT in Orbius

Document these absences so rebuilds do not add unrequested features:

- No backend / API / auth
- No React Router (tab state in `App.jsx`)
- No TypeScript
- No test suite
- No env-based config
- No Sessions/Time x-axis toggle on Progress (equal spacing per logged date only)
- No cloud sync or export/import UI
- No `ft_v5` migration from older storage keys (key name is fixed; no migration code)

---

## 13. Document Maintenance

When changing the app, update **in the same PR**:

1. The relevant feature doc (`workout.md`, etc.)
2. [data-model.md](./data-model.md) if schema changes
3. [source-index.md](./source-index.md) if files added/removed
4. [architecture.md](./architecture.md) if structure changes
5. This file if bootstrap steps or dependencies change
