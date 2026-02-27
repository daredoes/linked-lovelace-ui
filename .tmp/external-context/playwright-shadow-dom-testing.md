---
source: Context7 API
library: Playwright
package: @playwright/test
topic: Shadow DOM and web components testing
type: Shadow DOM Testing for Web Components
fetched: 2026-02-27T12:00:00Z
official_docs: https://playwright.dev/docs/locators
---

# Shadow DOM Testing for Web Components

## Key Capabilities

Playwright supports **piercing open shadow roots** as of version 1.26+, making it ideal for testing web components and custom elements like Home Assistant Lovelace cards.

## Shadow DOM Assertions

### Text Content Assertions (v1.26+)

The `expect(locator).toHaveText()` assertion now pierces open shadow roots:

```javascript
// Example for Home Assistant Lovelace card testing
const card = page.locator('custom-card-name');
await expect(page.locator('x-details')).toHaveText('Details');
await expect(card).toHaveText('Welcome, John!');
```

### Python Example

```python
# Use expect with to_have_text to pierce Shadow DOM
expect(page.locator("x-details")).to_contain_text("Details")
await expect(page.locator("x-details")).to_contain_text("Details")
```

### C# Example

```csharp
// Assertion works transparently across shadow boundaries
await Expect(Page.Locator("x-details")).ToContainTextAsync("Details");
```

## Locator Selection for Custom Elements

### CSS Selectors with Shadow DOM Support

Playwright augments standard CSS selectors to work across shadow boundaries:

```javascript
// Pierces open shadow DOM automatically
await page.locator('button').click();
await page.locator('css=custom-card').click();
```

### Custom Pseudo-classes for Lovelace Cards

```javascript
// Target by visible text (case-insensitive, whitespace-trimmed)
await page.locator('#nav-bar :text("Home")').click();

// Safe targeting with :has-text() combined with element selector
await page.locator('article:has-text("Playwright")').click();
```

## Best Practices

1. **Use Playwright's native locators** - Don't use raw XPath/CSS unless necessary
2. **Assertions pierce automatically** - No special selectors needed for shadow DOM
3. **Version requirement** - Shadow pierce requires Playwright v1.26+
4. **Open Shadow DOM only** - Closed shadow roots are intentionally inaccessible for security

## Common Pitfalls

- ❌ Avoid `:has-text("Playwright")` alone - matches body element
- ✅ Use `article:has-text("Playwright")` to narrow selection
- ✅ Combine text locators with element type for precision

## Home Assistant Specific Considerations

For Lovelace card testing:

```javascript
// Target custom Lovelace cards
const lovelaceCard = page.locator('hui-card');
await expect(lovelaceCard).toHaveText('Expected Card Content');

// Assertion automatically pierces shadow DOM of web components
```
