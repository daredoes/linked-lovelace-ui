import { Page, Locator, expect } from '@playwright/test';

// Helpers for the feature e2e tests. They drive Home Assistant's Lovelace
// websocket API (create / save / read / delete storage dashboards) from the
// browser via `hass.callWS`, and the Linked Lovelace status card UI.

export type Card = Record<string, any>;

const STATUS_CARD: Card = { type: 'custom:linked-lovelace-status' };

// Run a websocket command using the page's live hass connection.
export async function ws<T = any>(page: Page, msg: Record<string, any>): Promise<T> {
  return page.evaluate(
    (m) => (document.querySelector('home-assistant') as any).hass.callWS(m),
    msg,
  );
}

// Make sure the page has a hass connection (needed before any ws() call).
export async function ensureHass(page: Page): Promise<void> {
  if (!page.url().includes('/lovelace')) {
    await page.goto('/lovelace/demo', { waitUntil: 'domcontentloaded' });
  }
  await page.waitForFunction(() => !!(document.querySelector('home-assistant') as any)?.hass, null, {
    timeout: 30_000,
  });
}

let seq = 0;

// Create a fresh storage dashboard containing the status card + the given
// cards, returning its url_path. Tracks the dashboard for later cleanup.
export interface Dashboard {
  urlPath: string;
  id: string;
}

export async function createDashboard(page: Page, cards: Card[]): Promise<Dashboard> {
  await ensureHass(page);
  const urlPath = `ll-e2e-${Date.now().toString(36)}-${seq++}`;
  const created = await ws<{ id: string }>(page, {
    type: 'lovelace/dashboards/create',
    url_path: urlPath,
    title: `E2E ${urlPath}`,
    mode: 'storage',
    show_in_sidebar: false,
  });
  await saveConfig(page, urlPath, {
    title: `E2E ${urlPath}`,
    views: [{ title: 'Main', path: 'main', cards: [STATUS_CARD, ...cards] }],
  });
  return { urlPath, id: created.id };
}

export async function saveConfig(page: Page, urlPath: string, config: Card): Promise<void> {
  await ws(page, { type: 'lovelace/config/save', url_path: urlPath, config });
}

export async function readConfig(page: Page, urlPath: string): Promise<Card> {
  return ws<Card>(page, { type: 'lovelace/config', url_path: urlPath });
}

// The non-status cards of the dashboard's first view (after a sync these are the
// rendered output of the template usages).
export async function readMainCards(page: Page, urlPath: string): Promise<Card[]> {
  const config = await readConfig(page, urlPath);
  const cards: Card[] = config.views?.[0]?.cards ?? [];
  return cards.filter((c) => c.type !== 'custom:linked-lovelace-status');
}

export async function deleteDashboard(page: Page, id: string): Promise<void> {
  await ensureHass(page);
  await ws(page, { type: 'lovelace/dashboards/delete', dashboard_id: id }).catch(() => {});
}

// Open a dashboard and return the (upgraded) status card element.
// Home Assistant builds a view's cards as soon as its config arrives. On a cold
// module cache the bundle registers its elements a moment later, and the view
// then shows "Custom element doesn't exist" instead of the card. Reloading once
// the element is registered renders it properly, so retry rather than fail.
export async function openCard(page: Page, url: string, tag = 'linked-lovelace-status'): Promise<Locator> {
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const registered = await page
      .waitForFunction((t) => !!customElements.get(t), tag, { timeout: 10_000 })
      .then(() => true)
      .catch(() => false);
    if (!registered) continue;
    const card = page.locator(tag).first();
    const visible = await card
      .waitFor({ state: 'visible', timeout: 5_000 })
      .then(() => true)
      .catch(() => false);
    if (visible) return card;
  }
  throw new Error(`${tag} never rendered on ${url}`);
}

export async function openStatusCard(page: Page, urlPath: string): Promise<Locator> {
  return openCard(page, `/${urlPath}`);
}

// Click "Load Data" and wait for the controller to finish scanning live config.
export async function loadData(card: Locator): Promise<void> {
  await card.getByText('Load Data', { exact: true }).click();
  await expect.poll(() => card.evaluate((el: any) => el._loaded === true), { timeout: 25_000 }).toBe(true);
}

// Accept the confirm() dialog and click "Update All" to sync (writes rendered
// configs back via lovelace/config/save).
export async function updateAll(page: Page, card: Locator): Promise<void> {
  page.on('dialog', (d) => d.accept().catch(() => {}));
  await card.getByText('Update All', { exact: true }).click();
}
