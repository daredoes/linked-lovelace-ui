# Test Execution Standards

## Overview

This document defines the standards for executing tests for the **linked-lovelace-ui** Home Assistant Lovelace card library. It covers unit testing with Jest, integration testing against Home Assistant Docker containers, and E2E testing with Playwright.

---

## Testing Architecture

### Test Categories

| Category | Tool | Purpose | Scope |
|----------|------|---------|-------|
| **Unit Tests** | Jest 29.x | Component logic, template rendering | Code-level validation |
| **Integration Tests** | Jest + Docker | API integration, service calls | Home Assistant instance |
| **E2E Tests** | Playwright | Browser interactions, UI validation | Full workflow testing |

### Test Execution Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Unit Tests     │────▶│  Integration     │────▶│  E2E Tests      │
│  (No container) │     │  (Docker HA)     │     │  (Browser)      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
    Fast feedback          API validation          Browser compatibility
    (< 30s)
```

---

## Unit Test Standards

### Execution Format

```bash
# Run all unit tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
e2e test -- --watch

# Run specific test file
npm test src/v2/linkedLovelace.test.ts

# Run specific test name
npm test -- --testNamePattern="should initialize controller"

# Run test with specific coverage threshold
npm test -- --coverage --collectCoverageFrom="src/**/*.ts"
```

### Test File Naming Convention

- Source files: `*.ts` (e.g., `linkedLovelace.ts`)
- Test files: `*.test.ts` (e.g., `linkedLovelace.test.ts`)
- Location: Co-located with source or in `__tests__` folder

### Test Structure Standards

#### Describing Blocks
```typescript
describe('[type] ComponentName', () => {
  // Test suite for ComponentName type
});

// Example:
describe('[class] LinkedLovelaceController', () => {
  it('should initialize with valid configuration', () => {
    // test logic
  });
});
```

#### Test Naming Convention
```typescript
test('should [action] when [condition]', () => {
  // Arrange
  const mockData = { ... };
  
  // Act
  const result = component.process(mockData);
  
  // Assert
  expect(result).toBe(expected);
});
```

### Assertions

#### Available Matchers
```typescript
// Type checking
expect(value).toBeDefined();
expect(value).toBeNull();
expect(value).toBeUndefined();

// Collection assertions
expect(arr).toHaveLength(n);
expect(obj).toHaveProperty('key');
expect(arr).toContain(value);

// Equality
expect(result).toBe(expectedValue);
expect(result).toEqual(expectedObject);

// String matching
expect(string).toMatch(/regex/);
expect(string).toContain('substring');

// Truthiness
expect(flag).toBeTrue();
expect(flag).toBeFalse();

// Async testing
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrowError();
```

#### Mocking Patterns
```typescript
// Mock function
const mockFn = jest.fn();
mockFn.mockReturnValue('mocked');

// Mock implementation
jest.mock('../module', () => ({
  importantFunction: jest.fn(() => 'mocked result'),
}));

// Mock external dependencies
jest.mock('external-package', () => ({
  method: jest.fn(),
}));

// Call tracking
expect(mockFn).toHaveBeenCalledTimes(2);
expect(mockFn).toHaveBeenCalledWith(arg1, arg2);
```

### Code Coverage Requirements

- **Minimum coverage**: 90%
- **Statement coverage**: Required
- **Branch coverage**: Required
- **Function coverage**: Required
- **Line coverage**: Required for critical paths

```javascript
// jest.config.cjs
collectCoverageFrom: [
  'src/**/*.ts',
  '!src/**/*.test.ts',
  '!src/**/*.d.ts',
]

coverThreshold: {
  global: {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90,
  },
}
```

---

## Integration Test Standards

### Docker Test Container Setup

#### Required Configuration
```yaml
# docker-compose.yml for testing
services:
  home-assistant:
    image: homeassistant/home-assistant:stable
    ports:
      - "8123:8123"
    volumes:
      - ./dev/config:/config
      - ./dev/www:/config/www
      - ./dist:/config/www/custom-cards
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8123/api/states"]
      interval: 10s
      timeout: 5s
      retries: 3
