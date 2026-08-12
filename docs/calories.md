# Calories

The Calories page tracks daily food intake, macronutrients, and energy expenditure estimates.

## BMR & TDEE

Requires at least one Body Comp entry with weight, height, age, and sex.

### BMR Display
- Uses **Mifflin-St Jeor** when available, otherwise **Katch-McArdle**
- Shown in kcal/day

### Activity Level Selector

| Level | Multiplier | Description |
|-------|------------|-------------|
| Sedentary | 1.2 | Little/no exercise |
| Light | 1.375 | 1–3 days/week |
| Moderate | 1.55 | 3–5 days/week |
| Active | 1.725 | 6–7 days/week |
| Very Active | 1.9 | Hard daily / 2×/day |

**TDEE** = BMR × activity multiplier

### Goal Presets
Based on calculated TDEE:
- **Cut** — TDEE − 500 kcal
- **Maintain** — TDEE
- **Bulk** — TDEE + 300 kcal

## Date Picker

Collapsible calendar for selecting the logging date:

- Navigate months with ‹ / ›
- Orange dot indicates days with logged entries
- Selected date highlighted in accent color

## Daily Goal & Progress

- Set a custom daily calorie goal (default: 2200 kcal)
- Progress bar with color coding:
  - Green — under 80% of goal
  - Orange — 80–100%
  - Red — over 100%
- Shows consumed kcal and remaining kcal

## Macro Totals

Daily totals for the selected date:
- **Protein** (g)
- **Carbs** (g)
- **Fat** (g)

## Custom Entry

Collapsible form to add a food entry:

| Field | Description |
|-------|-------------|
| Food | Name/description |
| kcal | Calories |
| P | Protein (g) |
| C | Carbs (g) |
| F | Fat (g) |

## Daily Log

Lists all entries for the selected date with:

- Food name and macro breakdown
- Calorie count
- **Edit** — inline edit all fields
- **Delete** — remove entry

## Integration

- **Dashboard** shows today's total calories
- **Progress** page includes a 7-day calorie intake trend chart
