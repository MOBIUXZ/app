#!/usr/bin/env node
/** Validates docs reference existing spec files and key doc sections exist */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(resolve(root, 'spec/manifest.json'), 'utf8'));
var errors = [];

var checkedDocs = {};
manifest.specs.forEach(function (spec) {
  var docPaths = spec.docs || [];
  docPaths.forEach(function (docRel) {
    if (checkedDocs[docRel]) return;
    checkedDocs[docRel] = true;
    var docPath = resolve(root, docRel);
    if (!existsSync(docPath)) {
      errors.push('Manifest references missing doc: ' + docRel);
      return;
    }
    var content = readFileSync(docPath, 'utf8');
    if (content.indexOf('spec/') === -1 && docRel.indexOf('data-model') !== -1) {
      errors.push(docRel + ' should reference spec/ files');
    }
  });
});

var requiredDocs = [
  'docs/CONSTITUTION.md',
  'docs/SDD-WORKFLOW.md',
  'docs/RECONSTRUCTION.md',
  'docs/data-model.md',
  'AGENTS.md',
];
requiredDocs.forEach(function (rel) {
  if (!existsSync(resolve(root, rel))) errors.push('Missing required doc: ' + rel);
});

var specFiles = readdirSync(resolve(root, 'spec')).filter(function (f) { return f.endsWith('.json'); });
if (specFiles.length < 18) {
  errors.push('Expected at least 18 spec JSON files, found ' + specFiles.length);
}

if (errors.length) {
  console.error('Doc verification failed:\n');
  errors.forEach(function (msg) { console.error('  ✗ ' + msg); });
  process.exit(1);
}

console.log('✓ Docs and spec cross-references OK (' + specFiles.length + ' spec files)');
