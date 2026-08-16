import { defineConfig } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const visualSpec = JSON.parse(readFileSync(resolve(root, 'spec/visual-regression.json'), 'utf8'));

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: visualSpec.baseUrl,
    viewport: visualSpec.viewport,
    trace: 'on-first-retry',
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: visualSpec.maxDiffPixelRatio,
      animations: visualSpec.animations,
    },
  },
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: visualSpec.baseUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
