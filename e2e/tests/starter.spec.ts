import { test, expect } from '@playwright/test';
import { ws, createDashboard, deleteDashboard, readMainCards, loadData, updateAll, Dashboard, Card } from './helpers';

// The starter card (`custom:linked-lovelace-starter`) is a one-click on-ramp: it
// drops in a pre-built showcase dashboard (`linked-lovelace-demo`) so a new user
// can see the whole feature set live. These tests prove that drop-in works and
// that the resulting dashboard actually renders when synced.
const DEMO_URL = 'linked-lovelace-demo';

let created: Dashboard[] = [];

async function deleteByUrlPath(page: any, urlPath: string) {
  const list = await ws<any[]>(page, { type: 'lovelace/dashboards/list' });
  const found = list.find((d) => d.url_path === urlPath);
  if (found) await deleteDashboard(page, found.id);
}

test.afterEach(async ({ page }) => {
  for (const d of created) await deleteDashboard(page, d.id);
  created = [];
  await deleteByUrlPath(page, DEMO_URL).catch(() => {});
});

async function openStarter(page: any, urlPath: string) {
  await page.goto(`/${urlPath}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!customElements.get('linked-lovelace-starter'), null, { timeout: 30_000 });
  const card = page.locator('linked-lovelace-starter').first();
  await expect(card).toBeVisible();
  return card;
}

test('starter card renders with a Create Demo Dashboard action', async ({ page }) => {
  const d = await createDashboard(page, [{ type: 'custom:linked-lovelace-starter' }]);
  created.push(d);
  const card = await openStarter(page, d.urlPath);
  await expect(card.getByText('Linked Lovelace Starter', { exact: true })).toBeVisible();
  await expect(card.locator('[data-testid="create-demo"]')).toContainText('Create Demo Dashboard');
});

test('clicking Create drops in the pre-built demo dashboard', async ({ page }) => {
  const d = await createDashboard(page, [{ type: 'custom:linked-lovelace-starter' }]);
  created.push(d);
  const card = await openStarter(page, d.urlPath);

  // Make sure we start clean.
  await deleteByUrlPath(page, DEMO_URL).catch(() => {});

  await card.locator('[data-testid="create-demo"]').click();

  // The card reports success and links to the new dashboard.
  await expect(card.getByText('Demo dashboard ready!', { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(card.locator(`a.open-link[href="/${DEMO_URL}"]`)).toBeVisible();

  // The dashboard now exists with the showcase config (status card + templates).
  const config = await ws<Card>(page, { type: 'lovelace/config', url_path: DEMO_URL });
  const views: Card[] = config.views ?? [];
  const allCards: Card[] = views.flatMap((v) => v.cards ?? []);
  expect(allCards.some((c) => c.type === 'custom:linked-lovelace-status')).toBe(true);
  expect(allCards.filter((c) => c.ll_key).map((c) => c.ll_key).sort()).toEqual(['badge', 'panel', 'room']);
  expect(allCards.filter((c) => c.ll_template === 'room')).toHaveLength(3);
});

test('the dropped-in demo dashboard renders when synced', async ({ page }) => {
  const d = await createDashboard(page, [{ type: 'custom:linked-lovelace-starter' }]);
  created.push(d);
  const starter = await openStarter(page, d.urlPath);
  await deleteByUrlPath(page, DEMO_URL).catch(() => {});
  await starter.locator('[data-testid="create-demo"]').click();
  await expect(starter.getByText('Demo dashboard ready!', { exact: true })).toBeVisible({ timeout: 15_000 });

  // Open the demo dashboard, run the sync, and confirm the templates rendered.
  await page.goto(`/${DEMO_URL}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!customElements.get('linked-lovelace-status'), null, { timeout: 30_000 });
  const status = page.locator('linked-lovelace-status').first();
  await loadData(status);
  await updateAll(page, status);

  // The reused "room" template renders with its context + the partial's icon.
  await expect
    .poll(async () => {
      const rooms = (await readMainCards(page, DEMO_URL)).filter((c) => c.ll_template === 'room');
      return rooms.find((c) => c.ll_context?.name === 'Living Room')?.content || '';
    }, { timeout: 15_000 })
    .toContain('Living Room');

  const rooms = (await readMainCards(page, DEMO_URL)).filter((c) => c.ll_template === 'room');
  const living = rooms.find((c) => c.ll_context?.name === 'Living Room');
  expect(living?.content).toContain('🟢'); // stateToIcon partial rendered for state "on"

  // The nested "panel" template rendered too.
  const panel = (await readMainCards(page, DEMO_URL)).find((c) => c.ll_template === 'panel');
  expect(panel?.type).toBe('vertical-stack');
  expect(JSON.stringify(panel?.cards)).toContain('Welcome');
});
