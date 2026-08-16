import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import cssModulesSpec from '../spec/css-modules.json';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function extractCssClasses(cssText) {
  var matches = cssText.match(/^\.([a-zA-Z_][\w-]*)/gm) || [];
  return new Set(matches.map(function (m) { return m.slice(1); }));
}

describe('css modules contract (spec/css-modules.json)', function () {
  Object.entries(cssModulesSpec.modules).forEach(function (entry) {
    var relPath = entry[0];
    var required = entry[1];
    it(relPath + ' defines all required classes (' + required.length + ')', function () {
      var css = readFileSync(resolve(root, relPath), 'utf8');
      var defined = extractCssClasses(css);
      required.forEach(function (className) {
        expect(defined.has(className)).toBe(true);
      });
    });
  });
});
