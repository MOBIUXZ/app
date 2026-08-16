# FitTrack — Data Model

Complete persistence schema for reconstructing FitTrack. Storage key: **`ft_v5`** (single JSON blob in `localStorage`).

**Machine-readable source of truth:** [`spec/data-model.schema.json`](../spec/data-model.schema.json), [`spec/app-config.json`](../spec/app-config.json), [`spec/formula-fixtures.json`](../spec/formula-fixtures.json).

---

## Root Object

```typescript
interface FitTrackData {
  workouts: WorkoutEntry[];
  bodyLogs: BodyLogEntry[];
  bodyComp: BodyCompEntry[];
  calories: CalorieEntry[];
}
```

Default when missing or corrupt:

```json
{ "workouts": [], "bodyLogs": [], "bodyComp": [], "calories": [] }
```

Load/save: `App.jsx` — `loadData()`, `saveData(d)`, `save(d)`.

---

## WorkoutEntry

```typescript
interface WorkoutEntry {
  exercise: string;    // canonical name from resolveExercise()
  date: string;        // "DD-MM-YYYY" via formatDate()
  time: string;        // workout-level time e.g. "7:52" (optional)
  note: string;
  sets: WorkoutSet[];
}

interface WorkoutSet {
  weight: number;      // kg
  reps: number;        // can be fractional; 0 = failed attempt
  time?: string;       // per-set "MM:SS" from parser
  note?: string;
  side?: "left" | "right" | "both";  // parser adds; manual log often omits
}
```

### Example

```json
{
  "exercise": "Overhead Press",
  "date": "11-08-2026",
  "time": "7:52",
  "note": "",
  "sets": [
    { "weight": 50, "reps": 5, "time": "7:52", "note": "", "side": "both" },
    { "weight": 50, "reps": 0, "time": "8:01", "note": "", "side": "both" }
  ]
}
```

### Progress aggregation (per calendar date)

When multiple workouts same exercise + date, sets are merged before metrics:

| Metric | Rule |
|--------|------|
| Max Weight | `max(weight)` across all sets that day |
| Volume | `sum(weight × reps)` all sets |
| Best e1RM | `max(Epley e1RM)` successful sets |
| Mean e1RM | `avg(Epley e1RM)` successful sets only (reps > 0) |
| Split variants | Same rules on `*_left` / `*_right` side pools |

Epley (Progress + session graphs + detail modal best set):

```
e1RM = weight × (1 + reps / 30)   when reps > 0
e1RM = null                        when reps <= 0
1-rep set: e1RM = weight
```

---

## BodyLogEntry

Simple weight log for Dashboard + Progress body-weight chart.

```typescript
interface BodyLogEntry {
  weight: number;   // kg
  date: string;     // "DD-MM-YYYY"
}
```

**Created when:** user submits Body Comp **Log Entry** (appends `{ weight, date }` to `bodyLogs`).

**Synced when:** Body comp history entry edited or deleted (`syncBodyLogsAfterEdit()` removes old log row by matching date+weight, adds new if weight > 0).

---

## BodyCompEntry

Raw inputs plus **persisted computed fields** (recomputed on save/edit).

### Inputs (user-entered)

| Field | Type | Required for save |
|-------|------|-------------------|
| `date` | string `DD-MM-YYYY` | yes |
| `weight` | number (kg) | yes |
| `height` | number (cm) | optional |
| `bf` | number (%) | yes |
| `smm` | number (kg) skeletal muscle | optional |
| `waist` | number (cm) | optional |
| `age` | number | optional |
| `sex` | `"male"` \| `"female"` | default `"male"` |

### Computed (stored on entry)

| Field | Formula / rule |
|-------|----------------|
| `BW` | = `weight` |
| `PBF` | = `bf` |
| `FM` | `weight × (bf / 100)` when weight > 0 and bf > 0 |
| `FFM` | `weight - FM` |
| `BMI` | `weight / (height_m)²` when height > 0 |
| `FFMI` | `FFM / (height_m)²` |
| `FMI` | `FM / (height_m)²` |
| `SMM` | = `smm` input or null |
| `SMI` | `smm / (height_m)²` when smm > 0 |
| `BMR_Mifflin` | Male: `10×W + 6.25×H_cm − 5×age + 5`; Female: `10×W + 6.25×H_cm − 5×age − 161` |
| `BMR_Katch` | `370 + 21.6 × FFM` when FFM known |

