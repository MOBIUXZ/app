import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pageLayout from '../spec/page-layout.json';
import { getPageLayout, getAppLayout, getModalSpec, formatTemplateLabel, formatHeroTodayDate, groupByRow } from '../src/domain/pageLayout.js';

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

  it('app header settings gear opens a settings modal', function () {
    var layout = getAppLayout();
    expect(layout.settings.icon).toBe('settings');
    expect(layout.settings.ariaLabel).toBe('Settings');
    expect(layout.settings.iconSizePx).toBe(22);
    expect(layout.settings.modal.title).toBe('Settings');
    expect(layout.settings.modal.layerId).toBe('settings');
    expect(layout.settings.modal.sections.map(function (s) { return s.id; })).toEqual(['profile', 'calories', 'data', 'keyboard']);
    expect(layout.settings.modal.layout).toBe('compact');
    expect(layout.settings.modal.maxWidthPx).toBe(400);
    expect(groupByRow(layout.settings.modal.sections[0].fields).map(function (g) { return g.items.map(function (f) { return f.id; }); })).toEqual([['sex'], ['height', 'age']]);
    expect(groupByRow(layout.settings.modal.sections[1].fields).map(function (g) { return g.items.map(function (f) { return f.id; }); })).toEqual([['goal', 'activity']]);
    expect(groupByRow(layout.settings.modal.sections[2].actions).map(function (g) { return g.items.map(function (a) { return a.id; }); })).toEqual([['export', 'import'], ['wipe']]);
    expect(layout.settings.wipeModal.layerId).toBe('wipe-all-logs');
    expect(layout.settings.wipeModal.buttons).toEqual(['Cancel', 'Wipe logs']);
    expect(layout.settings.importModal.layerId).toBe('import-backup');
    expect(layout.settings.importModal.buttons).toEqual(['Cancel', 'Import']);
    expect(layout.settings.modal.staysMountedUnder).toEqual(['wipe-all-logs', 'import-backup']);
    expect(layout.shellClasses).toContain('settingsBtn');
    expect(layout.shellClasses).toContain('persistBanner');
    var source = readFileSync(resolve(root, 'src/App.jsx'), 'utf8');
    expect(source.indexOf('settingsBtn') !== -1).toBe(true);
    expect(source.indexOf('appLayout.settings') !== -1).toBe(true);
    expect(source.indexOf('useKeyboardLayer') !== -1).toBe(true);
    expect(source.indexOf('wipeLogs') !== -1).toBe(true);
    expect(source.indexOf('parseImportedData') !== -1).toBe(true);
    expect(source.indexOf('importModal.layerId') !== -1).toBe(true);
    expect(source.indexOf('persistStoredData') !== -1).toBe(true);
    expect(source.indexOf('onerror') !== -1).toBe(true);
    expect(source.indexOf('settingsPanel') !== -1).toBe(true);
    expect(source.indexOf('groupByRow') !== -1).toBe(true);
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

  it('body comp history Clear History uses a quiet pill', function () {
    var chrome = getPageLayout('bodyComp').historyChrome;
    expect(chrome.clearStyle).toBe('quietPill');
    expect(chrome.clearLabel).toBe('Clear History');
    expect(chrome.importLabel).toBe('Import InBody CSV');
    expect(chrome.listAll).toBe(true);
    var importModal = getModalSpec('bodyComp', 'importInbody');
    expect(importModal.layerId).toBe('import-inbody');
    expect(importModal.buttons).toEqual(['Cancel', 'Import']);
    var source = readFileSync(resolve(root, pageLayout.pages.bodyComp.component), 'utf8');
    expect(source.indexOf('slice(0, 10)') === -1).toBe(true);
    expect(source.indexOf('clearHistoryBtn') !== -1).toBe(true);
    expect(source.indexOf('historyChrome.clearLabel') !== -1).toBe(true);
    expect(source.indexOf('historyChrome.importLabel') !== -1).toBe(true);
  });

  it('workout history delete asks for confirmation', function () {
    var modal = getModalSpec('workout', 'deleteEntry');
    expect(modal.title).toBe('Delete this workout?');
    expect(modal.layerId).toBe('delete-workout-entry');
    expect(modal.buttons).toEqual(['Cancel', 'Delete']);
    expect(modal.body).toContain('{exercise}');
    expect(modal.body).toContain('{date}');
    var source = readFileSync(resolve(root, pageLayout.pages.workout.component), 'utf8');
    expect(source.indexOf('pendingDeleteIdx') !== -1).toBe(true);
    expect(source.indexOf('requestDelete') !== -1).toBe(true);
    expect(source.indexOf('confirmDelete') !== -1).toBe(true);
  });

  it('body comp history delete asks for confirmation', function () {
    var modal = getModalSpec('bodyComp', 'deleteEntry');
    expect(modal.title).toBe('Delete this entry?');
    expect(modal.layerId).toBe('delete-body-comp-entry');
    expect(modal.buttons).toEqual(['Cancel', 'Delete']);
    expect(modal.body).toContain('{date}');
    var source = readFileSync(resolve(root, pageLayout.pages.bodyComp.component), 'utf8');
    expect(source.indexOf('pendingDeleteIdx') !== -1).toBe(true);
    expect(source.indexOf('deleteEntry') !== -1).toBe(true);
    expect(source.indexOf('confirmDelete') !== -1).toBe(true);
  });

  it('calendar log panel stacks over a mounted day panel', function () {
    var day = getModalSpec('workout', 'calendarDay');
    var log = getModalSpec('workout', 'calendarLog');
    expect(day.layerId).toBe('calendar-day-panel');
    expect(day.staysMountedUnder).toEqual(['calendarLog', 'deleteCalendarEntry']);
    expect(log.layerId).toBe('calendar-log-panel');
    expect(log.stacksOver).toBe('calendarDay');
    var source = readFileSync(resolve(root, pageLayout.pages.workout.component), 'utf8');
    expect(source.indexOf('calDayOpen = showCalendarModal && !!calSelectedDate;') !== -1).toBe(true);
    expect(source.indexOf('calDayOpen = showCalendarModal && !!calSelectedDate && calPanel === "view"') === -1).toBe(true);
  });

  it('calendar day panel delete asks for confirmation on a stacked layer', function () {
    var modal = getModalSpec('workout', 'deleteCalendarEntry');
    var day = getModalSpec('workout', 'calendarDay');
    expect(modal.title).toBe('Delete this workout?');
    expect(modal.layerId).toBe('delete-calendar-entry');
    expect(modal.buttons).toEqual(['Cancel', 'Delete']);
    expect(modal.body).toContain('{exercise}');
    expect(modal.body).toContain('{date}');
    expect(modal.stacksOver).toBe('calendarDay');
    expect(modal.enterClass).toBe('ft-kb-modal-backdrop');
    expect(modal.portal).toBe(true);
    expect(modal.zIndexFloor).toBe(2000);
    expect(day.staysMountedUnder).toContain('deleteCalendarEntry');
    var source = readFileSync(resolve(root, pageLayout.pages.workout.component), 'utf8');
    expect(source.indexOf('btnIconDeleteCal') !== -1).toBe(true);
    expect(source.indexOf('delW(w._idx)') === -1).toBe(true);
    expect(source.indexOf('requestDelete(w._idx)') !== -1).toBe(true);
    expect(source.indexOf('deleteCalendarModal.layerId') !== -1).toBe(true);
    expect(source.indexOf('createPortal') !== -1).toBe(true);
    expect(source.indexOf('pendingDeleteRef') !== -1).toBe(true);
    expect(source.indexOf('onBackdropClick') !== -1).toBe(true);
    expect(source.indexOf('actionsLocked') !== -1).toBe(true);
  });

  it('workout hero uses a filled stat strip under the title', function () {
    var hero = getPageLayout('workout').hero;
    expect(hero.statLayout).toBe('filled-strip');
    expect(hero.statMetrics.map(function (m) { return m.id; })).toEqual(['workouts', 'unique', 'today']);
    var source = readFileSync(resolve(root, pageLayout.pages.workout.component), 'utf8');
    expect(source.indexOf('heroStatStrip') !== -1).toBe(true);
    expect(source.indexOf('heroStatGhost') === -1).toBe(true);
  });

  it('workout hero today date is day short-month year', function () {
    var todayDate = getPageLayout('workout').hero.todayDate;
    expect(todayDate.pattern).toBe('D Mon YYYY');
    expect(todayDate.monthCase).toBe('shortTitle');
    todayDate.fixtures.forEach(function (fixture) {
      expect(formatHeroTodayDate(new Date(fixture.iso + 'T12:00:00'), todayDate)).toBe(fixture.expected);
    });
    var source = readFileSync(resolve(root, pageLayout.pages.workout.component), 'utf8');
    expect(source.indexOf('formatHeroTodayDate') !== -1).toBe(true);
  });

  it('workout manual log Quick log is a non-button hint', function () {
    var manualLog = getPageLayout('workout').manualLog;
    expect(manualLog.title).toBe('Manual entry');
    expect(manualLog.badge).toBe('Quick log');
    expect(manualLog.badgeStyle).toBe('hint');
    var source = readFileSync(resolve(root, pageLayout.pages.workout.component), 'utf8');
    expect(source.indexOf('quickLogHint') !== -1).toBe(true);
    expect(source.indexOf('dashboardChip') === -1).toBe(true);
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

  it('workout history chrome uses the confirmed compact layout', function () {
    var chrome = getPageLayout('workout').historyChrome;
    expect(chrome.previewToggle).toBeUndefined();
    expect(chrome.statsInSearch).toBe(false);
    expect(chrome.statsOnToolbar).toBe(false);
    expect(chrome.toolbarGapPx).toBe(4);
    expect(chrome.groupCountStyle).toBe('entries');
    expect(chrome.shortToggleLabels).toBe(true);
    expect(chrome.expandAllStyle).toBe('text');
    expect(chrome.clearStyle).toBe('quietPill');
    expect(chrome.clearLabel).toBe('Clear History');
    var source = readFileSync(resolve(root, pageLayout.pages.workout.component), 'utf8');
    expect(source.indexOf('historyPreview') === -1).toBe(true);
    expect(source.indexOf('historyChrome.clearLabel') !== -1).toBe(true);
    expect(source.indexOf('clearHistoryBtn') !== -1).toBe(true);
    expect(source.indexOf('groupHeaderQuiet') !== -1).toBe(true);
    var css = readFileSync(resolve(root, pageLayout.pages.workout.cssModule), 'utf8');
    expect(css.indexOf('gap: ' + chrome.toolbarGapPx + 'px') !== -1).toBe(true);
  });

  it('workout history sorts DD-MM-YYYY dates without native Date parsing', function () {
    var source = readFileSync(resolve(root, pageLayout.pages.workout.component), 'utf8');
    expect(source.indexOf('sortHistoryWorkouts') !== -1).toBe(true);
    expect(source.indexOf('new Date(b.date)') === -1).toBe(true);
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
