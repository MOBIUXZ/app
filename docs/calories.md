# Calories

The Calories page tracks daily food intake, macronutrients, and energy expenditure estimates.

## BMR & TDEE

Requires at least one **Body Comp** entry. BMR is read from the **latest** `bodyComp` record (not recalculated on the Calories page).

### BMR source & formulas

| Priority | Field | Formula | Requirements |
|----------|-------|---------|--------------|
| 1 | `BMR_Mifflin` | Mifflin-St Jeor | Weight, height, age, sex (from Body Comp **Log Entry**) |
| 2 | `BMR_Katch` | `370 + 21.6 × FFM` | Body fat % (FFM = fat-free mass in kg) |

**Mifflin-St Jeor** (computed in `BodyCompPage.jsx` when logging):

- **Male:** `10 × weight(kg) + 6.25 × height(cm) − 5 × age + 5`
- **Female:** `10 × weight(kg) + 6.25 × height(cm) − 5 × age − 161`

The BMR card subtitle shows which formula was used (**Mifflin-St Jeor** or **Katch-McArdle**).

### BMR Display
- Value shown rounded to whole kcal/d
- If no qualifying Body Comp entry exists, shows a prompt to log weight, height, age, and sex

### Activity Level Selector

| Level | Multiplier | Description |
|-------|------------|-------------|
| Sedentary | 1.2 | Little/no exercise |
| Light | 1.375 | 1–3 days/week |
| Moderate | 1.55 | 3–5 days/week |
| Active | 1.725 | 6–7 days/week |
| Very Active | 1.9 | Hard daily / 2×/day |

**TDEE** = `round(BMR × activity multiplier)`

Selected level is shown under the TDEE value. Default selection is **Moderate** (index 2).

**Activity row UI:**
- **Selected:** green left accent bar, darker inset background, bold label
- **Unselected:** subtle hover lift; no purple highlight
- **Keyboard (↑↓ in list):** green outline (not purple); mouse hover does not move list focus
- **Click / press:** slight scale-down feedback

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

- **Body Comp** — latest entry supplies `BMR_Mifflin` / `BMR_Katch`; edit Body Comp to update Calories BMR/TDEE
- **Dashboard** shows today's total calories
- **Progress** page includes a 7-day calorie intake trend chart
