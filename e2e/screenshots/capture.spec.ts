import { test, expect, Page, Locator } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { ws, createDashboard, deleteDashboard, loadData, updateAll } from '../tests/helpers';

// Captures documentation screenshots of the Linked Lovelace status card flow,
// running against the real Home Assistant demo. Output -> docs/imgs/e2e/ and
// docs_site/images/ (for the VitePress site).
// Run via: ./scripts/screenshots.sh  (NOT part of the CI e2e gate).
const OUT = path.resolve('..', 'docs', 'imgs', 'e2e');
const SITE = path.resolve('..', 'docs_site', 'images');
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(SITE, { recursive: true });

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

test('capture: starter card + the dropped-in demo dashboard (rendered)', async ({ page }) => {
  const DEMO_URL = 'linked-lovelace-demo';
  // Fresh start: remove any existing demo dashboard.
  const list = await (async () => {
    await page.goto('/lovelace/demo', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!(document.querySelector('home-assistant') as any)?.hass, null, { timeout: 30_000 });
    return ws<any[]>(page, { type: 'lovelace/dashboards/list' });
  })();
  const existing = list.find((d) => d.url_path === DEMO_URL);
  if (existing) await deleteDashboard(page, existing.id);

  // Seed a dashboard with the starter card and screenshot it.
  const seed = await createDashboard(page, [{ type: 'custom:linked-lovelace-starter' }]);
  await page.goto(`/${seed.urlPath}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!customElements.get('linked-lovelace-starter'), null, { timeout: 30_000 });
  const starter = page.locator('linked-lovelace-starter').first();
  await expect(starter).toBeVisible();
  await page.waitForTimeout(400);
  await shotEl(starter, '06-starter-card.png');
  fs.copyFileSync(path.join(OUT, '06-starter-card.png'), path.join(SITE, 'linked-lovelace-starter-card.png'));

  // Drop in the demo, then sync it on its own status card.
  await starter.locator('[data-testid="create-demo"]').click();
  await expect(starter.getByText('Demo dashboard ready!', { exact: true })).toBeVisible({ timeout: 15_000 });

  await page.goto(`/${DEMO_URL}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!customElements.get('linked-lovelace-status'), null, { timeout: 30_000 });
  const status = page.locator('linked-lovelace-status').first();
  await loadData(status);
  await updateAll(page, status);
  await page.waitForTimeout(800);

  // Reload so the saved/rendered cards are shown, then capture the payoff.
  await page.goto(`/${DEMO_URL}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!customElements.get('linked-lovelace-status'), null, { timeout: 30_000 });
  await page.waitForTimeout(800);
  await shotPage(page, '07-demo-dashboard-rendered.png');
  fs.copyFileSync(path.join(OUT, '07-demo-dashboard-rendered.png'), path.join(SITE, 'linked-lovelace-demo-rendered.png'));

  // Cleanup.
  await deleteDashboard(page, seed.id);
  const after = await ws<any[]>(page, { type: 'lovelace/dashboards/list' });
  const demo = after.find((d) => d.url_path === DEMO_URL);
  if (demo) await deleteDashboard(page, demo.id);
});
