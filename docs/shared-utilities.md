# Shared Utilities

Core logic shared across all Orbius pages lives in `src/components/shared.jsx`.

> **Reconstruction:** Full export list and line count in [source-index.md](./source-index.md#componentssharedjsx). Complete alias table is in source only — copy `shared.jsx` verbatim for identical parser behavior.

## Data Persistence

| Key | Storage |
|-----|---------|
| `ft_v5` | `localStorage` JSON blob |

Data structure:
```json
{
  "workouts": [],
  "bodyLogs": [],
  "bodyComp": [],
  "calories": []
}
```

## Exercise Resolution

### `resolveExercise(raw)`

Normalizes any exercise string to a canonical name:

1. Strips markdown wrappers (`==`, `**`, `[[]]`)
2. Checks alias table (case-insensitive)
3. Fuzzy-matches against preset exercise list
4. Falls back to title-case formatting

**Example aliases:**

| Input | Resolved |
|-------|----------|
| `ohp`, `overhead press` | Overhead Press |
| `bp`, `bench press` | Bench Press |
| `squat`, `squats`, `sq` | Squat |
| `deadlift`, `deadlifts`, `dl` | Deadlift |
| `barbell rows`, `bb row`, `row` | Barbell Row |
| `pushpress`, `push press` | Push Press |
| `bw pushups`, `bw pullups`, `bw dips` | Push-up, Pull-up, Dip |
| `wtd pushups`, `wtd pullups` | Weighted Push-up, Weighted Pull-up |
| `rear delt machine lfyes` | Rear Delt Machine Fly (typo-tolerant) |
| `single arm latpulldown` | Single Arm Lat Pulldown |

### `formatExerciseName(exercise)`

Display formatter for the UI:

- **Compound lifts** → ALL CAPS with custom names where defined
- **Isolation lifts** → title case

| Canonical | Display |
|-----------|---------|
| Overhead Press | OVERHEAD PRESS |
| Push Press | PUSHPRESS |
| Barbell Row | BARBELL ROWS |
| Squat | SQUATS |
| Deadlift | DEADLIFTS |
| Bench Press | BENCH PRESS |
| Other compounds | UPPERCASE |
| Isolation | Title Case |

### `getExerciseChartColor(exercise, fallbackIdx?)`

Returns a consistent hex color for Progress chart lines, badges, and PR stats. Uses `resolveExercise()` first.

**Source of truth:** `EXERCISE_CHART_COLORS` in `shared.jsx`.

| Exercise | Color | Hex |
|----------|-------|-----|
| Overhead Press | Red | `#ef4444` |
| Barbell Row | Green | `#22c55e` |
| Push Press | Yellow | `#eab308` |
| Bench Press | Orange | `#fb923c` |
| Squat | Blue | `#3b82f6` |
| Deadlift (incl. Sumo/Romanian via `"Deadlift"` in name) | Purple | `#a78bfa` |
| Other lifts | Rotating fallback palette, or `ACCENT` | — |

Used by individual exercise charts and the combined compound lifts overlay so colors stay in sync.

#### Do not change colors

- **Do not modify** the six fixed hex values in `EXERCISE_CHART_COLORS` without an explicit product decision — these are user-facing conventions (squats = blue, deadlifts = purple, etc.).
- **Do not hardcode** lift line colors in components. Always call `getExerciseChartColor(exercise)`.
- **Do not use index-based color arrays** (e.g. `COLORS[idx]`) for compound lifts — list order must not affect color.
- To give a new lift a permanent color, add **one row** to `EXERCISE_CHART_COLORS` — never a second map in another file.

Full chart-color policy: [progress.md](./progress.md) → Chart Colors.

### `isCompoundLift(exercise)`

Returns `true` if the exercise is in the `COMPOUND_LIFTS` list.

### `isNoSplitLift(exercise)`

Returns `true` for bilateral barbell compounds that should not show the left/right split chart toggle:

Squat, Bench Press, Deadlift, Overhead Press, Barbell Row, Push Press, and common variants (Pause Squat, Sumo Deadlift, Front Squat, etc.).

## Compound Lifts List

```
Squat, Bench Press, Deadlift, Overhead Press, Push Press, Barbell Row,
Clean & Jerk, Snatch, Power Clean, Power Snatch, Front Squat, Overhead Squat,
Log Press, Axle Press, Yoke Carry, Farmer's Walk,
Sumo Deadlift, Romanian Deadlift, Good Morning, Box Squat, Floor Press,
Pause Squat, Pause Bench
```

## Smart Parser

### `parseWorkoutText(text)`

Parses free-form workout notes into structured entries.

#### Supported Date Formats
- `# 11 AUGUST 2026` (Obsidian markdown headers)
- `11 August 2026` / `August 11, 2026`
- `YYYY-MM-DD` / `YYYY/MM/DD`
- `DD-MM-YYYY` / `DD/MM/YYYY`

#### Supported Exercise Headers
- `==BARBELL ROWS==`
- `**Exercise Name**`
- Plain text lines (non-numeric)

#### Supported Set Formats
```
60KG - 10REPS 7:52
60kg - 8 reps (easy)
100KG - 6 1/2REPS
80KG - 4 OR 5REPS
60KG - ( RIGHT - 7REPS , LEFT - 5REPS ) 8:28
45KG - 12REPS.8:54
55KG - 6:34                    (time-only → 1 rep with timestamp)
20KG - 10 + REPS               (plus notation)
50KG - racked, but failed      (0 reps)
{ 60KG - 7REPS 50KG - 2REPS } DROPSET
```

#### Bodyweight & Weighted Calisthenics
```
BW = 68KG ==BW PUSHUPS== - 34REPS
==BW PUSHUPS==
BW = 68KG - 37REPS
BW = 68KG WEIGHTED = 5.35KG ==WTD PUSHUPS== - 27REPS
BW = 68 WEIGHTED 10KG ==WTD PULLUPS== - 4 PARTIAL REPS
BW = 68KG ==BW ELBOW PLANK HOLD== - 60 SECONDS
BW = 65-68KG                     (stores bodyweight context only)
```

- `BW = XKG` sets bodyweight context for subsequent sets under an exercise header
- Inline `==EXERCISE==` on a BW line starts a new exercise entry
- Weighted lines add vest/plate weight to bodyweight for total load
- `SECONDS` / hold durations are stored as reps with a `hold` note

#### Set Parsing Features
- Weight in kg (with or without `KG` suffix)
- Rep counts including fractional (`6 1/2`), range (`4 OR 5`), plus (`10 + REPS`), and partial (`4 PARTIAL REPS`)
- Time holds (`60 SECONDS`, `10SECONDS`) → reps = seconds, note = hold
- Failed / partial attempts without rep counts → **0 reps** (not 1)
- Soft failures: `racked but failed`, `partial`, `just racked`, `could not rack`
- Per-set timestamps (`7:52`, `12REPS.8:54`, time-only lines)
- Left/right side detection → separate sets with `side: "left"` or `"right"`
- Sets without side info → `side: "both"`
- Dropsets: brace-wrapped multi-set lines tagged with `dropset` note
- Multi-line continuation notes (e.g. partial lockout on next line) appended to prior set
- Set notes extracted from remaining text

#### Output Structure
```json
{
  "date": "11-08-2026",
  "entries": [
    {
      "exercise": "Barbell Row",
      "date": "11-08-2026",
      "time": "",
      "sets": [
        { "weight": 60, "reps": 10, "time": "7:52", "note": "", "side": "both" }
      ]
    }
  ]
}
```

## Date Helpers

### `formatDate(date)`
Formats dates as `DD-MM-YYYY`.

Workout History **Newest / Oldest** parses those strings with `parseStoredDate()` in `src/domain/pageLayout.js`. Native `new Date("16-08-2026")` is invalid (day 16 is not a US month), so it must not be used for sorting.

### `restStr(t1, t2)`
Calculates rest duration between two `MM:SS` timestamps.

## UI Components

Shared React components used across pages:

| Component / helper | Purpose |
|--------------------|---------|
| `Card` | Styled container |
| `StatBox` | Metric display box |
| `Collapse` | Expandable section |
| `inputClass()` | Input field class helper |
| `btnPrimary()` / `btnSecondary()` / `btnDanger()` | Button class helpers |

## Keyboard Navigation

See [keyboard-navigation.md](./keyboard-navigation.md) for full details.

| Hook / Component | Purpose |
|------------------|---------|
| `KeyboardLayerProvider` | App wrapper; layered popup keyboard routing |
| `useKeyboardLayer()` | Register a popup as top keyboard layer |
| `useKeyboardLayersBlocked()` | True when any popup is blocking global keys |
| `useAppNavKeyboard()` | Global page shortcuts; returns `selectTab(i)` for nav button clicks |
| `useDisableNumberInputWheel()` | Prevents mouse wheel from changing focused number inputs (mounted in `App.jsx`) |
| `useKeyboardListNav()` | Arrow/Enter navigation inside lists |
| `useConfirmDialogKeyboard()` | Confirm dialog with button focus + Enter/Esc |
| `handleParserTextareaKeyDown()` | Enter submits parser; Shift+Enter newline |
| `useParserTextareaKeyboard()` | Native capture listener for parser textarea Enter handling |
| `isTypingTarget()` | Detects when user is typing in a form field |
| `kbItemClass()` | CSS classes for focus and activate highlights |

## Activity Levels

Used by the Calories page for TDEE calculation:

```javascript
[
  { label: "Sedentary",  mult: 1.2 },
  { label: "Light",      mult: 1.375 },
  { label: "Moderate",   mult: 1.55 },
  { label: "Active",     mult: 1.725 },
  { label: "Very Active", mult: 1.9 }
]
```

`computeTdeeBreakdown()` in `src/domain/calories.js` splits TDEE into TEF (10%), PAEE, and NEAT/EAT.

## Exercise Categories

Seven preset categories with 10 exercises each — used in Workout page dropdowns. See [workout.md](./workout.md#exercise-categories) for the full list.
