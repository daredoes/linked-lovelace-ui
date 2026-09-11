import { test, expect, Page, Locator } from '@playwright/test';
import { ws, deleteDashboard, saveConfig, Card } from '../tests/helpers';
import { installCaptions, say, clearCaption } from './captions';

// Records a single captioned walkthrough of Linked Lovelace running in a real
// Home Assistant: the starter card, a sync, the templates and partials the
// controller discovered, a template defined inside a sections view, and the
// key-chip option. Run via scripts/video.sh; not part of the CI e2e gate.

const STATUS_CARD: Card = { type: 'custom:linked-lovelace-status' };
const DEMO_URL = 'linked-lovelace-demo';

const ROOM_TEMPLATE: Card = {
  type: 'markdown',
  ll_key: 'room',
  content: '## <%= context.name %>\n\nLights are **<%= context.state %>**.',
};

const roomInstance = (name: string, state: string): Card => ({
  type: 'custom:linked-lovelace-template',
  ll_template: 'room',
  ll_context: { name, state },
});

// A leftover dashboard from an interrupted run would make `create` fail, so
// clear the url_path first.
async function removeIfExists(page: Page, urlPath: string) {
  const list = await ws<any[]>(page, { type: 'lovelace/dashboards/list' });
  const found = list.find((d) => d.url_path === urlPath);
  if (found) await deleteDashboard(page, found.id);
}

async function createDashboardWithConfig(page: Page, urlPath: string, config: Card) {
  await removeIfExists(page, urlPath);
  const created = await ws<{ id: string }>(page, {
    type: 'lovelace/dashboards/create',
    url_path: urlPath,
    title: config.title,
    mode: 'storage',
    show_in_sidebar: true,
  });
  await saveConfig(page, urlPath, config);
  return created.id;
}

// HA builds a view's cards as soon as its config arrives. On a cold module
// cache the bundle can register its elements a moment later, and the view then
// shows "Custom element doesn't exist" instead of the card. Reloading once the
// element is registered renders it properly, so retry rather than fail.
async function openCard(page: Page, urlPath: string, tag: string): Promise<Locator> {
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.goto(`/${urlPath}`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction((t) => !!customElements.get(t), tag, { timeout: 30_000 });
    const card = page.locator(tag).first();
    const visible = await card
      .waitFor({ state: 'visible', timeout: 8_000 })
      .then(() => true)
      .catch(() => false);
    if (visible) return card;
  }
  throw new Error(`${tag} never rendered on /${urlPath}`);
}

async function syncDashboard(page: Page, card: Locator) {
  page.on('dialog', (d) => d.accept().catch(() => {}));
  await card.getByText('Load Data', { exact: true }).click();
  await expect.poll(() => card.evaluate((el: any) => el._loaded === true), { timeout: 30_000 }).toBe(true);
}