`height_m = height_cm / 100`.

### Balance checks (UI only, not stored)

- FM + FFM ≈ BW
- FM + SMM + residual ≈ BW (when SMM entered)

---

## CalorieEntry

```typescript
interface CalorieEntry {
  food: string;
  calories: number;
  protein: number;   // grams, default 0
  carbs: number;     // grams
  fat: number;       // grams
  date: string;      // from selDate.toLocaleDateString() — locale-dependent!
}
```

### Example (US locale)

```json
{
  "food": "Chicken breast",
  "calories": 330,
  "protein": 62,
  "carbs": 0,
  "fat": 7,
  "date": "8/16/2026"
}
```

---

## Date Format Rules (Critical)

| Context | Format | Function |
|---------|--------|----------|
| Workout log date | `DD-MM-YYYY` | `formatDate()` in shared.jsx |
| Body comp date | `DD-MM-YYYY` | `formatDate()` |
| Body log date | `DD-MM-YYYY` | same as body comp entry |
| Calorie entry date | Locale string | `selDate.toLocaleDateString()` |
| Dashboard "today" | Locale string | `new Date().toLocaleDateString()` |
| Progress chart parsing | Both `YYYY-MM-DD` and `DD-MM-YYYY` | `parseChartDate()` |

**Implication:** "Today Cals" on Dashboard only matches calorie entries logged on the same locale date string as the browser's "today".

---

## Exercise Catalog Constants

Defined in `shared.jsx` — copy verbatim for identical behavior.

### COMPOUND_LIFTS (23 entries)

Squat, Bench Press, Deadlift, Overhead Press, Push Press, Barbell Row, Clean & Jerk, Snatch, Power Clean, Power Snatch, Front Squat, Overhead Squat, Log Press, Axle Press, Yoke Carry, Farmer's Walk, Sumo Deadlift, Romanian Deadlift, Good Morning, Box Squat, Floor Press, Pause Squat, Pause Bench

### NO_SPLIT_LIFTS (15 entries)

Squat, Bench Press, Deadlift, Overhead Press, Barbell Row, Push Press, Pause Squat, Pause Bench, Sumo Deadlift, Romanian Deadlift, Good Morning, Box Squat, Floor Press, Front Squat, Incline Bench

### EXERCISE_CHART_COLORS

| Exercise | Hex |
|----------|-----|
| Overhead Press | `#ef4444` |
| Barbell Row | `#22c55e` |
| Push Press | `#eab308` |
| Bench Press | `#fb923c` |
| Squat | `#3b82f6` |
| Deadlift | `#a78bfa` |

Names containing `"Deadlift"` inherit Deadlift purple in `getExerciseChartColor()`.

### ACTIVITY (TDEE multipliers)

| Label | mult |
|-------|------|
| Sedentary | 1.2 |
| Light | 1.375 |
| Moderate | 1.55 |
| Active | 1.725 |
| Very Active | 1.9 |

TDEE = BMR × multiplier. CaloriePage default activity index = 2 (Moderate).

---

## 1RM Calculator Formulas (Workout Page Only)

Separate from Progress e1RM. `OneRMCalc` in `WorkoutPage.jsx`:

| Name | Formula |
|------|---------|
| Epley | `w × (1 + r/30)` |
| Brzycki | `w × (36 / (37 - r))` |
| Lander | `(100 × w) / (101.3 - 2.67123 × r)` |
| Lombardi | `w × r^0.1` |
| OConnor | `w × (1 + r/40)` |

Training percentages shown: 100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50 (% of estimated 1RM).

---

## Smart Parser Output Shape

`parseWorkoutText(text)` returns:

```typescript
{
  date?: string;
  entries: Array<{
    exercise: string;
    sets: WorkoutSet[];
    note?: string;
  }>;
  exercise?: string;  // legacy: first entry
  sets?: WorkoutSet[]; // legacy: first entry
}
```

Set shape from parser matches `WorkoutSet` above. Side detection via regex on left/right keywords in set body.

Full parser spec: [shared-utilities.md](./shared-utilities.md).

---

## Storage Versioning

- Key name `ft_v5` is fixed
- **No migration code** from `ft_v1`–`ft_v4` exists in the app
- Rebuilding from scratch starts with empty arrays
- To preserve user data: backup `localStorage.getItem("ft_v5")` before changes
