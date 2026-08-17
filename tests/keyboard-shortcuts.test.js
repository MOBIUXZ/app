import { describe, it, expect } from 'vitest';
import keyboardSpec from '../spec/keyboard-shortcuts.json';
import appConfig from '../spec/app-config.json';

describe('keyboard shortcuts spec', function () {
  it('navigation tabs match app-config', function () {
    expect(keyboardSpec.navigation.tabs).toEqual(appConfig.tabs);
  });

  it('has five tab number keys', function () {
    expect(keyboardSpec.navigation.numberKeys.length).toBe(5);
  });

  it('defines list navigation keys', function () {
    expect(keyboardSpec.listNav.upKey).toBe('ArrowUp');
    expect(keyboardSpec.listNav.downKey).toBe('ArrowDown');
    expect(keyboardSpec.listNav.selectKey).toBe('Enter');
  });

  it('settings popup closes with Escape', function () {
    var settings = keyboardSpec.popups.find(function (p) { return p.id === 'settings'; });
    expect(settings.layerId).toBe('settings');
    expect(settings.closeKey).toBe('Escape');
    expect(settings.staysMountedUnder).toEqual(['wipe-all-logs', 'import-backup']);
    var wipe = keyboardSpec.popups.find(function (p) { return p.id === 'wipe-all-logs'; });
    expect(wipe.stacksOver).toBe('settings');
    expect(wipe.closeKey).toBe('Escape');
    var importBackup = keyboardSpec.popups.find(function (p) { return p.id === 'import-backup'; });
    expect(importBackup.stacksOver).toBe('settings');
    expect(importBackup.closeKey).toBe('Escape');
  });

  it('parser textarea uses Enter submit and Shift+Enter newline', function () {
    expect(keyboardSpec.parserTextarea.submitKey).toBe('Enter');
    expect(keyboardSpec.parserTextarea.newlineModifier).toBe('Shift');
  });

  it('css classes are defined for keyboard feedback', function () {
    expect(keyboardSpec.cssClasses.listFocus).toBe('ft-kb-focus');
    expect(keyboardSpec.cssClasses.activate).toBe('ft-kb-activate');
    expect(keyboardSpec.cssClasses.btnFocus).toBe('ft-kb-btn-focus');
    expect(keyboardSpec.cssClasses.btnFocusCancel).toBe('ft-kb-btn-focus-cancel');
    expect(keyboardSpec.cssClasses.btnFocusConfirm).toBe('ft-kb-btn-focus-confirm');
  });

  it('confirm dialog uses filled button focus', function () {
    expect(keyboardSpec.confirmDialog.focusStyle).toBe('filled');
    expect(keyboardSpec.confirmDialog.defaultFocus).toBe('cancel');
    expect(keyboardSpec.confirmDialog.ignoreBackdropClickMs).toBeGreaterThan(0);
  });

  it('calendar log/parse stacks over a mounted day panel', function () {
    expect(keyboardSpec.calendarStack.order).toEqual([
      'calendar-modal',
      'calendar-day-panel',
      'calendar-log-panel',
      'delete-calendar-entry',
    ]);
    expect(keyboardSpec.calendarStack.dayPanelStaysMounted).toBe(true);
    expect(keyboardSpec.calendarStack.logEnterAnimation).toBe('same-as-day');
    var day = keyboardSpec.popups.find(function (p) { return p.id === 'calendar-day-panel'; });
    var log = keyboardSpec.popups.find(function (p) { return p.id === 'calendar-log-panel'; });
    var del = keyboardSpec.popups.find(function (p) { return p.id === 'delete-calendar-entry'; });
    expect(day.staysMountedUnder).toEqual(['calendar-log-panel', 'delete-calendar-entry']);
    expect(log.stacksOver).toBe('calendar-day-panel');
    expect(log.enterClass).toBe(keyboardSpec.cssClasses.modalBackdrop);
    expect(del.stacksOver).toBe('calendar-day-panel');
    expect(del.enterClass).toBe(keyboardSpec.cssClasses.modalBackdrop);
    expect(del.closeKey).toBe('Escape');
  });
});
