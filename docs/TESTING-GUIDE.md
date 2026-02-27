# Testing with Home Assistant - Docker and Playwright

## Overview

This document outlines how to run unit, integration, and E2E tests for the linked-lovelace-ui Home Assistant Lovelace card library using Docker containers and Playwright browser automation.

## Testing Architecture

### Test Categories

1. **Unit Tests (Jest)**
   - TypeScript tests for template engine, controllers, and helpers
   - Coverage threshold: 90% minimum
   - Fast feedback (< 2 minutes)
   
2. **Integration Tests (Jest + Docker)**
   - Tests against real Home Assistant instance via Docker container
   - API validation and WebSocket connection testing
   - Template rendering validation
   
3. **E2E Tests (Playwright)**
   - Browser-based testing of UI interactions
   - Shadow DOM testing for web components
   - Cross-browser compatibility (Chrome, Firefox, Safari)

## Quick Start

### Prerequisites
- Docker Desktop installed and running
- Node.js v16+
- Home Assistant long-lived access token (see Configuration section)

### Run Unit Tests
```bash
npm test

# With coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Run Integration Tests (requires Docker)
```bash
# Start Home Assistant test container
./scripts/setup-hass-test-container.sh -s

# Run integration tests
npx jest tests/integration/*.integration.test.ts

# Stop container
./scripts/setup-hass-test-container.sh -t
```

### Run E2E Tests (requires Playwright)
```bash
# Install Playwright browsers
npx playwright install --with-deps

# Run E2E tests
npx playwright test

# Run with headed browser (for debugging)
npx playwright test --headed
```

## Configuration

### Environment Variables

Create a `.env.test` file or export these before running tests:

```bash
export HA_HOST="http://localhost:8123"
export HA_TOKEN="your_long_lived_api_token_here"
export PLAYWRIGHT_HOST="http://localhost:8123"
export PLAYWRIGHT_TOKEN="your_browser_auth_token_here"
```

### Generating API Token

1. Go to Home Assistant UI: Settings → Persons → Your Profile
2. Scroll to "Long-Lived Access Tokens"
3. Click "Create Token"
4. Name it "Test Environment"
5. Copy the token (starts with `eyJ`)

## Docker Container Setup

### Container Configuration

The `scripts/setup-hass-test-container.sh` script manages the Home Assistant test container:

```bash
# Start container (default: stable image)
./scripts/setup-hass-test-container.sh -s

# Show container status
./scripts/setup-hass-test-container.sh -h

# Stop container
./scripts/setup-hass-test-container.sh -t

# Clean container logs
./scripts/setup-hass-test-container.sh -c

# Show help
./scripts/setup-hass-test-container.sh -h
```

### Docker Compose Configuration

Container configuration is automatically generated with:
- Image: `homeassistant/home-assistant:stable`
- Port mapping: 8123:8123
- Volume mounts:
  - `./dev/config` - Home Assistant configuration
  - `./dev/www` - Custom Lovelace card bundle
  - `./dist` - Built card files
- Health check: `/api/states` endpoint

## Playwright E2E Testing

### Browser Support

- **Desktop**: Chrome, Firefox, Safari
- **Mobile**: Chrome (Pixel 5), Safari (iPhone 12)

### Test Structure

```
tests/
├── e2e/
│   ├── card-initialization.test.ts  # Card loading and initialization
│   ├── template-rendering.test.ts   # Template rendering in browser
│   └── large-dashboards.test.ts      # Performance testing
├── integration/
│   └── card-api.test.ts              # API integration tests
└── fixtures/                         # Test data and mocks
```

### Writing E2E Tests

Example test structure:

```typescript
import { test, expect } from '@playwright/test';

describe('Card Initialization', () => {
  test('should load card on dashboard', async ({ page }) => {
    // Navigate to Home Assistant
    await page.goto('/');
    
    // Wait for Home Assistant to load
    await page.waitForSelector('home-assistant');
    
    // Verify card is visible
    const card = page.locator('linked-lovelace-card');
    await expect(card).toBeVisible();
  });
});
```

### Shadow DOM Testing

Playwright v1.26+ automatically pierces shadow roots. For Home Assistant web components:

```typescript
// Access shadow DOM elements
cardLocator = page.locator('home-assistant');
linkCard = cardLocator.locator('linked-lovelace-card');

// Navigate within shadow DOM
const templateContent = linkCard.locator('.template-rendered');
await expect(templateContent).toBeVisible();
```

## Best Practices

### Test Reliability

1. **Use Environment Variables**: Never hardcode tokens or URLs
2. **Implement Skip Logic**: Tests should skip if HA instance unavailable
3. **Add Explicit Waits**: Account for HA initialization delays
4. **Cache Docker Images**: Faster test execution with image caching
5. **Isolate Test State**: Each test should be independent

### Debugging

#### Playwright Tracing
```bash
# Enable tracing for failed tests
CI=1 npx playwright test --trace on

# View traces
npx playwright show-trace trace-1.zip
```

#### Docker Logs
```bash
# View container logs
docker logs linked-lovelace-hass-test -f

# View last 50 lines
docker logs linked-lovelace-hass-test --tail 50
```

### CI/CD Integration

For GitHub Actions or similar CI systems:

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run unit tests
        run: npm test
      
      - name: Run integration tests
        run: |
          ./scripts/setup-hass-test-container.sh -s
          npx jest tests/integration/*.integration.test.ts
          ./scripts/setup-hass-test-container.sh -t
        if: github.event_name == 'push'
      
      - name: Run E2E tests
        run: |
          npx playwright install --with-deps
          npx playwright test
        if: github.event_name == 'push'
```

## Common Issues

### Container Startup Failures

**Symptoms**: Timeout waiting for HA health check

**Solution**:
- Increase startup timeout: `STARTUP_TIMEOUT=60 ./scripts/setup-hass-test-container.sh -s`
- Check Docker daemon logs: `docker logs linked-lovelace-hass-test`
- Verify Docker is running: `docker info`

### API Authentication Errors

**Symptoms**: 401 Unauthorized errors

**Solution**:
- Verify HA_TOKEN is set and valid
- Generate new token from HA UI if expired
- Check token permissions include `user_read` and `config_read`

### Playwright Test Flakiness

**Symptoms**: Intermittent failures for browser interactions

**Solution**:
- Add explicit waits: `await page.waitForSelector('selector')`
- Set `actionTimeout` and `navigationTimeout` in playwright.config.ts
- Use `--headed` flag during development to observe UI issues

### Card Not Loading

**Symptoms**: Card not appearing in Lovelace dashboard

**Solution**:
- Verify Docker volume mounts are correct
- Check custom card files are in `/dev/www`
- Ensure `www/` folder is being served by HA instance

## Testing Checklist

### Before Committing
- [ ] All unit tests pass (`npm test`)
- [ ] Coverage is ≥ 90%
- [ ] TypeScript compilation successful
- [ ] No console.errors in test execution

### Before Publishing/Release
- [ ] All tests pass (unit + integration + E2E)
- [ ] Docker container runs without errors
- [ ] No visual regressions (optional)
- [ ] Performance benchmarks met

## Resources

### Official Documentation
- [Playwright Getting Started](https://playwright.dev/docs/intro)
- [Home Assistant API Documentation](https://developers.home-assistant.io/docs/api/rest)
- [Home Assistant WebSocket API](https://developers.home-assistant.io/docs/api/websocket)
- [Lovelace Card Development](https://developers.home-assistant.io/docs/lovelace/cards)

### Tools
- [Playwright Codegen](https://playwright.dev/docs/codegen) - Generate tests interactively
- [Playwright Inspector](https://playwright.dev/docs/inspector) - Debug tests
- [Home Assistant Dev Container](https://github.com/home-assistant/development.container)

## Support

For testing-related issues:
- Check the [Testing Rules](../.opencode/rules/testing.md) for project-specific guidelines
- Review [Testing Agent](../.opencode/agents/testing-agent.md) for complete documentation
- See [Test Execution Standards](../.opencode/context/core/standards/test-execution.md) for patterns and best practices

---
**Last Updated**: 2026-02-27
