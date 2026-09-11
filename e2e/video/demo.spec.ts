import { test, expect, Page, Locator } from '@playwright/test';
import YAML from 'yaml';
import { ws, deleteDashboard, saveConfig, Card } from '../tests/helpers';
import { installOverlay, say, clearCaption, showCode, hideCode } from './overlay';

// Records the captioned Linked Lovelace walkthrough against a real Home
// Assistant. Every YAML string below is the config actually pushed over
// `lovelace/config/save`, and the code panel shows that same text, so the
// viewer sees the config and the card it produces at the same time.
// Run via scripts/video.sh; not part of the CI e2e gate.

const BASICS = 'll-demo-basics';
const ADVANCED = 'll-demo-advanced';
const SECTIONS = 'll-demo-sections';
const CHIPS = 'll-demo-chips';

// ---------------------------------------------------------------------------
// Config fixtures
// ---------------------------------------------------------------------------

const DUPLICATED = `
views:
  - title: Home
    path: home
    cards:
      - type: markdown
        content: |
          ## Living Room
          Lights are **on**.
      - type: markdown
        content: |
          ## Bedroom
          Lights are **off**.
      - type: markdown
        content: |
          ## Kitchen
          Lights are **on**.
`;

const SOURCE_CARD = `
- type: markdown
  ll_key: room
  content: |
    ## <%= context.name %>
    Lights are **<%= context.state %>**.
`;

const USAGE_CARDS = `
- type: custom:linked-lovelace-template
  ll_template: room
  ll_context:
    name: Living Room
    state: 'on'
- type: custom:linked-lovelace-template
  ll_template: room
  ll_context:
    name: Bedroom
    state: 'off'
`;

const templated = (sourceContent: string) => `
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
      - type: custom:linked-lovelace-template
        ll_template: room
        ll_context:
          name: Bedroom
          state: 'off'
      - type: custom:linked-lovelace-template
        ll_template: room
        ll_context:
          name: Kitchen
          state: 'on'
  - title: Sources
    path: sources
    cards:
      - type: markdown
        ll_key: room
        content: |
${sourceContent}
`;

const ROOM_V1 = `          ## <%= context.name %>
          Lights are **<%= context.state %>**.`;

const ROOM_V2 = `          ## <%= context.name %>
          Lights are **<%= context.state %>**.
          _One template, every room._`;

const PARTIAL_YAML = `
- type: custom:linked-lovelace-partials
  partials:
    - key: stateIcon
      template: >-
        <% if (context.state === 'on') { %>ON<% }
        else { %>OFF<% } %>

- type: markdown
  ll_key: unit
  content: |
    ## <%= context.name %>
    [<%~ include('stateIcon', context) %>]
`;

const LL_KEYS_YAML = `
- type: custom:linked-lovelace-template
  ll_template: unitStack
  ll_keys:
    cards: cards
  ll_context:
    cards:
      - ll_template: unit
        ll_context:
          name: Office
          state: 'on'
      - ll_template: unit
        ll_context:
          name: Garage
          state: 'off'
`;

const NESTING_YAML = `
- type: markdown
  ll_key: badge
  ll_priority: 0
  content: '\`Ready: <%= context.label %>\`'

- type: vertical-stack
  ll_key: panel
  ll_priority: 10
  cards:
    - type: markdown
      content: '# <%= context.title %>'
    - type: custom:linked-lovelace-template
      ll_template: badge
      ll_context:
        label: '<%= context.title %>'
`;

const ADVANCED_CONFIG = `
title: Advanced
views:
  - title: Home
    path: home
    cards:
      - type: custom:linked-lovelace-status
      - type: custom:linked-lovelace-template
        ll_template: unitStack
        ll_keys:
          cards: cards
        ll_context:
          cards:
            - ll_template: unit
              ll_context:
                name: Office
                state: 'on'
            - ll_template: unit
              ll_context:
                name: Garage
                state: 'off'
      - type: custom:linked-lovelace-template
        ll_template: panel
        ll_context:
          title: Welcome
  - title: Sources
    path: sources
    cards:
      - type: custom:linked-lovelace-partials
        partials:
          - key: stateIcon
            template: >-
              <% if (context.state === 'on') { %>ON<% } else { %>OFF<% } %>
      - type: markdown
        ll_key: unit
        ll_priority: 0
        content: |
          ## <%= context.name %>
          [<%~ include('stateIcon', context) %>]
      - type: vertical-stack
        ll_key: unitStack
        ll_priority: 0
        cards: []
      - type: markdown
        ll_key: badge
        ll_priority: 0
        content: '\`Ready: <%= context.label %>\`'
      - type: vertical-stack
        ll_key: panel
        ll_priority: 10
        cards:
          - type: markdown
            content: '# <%= context.title %>'
          - type: custom:linked-lovelace-template
            ll_template: badge
            ll_context:
              label: '<%= context.title %>'
`;

