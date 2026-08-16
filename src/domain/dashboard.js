/** @file Dashboard domain — spec/ui-behavior-fixtures.json + spec/app-config.json */

import appConfig from "../../spec/app-config.json";

export function computePersonalRecords(workouts, resolveFn) {
  var prs = {};
  (workouts || []).forEach(function (w) {
    var ex = resolveFn(w.exercise);
    (w.sets || []).forEach(function (set) {
      if (!prs[ex] || set.weight > prs[ex]) prs[ex] = set.weight;
    });
  });
  return prs;
}

export function getRecentWorkouts(workouts, count) {
  var n = count != null ? count : appConfig.dashboard.recentWorkoutCount;
  return (workouts || []).slice().reverse().slice(0, n);
}

export function getDashboardSnapshot(data, resolveFn, todayStr) {
  var lastBW = data.bodyLogs.length ? data.bodyLogs[data.bodyLogs.length - 1] : null;
  var lastBC = data.bodyComp.length ? data.bodyComp[data.bodyComp.length - 1] : null;
  var todayCals = (data.calories || []).filter(function (e) { return e.date === todayStr; })
    .reduce(function (a, e) { return a + e.calories; }, 0);
  var prs = computePersonalRecords(data.workouts, resolveFn);
  var recent = getRecentWorkouts(data.workouts);
  return {
    workoutCount: (data.workouts || []).length,
    lastBodyWeight: lastBW ? lastBW.weight : null,
    lastBodyFat: lastBC ? lastBC.bf : null,
    todayCalories: todayCals || 0,
    prs: prs,
    recentExercises: recent.map(function (w) { return resolveFn(w.exercise); }),
  };
}
