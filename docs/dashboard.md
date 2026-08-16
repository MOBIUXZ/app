# Dashboard

The Dashboard is the home page of Orbius. It provides a quick overview of your fitness data and links into other sections.

## Stat Boxes

Four summary metrics are shown at the top:

| Stat | Source | Unit |
|------|--------|------|
| Body Weight | Latest entry in `bodyLogs` | kg |
| Body Fat | Latest entry in `bodyComp` (`bf` field) | % |
| Today Cals | Sum of calorie entries for today | kcal |
| Workouts | Total count of logged workouts | — |

## Personal Records (PRs)

- Calculates the **heaviest weight lifted** per exercise across all workout history.
- Exercises are normalized via `resolveExercise()` so aliases and variants group together.
- Compound lift names display in ALL CAPS (e.g. `BENCH PRESS`, `SQUATS`).
- Empty state links directly to the Workout page to log your first session.

## Recent Workouts

Collapsible section showing the **3 most recent** workout entries:

- Exercise name (formatted with compound lift caps)
- Date and optional time
- Set summary (`weight×reps` for each set)

## Navigation

Clicking **"Log your first workout!"** in the PR empty state switches to the Workout tab via `setTab("Workout")`.
