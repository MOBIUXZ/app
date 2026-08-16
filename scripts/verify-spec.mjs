#!/usr/bin/env node
/**
 * Pre-test spec verification — checks manifest paths and JSON validity.
 * Run via: npm run spec:check
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(resolve(root, 'spec/manifest.json'), 'utf8'));

var errors = [];

manifest.specs.forEach(function (spec) {
  var fullPath = resolve(root, spec.path);
  if (!existsSync(fullPath)) {
    errors.push('Missing spec file: ' + spec.path);
    return;
  }
  try {
    JSON.parse(readFileSync(fullPath, 'utf8'));
  } catch (e) {
    errors.push('Invalid JSON in ' + spec.path + ': ' + e.message);
  }
});

if (errors.length) {
  console.error('Spec verification failed:\n');
  errors.forEach(function (msg) { console.error('  ✗ ' + msg); });
  process.exit(1);
}

console.log('✓ All ' + manifest.specs.length + ' spec files present and valid JSON');
