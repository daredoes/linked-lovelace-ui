---
source: Context7 API
library: Playwright
package: @playwright/test
topic: Fixture-based testing and test isolation  
type: Best Practices for Fixture-Based Testing
fetched: 2026-02-27T12:00:00Z
official_docs: https://playwright.dev/docs/writing-tests
---

# Fixture-Based Testing Best Practices

## Test Isolation with BrowserContext

Each test runs in an **isolated BrowserContext** for a fresh, independent environment:

### JavaScript Test Isolation

```javascript
import { test } from '@playwright/test';

// Each test gets a fresh, isolated page
const test1 = async ({ page: testPage1 }) => {
  // testPage1 belongs to an isolated BrowserContext
  await testPage1.goto('https://example.com');
};

const test2 = async ({ page: testPage2 }) => {
  // testPage2 is completely isolated from test1
  await testPage2.goto('https://example.com');
};
```

### Java Test Isolation

```java
Browser browser = playwright.chromium().launch();
BrowserContext context = browser.newContext();
Page page = context.newPage();
```

### Python Pytest Test Isolation

```python
from playwright.sync_api import Page

def test_example_test(page: Page):
    # "page" belongs to an isolated BrowserContext, created for this specific test
    pass

def test_another_test(page: Page):
    # "page" in this second test is completely isolated from the first test
    pass
```

## Browser Fixture Usage

The `browser` fixture provides a shared Browser instance across all tests in the same worker:

```javascript
// Use beforeAll for expensive setup that can be shared
test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  // Shared browser setup
  await page.goto('https://example.com');
});
```

## Basic Test Structure (JUnit)

```java
@UsePlaywright
public class TestExample {
  @Test
  void shouldClickButton(Page page) {
    page.navigate("data:text/html,<button onclick='result=\"Clicked\"'>Go</button>");
    page.locator("button").click();
    assertEquals("Clicked", page.evaluate("result"));
  }

  @Test
  void shouldCheckTheBox(Page page) {
    page.setContent("<input id='checkbox' type='checkbox'></input>");
    page.locator("input").check();
    assertEquals(true, page.evaluate("window['checkbox'].checked"));
  }

  @Test
  void shouldSearchWiki(Page page) {
    page.navigate("https://www.wikipedia.org/");
    page.locator("input[name=\"search\"]").click();
    page.locator("input[name=\"search\"]").fill("playwright");
    page.locator("input[name=\"search\"]").press("Enter");
    assertThat(page).hasURL("https://en.wikipedia.org/wiki/Playwright");
  }
}
```

## Timeout Configuration

Configure action timeouts in `playwright.config.ts`:

```javascript
export default defineConfig({
  use: {
    // Maximum time for actions like click() - 0 means no limit
    actionTimeout: 30000,
    
    // Expect timeout for assertions
    expect: {
      timeout: 10000
    }
  }
});
```

## Browser Launch Options

```javascript
export default defineConfig({
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--start-maximized'],
          headless: false  // Set to false for debugging
        }
      }
    }
  ]
});
```

## Environment Variables for Debugging

```bash
# Enable API debugging
export DEBUG=pw:api

# Enable selector debugging
export DEBUG=pw:browser
```

## Best Practices for Reliable Tests

1. **Rely on fixtures** - Don't create your own browser instance unless necessary  
2. **Use default timeouts** - Let Playwright auto-wait for elements  
3. **Web-first assertions** - Use `expect()` with built-in retries  
4. **No side effects between tests** - Each test is truly isolated  
5. **Avoid stale caches** - BrowserContext ensures fresh state  

## Testing Integration with Service Actions

For Home Assistant test automation:

```javascript
test('test Lovelace card with service action', async ({ page }) => {
  // Page fixture provides isolated context
  await page.goto('/lovelace/0');
  
  // Verify card exists in isolated context
  await expect(page.locator('custom-card-name')).toBeVisible();
});
```
