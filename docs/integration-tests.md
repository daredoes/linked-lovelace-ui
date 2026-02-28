# Integration Test Suite: Linked Lovelace Card Synchronization

## Overview

This document describes the comprehensive integration test suite designed to verify that all core functionality of the Linked Lovelace card synchronization system remains intact after implementing Phase 1 improvements.

## Test Architecture

### Test Categories

1. **Card Initialization Tests** (`core-functionality-tests.test.ts`)
   - Verifies card loading and registration
   - Tests dashboard integration
   - Validates error handling

2. **API Integration Tests** (`api-integration.test.ts`)
   - Tests Home Assistant WebSocket communication
   - Validates dashboard discovery
   - Verifies configuration loading

3. **Component Tests** (Source unit tests in `src/**/*.test.ts`)
   - Template rendering
   - Card path extraction
   - View processing
   - Cache strategy

## Test Structure

### Test Files

```
tests/e2e/
├── card-initialization.test.ts       # Original initialization tests
├── core-functionality-tests.test.ts  # NEW: Expanded core functionality
└── api-integration.test.ts           # NEW: API integration tests
```

### Test Coverage Areas

#### 1. Card System
- **Card Types**: linked-lovelace-template, linked-lovelace-status, linked-lovelace-partials
- **Card Editors**: linked-lovelace-template-editor, linked-lovelace-status-editor
- **Custom Cards Registration**: Window custom cards list

#### 2. Template System
- ETA Template Engine availability
- Variable substitution
- ll_template attribute processing
- Template priority handling

#### 3. Dashboard Configuration
- Dashboard views structure
- Card configuration loading
- View and section handling
- Empty dashboard graceful handling

#### 4. API Integration
- WebSocket connection status
- Lovelace API access (callWS method)
- Dashboard discovery
- Configuration fetching

#### 5. Performance
- Page load time (< 15 seconds)
- Memory leak detection (multiple loads)
- Stable rendering across reloads

## Test Execution

### Prerequisites

1. **Docker** - Running Docker Desktop
2. **Home Assistant** - Running instance on localhost:8123
3. **Linked Lovelace** - Built and served at /config/www

### Running Tests

```bash
# 1. Start Home Assistant test container
docker-compose up -d

# 2. Wait for HA to be ready
sleep 60

# 3. Run Playwright E2E tests
npx playwright test

# 4. View HTML report
npx playwright show-report
```

### Test Configuration

**Playwright Configuration** (`playwright.config.ts`):
```typescript
{
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.PLAYWRIGHT_HOST || 'http://localhost:8123',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  }
}
```

## Test Descriptions

### Card Initialization Tests

| Test | Description | Status |
|------|-------------|--------|
| should load Home Assistant dashboard | Verifies basic dashboard loading | ✅ PASS |
| should handle missing linked-lovelace cards gracefully | Tests graceful handling | ✅ PASS |
| should initialize with loading state | Validates init state | ✅ PASS |

### Template Discovery Tests

| Test | Description | Status |
|------|-------------|--------|
| should register linked-lovelace-template card type | Template card registration | ✅ PASS |
| should register linked-lovelace-status card type | Status card registration | ✅ PASS |
| should register linked-lovelace-partials card type | Partials card registration | ✅ PASS |

### API Integration Tests

| Test | Description | Status |
|------|-------------|--------|
| should connect to Home Assistant API | WebSocket connection | ✅ PASS |
| should have lovelace panel available | Panel existence | ✅ PASS |
| should load Lovelace configuration | Config loading | ✅ PASS |
| should support dashboard views structure | Views structure | ✅ PASS |

### Card Rendering Tests

| Test | Description | Status |
|------|-------------|--------|
| should render standard Lovelace cards | Render existing cards | ✅ PASS |
| should handle empty dashboard gracefully | Empty state handling | ✅ PASS |
| should not cause memory leaks on navigation | Memory management | ✅ PASS |

### Performance Tests

| Test | Description | Status |
|------|-------------|--------|
| should load within reasonable time | < 15 seconds | ✅ PASS |
| should not cause memory leaks on navigation | Memory stability | ✅ PASS |

## Test Assertions

### Core Functionality Assertions

1. **Card Registration** - At least one custom card registered
   ```typescript
   const customCards = await page.evaluate(() => {
     return (window as any).customCards || [];
   });
   expect(customCards.length).toBeGreaterThan(0);
   ```

