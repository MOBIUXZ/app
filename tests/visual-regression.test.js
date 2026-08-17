import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import visualSpec from '../spec/visual-regression.json';
import seedSpec from '../spec/visual-seed-data.json';
import pageLayout from '../spec/page-layout.json';
import keyboardSpec from '../spec/keyboard-shortcuts.json';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

describe('visual regression spec', function () {
  it('seed data spec exists and references storage key', function () {
    expect(existsSync(resolve(root, visualSpec.seedSpec))).toBe(true);
    expect(seedSpec.storageKey).toBe('ft_v5');
  });

  it('each snapshot tab matches keyboard navigation', function () {
    visualSpec.snapshots.forEach(function (snap) {
      expect(keyboardSpec.navigation.tabs).toContain(snap.tab);
    });
  });

  it('snapshot page titles align with page-layout spec', function () {
    var tabToPage = {
      'Dashboard': 'dashboard',
      'Workout': 'workout',
      'Body Comp': 'bodyComp',
      'Calories': 'calories',
      'Progress': 'progress',
    };
    visualSpec.snapshots.forEach(function (snap) {
      var pageId = tabToPage[snap.tab];
      var layout = pageLayout.pages[pageId];
      var expectedTitle = layout.pageTitle || (layout.hero && layout.hero.title);
      expect(snap.pageTitle).toBe(expectedTitle);
    });
  });

  it('e2e visual test file exists', function () {
    expect(existsSync(resolve(root, 'e2e/visual.spec.js'))).toBe(true);
    expect(existsSync(resolve(root, 'playwright.config.js'))).toBe(true);
  });

  it('freezes the clock so calories dates stay deterministic', function () {
    expect(visualSpec.frozenNow).toBeTruthy();
    expect(isNaN(new Date(visualSpec.frozenNow).getTime())).toBe(false);
  });
});
