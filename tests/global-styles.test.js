import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import globalStyles from '../spec/global-styles.json';
import keyboardSpec from '../spec/keyboard-shortcuts.json';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const globalCss = readFileSync(resolve(root, globalStyles.outputPath), 'utf8');

describe('global styles (spec/global-styles.json)', function () {
  it('imports theme.css', function () {
    globalStyles.imports.forEach(function (imp) {
      expect(globalCss).toContain('@import "' + imp + '"');
    });
  });

  it('defines all keyboard classes', function () {
    globalStyles.keyboardClasses.forEach(function (cls) {
      expect(globalCss).toContain('.' + cls);
    });
  });

  it('keyboard spec cssClasses appear in global.css', function () {
    Object.values(keyboardSpec.cssClasses).forEach(function (cls) {
      expect(globalCss).toContain('.' + cls);
    });
  });

  it('hides number input spinners', function () {
    expect(globalCss).toContain('input[type="number"]');
    expect(globalCss).toContain('-webkit-appearance: none');
  });

  it('uses theme tokens for body background', function () {
    expect(globalCss).toContain(globalStyles.base.bodyBackground);
  });

  it('applies keyboard class tokens in global.css', function () {
    Object.keys(globalStyles.keyboardClassTokens).forEach(function (cls) {
      expect(globalCss).toContain('.' + cls);
      Object.values(globalStyles.keyboardClassTokens[cls]).forEach(function (val) {
        expect(globalCss).toContain(val);
      });
    });
  });

  it('confirm dialog focus does not use a pulsing ring', function () {
    expect(globalCss).not.toContain('ft-kb-btn-pulse');
  });
});