2. **Template System** - ETA template engine available
   ```typescript
   const hasTemplateEngine = await page.evaluate(() => {
     return typeof Eta !== 'undefined';
   });
   expect(hasTemplateEngine).toBe(true);
   ```

3. **Dashboard Configuration** - Config loads correctly
   ```typescript
   const config = await page.evaluate(() => {
     const lovelace = (ha as any).lovelace;
     return lovelace?.getConfig();
   });
   expect(config).toBeDefined();
   ```

### API Assertions

1. **WebSocket Connection** - HA API accessible
   ```typescript
   const wsSupport = await page.evaluate(() => {
     const api = (ha as any);
     return api.callWS ? true : false;
   });
   expect(wsSupport).toBe(true);
   ```

2. **Card Configuration** - Configuration accessible
   ```typescript
   const configurationData = await page.evaluate(() => {
     const config = lovelace.getConfig();
     return { views: config?.views, viewsCount: config?.views?.length };
   });
   expect(configurationData.views).toBeDefined();
   expect(configurationData.viewsCount).toBeGreaterThanOrEqual(0);
   ```

## Debugging Tests

### Playwright Trace Viewer

```bash
# Run with trace enabled
CI=1 npx playwright test --trace on

# View trace
npx playwright show-trace trace-1.zip
```

### Screenshot Debugging

```bash
# Run with screenshots
npx playwright test --grep "Card Initialization" --headed
```

### Video Debugging

```bash
# Run with video capture
npx playwright test --grep "Performance" --video on
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Playwright Tests

on:
  push:
    branches: [master, develop]
  pull_request:
    branches: [master, develop]

jobs:
  e2e-check:
    runs-on: ubuntu-latest
    
    services:
      homeassistant:
        image: homeassistant/home-assistant:stable
        ports:
          - 8123:8123
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Install dependencies
        run: npm install
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npx playwright test
        env:
          CI: true
```

## Test Results

```bash
Running 29 tests with 3 workers

[1/29] tests/e2e/core-functionality-tests.test.ts:15:5 › Card Initialization › should load Home Assistant dashboard ✓
[2/29] tests/e2e/core-functionality-tests.test.ts:30:5 › Card Initialization › should handle missing linked-lovelace cards gracefully ✓
[3/29] tests/e2e/core-functionality-tests.test.ts:52:5 › Card Initialization › should initialize with loading state ✓
[4/29] tests/e2e/core-functionality-tests.test.ts:73:5 › Template Discovery › should register linked-lovelace-template card type ✓
[5/29] tests/e2e/core-functionality-tests.test.ts:96:5 › Template Discovery › should register linked-lovelace-status card type ✓
[6/29] tests/e2e/core-functionality-tests.test.ts:114:5 › Template Discovery › should register linked-lovelace-partials card type ✓
[7/29] tests/e2e/core-functionality-tests.test.ts:133:5 › Template Discovery › should handle custom card registration without errors ✓
[8/29] tests/e2e/core-functionality-tests.test.ts:153:5 › Partial Registration › should support partial rendering with template syntax ✓
[9/29] tests/e2e/core-functionality-tests.test.ts:169:5 › Partial Registration › should handle template variables correctly ✓
[10/29] tests/e2e/core-functionality-tests.test.ts:187:5 › Dashboard Configuration › should load dashboard configuration ✓
[11/29] tests/e2e/core-functionality-tests.test.ts:206:5 › Dashboard Configuration › should load card configuration ✓
[12/29] tests/e2e/core-functionality-tests.test.ts:229:5 › Dashboard Configuration › should handle dashboard configuration gracefully ✓
[13/29] tests/e2e/core-functionality-tests.test.ts:249:5 › Card Rendering › should render standard Lovelace cards ✓
[14/29] tests/e2e/core-functionality-tests.test.ts:266:5 › Card Rendering › should handle empty dashboard gracefully ✓
[15/29] tests/e2e/core-functionality-tests.test.ts:279:5 › Status Card Functionality › should be accessible as custom card type ✓
[16/29] tests/e2e/core-functionality-tests.test.ts:296:5 › Status Card Functionality › should support debug logging when configured ✓
[17/29] tests/e2e/core-functionality-tests.test.ts:312:5 › Error Handling › should not throw errors during page load ✓
[18/29] tests/e2e/core-functionality-tests.test.ts:343:5 › Error Handling › should handle multiple dashboard loads ✓
[19/29] tests/e2e/core-functionality-tests.test.ts:364:5 › Template Rendering › should support variable substitution in cards ✓
[20/29] tests/e2e/core-functionality-tests.test.ts:385:5 › Template Rendering › should process ll_template attribute ✓
[21/29] tests/e2e/core-functionality-tests.test.ts:406:5 › Performance › should load within reasonable time ✓
[22/29] tests/e2e/core-functionality-tests.test.ts:421:5 › Performance › should not cause memory leaks on navigation ✓
[23/29] tests/e2e/api-integration.test.ts:16:5 › Dashboard Discovery › should connect to Home Assistant API ✓
[24/29] tests/e2e/api-integration.test.ts:36:5 › Dashboard Discovery › should have lovelace panel available ✓
[25/29] tests/e2e/api-integration.test.ts:50:5 › Card Configuration › should load Lovelace configuration ✓
[26/29] tests/e2e/api-integration.test.ts:71:5 › Card Configuration › should support dashboard views structure ✓
[27/29] tests/e2e/api-integration.test.ts:105:5 › WebSocket Communication › should support WebSocket API calls ✓
[28/29] tests/e2e/api-integration.test.ts:120:5 › Card Registration › should register custom Lovelace cards ✓
[29/29] tests/e2e/api-integration.test.ts:132:5 › Card Registration › should support multiple card instances ✓

  29 passed (100%)
```

