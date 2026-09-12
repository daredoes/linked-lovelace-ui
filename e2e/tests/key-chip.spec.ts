import { test, expect } from '@playwright/test';
import {
  Card,
  Dashboard,
  createDashboard,
  saveConfig,
  readConfig,
  deleteDashboard,
  readMainCards,
  openStatusCard,
  loadData,
  updateAll,
} from './helpers';

// E2E for the opt-in key chip: a definition card that sets `show_key_chips: true`
// next to its `ll_key` is wrapped by the next sync in
// `custom:linked-lovelace-key-chip`, which renders the original card plus a
// corner chip showing the key. Clearing the flag and re-syncing unwraps it.

const KEY_CHIP = 'custom:linked-lovelace-key-chip';

let created: Dashboard[] = [];
test.afterEach(async ({ page }) => {
  for (const d of created) await deleteDashboard(page, d.id);
  created = [];
});

const definition: Card = { type: 'markdown', ll_key: 'greeting', content: 'Hello chip' };
const usage: Card = { type: 'custom:linked-lovelace-template', ll_template: 'greeting' };

async function newChipDashboard(page: any, showKeyChips: boolean): Promise<string> {
  const d = await createDashboard(page, []);
  created.push(d);
  await saveConfig(page, d.urlPath, {
    title: 'key chips',
    views: [
      {
        title: 'Main',
        path: 'main',
        cards: [
          { type: 'custom:linked-lovelace-status' },
          { ...definition, show_key_chips: showKeyChips },
          usage,
        ],
      },
    ],
  });
  return d.urlPath;
}

async function sync(page: any, urlPath: string): Promise<void> {
  const card = await openStatusCard(page, urlPath);
  await loadData(card);
  await updateAll(page, card);
}

test('sync wraps definitions in a key chip card and renders the chip', async ({ page }) => {
  const urlPath = await newChipDashboard(page, true);
  await sync(page, urlPath);

  await expect
    .poll(async () => (await readMainCards(page, urlPath))[0]?.type, { timeout: 15_000 })
    .toBe(KEY_CHIP);

  const cards = await readMainCards(page, urlPath);
  // Definition is wrapped: ll_key on the wrapper, original card underneath.
  expect(cards[0]).toStrictEqual({
    type: KEY_CHIP,
    ll_key: 'greeting',
    show_key_chips: true,
    card: { type: 'markdown', content: 'Hello chip' },
  });
  // The flag stays on the definition, never on the cards rendered from it.
  expect(cards[1].show_key_chips).toBeUndefined();
  // The instance is rendered but not wrapped.
  expect(cards[1].ll_template).toBe('greeting');
  expect(cards[1].type).toBe('markdown');
  expect(cards[1].content).toBe('Hello chip');

  // Visual: the wrapper element renders the chip with the bare key text.
  await page.goto(`/${urlPath}`, { waitUntil: 'domcontentloaded' });
  const chip = page.locator('linked-lovelace-key-chip .ll-chip');
  await expect(chip).toHaveText('greeting');
  // ...and the inner card still renders its content.
  await expect(page.locator('linked-lovelace-key-chip ha-markdown')).toContainText('Hello chip');
});

test('re-syncing with the flag set is idempotent', async ({ page }) => {
  const urlPath = await newChipDashboard(page, true);
  await sync(page, urlPath);
  await expect
    .poll(async () => (await readMainCards(page, urlPath))[0]?.type, { timeout: 15_000 })
    .toBe(KEY_CHIP);
  const first = await readMainCards(page, urlPath);

  await sync(page, urlPath);
  // Give the second save a moment, then confirm the config is unchanged.
  await expect
    .poll(async () => JSON.stringify(await readMainCards(page, urlPath)), { timeout: 15_000 })
    .toBe(JSON.stringify(first));
});

test('clearing the flag unwraps the definition on the next sync', async ({ page }) => {
  const urlPath = await newChipDashboard(page, true);
  await sync(page, urlPath);
  await expect
    .poll(async () => (await readMainCards(page, urlPath))[0]?.type, { timeout: 15_000 })
    .toBe(KEY_CHIP);

  // Clear the flag on the wrapper in place, keeping the wrapped card as it is.
  const config = await readConfig(page, urlPath);
  config.views[0].cards = config.views[0].cards.map((c: Card) =>
    c.type === KEY_CHIP ? { ...c, show_key_chips: false } : c,
  );
  await saveConfig(page, urlPath, config);

  await sync(page, urlPath);
  await expect
    .poll(async () => (await readMainCards(page, urlPath))[0]?.type, { timeout: 15_000 })
    .toBe('markdown');
  const cards = await readMainCards(page, urlPath);
  expect(cards[0]).toStrictEqual({
    ll_key: 'greeting',
    show_key_chips: false,
    type: 'markdown',
    content: 'Hello chip',
  });
});
