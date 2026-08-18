import { describe, it, expect } from 'vitest';
import { computeYDomain, CHART_CURSOR, FAILED_SET_COLOR, computeOverlayYAxisTicks, formatChartAxisTick } from '../src/domain/chartDomain.js';
import chartSpec from '../spec/chart-domain.json';
import appConfig from '../spec/app-config.json';

describe('computeYDomain (spec/chart-domain.json)', function () {
  chartSpec.fixtures.forEach(function (fixture) {
    it(fixture.id, function () {
      expect(computeYDomain(fixture.values)).toEqual(fixture.expected);
    });
  });
});

describe('computeOverlayYAxisTicks (spec/chart-domain.json)', function () {
  chartSpec.overlayZeroAxisFixtures.forEach(function (fixture) {
    it(fixture.id, function () {
      expect(computeOverlayYAxisTicks(fixture.domain, fixture.zero)).toEqual(fixture.expectedTicks);
    });
  });
});

describe('formatChartAxisTick (spec/chart-domain.json)', function () {
  chartSpec.axisTickFormatFixtures.forEach(function (fixture) {
    it(fixture.id, function () {
      expect(formatChartAxisTick(fixture.value)).toBe(fixture.expected);
    });
  });
});

describe('chart domain spec constants', function () {
  it('cursor matches spec', function () {
    expect(CHART_CURSOR).toEqual(chartSpec.chartCursor);
  });

  it('failed set color matches spec', function () {
    expect(FAILED_SET_COLOR).toBe(chartSpec.failedSetColor);
  });

  it('app-config chart animation matches chart easing', function () {
    expect(appConfig.chartAnimation.easing).toBe('ease-in-out');
    expect(appConfig.chartAnimation.trendToggleMs).toBe(600);
  });
});
