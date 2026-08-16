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

  it('parser textarea uses Enter submit and Shift+Enter newline', function () {
    expect(keyboardSpec.parserTextarea.submitKey).toBe('Enter');
    expect(keyboardSpec.parserTextarea.newlineModifier).toBe('Shift');
  });

  it('css classes are defined for keyboard feedback', function () {
    expect(keyboardSpec.cssClasses.listFocus).toBe('ft-kb-focus');
    expect(keyboardSpec.cssClasses.activate).toBe('ft-kb-activate');
  });

  it('calendar log/parse stacks over a mounted day panel', function () {
    expect(keyboardSpec.calendarStack.order).toEqual([
      'calendar-modal',
      'calendar-day-panel',
      'calendar-log-panel',
    ]);
    expect(keyboardSpec.calendarStack.dayPanelStaysMounted).toBe(true);
    expect(keyboardSpec.calendarStack.logEnterAnimation).toBe('same-as-day');
    var day = keyboardSpec.popups.find(function (p) { return p.id === 'calendar-day-panel'; });
    var log = keyboardSpec.popups.find(function (p) { return p.id === 'calendar-log-panel'; });
    expect(day.staysMountedUnder).toBe('calendar-log-panel');
    expect(log.stacksOver).toBe('calendar-day-panel');
    expect(log.enterClass).toBe(keyboardSpec.cssClasses.modalBackdrop);
  });
});
