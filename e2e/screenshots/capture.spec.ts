import { test, expect, Page, Locator } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Captures documentation screenshots of the Linked Lovelace status card flow,
// running against the real Home Assistant demo. Output -> docs/imgs/e2e/.
// Run via: ./scripts/screenshots.sh  (NOT part of the CI e2e gate).
const OUT = path.resolve('..', 'docs', 'imgs', 'e2e');
fs.mkdirSync(OUT, { recursive: true });

const shotPage = (page: Page, name: string) =>
  page.screenshot({ path: path.join(OUT, name), fullPage: true });
const shotEl = (el: Locator, name: string) => el.screenshot({ path: path.join(OUT, name) });

async function statusCard(page: Page): Promise<Locator> {
  await page.goto('/lovelace/demo');
  await page.waitForFunction(() => !!customElements.get('linked-lovelace-status'), null, { timeout: 30_000 });
  const card = page.locator('linked-lovelace-status').first();
  await expect(card).toBeVisible();
  return card;
}

test('capture: demo dashboard (initial)', async ({ page }) => {
  const card = await statusCard(page);
  await page.waitForTimeout(500);
  await shotPage(page, '01-demo-dashboard.png');
  await shotEl(card, '02-status-card-initial.png');
});

test('capture: status card after Load Data', async ({ page }) => {
  const card = await statusCard(page);
  await card.getByText('Load Data', { exact: true }).click();
  await expect.poll(() => card.evaluate((el: any) => el._loaded === true), { timeout: 20_000 }).toBe(true);
  await page.waitForTimeout(300);
  await shotEl(card, '03-status-card-loaded.png');
});

test('capture: Templates + Partials tabs (discovered from live config)', async ({ page }) => {
  const card = await statusCard(page);
  await card.getByText('Load Data', { exact: true }).click();
  await expect.poll(() => card.evaluate((el: any) => el._loaded === true), { timeout: 20_000 }).toBe(true);

  // Templates tab + expand the accordion so the discovered template body shows.
  await card.locator('.tab', { hasText: 'Templates' }).click();
  await card.locator('.accordion-bar', { hasText: 'Templates' }).click();
  await page.waitForTimeout(300);
  await shotEl(card, '04-templates-tab.png');

  // Partials tab + expand.
  await card.locator('.tab', { hasText: 'Partials' }).click();
  await card.locator('.accordion-bar', { hasText: 'Partials' }).click();
  await page.waitForTimeout(300);
  await shotEl(card, '05-partials-tab.png');
});
