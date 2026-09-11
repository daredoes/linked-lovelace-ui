import { test, expect } from '@playwright/test';
import * as path from 'path';
import YAML from 'yaml';
import { ws, saveConfig, deleteDashboard } from '../tests/helpers';

// Captures the two Dashboards-tab screenshots used by
// docs_site/using-the-status-card.md: the tab as it looks after Load Data, and
// the same card with Preview Changes expanded. Run via ./scripts/screenshots.sh.
const OUT = path.resolve('..', 'docs_site', 'images');

test('capture status card dashboards tab', async ({ page }) => {
  test.setTimeout(300_000);
  page.on('dialog', (d) => d.accept().catch(() => {}));
  await page.goto('/lovelace/demo', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!(document.querySelector('home-assistant') as any)?.hass, null, { timeout: 30_000 });
  for (const d of await ws<any[]>(page, { type: 'lovelace/dashboards/list' })) {
    if (/^ll-/.test(d.url_path || '')) await deleteDashboard(page, d.id);
  }
  const created = await ws<{ id: string }>(page, {
    type: 'lovelace/dashboards/create', url_path: 'll-shots', title: 'Rooms', mode: 'storage', show_in_sidebar: true,
  });
  await saveConfig(page, 'll-shots', YAML.parse(`
title: Rooms
views:
  - title: Home
    path: home
    cards:
      - type: custom:linked-lovelace-status
      - type: custom:linked-lovelace-template
        ll_template: room
        ll_context:
          name: Living Room
          state: 'on'
  - title: Sources
    path: sources
    cards:
      - type: markdown
        ll_key: room
        content: |
          ## <%= context.name %>
          Lights are **<%= context.state %>**.
`));
  let card;
  for (let i = 0; i < 3; i++) {
    await page.goto('/ll-shots', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!customElements.get('linked-lovelace-status'), null, { timeout: 30_000 });
    card = page.locator('linked-lovelace-status').first();
    if (await card.waitFor({ state: 'visible', timeout: 8_000 }).then(() => true).catch(() => false)) break;
  }
  // The expanded card is taller than the viewport, so an element screenshot
  // has to scroll and the fixed app header paints over its top. Lifting the
  // card above the header keeps the capture clean.
  await card!.evaluate((el: HTMLElement) => {
    el.style.position = 'relative';
    el.style.zIndex = '9999';
  });
  await card!.getByText('Load Data', { exact: true }).click();
  await expect.poll(() => card!.evaluate((el: any) => el._loaded === true), { timeout: 40_000 }).toBe(true);
  await page.mouse.move(0, 0);
  await page.waitForTimeout(800);
  await card!.screenshot({ path: `${OUT}/linked-lovelace-status-loaded.png` });

  await card!.locator('.accordion-bar', { hasText: 'Preview Changes' }).click();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(800);
  await card!.screenshot({ path: `${OUT}/linked-lovelace-dashboard-diff.png` });
  await deleteDashboard(page, created.id);
});
