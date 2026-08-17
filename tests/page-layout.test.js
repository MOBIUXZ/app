import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pageLayout from '../spec/page-layout.json';
import { getPageLayout, getAppLayout, getModalSpec, formatTemplateLabel } from '../src/domain/pageLayout.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

describe('page layout spec (spec/page-layout.json)', function () {
  it('defines all five pages', function () {
    expect(Object.keys(pageLayout.pages)).toEqual(['dashboard', 'workout', 'bodyComp', 'calories', 'progress']);
  });

  it('each page component file exists', function () {
    Object.values(pageLayout.pages).forEach(function (page) {
      expect(existsSync(resolve(root, page.component))).toBe(true);
      expect(existsSync(resolve(root, page.cssModule))).toBe(true);
    });
  });

  it('dashboard stat boxes match app-config recent count context', function () {
    var dash = getPageLayout('dashboard');
    expect(dash.statBoxes.length).toBe(4);
    expect(dash.statBoxes[0].valueKey).toBe('lastBodyWeight');
  });

  it('app logo is defined', function () {
    var layout = getAppLayout();
    expect(layout.logo.text).toBe('Orbius');
    expect(layout.logo.component).toBe('src/components/Logo.jsx');
    expect(existsSync(resolve(root, layout.logo.component))).toBe(true);
  });

  it('document title includes brand tagline', function () {
    var layout = getAppLayout();
    expect(layout.documentTitle).toBe('Orbius — Always in orbit. Always evolving.');
    var html = readFileSync(resolve(root, 'index.html'), 'utf8');
    expect(html.indexOf('<title>' + layout.documentTitle + '</title>') !== -1).toBe(true);
  });

  it('modal specs resolve for workout clear history', function () {
    var modal = getModalSpec('workout', 'clearHistory');
    expect(modal.title).toContain('Clear Workout History');
    expect(modal.layerId).toBe('clear-workout-history');
  });

  it('calendar log panel stacks over a mounted day panel', function () {
    var day = getModalSpec('workout', 'calendarDay');
    var log = getModalSpec('workout', 'calendarLog');
    expect(day.layerId).toBe('calendar-day-panel');
    expect(day.staysMountedUnder).toBe('calendarLog');
    expect(log.layerId).toBe('calendar-log-panel');
    expect(log.stacksOver).toBe('calendarDay');
    var source = readFileSync(resolve(root, pageLayout.pages.workout.component), 'utf8');
    expect(source.indexOf('calDayOpen = showCalendarModal && !!calSelectedDate;') !== -1).toBe(true);
    expect(source.indexOf('calDayOpen = showCalendarModal && !!calSelectedDate && calPanel === "view"') === -1).toBe(true);
  });

  it('workout hero uses a filled stat strip under the title', function () {
    var hero = getPageLayout('workout').hero;
    expect(hero.statLayout).toBe('filled-strip');
    expect(hero.statMetrics.map(function (m) { return m.id; })).toEqual(['workouts', 'unique', 'today']);
    var source = readFileSync(resolve(root, pageLayout.pages.workout.component), 'utf8');
    expect(source.indexOf('heroStatStrip') !== -1).toBe(true);
    expect(source.indexOf('heroStatGhost') === -1).toBe(true);
  });

  it('workout history collapse-all persists across By Date and By Workout', function () {
    var groups = getPageLayout('workout').historyGroups;
    expect(groups.defaultExpanded).toBe(true);
    expect(groups.expandAllPersistsAcrossGrouping).toBe(true);
    var source = readFileSync(resolve(root, pageLayout.pages.workout.component), 'utf8');
    expect(source.indexOf('groupsDefaultExpanded') !== -1).toBe(true);
    expect(source.indexOf('nextHistoryGroupsAll') !== -1).toBe(true);
  });

  it('workout history search matches exercise name and date', function () {
    var search = getPageLayout('workout').historySearch;
    expect(search.matchFields).toEqual(['exercise', 'date']);
    var source = readFileSync(resolve(root, pageLayout.pages.workout.component), 'utf8');
    expect(source.indexOf('matchesHistorySearch') !== -1).toBe(true);
    expect(source.indexOf('historySearch.placeholder') !== -1).toBe(true);
  });

  it('calories page spec includes TDEE breakdown rows', function () {
    var breakdown = getPageLayout('calories').tdeeBreakdown;
    expect(breakdown.layout).toEqual(['formula', 'bar', 'legend', 'equation']);
    expect(breakdown.rows.map(function (r) { return r.id; })).toEqual(['bmr', 'tef', 'neat', 'eat', 'paee']);
    var colorById = {};
    breakdown.rows.forEach(function (r) { colorById[r.id] = r.colorToken; });
    expect(colorById.bmr).toBe('orange');
    expect(colorById.tef).toBe('yellow');
    expect(colorById.paee).toBe('accent');
    var source = readFileSync(resolve(root, pageLayout.pages.calories.component), 'utf8');
    expect(source.indexOf('tdeeBreakdown') !== -1).toBe(true);
    expect(source.indexOf('tdeeLegendItem') !== -1).toBe(true);
    expect(source.indexOf('tdeeRow') === -1).toBe(true);
  });

  it('calendar month panel is slightly narrower than year and year width stays put', function () {
    var modal = getModalSpec('workout', 'calendarModal');
    expect(modal.monthMaxWidthPx).toBe(389);
    expect(modal.yearMaxWidthPx).toBe(680);
    var css = readFileSync(resolve(root, pageLayout.pages.workout.cssModule), 'utf8');
    expect(css.indexOf('.calModalPanel.calModalPanelMonth') !== -1).toBe(true);
    expect(css.indexOf('max-width: ' + modal.monthMaxWidthPx + 'px') !== -1).toBe(true);
    expect(css.indexOf('max-width: ' + modal.yearMaxWidthPx + 'px') !== -1).toBe(true);
  });

  it('smart parser modal uses the spec title without a second icon', function () {
    var modal = getModalSpec('workout', 'smartParser');
    expect(modal.title).toBe('🧠 Smart Parser');
    expect(modal.iconInTitle).toBe(true);
    var source = readFileSync(resolve(root, pageLayout.pages.workout.component), 'utf8');
    expect(source.indexOf('parserIcon') === -1).toBe(true);
    expect(source.indexOf('getModalSpec("workout", "smartParser").title') !== -1).toBe(true);
  });

  it('template labels interpolate variables', function () {
    expect(formatTemplateLabel('Log for {date}', { date: 'Mon' })).toBe('Log for Mon');
  });

  Object.values(pageLayout.pages).forEach(function (page) {
    if (!page.pageTitle && !page.hero) return;
    it(page.component + ' source uses layout spec import or layout variable', function () {
      var source = readFileSync(resolve(root, page.component), 'utf8');
      expect(source.indexOf('pageLayout') !== -1 || source.indexOf('Layout') !== -1).toBe(true);
    });
  });
});
