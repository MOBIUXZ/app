import { describe, it, expect } from 'vitest';
import {
  estimate1RM,
  roundE1RM,
  computeSessionMetrics,
  computeBodyCompEntry,
  deriveFmi,
  deriveSmmPct,
  deriveFfm,
  deriveFfmPct,
  deriveFfmi,
} from '../src/domain/metrics.js';
import formulaFixtures from '../spec/formula-fixtures.json';

describe('estimate1RM (spec/formula-fixtures.json)', function () {
  formulaFixtures.e1rm.forEach(function (fixture, idx) {
    it('case ' + (idx + 1) + ': ' + fixture.weight + 'kg × ' + fixture.reps, function () {
      var result = roundE1RM(estimate1RM(fixture.weight, fixture.reps));
      if (fixture.expected == null) {
        expect(result).toBeNull();
      } else {
        expect(result).toBeCloseTo(fixture.expected, 1);
      }
    });
  });
});

describe('computeSessionMetrics (spec/formula-fixtures.json)', function () {
  formulaFixtures.sessionMetrics.forEach(function (fixture) {
    it(fixture.id, function () {
      var result = computeSessionMetrics(fixture.sets);
      Object.keys(fixture.expected).forEach(function (key) {
        var expected = fixture.expected[key];
        if (typeof expected === 'number') {
          expect(result[key]).toBeCloseTo(expected, 1);
        } else {
          expect(result[key]).toBe(expected);
        }
      });
    });
  });
});

describe('computeBodyCompEntry (spec/formula-fixtures.json)', function () {
  formulaFixtures.bodyComp.forEach(function (fixture) {
    it(fixture.id, function () {
      var result = computeBodyCompEntry(fixture.fields);
      Object.keys(fixture.expected).forEach(function (key) {
        var expected = fixture.expected[key];
        if (typeof expected === 'number') {
          expect(result[key]).toBeCloseTo(expected, 1);
        } else {
          expect(result[key]).toBe(expected);
        }
      });
    });
  });
});

describe('deriveFmi (spec/formula-fixtures.json)', function () {
  formulaFixtures.deriveFmi.forEach(function (fixture) {
    it(fixture.id, function () {
      var result = deriveFmi(fixture.entry);
      if (fixture.expected == null) {
        expect(result).toBeNull();
      } else {
        expect(result).toBeCloseTo(fixture.expected, 5);
      }
    });
  });
});

describe('deriveSmmPct (spec/formula-fixtures.json)', function () {
  formulaFixtures.deriveSmmPct.forEach(function (fixture) {
    it(fixture.id, function () {
      var result = deriveSmmPct(fixture.entry);
      if (fixture.expected == null) {
        expect(result).toBeNull();
      } else {
        expect(result).toBeCloseTo(fixture.expected, 5);
      }
    });
  });
});

function assertDeriveFixture(fn, fixture) {
  var result = fn(fixture.entry);
  if (fixture.expected == null) {
    expect(result).toBeNull();
  } else {
    expect(result).toBeCloseTo(fixture.expected, 5);
  }
}

describe('deriveFfm (spec/formula-fixtures.json)', function () {
  formulaFixtures.deriveFfm.forEach(function (fixture) {
    it(fixture.id, function () { assertDeriveFixture(deriveFfm, fixture); });
  });
});

describe('deriveFfmPct (spec/formula-fixtures.json)', function () {
  formulaFixtures.deriveFfmPct.forEach(function (fixture) {
    it(fixture.id, function () { assertDeriveFixture(deriveFfmPct, fixture); });
  });
});

describe('deriveFfmi (spec/formula-fixtures.json)', function () {
  formulaFixtures.deriveFfmi.forEach(function (fixture) {
    it(fixture.id, function () { assertDeriveFixture(deriveFfmi, fixture); });
  });
});
