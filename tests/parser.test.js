import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseWorkoutText } from '../src/components/shared.jsx';
import parserFixtures from '../spec/parser-fixtures.json';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function normalizeEntry(entry) {
  return {
    exercise: entry.exercise,
    date: entry.date,
    sets: (entry.sets || []).map(function (set) {
      var normalized = {
        weight: set.weight,
        reps: set.reps,
        side: set.side || 'both',
      };
      if (set.time) normalized.time = set.time;
      if (set.note) normalized.note = set.note;
      return normalized;
    }),
  };
}

describe('parseWorkoutText (spec/parser-fixtures.json)', function () {
  parserFixtures.cases.forEach(function (fixture) {
    it(fixture.id, function () {
      var result = parseWorkoutText(fixture.input);
      expect(result.date).toBe(fixture.expected.date);
      expect(result.entries.length).toBe(fixture.expected.entries.length);

      result.entries.forEach(function (entry, idx) {
        var expected = normalizeEntry(fixture.expected.entries[idx]);
        var actual = normalizeEntry(entry);
        expect(actual.exercise).toBe(expected.exercise);
        expect(actual.date).toBe(expected.date || fixture.expected.date);
        expect(actual.sets.length).toBe(expected.sets.length);
        actual.sets.forEach(function (set, setIdx) {
          var expSet = expected.sets[setIdx];
          expect(set.weight).toBeCloseTo(expSet.weight, 2);
          expect(set.reps).toBe(expSet.reps);
          expect(set.side).toBe(expSet.side);
          if (expSet.time) expect(set.time).toBe(expSet.time);
          if (expSet.note) expect(set.note).toContain(expSet.note.split(' ')[0]);
        });
      });
    });
  });
});

describe('parseWorkoutText default data model shape', function () {
  it('returns entries compatible with ft_v5 schema fields', function () {
    var schema = JSON.parse(readFileSync(resolve(root, 'spec/data-model.schema.json'), 'utf8'));
    var workoutRequired = schema.$defs.WorkoutEntry.required;
    var setRequired = schema.$defs.WorkoutSet.required;

    var result = parseWorkoutText('# 11 AUGUST 2026\n==SQUAT==\n60KG - 5REPS');
    result.entries.forEach(function (entry) {
      workoutRequired.forEach(function (key) {
        expect(entry).toHaveProperty(key);
      });
      entry.sets.forEach(function (set) {
        setRequired.forEach(function (key) {
          expect(set).toHaveProperty(key);
        });
      });
    });
  });
});
