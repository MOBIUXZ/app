import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import fileTree from '../spec/file-tree.json';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

describe('project file tree (spec/file-tree.json)', function () {
  fileTree.requiredPaths.forEach(function (relPath) {
    it('exists: ' + relPath, function () {
      expect(existsSync(resolve(root, relPath))).toBe(true);
    });
  });
});
