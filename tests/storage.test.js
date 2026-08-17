import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import storageSpec from '../spec/storage-fixtures.json';
import appConfig from '../spec/app-config.json';
import catalog from '../spec/exercise-catalog.json';
import {
  normalizeStoredData,
  parseImportedData,
  wipeLogs,
  exportFileName,
  profilePrefill,
  patchSettings,
} from '../src/domain/storage.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

describe('storage spec (spec/storage-fixtures.json)', function () {
  it('default settings match app-config calorie defaults', function () {
    var normalized = normalizeStoredData({});
    expect(normalized.settings.calories.goal).toBe(appConfig.calories.defaultGoal);
    expect(normalized.settings.calories.activityIndex).toBe(appConfig.calories.defaultActivityIndex);
  });

  it('clamps activity to catalog length', function () {
    expect(catalog.activityLevels.length - 1).toBe(4);
  });

  storageSpec.normalizeFixtures.forEach(function (fixture) {
    it('normalize: ' + fixture.id, function () {
      var out = normalizeStoredData(fixture.input);
      expect(out.settings.profile.sex).toBe(fixture.expectedSex);
      expect(out.settings.profile.height).toBe(fixture.expectedHeight);
      expect(out.settings.profile.age).toBe(fixture.expectedAge);
      expect(out.settings.calories.goal).toBe(fixture.expectedGoal);
      expect(out.settings.calories.activityIndex).toBe(fixture.expectedActivityIndex);
    });
  });

  storageSpec.importFixtures.forEach(function (fixture) {
    it('import: ' + fixture.id, function () {
      var result = fixture.raw != null
        ? parseImportedData(fixture.raw)
        : parseImportedData(JSON.stringify(fixture.input));
      expect(result.ok).toBe(fixture.ok);
      if (!fixture.ok) {
        expect(result.errorId).toBe(fixture.errorId);
        return;
      }
      if (fixture.expectedWorkoutCount != null) {
        expect(result.data.workouts.length).toBe(fixture.expectedWorkoutCount);
      }
      if (fixture.expectedSex) expect(result.data.settings.profile.sex).toBe(fixture.expectedSex);
      if (fixture.expectedGoal != null) expect(result.data.settings.calories.goal).toBe(fixture.expectedGoal);
      if (fixture.expectedActivityIndex != null) {
        expect(result.data.settings.calories.activityIndex).toBe(fixture.expectedActivityIndex);
      }
    });
  });

  storageSpec.wipeFixtures.forEach(function (fixture) {
    it('wipe: ' + fixture.id, function () {
      var out = wipeLogs(fixture.input);
      expect(out.workouts.length).toBe(fixture.expectedCounts.workouts);
      expect(out.bodyLogs.length).toBe(fixture.expectedCounts.bodyLogs);
      expect(out.bodyComp.length).toBe(fixture.expectedCounts.bodyComp);
      expect(out.calories.length).toBe(fixture.expectedCounts.calories);
      expect(out.settings.profile.sex).toBe(fixture.expectedSex);
      expect(out.settings.calories.goal).toBe(fixture.expectedGoal);
    });
  });

  storageSpec.exportFileNameFixtures.forEach(function (fixture) {
    it('export file name ' + fixture.expected, function () {
      expect(exportFileName(new Date(fixture.year, fixture.month - 1, fixture.day))).toBe(fixture.expected);
    });
  });

  storageSpec.profilePrefillFixtures.forEach(function (fixture) {
    it('prefill: ' + fixture.id, function () {
      expect(profilePrefill(fixture.settings)).toEqual(fixture.expected);
    });
  });

  it('patchSettings updates one branch without dropping logs', function () {
    var data = normalizeStoredData({
      workouts: [{ exercise: 'Squat', date: '01-01-2026', sets: [{ weight: 100, reps: 5 }] }],
      settings: { profile: { sex: 'male', height: null, age: null }, calories: { goal: 2200, activityIndex: 2 } },
    });
    var next = patchSettings(data, { calories: { goal: 1900 } });
    expect(next.workouts.length).toBe(1);
    expect(next.settings.calories.goal).toBe(1900);
    expect(next.settings.calories.activityIndex).toBe(2);
  });

  it('Body Comp and Calories pages read settings helpers', function () {
    var body = readFileSync(resolve(root, 'src/components/BodyCompPage.jsx'), 'utf8');
    var cals = readFileSync(resolve(root, 'src/components/CaloriePage.jsx'), 'utf8');
    expect(body.indexOf('profilePrefill') !== -1).toBe(true);
    expect(cals.indexOf('normalizeStoredData') !== -1 || cals.indexOf('patchSettings') !== -1).toBe(true);
  });
});
