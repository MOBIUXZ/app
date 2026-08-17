import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import manifest from '../spec/manifest.json';
import catalog from '../spec/exercise-catalog.json';
import appConfig from '../spec/app-config.json';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

describe('spec manifest integrity', function () {
  it('every manifest spec file exists on disk', function () {
    expect(manifest.specs.length).toBeGreaterThanOrEqual(21);
    manifest.specs.forEach(function (spec) {
      expect(existsSync(resolve(root, spec.path))).toBe(true);
    });
  });

  it('every test suite file exists on disk', function () {
    manifest.testSuites.forEach(function (suite) {
      expect(existsSync(resolve(root, suite.path))).toBe(true);
    });
  });
});

describe('exercise catalog spec', function () {
  it('ALL_EXERCISES count matches flattened categories', function () {
    var flat = Object.values(catalog.exerciseCategories).reduce(function (a, b) { return a.concat(b); }, []);
    expect(flat.length).toBe(71);
  });

  it('compound lifts are subset of all exercises', function () {
    var flat = Object.values(catalog.exerciseCategories).reduce(function (a, b) { return a.concat(b); }, []);
    catalog.compoundLifts.forEach(function (lift) {
      expect(flat).toContain(lift);
    });
  });
});

describe('app config spec', function () {
  it('default data validates against data-model schema required keys', function () {
    var schema = JSON.parse(readFileSync(resolve(root, 'spec/data-model.schema.json'), 'utf8'));
    schema.required.forEach(function (key) {
      expect(appConfig.defaultData).toHaveProperty(key);
      expect(Array.isArray(appConfig.defaultData[key])).toBe(true);
    });
  });

  it('storage key is ft_v5', function () {
    expect(appConfig.storageKey).toBe('ft_v5');
  });

  it('default settings match calorie defaults', function () {
    expect(appConfig.defaultData.settings.calories.goal).toBe(appConfig.calories.defaultGoal);
    expect(appConfig.defaultData.settings.calories.activityIndex).toBe(appConfig.calories.defaultActivityIndex);
    expect(appConfig.defaultData.settings.profile.sex).toBe('male');
  });
});