```

### Integration Test Structure

#### API Connection Pattern
```typescript
describe('Home Assistant API Integration', () => {
  let haHost: string;
  let haToken: string;
  
  beforeAll(async () => {
    haHost = process.env.HA_HOST || 'http://localhost:8123';
    haToken = process.env.HA_TOKEN || '';
    
    // Wait for container to be ready
    await waitForHealthCheck(haHost);
  });
  
  describe('Lovelace Card Registration', () => {
    it('should register custom card correctly', async () => {
      // Connect to WebSocket API
      const conn = await homeassistantConnection(haHost, haToken);
      
      // Verify card configuration
      const cards = await getCustomCards(conn);
      expect(cards).toContain('linked-lovelace');
    });
  });
});
```

### Service Call Testing

#### Required Patterns
```typescript
describe('Service Call Automation', () => {
  it('should execute service calls correctly', async () => {
    const conn = await homeassistantConnection(haHost, haToken);
    
    // Execute service call via WebSocket
    await executeServiceCall(conn, 'homeassistant.reload_customization', {
      entity_id: 'sensor.temperature',
    });
    
    // Verify result
    const state = await getState(conn, 'sensor.temperature');
    expect(state).toBeDefined();
  });
});
```

### Template Validation

```typescript
describe('Template Engine Validation', () => {
  describe('ETA Syntax Integration', () => {
    it('should render templates compatible with HA template language', () => {
      const engine = new TemplateEngine();
      
      const template = `
        <% let temp = context.temperature %>
        <% if (temp > 70) { %>
          <span class="warm">The room is warm: <%= temp %>°F</span>
        <% } else { %>
          <span class="cool">The room is cool: <%= temp %>°F</span>
        <% } %>
      `;
      
      const context = { temperature: 75 };
      const result = engine.render(template, context);
      
      expect(result).toContain('warm');
      expect(result).not.toContain('cool');
      expect(result).toContain('75°C');
    });
  });
});
```

---

## E2E Test Standards (Playwright)

### Browser Configuration

#### Playwright Setup (`playwright.config.ts`)
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60 * 1000, // 60 seconds per test
  expect: {
    timeout: 5000,
  },
  use: {
    baseURL: process.env.PLAYWRIGHT_HOST || 'http://localhost:8123',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
});
```

### Shadow DOM Testing

#### Selector Strategies
```typescript
// Piercing shadow DOM (Playwright v1.26+)
describe('Lovelace Card Rendering', () => {
  test('should render card in Home Assistant dashboard', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/);');
    
    // Wait for Home Assistant loader
    await page.waitForSelector('home-assistant');
    
    // Access shadow DOM elements
    const ha = page.locator('home-assistant');
    const card = ha.locator('linked-lovelace-card');
    
    // Validate card presence
    expect(card).toBeVisible();
    
    // Shadow DOM selection for nested elements
    const cardContent = card.locator('template-rendered');
    expect(cardContent).toHaveText(/template.*rendered/);
  });
});
```

### Authentication Patterns

#### Login Automation
```typescript
describe('Authentication and Access', () => {
  test('should authenticate and access dashboard', async ({ page }) => {
    // Navigate to HA login page
    await page.goto('/);');
    
    // Wait for login form
    await page.waitForSelector('paper-input-container');
    
    // Fill credentials
    await page.fill('input[name=password]', process.env.HA_PASSWORD || '');
    
    // Submit form
    await page.click('paper-button[type=submit]');
    
    // Wait for authentication
    await page.waitForSelector('home-assistant');
    
    // Verify authenticated
    const haInstance = await page.locator('ha-panel-lovelace').first();
    expect(haInstance).toBeVisible();
  });
});
```

### Visual Validation

#### Snapshot Testing
```typescript
describe('Visual Regression Testing', () => {
  test('should render card identically to expected snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('home-assistant');
    
    const card = page.locator('linked-lovelace-card');
    await card.scrollIntoViewIfNeeded();
    
    // Take screenshot for visual validation
    const screenshot = await card.screenshot();
    expect(screenshot).toMatchSnapshot('lovelace-card-rendered.png');
  });
});
```

---

## Environment Configuration

### Required Environment Variables

| Variable | Purpose | Default | Required |
|----------|---------|---------|----------|
| `HA_HOST` | Home Assistant instance URL | `http://localhost:8123` | Integration tests |
| `HA_TOKEN` | Long-lived API token | None | Integration/E2E tests |
| `PLAYWRIGHT_HOST` | E2E testing target URL | Same as HA_HOST | E2E tests |
| `PLAYWRIGHT_TOKEN` | Browser authentication token | None | E2E tests |
| `CI` | CI environment flag | `false` | All tests |

### Test Configuration Files

#### `.env.test` for tests
```bash
# Integration testing
HA_HOST=http://localhost:8123
HA_TOKEN=your_long_lived_api_token_here

# E2E testing
PLAYWRIGHT_HOST=http://localhost:8123
PLAYWRIGHT_TOKEN=your_browser_auth_token_here
```

---

## Test Execution Commands Reference