const SECTIONS_CONFIG = `
title: Sections
views:
  - title: Home
    path: home
    cards:
      - type: custom:linked-lovelace-status
      - type: custom:linked-lovelace-template
        ll_template: sectionRoom
        ll_context:
          name: Garage
          state: 'off'
  - title: Sources
    path: sources
    type: sections
    sections:
      - type: grid
        cards:
          - type: markdown
            ll_key: sectionRoom
            content: |
              ## <%= context.name %>
              Lights are **<%= context.state %>**.
              _Defined inside a section._
`;

const CHIPS_CONFIG = `
title: Key Chips
views:
  - title: Sources
    path: sources
    cards:
      - type: custom:linked-lovelace-status
        show_key_chips: true
      - type: markdown
        ll_key: chipRoom
        content: |
          ## <%= context.name %>
      - type: custom:linked-lovelace-template
        ll_template: chipRoom
        ll_context:
          name: Studio
`;

// ---------------------------------------------------------------------------
// Home Assistant plumbing
// ---------------------------------------------------------------------------

async function connect(page: Page) {
  await page.goto('/lovelace/demo', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!(document.querySelector('home-assistant') as any)?.hass, null, {
    timeout: 30_000,
  });
}

// A leftover dashboard from an interrupted run would make `create` fail.
async function removeIfExists(page: Page, urlPath: string) {
  const list = await ws<any[]>(page, { type: 'lovelace/dashboards/list' });
  const found = list.find((d) => d.url_path === urlPath);
  if (found) await deleteDashboard(page, found.id);
}

async function createDashboard(page: Page, urlPath: string, yamlText: string): Promise<string> {
  await removeIfExists(page, urlPath);
  const config = YAML.parse(yamlText) as Card;
  const created = await ws<{ id: string }>(page, {
    type: 'lovelace/dashboards/create',
    url_path: urlPath,
    title: config.title || urlPath,
    mode: 'storage',
    show_in_sidebar: true,
  });
  await saveConfig(page, urlPath, config);
  return created.id;
}

