import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import uiModuleSpec from '../spec/ui-module.json';
import cssModulesSpec from '../spec/css-modules.json';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const uiCss = readFileSync(resolve(root, uiModuleSpec.outputPath), 'utf8');

function hasClass(className) {
  return uiCss.indexOf('.' + className) !== -1;
}

describe('ui module spec (spec/ui-module.json)', function () {
  uiModuleSpec.requiredClasses.forEach(function (className) {
    it('ui.module.css defines .' + className, function () {
      expect(hasClass(className)).toBe(true);
    });
  });

  it('shared component root classes exist', function () {
    expect(hasClass(uiModuleSpec.sharedComponents.Card.rootClass)).toBe(true);
    expect(hasClass(uiModuleSpec.sharedComponents.StatBox.rootClass)).toBe(true);
    expect(hasClass(uiModuleSpec.sharedComponents.Collapse.rootClass)).toBe(true);
  });

  it('modal classes exist', function () {
    Object.values(uiModuleSpec.modal).forEach(function (className) {
      expect(hasClass(className)).toBe(true);
    });
  });

  it('ui.module.css class list matches css-modules spec', function () {
    var specClasses = cssModulesSpec.modules['src/styles/ui.module.css'];
    specClasses.forEach(function (className) {
      expect(hasClass(className)).toBe(true);
    });
  });
});