### Local Development
```bash
# Run unit tests
npm test

# Run tests in watch mode
e2e test -- --watch

# Run with detailed output
npm test -- --verbose

# Generate coverage report
npm test -- --coverage --coverageDirectory=coverage
```

### Docker Integration
```bash
# Start HA test container
./scripts/setup-hass-test-container.sh -s

# Run integration tests
npx jest tests/integration/*.integration.test.ts

# Stop container
./scripts/setup-hass-test-container.sh -t
```

### Playwright E2E
```bash
# Install Playwright browsers
npx playwright install --with-deps

# Run E2E tests
npx playwright test

# Run with headed browser (for debugging)
npx playwright test --headed

# Run specific browser
npx playwright test --project=chromium

# Run in CI mode (headed off, retries enabled)
CI=1 npx playwright test
```

### Full Test Suite (CI)
```bash
# Sequential execution
npm test                    # Unit tests
./scripts/setup-hass-test-container.sh -s  # Start HA
npx jest tests/integration/*.integration.test.ts  # Integration tests
npx playwright test         # E2E tests
./scripts/setup-hass-test-container.sh -t  # Stop HA
```

---

## Error Handling and Reporting

### Test Failures

#### Jest Failures
```bash
# Check full error output
npm test -- --verbose --no-coverage --reporters=default --reporters=jest-junit

# Get test failure summary
npm test -- --json > test-results.json && cat test-results.json | jq '.numFailedTests'
```

### Playwright Reports
```bash
# Generate HTML report
npx playwright show-report

# Run with trace viewer for debugging
CI=1 npx playwright test --trace on
```

### CI/CD Reporting
```bash
# Jest XML report
npm test -- --ci --reporters=default --reporters=jest-junit

# Playwright HTML report
npx playwright test && npx playwright show-report --opened
```

---

## Quality Gates

### Pre-Commit Checks
- ✅ All unit tests pass (90% coverage minimum)
- ✅ No TypeScript compilation errors
- ✅ ESLint validation successful

### Pre-Deployment Checks
- ✅ All tests pass (unit + integration + E2E)
- ✅ Docker container health checks pass
- ✅ All browser compatibility tests pass
- ✅ No visual regressions (screenshot comparison)

### CI/CD Validation
- ✅ All unit tests must pass (coverage threshold)
- ✅ All integration tests must pass
- ✅ All E2E tests must pass across 3 browsers
- ✅ Build artifacts must be valid (Rollup production build)

---

## Security Considerations

### Token Management
```typescript
// Never hardcode tokens in test files
// Use environment variables
const haToken = process.env.HA_TOKEN;

// Validate token length
if (!haToken || haToken.length < 100) {
  throw new Error('HA_TOKEN environment variable must be set');
}
```

### Container Security
- Run Docker containers in isolated network namespace
- Use read-only mounts where possible
- Remove sensitive data from test configs after execution
- Rotate test API tokens regularly

---

## Performance Benchmarks

### Template Rendering Performance
```typescript
describe('Performance Benchmarks', () => {
  test('should render template within acceptable time', () => {
    const engine = new TemplateEngine();
    const template = complexTemplate();
    const context = complexContext();
    
    const startTime = performance.now();
    const result = engine.render(template, context);
    const endTime = performance.now();
    
    const renderTime = endTime - startTime;
    expect(renderTime).toBeLessThan(100); // < 100ms
    expect(result).toBeDefined();
  });
});
```

### Browser Performance (E2E)
- Card initialization: < 2 seconds
- Template rendering: < 500ms per card
- Dashboard load: < 5 seconds (with < 10 cards)
- Scroll/render 100+ cards: < 2 seconds

---

## Best Practices

1. **Test Isolation** - Each test is independent and reproducible
2. **Mock External Dependencies** - Focus on component behavior
3. **Use Fixtures Consistently** - Maintain reproducible test state
4. **Validate Against HA Language** - Catch breaking template changes
5. **Run E2E in Headed Mode During Development** - Observe UI issues
6. **Cache Docker Images** - Faster CI feedback with image caching
7. **Set Appropriate Timeouts** - Account for HA startup time
8. **Use Shadow DOM Selectors** - Proper Web Component targeting
9. **Include Timeout Validation** - Ensure tests complete reliably
10. **Report Visual Regressions** - Screenshot comparison for UI changes

---

## Version Information

- **Jest**: 29.x with ts-jest 29.1.0
- **Playwright**: 1.40+ (Shadow DOM support)
- **Home Assistant Docker**: `homeassistant/home-assistant:stable`
- **ETA Template Engine**: Production version compatible with HA
- **TypeScript**: Strict mode enforcement

---

**Status**: Active | **Last Updated**: 2026-02-27
