import { test, expect, Page } from '@playwright/test';

// End-to-end checks that exercise Linked Lovelace inside a REAL Home Assistant
// frontend + websocket API — the layer the Jest unit tests mock out. These
// confirm the cards register, render, and read the live lovelace config.
const DASHBOARD = '/lovelace/demo';

// HA renders cards inside open shadow DOM; Playwright locators pierce it.
async function openDashboard(page: Page) {
  await page.goto(DASHBOARD);
  // Wait for the custom element to be defined and upgraded by the browser.
  await page.waitForFunction(() => !!customElements.get('linked-lovelace-status'), null, {
    timeout: 30_000,
  });
}

test('status + template cards register as custom elements', async ({ page }) => {
  await openDashboard(page);
  const defined = await page.evaluate(() => ({
    status: !!customElements.get('linked-lovelace-status'),
    template: !!customElements.get('linked-lovelace-template'),
    partials: !!customElements.get('linked-lovelace-partials'),
  }));
  expect(defined).toEqual({ status: true, template: true, partials: true });
});

test('status card renders with header and Load Data action', async ({ page }) => {
  await openDashboard(page);
  await expect(page.getByText('Linked Lovelace Status', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Load Data', { exact: true })).toBeVisible();
});

test('template-usage card renders its migration notice', async ({ page }) => {
  await openDashboard(page);
  await expect(page.getByText('Linked Lovelace Template', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/no longer runs updates for Linked Lovelace/)).toBeVisible();
});

test('Load Data reads live HA config and discovers the "text" template + partial', async ({ page }) => {
  await openDashboard(page);
  const card = page.locator('linked-lovelace-status').first();

  // Clicking Load Data drives HassController -> LinkedLovelaceApi against the
  // live HA websocket lovelace API (getDashboards / getDashboardConfig). This
  // is exactly the integration the Jest unit tests mock.
  await card.getByText('Load Data', { exact: true }).click();

  // Once loaded, the card flips to the "Refresh" action and shows the tab strip.
  // Assert against the card's own state to avoid coupling to HA chrome.
  await expect
    .poll(async () => card.evaluate((el: any) => el._loaded === true), { timeout: 20_000 })
    .toBe(true);

  const rendered = await card.evaluate((el: any) => ({
    tabs: [...el.shadowRoot.querySelectorAll('.tab')].map((t) => t.textContent.trim()),
    buttons: [...el.shadowRoot.querySelectorAll('ha-progress-button')].map((b) => b.textContent.trim()),
    templateKeys: [...el.shadowRoot.querySelectorAll('.tab-content a')].map((a) => a.textContent.trim()),
    text: el.shadowRoot.textContent.replace(/\s+/g, ' '),
  }));

  // Tabs + the live "Refresh"/"Update All" controls are present.
  expect(rendered.tabs).toEqual(['Dashboards', 'Templates', 'Partials', 'Logs']);
  expect(rendered.buttons).toContain('Refresh');
  expect(rendered.buttons).toContain('Update All');

  // The dashboard's `ll_key: text` template and `stateToIcon` partial were
  // discovered from the LIVE lovelace config and listed by the card.
  expect(rendered.templateKeys).toContain('text');
  expect(rendered.text).toContain('stateToIcon');
});
