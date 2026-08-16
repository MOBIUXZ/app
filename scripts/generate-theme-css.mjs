#!/usr/bin/env node
/** Generates src/styles/theme.css from spec/theme-tokens.json */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const spec = JSON.parse(readFileSync(resolve(root, 'spec/theme-tokens.json'), 'utf8'));
const lines = [':root {'];
Object.entries(spec.tokens).forEach(function (entry) {
  lines.push('  ' + entry[0] + ': ' + entry[1] + ';');
});
lines.push('}', '');

const outPath = resolve(root, spec.outputPath);
writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log('✓ Generated ' + spec.outputPath + ' (' + Object.keys(spec.tokens).length + ' tokens)');
