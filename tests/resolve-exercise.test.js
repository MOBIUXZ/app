import { describe, it, expect } from 'vitest';
import { resolveExercise } from '../src/components/shared.jsx';
import resolveFixtures from '../spec/resolve-exercise-fixtures.json';
import aliases from '../spec/exercise-aliases.json';

describe('resolveExercise (spec/resolve-exercise-fixtures.json)', function () {
  resolveFixtures.resolveExercise.forEach(function (fixture) {
    it('"' + fixture.input + '" → "' + fixture.expected + '"', function () {
      expect(resolveExercise(fixture.input)).toBe(fixture.expected);
    });
  });
});

describe('exercise alias spec integrity', function () {
  it('every alias value is a non-empty canonical exercise name', function () {
    Object.values(aliases).forEach(function (canonical) {
      expect(typeof canonical).toBe('string');
      expect(canonical.length).toBeGreaterThan(0);
    });
  });

  it('alias keys are normalized (lowercase, no trailing punctuation)', function () {
    Object.keys(aliases).forEach(function (key) {
      expect(key).toBe(key.toLowerCase());
      expect(key).not.toMatch(/[:\-]$/);
    });
  });
});
