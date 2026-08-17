import { describe, it, expect } from 'vitest';
import { getDashboardSnapshot } from '../src/domain/dashboard.js';
import { computeMacroTotals, computeGoalBarPct, getGoalBarColor, computeTdee, computeTdeeBreakdown } from '../src/domain/calories.js';
import { syncBodyLogsAfterEdit, removeBodyLogForEntry, preserveMeasuredInbody, upsertBodyCompByDate } from '../src/domain/bodyCompSync.js';
import { computeBodyCompEntry } from '../src/domain/metrics.js';
import { isHistoryGroupExpanded, areAllHistoryGroupsExpanded, nextHistoryGroupsAll, filterHistoryWorkouts, sortHistoryWorkouts } from '../src/domain/pageLayout.js';
import { resolveExercise } from '../src/components/shared.jsx';
import uiBehavior from '../spec/ui-behavior-fixtures.json';
import appConfig from '../spec/app-config.json';
import pageLayout from '../spec/page-layout.json';

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
      if (fixture.expected.breakdown) {
        expect(computeTdeeBreakdown(fixture.input.bmr, fixture.expected.tdee)).toEqual(fixture.expected.breakdown);
      }
    });
  });
});

describe('body comp sync (spec/ui-behavior-fixtures.json)', function () {
  uiBehavior.bodyCompSync.fixtures.forEach(function (fixture) {
    it(fixture.id, function () {
      if (fixture.form) {
        var next = preserveMeasuredInbody(fixture.oldEntry, computeBodyCompEntry(fixture.form));
        expect(next.source).toBe(fixture.expectedSource);
        expect(next.BMR_InBody).toBe(fixture.expectedBmrInBody);
        expect(next.inbody.score).toBe(fixture.expectedScore);
        expect(next.weight).toBe(fixture.expectedWeight);
        return;
      }
      if (fixture.entry && fixture.bodyComp) {
        var upserted = upsertBodyCompByDate(fixture.bodyComp, fixture.entry, fixture.replaceIndex);
        expect(upserted.length).toBe(fixture.expectedCount);
        expect(upserted[0].weight).toBe(fixture.expectedWeight);
        return;
      }
      if (fixture.newEntry === null) {
        expect(removeBodyLogForEntry(fixture.bodyLogs, fixture.oldEntry)).toEqual(fixture.expectedLogs);
      } else {
        expect(syncBodyLogsAfterEdit(fixture.bodyLogs, fixture.oldEntry, fixture.newEntry)).toEqual(fixture.expectedLogs);
      }
    });
  });
});

describe('workout history groups (spec/ui-behavior-fixtures.json)', function () {
  it('default expanded matches page layout spec', function () {
    expect(pageLayout.pages.workout.historyGroups.defaultExpanded).toBe(uiBehavior.workoutHistory.defaultExpanded);
    expect(pageLayout.pages.workout.historyGroups.expandAllPersistsAcrossGrouping).toBe(true);
  });

  uiBehavior.workoutHistory.fixtures.forEach(function (fixture) {
    it(fixture.id, function () {
      if (fixture.input.action === 'setAll') {
        expect(nextHistoryGroupsAll(fixture.input.expand)).toEqual(fixture.expected);
        return;
      }
      var expanded = {};
      fixture.input.groupKeys.forEach(function (key) {
        expanded[key] = isHistoryGroupExpanded(fixture.input.expandedGroups, key, fixture.input.defaultExpanded);
      });
      expect(expanded).toEqual(fixture.expected.expanded);
      expect(areAllHistoryGroupsExpanded(fixture.input.groupKeys, fixture.input.expandedGroups, fixture.input.defaultExpanded)).toBe(fixture.expected.allExpanded);
    });
  });

  it('search placeholder matches page layout spec', function () {
    expect(pageLayout.pages.workout.historySearch.placeholder).toBe(uiBehavior.workoutHistory.search.placeholder);
    expect(pageLayout.pages.workout.historySearch.matchFields).toEqual(['exercise', 'date']);
  });

  uiBehavior.workoutHistory.search.fixtures.forEach(function (fixture) {
    it('search ' + fixture.id, function () {
      var matched = filterHistoryWorkouts(uiBehavior.workoutHistory.search.workouts, fixture.query).map(function (w) { return w.exercise; });
      expect(matched).toEqual(fixture.expectedExercises);
    });
  });

  uiBehavior.workoutHistory.sort.fixtures.forEach(function (fixture) {
    it('sort ' + fixture.id, function () {
      var sorted = sortHistoryWorkouts(uiBehavior.workoutHistory.sort.workouts, fixture.sortBy, fixture.order).map(function (w) { return w.date; });
      expect(sorted).toEqual(fixture.expectedDates);
    });
  });
});