test('demo walkthrough', async ({ page }) => {
  await installCaptions(page);
  const createdIds: string[] = [];

  // ---- Scene 1: the starter card --------------------------------------------
  console.log('SCENE 1: starter');
  const starterId = await (async () => {
    await page.goto('/lovelace/demo', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!(document.querySelector('home-assistant') as any)?.hass, null, {
      timeout: 30_000,
    });
    return createDashboardWithConfig(page, 'll-video-start', {
      title: 'Linked Lovelace',
      views: [{ title: 'Start', path: 'start', cards: [{ type: 'custom:linked-lovelace-starter' }] }],
    });
  })();
  createdIds.push(starterId);

  const starter = await openCard(page, 'll-video-start', 'linked-lovelace-starter');
  await say(page, 'Linked Lovelace: write a Lovelace card once, reuse it everywhere, sync on demand.');
  await say(page, 'This is a real Home Assistant. The Starter card drops in a demo dashboard.');
  await starter.locator('[data-testid="create-demo"]').click();
  await expect(starter).toContainText(/Demo|demo/);
  await say(page, 'One click created a dashboard with templates, partials, and cards that use them.');

  // ---- Scene 2: the demo dashboard before a sync ----------------------------
  console.log('SCENE 2: demo dashboard');
  const demoCard = await openCard(page, DEMO_URL, 'linked-lovelace-status');
  await say(page, 'Before syncing, each usage is just a placeholder holding its own ll_context.');

  // ---- Scene 3: Load Data ---------------------------------------------------
  console.log('SCENE 3: Load Data');
  await say(page, 'Load Data reads every dashboard over the websocket API and finds the sources.');
  await syncDashboard(page, demoCard);
  await say(page, 'It found the templates and partials defined across the dashboard.');

  await demoCard.locator('.tab', { hasText: 'Templates' }).click();
  await demoCard.locator('.accordion-bar', { hasText: 'Templates' }).click();
  await say(page, 'The Templates tab shows each source card, keyed by its ll_key.');
  await demoCard.locator('.tab', { hasText: 'Partials' }).click();
  await demoCard.locator('.accordion-bar', { hasText: 'Partials' }).click();
  await say(page, 'Partials are Eta snippets templates can include, like turning a state into an icon.');

  // ---- Scene 4: Update All -------------------------------------------------
  console.log('SCENE 4: Update All');
  await demoCard.locator('.tab', { hasText: 'Dashboards' }).click();
  await say(page, 'Update All renders every usage and writes the result back to the dashboard.');
  await demoCard.getByText('Update All', { exact: true }).click();
  await page.waitForTimeout(2500);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await say(page, 'The placeholders are now real cards. One template, three rooms, one edit to change them all.');

  // ---- Scene 5: a template defined inside a sections view ------------------
  console.log('SCENE 5: sections');
  await clearCaption(page);
  const sectionsId = await createDashboardWithConfig(page, 'll-video-sections', {
    title: 'Sections Layout',
    views: [
      { title: 'Rooms', path: 'rooms', cards: [STATUS_CARD, roomInstance('Garage', 'off')] },
      {
        title: 'Sources',
        path: 'sources',
        type: 'sections',
        sections: [{ type: 'grid', cards: [ROOM_TEMPLATE] }],
      },
    ],
  });
  createdIds.push(sectionsId);

  const sectionsCard = await openCard(page, 'll-video-sections', 'linked-lovelace-status');
  await say(page, 'Here the source template lives inside a sections view, the default layout since 2024.3.');
  await syncDashboard(page, sectionsCard);
  await say(page, 'Discovery walks section cards as well as view cards, so the template registers.');
  await sectionsCard.getByText('Update All', { exact: true }).click();
  await page.waitForTimeout(2500);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await say(page, 'The Garage card rendered from a template defined one view over, inside a section.');

  // ---- Scene 6: key chips --------------------------------------------------
  console.log('SCENE 6: key chips');
  await clearCaption(page);
  const chipsId = await createDashboardWithConfig(page, 'll-video-chips', {
    title: 'Key Chips',
    views: [
      {
        title: 'Sources',
        path: 'sources',
        cards: [{ ...STATUS_CARD, show_key_chips: true }, ROOM_TEMPLATE, roomInstance('Studio', 'on')],
      },
    ],
  });
  createdIds.push(chipsId);

  const chipsCard = await openCard(page, 'll-video-chips', 'linked-lovelace-status');
  await say(page, 'Turn on key chips and a sync labels each source card with its ll_key.');
  await syncDashboard(page, chipsCard);
  await chipsCard.getByText('Update All', { exact: true }).click();
  await page.waitForTimeout(2500);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await expect(page.locator('linked-lovelace-key-chip').first()).toBeVisible();
  await say(page, 'The chip marks the definition, so the card you edit is obvious at a glance.');
  await say(page, 'Docs and a browser playground: daredoes.github.io/linked-lovelace-ui');

  // ---- Cleanup -------------------------------------------------------------
  await clearCaption(page);
  for (const id of createdIds) await deleteDashboard(page, id);
  await removeIfExists(page, DEMO_URL);
});