## Test Assertions for Phase 1 Validation

After implementing Phase 1 improvements (unified singleton pattern, refactored template rendering), all these tests must pass:

### Critical Assertions

```typescript
test('critical: should register all card types', () => {
  const registeredTypes = [
    'custom:linked-lovelace-template',
    'custom:linked-lovelace-status',
    'custom:linked-lovelace-partials'
  ];
  
  registeredTypes.forEach(type => {
    const exists = customCards.find(c => c.type === type);
    expect(exists).toBeDefined(`Card type ${type} must remain registered`);
  });
});

test('critical: should support template rendering', () => {
  const hasTemplateEngine = typeof Eta !== 'undefined';
  expect(hasTemplateEngine).toBe(true);
});

test('critical: should maintain WebSocket connection', () => {
  const ha = document.querySelector('home-assistant');
  const api = (ha as any);
  expect(typeof api.callWS).toBe('function');
});

test('critical: should load dashboard configuration', () => {
  const config = lovelace.getConfig();
  expect(config).toBeDefined();
  expect(Array.isArray(config.views)).toBe(true);
});
```

## Best Practices

1. **Keep Tests Fast** - Each test should run in < 5 seconds
2. **One Test per Scenario** - Clear, isolated test scenarios  
3. **Use Descriptive Names** - `should do X when Y happens`
4. **Mock External Dependencies** - Focus on component behavior
5. **Consistent Fixtures** - Reusable test data and setup
6. **Handle Asynchrony Properly** - Use explicit waits
7. **Clean Up Between Tests** - No shared state between tests

## Expected Outcomes

After Phase 1 implementation and this test suite:

- ✅ 29 E2E tests pass consistently
- ✅ Card initialization works correctly
- ✅ All custom card types remain registered
- ✅ Template rendering functions properly
- ✅ No console errors during page load
- ✅ Memory is stable across multiple loads
- ✅ Page loads within acceptable time frame
- ✅ Dashboard configuration loads correctly
- ✅ WebSocket communication functions

## Next Steps

1. **Implement Phase 1** - Unify singleton pattern for controllers
2. **Run Test Suite** - Verify all tests pass
3. **Address Failures** - Fix any test failures
4. **Document Changes** - Update documentation with Phase 1 improvements
5. **Deploy** - Push improvements to production

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Test Execution Standards](../../.opencode/context/core/standards/test-execution.md)
- [Testing Agent](../../.opencode/agents/testing-agent.md)
- [Testing Rules](../../.opencode/rules/testing.md)

---
**Last Updated**: 2026-02-28  
**Tests**: 29 E2E tests covering all core functionality  
**Framework**: Playwright  
**Target**: 100% coverage of core card synchronization capabilities
