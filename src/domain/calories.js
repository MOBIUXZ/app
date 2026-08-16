/** @file Calorie domain — spec/ui-behavior-fixtures.json + spec/app-config.json */

import appConfig from "../../spec/app-config.json";
import uiBehavior from "../../spec/ui-behavior-fixtures.json";

export var DEFAULT_CALORIE_GOAL = appConfig.calories.defaultGoal;
export var GOAL_BAR_THRESHOLDS = appConfig.calories.goalBarThresholds;
export var TDEE_OFFSETS = appConfig.calories.tdeeOffsets;
export var GOAL_BAR_COLORS = uiBehavior.calories.goalBarColors;

export function computeMacroTotals(entries) {
  return (entries || []).reduce(function (a, e) {
    return {
      cal: a.cal + (e.calories || 0),
      p: a.p + (e.protein || 0),
      c: a.c + (e.carbs || 0),
      f: a.f + (e.fat || 0),
    };
  }, { cal: 0, p: 0, c: 0, f: 0 });
}

export function computeGoalBarPct(totalCal, goal) {
  var g = parseFloat(goal) || DEFAULT_CALORIE_GOAL;
  if (g <= 0) return 0;
  return Math.round((totalCal / g) * 100);
}

export function getGoalBarDisplayPct(pct) {
  return Math.min(100, pct);
}

export function getGoalBarColor(pct) {
  if (pct > GOAL_BAR_THRESHOLDS.over) return GOAL_BAR_COLORS.over;
  if (pct > GOAL_BAR_THRESHOLDS.warn) return GOAL_BAR_COLORS.warn;
  return GOAL_BAR_COLORS.under;
}

export function computeTdee(bmr, activityMult) {
  if (bmr == null || !(activityMult > 0)) return null;
  return Math.round(bmr * activityMult);
}

export function getTdeeTargets(tdee) {
  if (tdee == null) return null;
  return {
    cut: tdee + TDEE_OFFSETS.cut,
    maintain: tdee + TDEE_OFFSETS.maintain,
    bulk: tdee + TDEE_OFFSETS.bulk,
  };
}
