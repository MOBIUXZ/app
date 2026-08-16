import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import themeSpec from '../spec/theme-tokens.json';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const themeCss = readFileSync(resolve(root, themeSpec.outputPath), 'utf8');

describe('theme tokens (spec/theme-tokens.json)', function () {
  Object.entries(themeSpec.tokens).forEach(function (entry) {
    var varName = entry[0];
    var value = entry[1];
    it(varName + ' = ' + value, function () {
      expect(themeCss).toContain(varName + ': ' + value + ';');
    });
  });
});
