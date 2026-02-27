---
source: Context7 API
library: Playwright
package: @playwright/test
packageName: playwright

topic: Browser configuration and launch options
type: Browser Configuration and Launch Options
fetched: 2026-02-27T12:00:00Z
official_docs: https://playwright.dev/docs/test-use-options
---

# Browser Configuration and Launch Options

## Core Test Options

Configure in `playwright.config.ts`:

```javascript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    // Maximum time for actions like click() - 0 means no limit
    actionTimeout: 30000,
    
    // Name of the browser
    browserName: 'chromium',
    
    // Toggles bypassing Content-Security-Policy
    bypassCSP: true,
    
    // Channel: chrome, chrome-beta, msedge, msedge-beta
    channel: 'chrome',
    
    // Headless mode (default: true)
    headless: true,
    
    // Custom test ID attribute
    testIdAttribute: 'pw-test-id',
  }
});
```

## Launch Options Configuration

### Using launchOptions Object

```javascript
export default defineConfig({
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--start-maximized'],
          headless: false
        }
      }
    }
  ]
});
```

### LaunchOptions Properties

- `args: string[]` - Additional arguments to pass to browser
- `headless: boolean` - Run in headless mode (default: true)
- `channel: string` - Browser channel (overrides channel option)
- `executablePath: string` - Path to browser executable
- `env: {[key: string]: string}` - Environment variables

## Browser Channel Options

```xml
<!-- .runsettings for .NET -->
<RunSettings>
  <Playwright>
    <BrowserName>chromium</BrowserName>
    <LaunchOptions>
      <Headless>true</Headless>
      <Channel>msedge</Channel>
    </LaunchOptions>
  </Playwright>
</RunSettings>
```

## CLI Configuration (.NET)

```bash
dotnet test -- Playwright.BrowserName=chromium Playwright.LaunchOptions.Headless=false Playwright.LaunchOptions.Channel=msedge
```

## Environment Variables for Debugging

```bash
export DEBUG=pw:api  # Enable API debugging
export DEBUG=pw:browser  # Enable selector debugging
```

## Device Profiles

```javascript
import { devices } from '@playwright/test';

export default defineConfig({
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'Desktop Firefox',
      use: { ...devices['Desktop Firefox'] },
    }
  ]
});
```

## Custom Args (Use with Caution)

```javascript
{
  launchOptions: {
    args: [
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage'
    ]
  }
}
```

⚠️ **Warning**: Use custom browser args at your own risk, as some of them may break Playwright functionality.

## Priority Order

1. **Direct options** (headless, channel) - take priority
2. **launchOptions** - merged with browser launch
3. **Device profiles** - provide defaults
4. **Base defaults** - Playwright's internal defaults