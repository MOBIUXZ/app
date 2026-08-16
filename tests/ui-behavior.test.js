import { describe, it, expect } from 'vitest';
import { getDashboardSnapshot } from '../src/domain/dashboard.js';
import { computeMacroTotals, computeGoalBarPct, getGoalBarColor, computeTdee } from '../src/domain/calories.js';
import { syncBodyLogsAfterEdit, removeBodyLogForEntry } from '../src/domain/bodyCompSync.js';
import { resolveExercise } from '../src/components/shared.jsx';
import uiBehavior from '../spec/ui-behavior-fixtures.json';
import appConfig from '../spec/app-config.json';

describe('dashboard behavior (spec/ui-behavior-fixtures.json)', function () {
  uiBehavior.dashboard.fixtures.forEach(function (fixture) {
    it(fixture.id, function () {
      var input = fixture.input;
      var today = fixture.input.calories[0].date === 'FIXED_TODAY'
        ? new Date().toLocaleDateString()
        : fixture.input.calories[0].date;
      if (input.calories[0].date === 'FIXED_TODAY') {
        input = Object.assign({}, input, {
          calories: [{ food: 'Oats', calories: 300, protein: 10, carbs: 50, fat: 5, date: today }],
        });
      }
      var snapshot = getDashboardSnapshot(input, resolveExercise, today);
      expect(snapshot.workoutCount).toBe(fixture.expected.workoutCount);
      expect(snapshot.lastBodyWeight).toBe(fixture.expected.lastBodyWeight);
      expect(snapshot.lastBodyFat).toBe(fixture.expected.lastBodyFat);
      expect(snapshot.todayCalories).toBe(fixture.expected.todayCalories);
      expect(snapshot.prs).toEqual(fixture.expected.prs);
      expect(snapshot.recentExercises).toEqual(fixture.expected.recentExercises);
    });
  });

  it('recent count matches app-config', function () {
    expect(appConfig.dashboard.recentWorkoutCount).toBe(uiBehavior.dashboard.recentWorkoutCount);
  });
});

describe('calorie behavior (spec/ui-behavior-fixtures.json)', function () {
  uiBehavior.calories.fixtures.forEach(function (fixture) {
    it(fixture.id, function () {
      if (fixture.expected.totals) {
        expect(computeMacroTotals(fixture.input.entries)).toEqual(fixture.expected.totals);
      }
      if (fixture.expected.goalPct != null) {
        var entries = fixture.input.entries || [];
        var totals = computeMacroTotals(entries);
        expect(computeGoalBarPct(totals.cal, fixture.input.goal)).toBe(fixture.expected.goalPct);
      }
      if (fixture.expected.goalBarColor) {
        expect(getGoalBarColor(fixture.expected.goalPct)).toBe(fixture.expected.goalBarColor);
      }
      if (fixture.expected.tdee != null) {
        expect(computeTdee(fixture.input.bmr, fixture.input.activityMult)).toBe(fixture.expected.tdee);
      }
    });
  });
});

describe('body comp sync (spec/ui-behavior-fixtures.json)', function () {
  uiBehavior.bodyCompSync.fixtures.forEach(function (fixture) {
    it(fixture.id, function () {
      if (fixture.newEntry === null) {
        expect(removeBodyLogForEntry(fixture.bodyLogs, fixture.oldEntry)).toEqual(fixture.expectedLogs);
      } else {
        expect(syncBodyLogsAfterEdit(fixture.bodyLogs, fixture.oldEntry, fixture.newEntry)).toEqual(fixture.expectedLogs);
      }
    });
  });
});
