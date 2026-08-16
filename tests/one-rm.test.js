import { describe, it, expect } from 'vitest';
import { computeOneRM, TRAINING_PERCENTAGES, DEFAULT_ONE_RM_FORMULA, ONE_RM_FORMULAS } from '../src/domain/oneRm.js';
import oneRmSpec from '../spec/one-rm-formulas.json';

describe('computeOneRM (spec/one-rm-formulas.json)', function () {
  oneRmSpec.fixtures.forEach(function (fixture) {
    it(fixture.formula + ' ' + fixture.weight + '×' + fixture.reps, function () {
      var result = computeOneRM(fixture.formula, fixture.weight, fixture.reps);
      if (fixture.expected == null) {
        expect(result).toBeNull();
      } else {
        expect(result).toBeCloseTo(fixture.expected, 1);
      }
    });
  });
});

describe('one-rm spec metadata', function () {
  it('formulas list matches domain export', function () {
    expect(ONE_RM_FORMULAS).toEqual(oneRmSpec.formulas);
  });

  it('training percentages match spec', function () {
    expect(TRAINING_PERCENTAGES).toEqual(oneRmSpec.trainingPercentages);
  });

  it('default formula is Epley', function () {
    expect(DEFAULT_ONE_RM_FORMULA).toBe(oneRmSpec.defaultFormula);
  });
});
