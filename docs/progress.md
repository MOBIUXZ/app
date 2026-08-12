# Progress

The Progress page visualizes training and health trends with interactive line charts powered by Recharts.

## Exercise Charts

Every logged exercise gets its own chart card, grouped into two sections.

### Compound Lifts

Exercises classified as compound (Squat, Bench Press, Deadlift, Overhead Press, Push Press, Barbell Row, Olympic lifts, strongman movements, etc.) appear under **COMPOUND LIFTS**.

- Compound badge on chart header
- Names display in ALL CAPS (e.g. `SQUATS`, `PUSHPRESS`)
- **No split toggle** for bilateral barbell compounds (Squat, Bench, Deadlift, OHP, Barbell Row, Push Press, and variants)

### Isolation Lifts

All other exercises appear under **ISOLATION LIFTS** (e.g. Single Arm Lat Pulldown, Rear Delt Machine Fly, Dumbbell Curl).

## Per-Exercise Chart Card

Each chart includes:

### Header Stats
| Stat | Description |
|------|-------------|
| PR | All-time max weight for that exercise |
| Trend | Change vs previous session (▲/▼ kg) |
| Sessions | Total session count |

### Session Summary (latest)
- Last Weight (kg)
- Last Volume (kg — sum of weight × reps)
- Max Reps

### Metric Toggle
Switch between three chart metrics:
- **Max Weight** — heaviest set per session
- **Volume** — total weight × reps per session
- **Max Reps** — highest rep count per session

### Combined / Split Toggle

Available when left/right side data exists **and** the exercise is not a no-split compound:

- **Combined** — single line chart (default for compounds)
- **Split** — side-by-side Left (blue) and Right (pink) charts

Side data comes from Smart Parser entries like:
```
60KG - ( RIGHT - 7REPS , LEFT - 5REPS ) 8:28
```

Sets without side info are marked `both` and count toward combined totals.

### Chart Behavior
- Charts render from **1 session** onward (single data point shown)
- Hint shown when only 1 session: *"Log another session to see trends"*
- Click a chart point to open the **Workout Details** modal

## Combined Compound Lifts Chart

When 2+ compound lifts are logged, an overlay chart compares all compounds on one graph.

- Toggle metric: Max Weight / Volume / Max Reps
- Each compound is a separate colored line
- Deadlift uses a dedicated brown color

## Workout Details Modal

Click any chart data point to open a modal showing all workouts on that date:

- Exercise name (compound lifts in caps)
- Date and time
- All sets with weight × reps
- Left/Right labels (`L` / `R`) when side data exists

## Body Weight & Body Fat Chart

- **Body Weight** line from `bodyLogs` entries
- **Body Fat %** line (when BF data exists in `bodyComp`)

## Calorie Intake Trend

7-day rolling chart of daily calorie totals from the Calories page.

## Data Normalization

Before charting, all exercise names pass through `resolveExercise()` so variants like `Pushpress`, `barbell rows`, and `squats` map to canonical names and appear in the correct compound/isolation section.
