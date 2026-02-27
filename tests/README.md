# Test Suite for Home Assistant Lovelace Cards

This directory contains the test suite for the linked-lovelace-ui Home Assistant Lovelace card library.

## Test Structure

```
tests/
├── e2e/                          # Playwright E2E tests
│   ├── card-initialization.test.ts
│   └── template-rendering.test.ts
├── integration/                  # Jest integration tests
│   └── card-api.test.ts
├── fixtures/                     # Test data and mocks
├── jestSetup.ts                  # Jest configuration
└── package.json                  # Playwright dependencies
```

## Test Categories

### Unit Tests (Jest)
- Location: `src/v2/*.test.ts`, `src/controllers/*.test.ts`
- Runner: `npm test`
- Purpose: Test code logic, template engine, controllers
- Requirements: 90% coverage, TypeScript compilation

### Integration Tests
- Location: `tests/integration/*.integration.test.ts`
- Runner: `npx jest tests/integration/*.integration.test.ts`
- Purpose: Test API integration, service calls, template validation
- Requirements: Home Assistant container, API token

### E2E Tests (Playwright)
- Location: `tests/e2e/*.test.ts`
- Runner: `npx playwright test`
- Purpose: Browser-based UI testing, cross-browser validation
- Requirements: Playwright browsers, Home Assistant instance

## Quick Start

### Unit Tests
```bash
# Run all unit tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test src/v2/template-engine.test.ts
```

### Integration Tests
```bash
# Start Home Assistant container
./scripts/setup-hass-test-container.sh -s

# Run integration tests
npx jest tests/integration/*.integration.test.ts

# Stop container
./scripts/setup-hass-test-container.sh -t
```

### E2E Tests
```bash
# Install Playwright
npx playwright install --with-deps

# Run E2E tests
npx playwright test
```

## Configuration

### Environment Variables

- `HA_HOST` - Home Assistant instance URL (default: http://localhost:8123)
- `HA_TOKEN` - Long-lived API token (required for integration/E2E tests)
- `PLAYWRIGHT_HOST` - E2E testing target (default: same as HA_HOST)
- `CI` - Set to 'true' for CI/CD environments

### API Token

Generate a long-lived token in Home Assistant:
1. Settings → Persons → Your Profile
2. Scroll to "Long-Lived Access Tokens"
3. Click "Create Token"
4. Copy the token and export it: `export HA_TOKEN="eyJ..."`

## Test Results

### Jest Test Report
```
Test Suites: 7 total
Tests:       78 passed (including Jest integration tests)
Snapshots:   0 total
Time:        2.266 s
```

### Playwright Test Report
```
Running 26 tests using 3 workers

[1/3] tests/e2e/card-initialization.test.ts:15:7 › Card Initialization › ... ✓
[2/3] tests/e2e/card-initialization.test.ts:53:7 › Card Initialization › ... ✓
[3/3] tests/e2e/card-initialization.test.ts:76:7 › Card Initialization › ... ✓

  3 passed (100%)
```

## Debugging

### Playwright Tracing
```bash
# Enable tracing for failed tests
CI=1 npx playwright test --trace on

# View trace file
npx playwright show-trace trace-1.zip
```

### Docker Logs
```bash
# View container logs
docker logs linked-lovelace-hass-test -f

# View last 50 lines
docker logs linked-lovelace-hass-test --tail 50
```

### Playwright UI Mode
```bash
# Run tests with interactive UI
npx playwright test --ui
```

## Best Practices

1. **Keep Tests Fast**: Each test should run in < 5 seconds
2. **One Test per Scenario**: Clear, isolated test scenarios
3. **Use Descriptive Names**: `should do X when Y happens`
4. **Mock External Dependencies**: Focus on component behavior
5. **Consistent Fixtures**: Reusable test data and setup

## CI/CD Integration

See `.github/workflows/testing.yml` for complete CI/CD workflow configuration.

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Home Assistant API Docs](https://developers.home-assistant.io/docs/api/rest)
- [Testing Guidelines](../../docs/TESTING-GUIDE.md)
- [Testing Agent](../../.opencode/agents/testing-agent.md)
- [Testing Standards](../../.opencode/context/core/standards/test-execution.md)

---
**Last Updated**: 2026-02-27
