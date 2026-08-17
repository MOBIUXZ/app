import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const visualSpec = JSON.parse(readFileSync(resolve(root, '../../spec/visual-regression.json'), 'utf8'));
const seedSpec = JSON.parse(readFileSync(resolve(root, '../../spec/visual-seed-data.json'), 'utf8'));
const appConfig = JSON.parse(readFileSync(resolve(root, '../../spec/app-config.json'), 'utf8'));

export function frozenNowDate() {
  return visualSpec.frozenNow ? new Date(visualSpec.frozenNow) : new Date();
}

export function buildSeedData() {
  var data = JSON.parse(JSON.stringify(seedSpec.data));
  var today = frozenNowDate().toLocaleDateString();
  data.calories = data.calories.map(function (entry) {
    if (entry.date === 'SEED_TODAY') {
      return Object.assign({}, entry, { date: today });
    }
    return entry;
  });
  return data;
}

export function storageKey() {
  return seedSpec.storageKey || appConfig.storageKey;
}

export async function seedLocalStorage(page) {
  var key = storageKey();
  var data = buildSeedData();
  await page.addInitScript(function (payload) {
    localStorage.setItem(payload.key, JSON.stringify(payload.data));
  }, { key: key, data: data });
}

export function loadVisualSpec() {
  return JSON.parse(readFileSync(resolve(root, '../../spec/visual-regression.json'), 'utf8'));
}
