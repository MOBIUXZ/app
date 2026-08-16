import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import styleHelpersSpec from '../spec/style-helpers.json';
import * as helpers from '../src/styles/styleHelpers.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

describe('style helpers (spec/style-helpers.json)', function () {
  styleHelpersSpec.exports.forEach(function (name) {
    it('exports ' + name, function () {
      expect(typeof helpers[name]).not.toBe('undefined');
    });
  });

  it('helper source file exists at spec path', function () {
    expect(readFileSync(resolve(root, styleHelpersSpec.modulePath), 'utf8').length).toBeGreaterThan(0);
  });

  it('btnPrimaryClass maps to ui.btnPrimary', function () {
    expect(helpers.btnPrimaryClass()).toContain(helpers.ui.btnPrimary);
  });

  it('cx joins class names', function () {
    expect(helpers.cx('a', '', 'b')).toBe('a b');
  });
});
