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
