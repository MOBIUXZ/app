# FitTrack — Feature Documentation

FitTrack is a client-side fitness tracking web app built with **React** and **Vite**. All data is stored locally in the browser using `localStorage` (key: `ft_v5`).

## Navigation

| Page | File | Description |
|------|------|-------------|
| Dashboard | [dashboard.md](./dashboard.md) | At-a-glance stats, PRs, and recent workouts |
| Workout | [workout.md](./workout.md) | Logging, calendar, smart parser, history, 1RM calculator |
| Body Comp | [body-comp.md](./body-comp.md) | Body composition logging and derived metrics |
| Calories | [calories.md](./calories.md) | Food logging, macros, BMR/TDEE, daily goals |
| Progress | [progress.md](./progress.md) | Exercise charts, compound/isolation tracking, trends |
| Styling | [styling.md](./styling.md) | CSS modules, theme tokens, shared UI patterns |
| Shared Utilities | [shared-utilities.md](./shared-utilities.md) | Smart parser, exercise resolution, compound lifts, data helpers |
| Keyboard Navigation | [keyboard-navigation.md](./keyboard-navigation.md) | Arrow keys, Enter, page shortcuts, focus highlights |

## App Structure

```
FitTrack
├── Dashboard    — Summary hub
├── Workout      — Training log & tools
├── Body Comp    — Composition measurements
├── Calories     — Nutrition tracking
└── Progress     — Charts & analytics
```

## Data Model

All pages read/write a single data object:

```json
{
  "workouts": [],
  "bodyLogs": [],
  "bodyComp": [],
  "calories": []
}
```

### Workout entry

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

Sets may include an optional `side` field: `"left"`, `"right"`, or `"both"`.

## Tech Stack

- **React 18** — UI components
- **Recharts** — Line charts on Progress page
- **Vite** — Build tool
- **localStorage** — Persistent storage (no backend)

## Key Conventions

- **Main navigation** — five pages in a segmented pill track; active tab is a gradient purple pill (see [keyboard-navigation.md](./keyboard-navigation.md#main-navigation)).
- **Compound lifts** (Squat, Bench Press, Deadlift, etc.) display in ALL CAPS in the UI (e.g. `SQUATS`, `PUSHPRESS`, `BARBELL ROWS`).
- **Exercise names** are normalized via aliases (e.g. `pushpress` → Push Press, `barbell rows` → Barbell Row).
- **Dates** are stored as `DD-MM-YYYY` for workouts; calorie entries use locale date strings.
- **Number inputs** do not change on mouse wheel scroll while focused; spinner arrows are hidden (see [styling.md](./styling.md#number-inputs)).
- **Collapse panels** use `12px` top padding inside the body so the first field (e.g. Date on Body Comp **Log Entry**) is not flush against the header (see [styling.md](./styling.md#collapse-panels)).
- **Workout History** groups default to expanded; **Expand all / Collapse all** works in a single click (see [workout.md](./workout.md#grouping)).
- **Progress → Workout Details** best set uses label **Best e1RM {value}** (green), matching the chart metric toggle (see [progress.md](./progress.md#set-list-per-workout)).
- **Progress tab** stays mounted in the DOM after the first visit (hidden when inactive) for faster return navigation; charts lazy-load as you scroll (see [progress.md](./progress.md#performance)).