// Home Assistant builds a view's cards as soon as its config arrives. On a cold
// module cache the bundle can register its elements a moment later, and the
// view then shows "Custom element doesn't exist" instead of the card. Reloading
// once the element is registered renders it properly, so retry rather than fail.
async function open(page: Page, urlPath: string, tag = 'linked-lovelace-status'): Promise<Locator> {
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

async function loadData(card: Locator) {
  await card.getByText('Load Data', { exact: true }).click();
  await expect.poll(() => card.evaluate((el: any) => el._loaded === true), { timeout: 40_000 }).toBe(true);
}

async function updateAll(page: Page, card: Locator) {
  await card.getByText('Update All', { exact: true }).click();
  await page.waitForTimeout(2500);
}

// The config Home Assistant now holds, as YAML, for showing what a sync wrote.
async function configAsYaml(page: Page, urlPath: string, pick?: (c: Card) => unknown): Promise<string> {
  const config = await ws<Card>(page, { type: 'lovelace/config', url_path: urlPath });
  return YAML.stringify(pick ? pick(config) : config);
}

// ---------------------------------------------------------------------------

test('demo walkthrough', async ({ page }) => {
  test.setTimeout(900_000);
  await installOverlay(page);
  page.on('dialog', (d) => d.accept().catch(() => {}));
  const created: string[] = [];

  await connect(page);

  // ---- Act 1: the duplication problem -------------------------------------
  console.log('ACT 1: duplication');
  created.push(await createDashboard(page, BASICS, DUPLICATED));
  await open(page, BASICS, 'hui-view');
  await say(page, 'Linked Lovelace: write a Lovelace card once, reuse it everywhere, sync on demand.');
  await say(page, 'Start with the problem. Three cards here, and three copies of the same YAML.');
  await showCode(page, `${BASICS} config`, DUPLICATED, ['markdown']);
  await say(page, 'Change the layout and you edit it three times, in every dashboard that uses it.');
  await hideCode(page);

  // ---- Act 2: one source, three usages ------------------------------------
  console.log('ACT 2: source + usages');
  await saveConfig(page, BASICS, YAML.parse(templated(ROOM_V1)));
  const basics = await open(page, BASICS);
  await showCode(page, 'The source card', SOURCE_CARD, ['ll_key: room', 'context.name', 'context.state']);
  await say(page, 'This is the source card. ll_key names it, and the placeholders are Eta syntax.');
  await showCode(page, 'The cards that use it', USAGE_CARDS, ['ll_template: room', 'll_context']);
  await say(page, 'Each usage names the template with ll_template and passes its own ll_context.');
  await hideCode(page);
  await say(page, 'Until a sync runs, the usages are just placeholders holding their context.');

  // ---- Act 3: discovery ----------------------------------------------------
  console.log('ACT 3: Load Data');
  await say(page, 'Load Data reads every dashboard over the websocket API and collects the sources.');
  await loadData(basics);
  await basics.locator('.tab', { hasText: 'Templates' }).click();
  await basics.locator('.accordion-bar', { hasText: 'Templates' }).click();
  await say(page, 'The Templates tab lists what it found, and expands to show each body.');
  await basics.locator('.tab', { hasText: 'Logs' }).click();
  await basics.locator('.accordion-bar', { hasText: 'Logs' }).click();
  await say(page, 'The Logs tab records every step, which is where to look when something is missing.');

  // ---- Act 4: preview, then write -----------------------------------------
  console.log('ACT 4: preview + Update All');
  await basics.locator('.tab', { hasText: 'Dashboards' }).click();
  await basics.locator('.accordion-bar', { hasText: 'Preview Changes' }).click();
  await say(page, 'Preview Changes diffs what a sync would write, before anything is saved.');
  await say(page, 'Update All then writes the rendered cards back to the dashboard.');
  await updateAll(page, basics);
  await open(page, BASICS);
  await say(page, 'Three real cards now, each rendered from the same source with its own context.');
  await showCode(
    page,
    'What the sync wrote back',
    await configAsYaml(page, BASICS, (c: any) => ({ cards: c.views[0].cards.slice(1, 2) })),
    ['ll_template: room', 'll_context'],
  );
  await say(page, 'The written card keeps ll_template and ll_context, so the next sync can render it again.');
  await hideCode(page);

  // ---- Act 5: edit once ----------------------------------------------------
  console.log('ACT 5: edit once');
  await saveConfig(page, BASICS, YAML.parse(templated(ROOM_V2)));
  await showCode(page, 'Edit the source, once', `- type: markdown\n  ll_key: room\n  content: |\n${ROOM_V2}`, [
    '_One template, every room._',
  ]);
  await say(page, 'Add a line to the source card and sync again.');
  const basics2 = await open(page, BASICS);
  await loadData(basics2);
  await updateAll(page, basics2);
  await open(page, BASICS);
  await hideCode(page);
  await say(page, 'One edit, and every room card carries it. That is the whole point.');

  // ---- Act 6: partials, ll_keys, nesting ----------------------------------
  console.log('ACT 6: advanced');
  created.push(await createDashboard(page, ADVANCED, ADVANCED_CONFIG));
  const advanced = await open(page, ADVANCED);
  await loadData(advanced);
  await advanced.locator('.tab', { hasText: 'Partials' }).click();
  await advanced.locator('.accordion-bar', { hasText: 'Partials' }).click();
  await showCode(page, 'A partial, and a template that includes it', PARTIAL_YAML, ['key: stateIcon', "include('stateIcon', context)"]);
  await say(page, 'Partials are Eta snippets. Templates pull them in with include, so logic is shared.');
  await showCode(page, 'll_keys injects whole cards', LL_KEYS_YAML, ['ll_keys:', 'cards: cards']);
  await say(page, 'll_keys maps a card key to a context key, so a list of cards can be passed in.');
  await showCode(page, 'll_priority orders registration', NESTING_YAML, ['ll_priority: 10', 'll_template: badge']);
  await say(page, 'A template can use another. Higher ll_priority registers later, once its parts exist.');
  await advanced.locator('.tab', { hasText: 'Dashboards' }).click();
  await updateAll(page, advanced);
  await open(page, ADVANCED);
  await hideCode(page);
  await say(page, 'One sync: the partial, the injected card list, and the nested panel all resolve.');

  // ---- Act 7: sections layout ---------------------------------------------
  console.log('ACT 7: sections');
  created.push(await createDashboard(page, SECTIONS, SECTIONS_CONFIG));
  const sections = await open(page, SECTIONS);
  await showCode(page, 'A source inside a section', SECTIONS_CONFIG, ['type: sections', 'sections:', 'll_key: sectionRoom']);
  await say(page, 'Sources can live in a sections view, the default dashboard layout since 2024.3.');
  await loadData(sections);
  await updateAll(page, sections);
  await open(page, SECTIONS);
  await hideCode(page);
  await say(page, 'Discovery walks section cards too, so the Garage card renders from it.');

  // ---- Act 8: key chips ----------------------------------------------------
  console.log('ACT 8: chips');
  created.push(await createDashboard(page, CHIPS, CHIPS_CONFIG));
  const chips = await open(page, CHIPS);
  await showCode(page, 'Label the definitions', CHIPS_CONFIG, ['show_key_chips: true']);
  await say(page, 'Turn on key chips and a sync labels every source card with its ll_key.');
  await loadData(chips);
  await updateAll(page, chips);
  await open(page, CHIPS);
  await hideCode(page);
  await expect(page.locator('linked-lovelace-key-chip').first()).toBeVisible();
  await say(page, 'The chip marks the card you edit, so a source is never mistaken for a copy.');
  await say(page, 'Docs, and the same demo in your browser: daredoes.github.io/linked-lovelace-ui');

  // ---- Cleanup -------------------------------------------------------------
  await clearCaption(page);
  for (const id of created) await deleteDashboard(page, id);
});
