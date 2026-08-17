import { test, expect } from '@playwright/test';
import { seedLocalStorage, loadVisualSpec, frozenNowDate } from './helpers/seed.mjs';

var visualSpec = loadVisualSpec();

test.describe('visual regression (spec/visual-regression.json)', function () {
  test.beforeEach(async function ({ page }) {
    await page.clock.setFixedTime(frozenNowDate());
    await seedLocalStorage(page);
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  visualSpec.snapshots.forEach(function (snap) {
    test(snap.id + ' page', async function ({ page }) {
      await page.getByRole('tab', { name: snap.tab, exact: true }).click();
      await expect(page.getByText(snap.waitFor, { exact: false }).first()).toBeVisible({ timeout: 10000 });
      if (snap.openAction && snap.openAction.type === 'click') {
        await page.getByRole('button', { name: snap.openAction.text, exact: false }).click();
        if (snap.waitForAfterOpen) {
          await expect(page.getByText(snap.waitForAfterOpen, { exact: false }).first()).toBeVisible({ timeout: 10000 });
        }
      }
      if (snap.extraWaitMs) {
        await page.waitForTimeout(snap.extraWaitMs);
      }
      await expect(page).toHaveScreenshot(snap.id + '.png', {
        fullPage: snap.fullPage === true,
        animations: visualSpec.animations,
        maxDiffPixelRatio: visualSpec.maxDiffPixelRatio,
      });
    });
  });

  visualSpec.modalSnapshots.forEach(function (snap) {
    test(snap.id + ' modal', async function ({ page }) {
      await page.getByRole('tab', { name: snap.tab, exact: true }).click();
      if (snap.openAction.type === 'click') {
        await page.getByRole('button', { name: snap.openAction.text, exact: false }).click();
      }
      await expect(page.getByText(snap.waitFor, { exact: false }).first()).toBeVisible({ timeout: 10000 });
      await expect(page).toHaveScreenshot(snap.id + '.png', {
        fullPage: false,
        animations: visualSpec.animations,
        maxDiffPixelRatio: visualSpec.maxDiffPixelRatio,
      });
    });
  });
});
