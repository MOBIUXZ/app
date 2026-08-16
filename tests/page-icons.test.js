import { describe, it, expect } from 'vitest';
import pageLayout from '../spec/page-layout.json';
import { getPageIcon, listPageIconIds } from '../src/domain/pageIcons.js';

describe('page icons spec (spec/page-icons.json)', function () {
  it('catalog includes page-title and collapse icons', function () {
    expect(listPageIconIds()).toEqual([
      'gauge',
      'activity',
      'layers',
      'flame',
      'chart-spline',
      'notebook',
      'square-function',
      'pencil-line',
      'square-plus',
      'history',
    ]);
  });

  it('each icon has drawable shapes', function () {
    listPageIconIds().forEach(function (id) {
      var icon = getPageIcon(id);
      expect(icon.viewBox).toBe('0 0 24 24');
      expect(icon.shapes.length).toBeGreaterThan(0);
      icon.shapes.forEach(function (shape) {
        expect(['rect', 'path', 'circle', 'line']).toContain(shape.type);
      });
    });
  });

  it('page-layout titles use catalog icon ids and no title emoji', function () {
    var expected = {
      dashboard: 'gauge',
      bodyComp: 'layers',
      calories: 'flame',
      progress: 'chart-spline',
    };
    Object.keys(expected).forEach(function (pageId) {
      var page = pageLayout.pages[pageId];
      expect(page.pageIcon).toBe(expected[pageId]);
      expect(getPageIcon(page.pageIcon)).not.toBe(null);
      expect(page.pageTitle).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
    });
    expect(pageLayout.pages.workout.hero.icon).toBe('activity');
    expect(pageLayout.pages.workout.hero.title).toBe('Workout Log');
    expect(pageLayout.pages.workout.collapses.find(function (c) { return c.id === 'logWorkout'; }).icon).toBe('pencil-line');
    expect(pageLayout.pages.workout.collapses.find(function (c) { return c.id === 'history'; }).icon).toBe('notebook');
    expect(pageLayout.pages.workout.collapses.find(function (c) { return c.id === 'oneRm'; }).icon).toBe('square-function');
    expect(pageLayout.pages.bodyComp.collapses.find(function (c) { return c.id === 'logEntry'; }).icon).toBe('square-plus');
    expect(pageLayout.pages.bodyComp.collapses.find(function (c) { return c.id === 'history'; }).icon).toBe('history');
  });
});
