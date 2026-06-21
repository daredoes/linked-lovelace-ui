import { test, expect } from '@playwright/test';
import {
  Card,
  Dashboard,
  createDashboard,
  saveConfig,
  deleteDashboard,
  readMainCards,
  openStatusCard,
  loadData,
  updateAll,
} from './helpers';

// Full-feature e2e: each test builds an isolated, writable STORAGE dashboard
// containing the Linked Lovelace status (controller) card plus template/partial
// definitions and usages, then drives the real card UI. Sync tests click
// "Update All", which writes rendered configs back via lovelace/config/save —
// the round-trip the Jest unit tests can only simulate.

// Track created dashboards for cleanup.
let created: Dashboard[] = [];
test.afterEach(async ({ page }) => {
  for (const d of created) await deleteDashboard(page, d.id);
  created = [];
});

async function newDashboard(page: any, cards: Card[]): Promise<string> {
  const d = await createDashboard(page, cards);
  created.push(d);
  return d.urlPath;
}

// Find the rendered output of a template usage by its ll_template key.
const usageOf = (cards: Card[], key: string) => cards.find((c) => c.ll_template === key);

// --- 1. adding the controller card -----------------------------------------
test('add the controller (status) card to a dashboard', async ({ page }) => {
  const urlPath = await newDashboard(page, []); // status card only
  const card = await openStatusCard(page, urlPath);
  await expect(card.getByText('Linked Lovelace Status', { exact: true })).toBeVisible();
  await expect(card.getByText('Load Data', { exact: true })).toBeVisible();
});

// --- 2. adding a template ---------------------------------------------------
test('add a template (ll_key) and have it discovered', async ({ page }) => {
  const urlPath = await newDashboard(page, [
    { type: 'markdown', ll_key: 'greeting', content: 'Hello there' },
  ]);
  const card = await openStatusCard(page, urlPath);
  await loadData(card);
  await card.locator('.tab', { hasText: 'Templates' }).click();
  await expect(card.locator('.tab-content a', { hasText: 'greeting' }).first()).toBeVisible();
});

// --- 3. using a template ----------------------------------------------------
test('use a template and sync it into a rendered card', async ({ page }) => {
  const urlPath = await newDashboard(page, [
    { type: 'markdown', ll_key: 'greeting', content: 'Hello there' },
    { type: 'custom:linked-lovelace-template', ll_template: 'greeting' },
  ]);
  const card = await openStatusCard(page, urlPath);
  await loadData(card);
  await updateAll(page, card);

  await expect
    .poll(async () => usageOf(await readMainCards(page, urlPath), 'greeting')?.content, { timeout: 15_000 })
    .toBe('Hello there');
  const rendered = usageOf(await readMainCards(page, urlPath), 'greeting');
  expect(rendered?.type).toBe('markdown');
});

// --- 4. modifying and syncing a template ------------------------------------
test('modify a template and re-sync to propagate the change', async ({ page }) => {
  const usage: Card = { type: 'custom:linked-lovelace-template', ll_template: 'greeting' };
  const urlPath = await newDashboard(page, [
    { type: 'markdown', ll_key: 'greeting', content: 'Hello v1' },
    usage,
  ]);

  // First sync -> v1.
  let card = await openStatusCard(page, urlPath);
  await loadData(card);
  await updateAll(page, card);
  await expect
    .poll(async () => usageOf(await readMainCards(page, urlPath), 'greeting')?.content, { timeout: 15_000 })
    .toBe('Hello v1');

  // Author edits the template definition, then re-syncs.
  await saveConfig(page, urlPath, {
    title: 'edit',
    views: [
      {
        title: 'Main',
        path: 'main',
        cards: [
          { type: 'custom:linked-lovelace-status' },
          { type: 'markdown', ll_key: 'greeting', content: 'Hello v2' },
          usage,
        ],
      },
    ],
  });
  card = await openStatusCard(page, urlPath);
  await loadData(card);
  await updateAll(page, card);
  await expect
    .poll(async () => usageOf(await readMainCards(page, urlPath), 'greeting')?.content, { timeout: 15_000 })
    .toBe('Hello v2');
});

// --- 5. using variables in a template ---------------------------------------
test('use context variables in a template', async ({ page }) => {
  const urlPath = await newDashboard(page, [
    { type: 'markdown', ll_key: 'counter', content: 'Count: <%= context.count %>' },
    { type: 'custom:linked-lovelace-template', ll_template: 'counter', ll_context: { count: 42 } },
  ]);
  const card = await openStatusCard(page, urlPath);
  await loadData(card);
  await updateAll(page, card);

  await expect
    .poll(async () => usageOf(await readMainCards(page, urlPath), 'counter')?.content, { timeout: 15_000 })
    .toBe('Count: 42');
});

// --- 6. creating a partial --------------------------------------------------
test('create a partial and have it discovered', async ({ page }) => {
  const urlPath = await newDashboard(page, [
    { type: 'custom:linked-lovelace-partials', partials: [{ key: 'iconPartial', template: 'mdi:lightbulb' }] },
  ]);
  const card = await openStatusCard(page, urlPath);
  await loadData(card);
  await card.locator('.tab', { hasText: 'Partials' }).click();
  await expect(card.locator('.tab-content a', { hasText: 'iconPartial' }).first()).toBeVisible();
});

// --- 7. using a local partial -----------------------------------------------
test('use a local partial inside a template via include()', async ({ page }) => {
  const urlPath = await newDashboard(page, [
    { type: 'custom:linked-lovelace-partials', partials: [{ key: 'iconPartial', template: 'mdi:lightbulb' }] },
    { type: 'button', ll_key: 'iconcard', icon: "<%~ include('iconPartial') %>" },
    { type: 'custom:linked-lovelace-template', ll_template: 'iconcard' },
  ]);
  const card = await openStatusCard(page, urlPath);
  await loadData(card);
  await updateAll(page, card);

  await expect
    .poll(async () => usageOf(await readMainCards(page, urlPath), 'iconcard')?.icon, { timeout: 15_000 })
    .toBe('mdi:lightbulb');
});

// --- 8. using a nested template ---------------------------------------------
test('use a nested template (template referencing another template)', async ({ page }) => {
  const urlPath = await newDashboard(page, [
    // inner registered first (lower priority)
    { type: 'markdown', ll_key: 'inner', ll_priority: 0, content: 'INNER:<%= context.who %>' },
    // outer wraps inner and forwards a variable into it
    {
      type: 'vertical-stack',
      ll_key: 'outer',
      ll_priority: 1,
      cards: [
        { type: 'custom:linked-lovelace-template', ll_template: 'inner', ll_context: { who: '<%= context.name %>' } },
      ],
    },
    // usage of the outer (nested) template
    { type: 'custom:linked-lovelace-template', ll_template: 'outer', ll_context: { name: 'Nested' } },
  ]);
  const card = await openStatusCard(page, urlPath);
  await loadData(card);
  await updateAll(page, card);

  await expect
    .poll(async () => {
      const outer = usageOf(await readMainCards(page, urlPath), 'outer');
      return outer?.cards?.[0]?.content;
    }, { timeout: 15_000 })
    .toBe('INNER:Nested');

  const outer = usageOf(await readMainCards(page, urlPath), 'outer');
  expect(outer?.type).toBe('vertical-stack');
});
