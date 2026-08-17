import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import qaChecklist from '../spec/manual-qa-checklist.json';
import visualSpec from '../spec/visual-regression.json';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

describe('manual QA checklist spec', function () {
  it('defines automated equivalent command', function () {
    expect(qaChecklist.automatedEquivalent).toBe('npm run test:visual');
  });

  it('every visual snapshot has a matching QA section', function () {
    var snapshotIds = visualSpec.snapshots.map(function (s) { return s.id; })
      .concat((visualSpec.modalSnapshots || []).map(function (s) { return s.id; }));
    qaChecklist.sections.forEach(function (section) {
      if (section.visualSnapshot) {
        expect(snapshotIds.indexOf(section.visualSnapshot) !== -1).toBe(true);
      }
      (section.items || []).forEach(function (item) {
        if (!item.visualSnapshot) return;
        expect(snapshotIds.indexOf(item.visualSnapshot) !== -1).toBe(true);
      });
    });
  });

  it('manual QA doc exists', function () {
    expect(existsSync(resolve(root, 'docs/MANUAL-QA.md'))).toBe(true);
  });

  it('sections have at least one checklist item', function () {
    qaChecklist.sections.forEach(function (section) {
      expect(section.items.length).toBeGreaterThan(0);
    });
  });
});
