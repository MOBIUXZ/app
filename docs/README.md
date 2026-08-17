# Orbius — Feature Documentation

Orbius is a client-side fitness tracking web app built with **React** and **Vite**. All data is stored locally in the browser using `localStorage` (key: `ft_v5`).

---

## Spec-driven development

| Document | Purpose |
|----------|---------|
| **[CONSTITUTION.md](./CONSTITUTION.md)** | Governing rules — specs are source of truth |
| **[SDD-WORKFLOW.md](./SDD-WORKFLOW.md)** | Commands (`npm test`, `npm run verify`) and change workflow |
| [../spec/manifest.json](../spec/manifest.json) | Index of all machine-readable specs |

---

## Reconstruction (start here for full rebuild)

| Document | Purpose |
|----------|---------|
| **[RECONSTRUCTION.md](./RECONSTRUCTION.md)** | Master guide — bootstrap, config files, build order, verification checklist |
| [architecture.md](./architecture.md) | System design, component tree, data flow |
| [data-model.md](./data-model.md) | Complete schema, formulas, date format rules |
| [source-index.md](./source-index.md) | Every file in the repo with exports and line counts |

---

## Feature docs (by page)

| Page | File | Description |
|------|------|-------------|
| Dashboard | [dashboard.md](./dashboard.md) | At-a-glance stats, PRs, and recent workouts |
| Workout | [workout.md](./workout.md) | Logging, calendar, smart parser, history, 1RM calculator |
| Body Comp | [body-comp.md](./body-comp.md) | Body composition logging and derived metrics |
| Calories | [calories.md](./calories.md) | Food logging, macros, BMR/TDEE, daily goals |
| Progress | [progress.md](./progress.md) | Exercise charts, compound/isolation tracking, trends |

## Cross-cutting docs

| Topic | File |
|-------|------|
| CSS architecture | [styling.md](./styling.md) |
| Smart parser, exercises, hooks | [shared-utilities.md](./shared-utilities.md) |
| Keyboard & popup layers | [keyboard-navigation.md](./keyboard-navigation.md) |

---

## App Structure

```
Orbius
├── Dashboard    — Summary hub
├── Workout      — Training log & tools
├── Body Comp    — Composition measurements
├── Calories     — Nutrition tracking
└── Progress     — Charts & analytics
```

Entry: `src/main.jsx` → `App.jsx` (tab routing, no React Router).

---

## Data Model

All pages read/write a single object persisted at `localStorage["ft_v5"]`:

```json
{
  "workouts": [],
  "bodyLogs": [],
  "bodyComp": [],
  "calories": []
}
```

Full schema with computed fields, formulas, and date quirks: **[data-model.md](./data-model.md)**

### Workout entry (summary)

```json
{
  "exercise": "Squat",
  "date": "11-08-2026",
  "time": "7:52",
  "note": "",
  "sets": [
    { "weight": 100, "reps": 5, "time": "7:52", "note": "", "side": "both" }
  ]
}
```

Sets may include optional `side`: `"left"`, `"right"`, or `"both"`.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| UI | React 18 |
| Build | Vite 4 |
| Charts | Recharts 2.8 (Progress only) |
| Styling | CSS Modules + `theme.css` variables |
| Storage | localStorage (no backend) |

Dependencies: see `package.json` in [RECONSTRUCTION.md](./RECONSTRUCTION.md#root-config-files).

---

## Key Conventions

- **Main navigation** — five pages in a segmented pill track; active tab is a gradient purple pill (see [keyboard-navigation.md](./keyboard-navigation.md#main-navigation)).
- **Compound lifts** (Squat, Bench Press, Deadlift, etc.) display in ALL CAPS in the UI (e.g. `SQUATS`, `PUSHPRESS`, `BARBELL ROWS`).
- **Exercise names** are normalized via aliases (e.g. `pushpress` → Push Press, `barbell rows` → Barbell Row). Full alias list in source: `shared.jsx`.
- **Dates** — workouts/body use `DD-MM-YYYY`; calorie entries use locale date strings (see [data-model.md](./data-model.md#date-format-rules-critical)).
- **Number inputs** do not change on mouse wheel scroll while focused; spinner arrows are hidden (see [styling.md](./styling.md#number-inputs)).
- **Collapse panels** use `12px` top padding inside the body (see [styling.md](./styling.md#collapse-panels)).
- **Workout History** groups default to expanded; **Expand all / Collapse all** persists across **By Date** / **By Workout** (see [workout.md](./workout.md#grouping)).
- **Progress → Workout Details** best set uses **Best e1RM {value}** (green), matching chart toggles (see [progress.md](./progress.md#set-list-per-workout)).
- **Progress tab** stays mounted after first visit; charts lazy-load, appear instantly, morph 600ms on metric toggle (see [progress.md](./progress.md#performance)).

---

## Source file map

Complete inventory: **[source-index.md](./source-index.md)**

```
src/
├── main.jsx, App.jsx, App.module.css
├── styles/          theme, global, ui.module, styleHelpers
└── components/
    ├── shared.jsx
    ├── DashboardPage.*
    ├── WorkoutPage.*
    ├── BodyCompPage.*
    ├── CaloriePage.*
    └── ProgressPage.*
```

---

## Document maintenance

When changing the application, update the matching feature doc **and** [data-model.md](./data-model.md) / [source-index.md](./source-index.md) / [RECONSTRUCTION.md](./RECONSTRUCTION.md) as needed so reconstruction docs stay accurate.
