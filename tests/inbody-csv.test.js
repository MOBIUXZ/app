import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import inbodySpec from '../spec/inbody-csv-fixtures.json';
import {
  yearFromFileName,
  parseInbodyDate,
  parseInbodyCsv,
  buildInbodyEntry,
  mergeInbodyIntoLogs,
} from '../src/domain/inbodyCsv.js';
import { buildAllBodyTrendSeries, flattenTrendGroups, buildSegmentalGridModel, buildMergedSegmentalGridModel, buildOverlayTrendModel, resolveSegmentalTrendGroup, visibleSegmentalTrendGroups, visibleSegmentalViews, resolveSegmentalView } from '../src/domain/bodyTrends.js';
import { buildSegmentalSnapshot, latestSegmentalSnapshot } from '../src/domain/bodySegmental.js';
import { getPageLayout } from '../src/domain/pageLayout.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

describe('inbody csv spec (spec/inbody-csv-fixtures.json)', function () {
  inbodySpec.yearFromFileNameFixtures.forEach(function (fixture) {
    it('year from file name: ' + fixture.id, function () {
      expect(yearFromFileName(fixture.fileName)).toBe(fixture.expected);
    });
  });

  inbodySpec.dateFixtures.forEach(function (fixture) {
    it('date: ' + fixture.id, function () {
      expect(parseInbodyDate(fixture.raw, fixture.year)).toBe(fixture.expected);
    });
  });

  inbodySpec.parseFixtures.forEach(function (fixture) {
    it('parse: ' + fixture.id, function () {
      var result = parseInbodyCsv(fixture.csv, { fileName: fixture.fileName, year: fixture.year });
      expect(result.ok).toBe(fixture.ok);
      if (!fixture.ok) {
        expect(result.errorId).toBe(fixture.errorId);
        return;
      }
      if (fixture.expectedScanCount != null) expect(result.scans.length).toBe(fixture.expectedScanCount);
      if (fixture.expectedSkipped != null) expect(result.skipped).toBe(fixture.expectedSkipped);
      if (fixture.expectedCollapsed != null) expect(result.collapsed).toBe(fixture.expectedCollapsed);
      var first = result.scans[0];
      var last = result.scans[result.scans.length - 1];
      if (fixture.expectedFirstDate) expect(first.date).toBe(fixture.expectedFirstDate);
      if (fixture.expectedLastDate) expect(last.date).toBe(fixture.expectedLastDate);
      if (fixture.expectedFirstWeight != null) expect(first.weight).toBe(fixture.expectedFirstWeight);
      if (fixture.expectedLastWeight != null) expect(last.weight).toBe(fixture.expectedLastWeight);
      if (fixture.expectedFirstBf != null) expect(first.bf).toBe(fixture.expectedFirstBf);
      if (fixture.expectedFirstFm != null) expect(first.fm).toBe(fixture.expectedFirstFm);
      if (fixture.expectedFirstBmi != null) expect(first.bmi).toBe(fixture.expectedFirstBmi);
      if (fixture.expectedFirstSmi != null) expect(first.smi).toBe(fixture.expectedFirstSmi);
      if (fixture.expectedFirstBmr != null) expect(first.bmr).toBe(fixture.expectedFirstBmr);
      if (fixture.expectedFirstScore != null) expect(first.extras.score).toBe(fixture.expectedFirstScore);
    });
  });

  inbodySpec.buildFixtures.forEach(function (fixture) {
    it('build: ' + fixture.id, function () {
      var entry = buildInbodyEntry(fixture.scan, fixture.profile);
      expect(entry.FM).toBe(fixture.expectedFm);
      expect(entry.BMI).toBe(fixture.expectedBmi);
      expect(entry.SMI).toBe(fixture.expectedSmi);
      if (Object.prototype.hasOwnProperty.call(fixture, 'expectedBmrInBody')) {
        expect(entry.BMR_InBody).toBe(fixture.expectedBmrInBody);
      }
      expect(entry.source).toBe(fixture.expectedSource);
      expect(entry.inbody.score).toBe(fixture.expectedScore);
      if (fixture.expectedFmi != null) expect(entry.FMI).toBeCloseTo(fixture.expectedFmi, 3);
    });
  });

  inbodySpec.mergeFixtures.forEach(function (fixture) {
    it('merge: ' + fixture.id, function () {
      var out = mergeInbodyIntoLogs(fixture.current, fixture.incoming);
      expect(out.added).toBe(fixture.expectedAdded);
      expect(out.replaced).toBe(fixture.expectedReplaced);
      expect(out.bodyComp.length).toBe(fixture.expectedCompCount);
      expect(out.bodyComp[0].weight).toBe(fixture.expectedFirstWeight);
      expect(out.bodyComp[out.bodyComp.length - 1].weight).toBe(fixture.expectedLastWeight);
      expect(out.bodyLogs[out.bodyLogs.length - 1].weight).toBe(fixture.expectedLastWeight);
    });
  });

  inbodySpec.trendFixtures.forEach(function (fixture) {
    it('trend series: ' + fixture.id, function () {
      var progress = getPageLayout('progress');
      if (fixture.useSegmentalCharts) {
        expect(buildAllBodyTrendSeries(fixture.bodyComp, flattenTrendGroups(progress.segmentalTrendGroups))).toEqual(fixture.expected);
      }
      if (fixture.expectedVisceral) {
        expect(buildAllBodyTrendSeries(fixture.bodyComp, progress.visceralTrends.charts)).toEqual(fixture.expectedVisceral);
      }
      if (fixture.expectedBmr) {
        expect(buildAllBodyTrendSeries(fixture.bodyComp, progress.bmrTrends.charts)).toEqual(fixture.expectedBmr);
      }
      if (fixture.expectedExtras) {
        expect(buildAllBodyTrendSeries(fixture.bodyComp, progress.bodyChartExtras)).toEqual(fixture.expectedExtras);
      }
      if (fixture.expectedFat) {
        expect(buildAllBodyTrendSeries(fixture.bodyComp, progress.fatTrends.charts)).toEqual(fixture.expectedFat);
      }
      if (fixture.expectedMuscle) {
        expect(buildAllBodyTrendSeries(fixture.bodyComp, progress.muscleTrends.charts)).toEqual(fixture.expectedMuscle);
      }
      if (fixture.expectedFfm) {
        expect(buildAllBodyTrendSeries(fixture.bodyComp, progress.ffmTrends.charts)).toEqual(fixture.expectedFfm);
      }
      if (fixture.expectedComposition) {
        expect(buildAllBodyTrendSeries(fixture.bodyComp, progress.compositionTrends.charts)).toEqual(fixture.expectedComposition);
      }
      if (fixture.expectedScore) {
        expect(buildAllBodyTrendSeries(fixture.bodyComp, progress.scoreTrends.charts)).toEqual(fixture.expectedScore);
      }
    });
  });

  inbodySpec.segmentalFixtures.forEach(function (fixture) {
    it('segmental map: ' + fixture.id, function () {
      var spec = getPageLayout('bodyComp').segmentalMap;
      var snap = buildSegmentalSnapshot(fixture.entry, spec);
      if (fixture.expected === null) {
        expect(snap).toBe(null);
        return;
      }
      expect(snap.date).toBe(fixture.expected.date);
      expect(snap.hasLean).toBe(fixture.expected.hasLean);
      expect(snap.hasFat).toBe(fixture.expected.hasFat);
      expect(snap.imbalances.length).toBe(fixture.expected.imbalanceCount);
      if (fixture.expected.lean) expect(snap.lean).toEqual(fixture.expected.lean);
      if (fixture.expected.fat) expect(snap.fat).toEqual(fixture.expected.fat);
      if (fixture.expected.imbalancePair) expect(snap.imbalances[0].pairId).toBe(fixture.expected.imbalancePair);
      if (fixture.expected.imbalanceMetric) expect(snap.imbalances[0].metric).toBe(fixture.expected.imbalanceMetric);
    });
  });

  inbodySpec.latestSegmentalFixtures.forEach(function (fixture) {
    it('latest segmental: ' + fixture.id, function () {
      var spec = getPageLayout('bodyComp').segmentalMap;
      var snap = latestSegmentalSnapshot(fixture.bodyComp, spec);
      expect(snap.date).toBe(fixture.expectedDate);
    });
  });

  inbodySpec.gridFixtures.forEach(function (fixture) {
    it('segmental body grid: ' + fixture.id, function () {
      var progress = getPageLayout('progress');
      var group = progress.segmentalTrendGroups.find(function (item) { return item.id === fixture.groupId; });
      var model = buildSegmentalGridModel(group, fixture.seriesById, progress.segmentalBodyGrid);
      Object.keys(fixture.expectedLatest).forEach(function (slot) {
        expect(model.slots[slot].latest).toBe(fixture.expectedLatest[slot]);
      });
      expect(model.domains).toEqual(fixture.expectedDomains);
      expect(model.gaps.map(function (gap) { return gap.pairId; })).toEqual(fixture.expectedGapPairIds);
    });
  });

  inbodySpec.gridToggleFixtures.forEach(function (fixture) {
    it('segmental toggle: ' + fixture.id, function () {
      var progress = getPageLayout('progress');
      var visible = visibleSegmentalTrendGroups(progress.segmentalTrendGroups, fixture.seriesById);
      var active = resolveSegmentalTrendGroup(progress.segmentalTrendGroups, fixture.seriesById, fixture.requestedId);
      expect(visible.map(function (group) { return group.id; })).toEqual(fixture.expectedVisibleIds);
      expect(active && active.id).toBe(fixture.expectedId);
    });
  });

  inbodySpec.gridViewFixtures.forEach(function (fixture) {
    it('segmental view: ' + fixture.id, function () {
      var progress = getPageLayout('progress');
      var views = visibleSegmentalViews(progress.segmentalTrendGroups, fixture.seriesById, progress.segmentalBodyGrid.mergeView);
      var active = resolveSegmentalView(progress.segmentalTrendGroups, fixture.seriesById, fixture.requestedId, progress.segmentalBodyGrid.mergeView);
      expect(views.map(function (view) { return view.id; })).toEqual(fixture.expectedVisibleIds);
      expect(active && active.id).toBe(fixture.expectedId);
      expect(!!(active && active.merged)).toBe(fixture.expectedMerged);
    });
  });

  inbodySpec.gridMergeFixtures.forEach(function (fixture) {
    it('segmental merged overlay: ' + fixture.id, function () {
      var progress = getPageLayout('progress');
      var model = buildMergedSegmentalGridModel(progress.segmentalTrendGroups, fixture.seriesById, progress.segmentalBodyGrid);
      Object.keys(fixture.expectedOverlayKeys).forEach(function (slot) {
        expect(model.slots[slot].overlays.map(function (overlay) { return overlay.dataKey; })).toEqual(fixture.expectedOverlayKeys[slot]);
      });
      expect(model.slots.leftArm.series).toEqual(fixture.expectedMergedLeftArm);
      Object.keys(fixture.expectedLatest).forEach(function (slot) {
        var latest = {};
        model.slots[slot].overlays.forEach(function (overlay) { latest[overlay.dataKey] = overlay.latest; });
        expect(latest).toEqual(fixture.expectedLatest[slot]);
      });
      expect(model.domains).toEqual(fixture.expectedDomains);
      expect(model.gaps.map(function (gap) { return gap.pairId; })).toEqual(fixture.expectedGapPairIds);
    });
  });

  inbodySpec.overlayTrendFixtures.forEach(function (fixture) {
    it('overlay trend: ' + fixture.id, function () {
      var progress = getPageLayout('progress');
      var model = buildOverlayTrendModel(progress.massOverlayTrends.charts, fixture.seriesById);
      expect(model.overlays.map(function (overlay) { return overlay.dataKey; })).toEqual(fixture.expectedOverlayKeys);
      expect(model.series).toEqual(fixture.expectedSeries);
      expect(model.domain).toEqual(fixture.expectedDomain);
    });
  });

  it('Progress page wires InBody trend charts from the layout spec', function () {
    var source = readFileSync(resolve(root, 'src/components/ProgressPage.jsx'), 'utf8');
    expect(source.indexOf('buildAllBodyTrendSeries') !== -1).toBe(true);
    expect(source.indexOf('bodyChartExtras') !== -1).toBe(true);
    expect(source.indexOf('bodyWeightChart') !== -1).toBe(true);
    expect(source.indexOf('visceralTrends') !== -1).toBe(true);
    expect(source.indexOf('bmrTrends') !== -1).toBe(true);
    expect(source.indexOf('segmentalTrendGroups') !== -1).toBe(true);
    expect(source.indexOf('buildSegmentalGridModel') !== -1).toBe(true);
    expect(source.indexOf('buildMergedSegmentalGridModel') !== -1).toBe(true);
    expect(source.indexOf('segmentalBodyGrid') !== -1).toBe(true);
    expect(source.indexOf('resolveSegmentalView') !== -1).toBe(true);
    expect(source.indexOf('pillToggleTrack') !== -1).toBe(true);
    expect(source.indexOf('tooltipValueTemplate') !== -1).toBe(true);
    expect(source.indexOf('compositionTrends') !== -1).toBe(true);
    expect(source.indexOf('scoreTrends') !== -1).toBe(true);
    expect(source.indexOf('fatTrends') !== -1).toBe(true);
    expect(source.indexOf('muscleTrends') !== -1).toBe(true);
    expect(source.indexOf('ffmTrends') !== -1).toBe(true);
    expect(source.indexOf('massOverlayTrends') !== -1).toBe(true);
    expect(source.indexOf('buildOverlayTrendModel') !== -1).toBe(true);
    expect(source.indexOf('Skeletal Muscle') === -1).toBe(true);
    expect(source.indexOf('Visceral Fat') === -1).toBe(true);
    expect(source.indexOf('Left Arm') === -1).toBe(true);
    expect(source.indexOf('Body Fat Mass') === -1).toBe(true);
    expect(source.indexOf('Fat Mass (kg)') === -1).toBe(true);
    expect(source.indexOf('FMI (kg') === -1).toBe(true);
    expect(source.indexOf('Muscle Mass %') === -1).toBe(true);
    expect(source.indexOf('Fat-Free Mass') === -1).toBe(true);
    expect(source.indexOf('BMI (kg') === -1).toBe(true);
    expect(source.indexOf('Body Weight (kg)') === -1).toBe(true);
    expect(source.indexOf('Total Body Water') === -1).toBe(true);
    expect(source.indexOf('InBody Score') === -1).toBe(true);
    expect(source.indexOf('BMR (kcal') === -1).toBe(true);
  });

  it('Body Comp page wires the InBody import helpers', function () {
    var source = readFileSync(resolve(root, 'src/components/BodyCompPage.jsx'), 'utf8');
    expect(source.indexOf('parseInbodyCsv') !== -1).toBe(true);
    expect(source.indexOf('mergeInbodyIntoLogs') !== -1).toBe(true);
    expect(source.indexOf('import-inbody') !== -1 || source.indexOf('importInbody') !== -1).toBe(true);
    expect(source.indexOf('latestSegmentalSnapshot') !== -1).toBe(true);
    expect(source.indexOf('segmentalMap') !== -1).toBe(true);
    expect(source.indexOf('historyChips') !== -1).toBe(true);
    expect(source.indexOf('readBodyCompChartValue') !== -1).toBe(true);
    expect(source.indexOf('preserveMeasuredInbody') !== -1).toBe(true);
    expect(source.indexOf('upsertBodyCompByDate') !== -1).toBe(true);
    expect(source.indexOf('Left Arm') === -1).toBe(true);
  });
});
