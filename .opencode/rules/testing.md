---
apply: always
---

# Testing Rules for linked-lovelace-ui

## Overview

These rules define the testing standards and execution requirements for the Home Assistant Lovelace card library. They apply to all code changes, features, and integrations.

---

## Rule 1: Unit Test Coverage Requirements

### Priority: HIGH

**Requirement**: All code changes must maintain minimum 90% code coverage.

**Application**:
- When adding new code or modifying existing functionality
- When refactoring or improving existing code
- When introducing new features

**Validation Command**:
```bash
npm test -- --coverage
```

**Failure Criteria**:
- Test coverage drops below 90%
- New code introduces untested branches
- Existing test assertions fail after changes

**Examples**:
```typescript
// ❌ Before (incomplete test)
describe('TemplateEngine', () => {
  it('should create engine', () => {
    const engine = new TemplateEngine();
    expect(engine).toBeDefined();
  });
  // Missing tests for rendering, include(), etc.
});

// ✅ After (complete test)
describe('TemplateEngine', () => {
  it('should create engine', () => {
    const engine = new TemplateEngine();
    expect(engine).toBeDefined();
  });
  
  it('should render template with context variables', () => {
    const engine = new TemplateEngine();
    const context = { name: 'John' };
    const template = 'Hello, <%= context.name %>!';
    const result = engine.render(template, context);
    expect(result).toBe('Hello, John!');
  });
  
  it('should include partials correctly', () => {
    const engine = new TemplateEngine();
    engine.addPartial('header', '<h1><%= context.title %></h1>');
    const context = { title: 'Welcome' };
    const template = '\u003c%~ include(\\'header\\', context) %\u003e';
    const result = engine.render(template, context);
    expect(result).toBe('<h1>Welcome</h1>');
  });
});
```

---

## Rule 2: Test File Naming and Structure

### Priority: HIGH

**Requirement**: Test files must follow consistent naming and organizational patterns.

**Application**:
- When creating new test files
- When reorganizing existing tests
- When integrating with CI/CD workflows

**Naming Convention**:
```typescript
// Source file: linkedLovelace.ts
// Test file: linkedLovelace.test.ts

// Source file: src/v2/template-engine.ts
// Test file: src/v2/template-engine.test.ts

// Source file: tests/integration/card-api.test.ts
// Test file: tests/integration/card-api.integration.test.ts
```

**Description Format**:
```typescript
// Must follow format: [type] ComponentName/description

describe('[class] LinkedLovelaceController', () => {
  // Test suite for controller class
});

describe('[function] sortTemplatesByPriority', () => {
  // Test suite for sorting function
});
```

**Test Naming Format**:
```typescript
test('should [action] when [condition]', () => {
  // Test logic
});

// Example:
it('should initialize with valid configuration', () => {
  // Test implementation
});
```

---

## Rule 3: Home Assistant Container Testing

### Priority: MEDIUM

**Requirement**: Integration tests against Home Assistant must use isolated Docker containers.

**Application**:
- When testing API integration
- When testing WebSocket connections
- When validating card registration
- When testing template rendering on actual HA instance

**Container Configuration**:
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
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8123/api/states"]
      interval: 10s
      timeout: 5s
      retries: 3
```

**Container Lifecycle**:
```bash
# Start container
./scripts/setup-hass-test-container.sh -s

# Wait for container to be healthy
wait-for-health localhost:8123

# Run integration tests
npx jest tests/integration/*.integration.test.ts

# Stop container
./scripts/setup-hass-test-container.sh -t
```

---

## Rule 4: Playwright E2E Testing

### Priority: MEDIUM

**Requirement**: All UI interactions and browser compatibility must be tested with Playwright.

**Application**:
- When adding new card features that affect UI
- When modifying CSS or template rendering
- When implementing user interactions
- When testing cross-browser compatibility

**Test Scope**:
```typescript
// Test card initialization
test('should initialize card on dashboard', async () => {
  await page.goto('/');
  const card = page.locator('linked-lovelace-card');
  expect(card).toBeVisible();
});

// Test template rendering
test('should render templates correctly', async () => {
  await page.goto('/');
  const templateContent = page.locator('.template-rendered');
  expect(templateContent).not.toHaveText('undefined');
});

// Test shadow DOM interaction
test('should handle shadow DOM elements', async () => {
  const ha = page.locator('home-assistant');
  const card = ha.locator('linked-lovelace-card');
  // Test nested elements
  const cardElement = card.locator('paper-card').first();
  expect(cardElement).toBeTruthy();
});
```

---

## Rule 5: Test Data and Fixtures

### Priority: LOW

**Requirement**: All test data must be stored in fixture files.

**Application**:
- When creating test scenarios
- When defining expected outputs
- When testing against template variations

**Fixture Organization**:
```
testFixtures:
  - src/v2/selectOption.yml (input_select service call pattern)
  - src/v2/selectAction.json (JSON select action pattern)
  - src/v2/modeToIcon.yml (icon determination logic)
  - src/v2/modeToIconColor.yml (color determination logic)
  - src/v2/test.yml (expected output comparisons)
  - src/v2/testv2.yml (ETA template syntax examples)
```

**Fixture Format**:
```yaml
# YAML fixtures for testing
service: input_select.select_option
target:
  entity_id: input_select.select_one
data:
  option: <%= context.selected_option %>
```

---

## Rule 6: API Authentication Security

### Priority: HIGH

**Requirement**: All API tokens must be stored in environment variables, never hardcoded.

**Application**:
- When configuring Docker test containers
- When setting up Playwright E2E tests
- When integrating with Home Assistant WebSocket API

**Token Management**:
```typescript
// ✅ Correct: Environment variables
const haToken = process.env.HA_TOKEN;
if (!haToken) {
  throw new Error('HA_TOKEN environment variable required');
}

// ❌ Incorrect: Hardcoded tokens
// DO NOT use: const haToken = 'abc123very_long_token_here';
```

**Security Validation**:
```bash
# Check for hardcoded tokens
! grep -r "token.*=[A-Z0-9].*[0-9]" src/ tests/ || echo "No hardcoded tokens found"

# Validate environment is set
if [ -z "$HA_TOKEN" ]; then
  echo "HA_TOKEN not set - setting up test environment"
  export HA_TOKEN=$(docker exec linked-lovelace-hass-test \
    homeassistant --config /config create_user --username test --password test)
fi
```

---

## Rule 7: Test Execution Order

### Priority: MEDIUM

**Requirement**: Tests must execute in correct order with proper isolation.

**Execution Sequence**:
```bash
# 1. Unit tests (fastest feedback)
npm test

# 2. Integration tests (container required)
./scripts/setup-hass-test-container.sh -s
npx jest tests/integration/*.integration.test.ts
./scripts/setup-hass-test-container.sh -t

# 3. E2E tests (browser testing)
npx playwright test
```

**Test Isolation**:
- Each test must complete without leaving side effects
- Container must be fresh for each integration test run
- Browser state must be reset between E2E test runs

**Isolation Rules**:
```typescript
// ✅ Correct: Test isolation
beforeAll(async () => {});
afterAll(async () => { cleanup });

// ❌ Incorrect: Shared state between tests
let sharedState = {};
beforeEach(() => {});
afterEach(() => { 
  // Don't rely on cleanup for isolation
});
```

---

## Rule 8: Error Handling in Tests

### Priority: MEDIUM

**Requirement**: Tests must properly handle and report errors.

**Error Reporting Format**:
```typescript
try {
  await executeTestWithContainer();
} catch (error) {
  toConsole('error', 'Test execution failed', error);
  throw error; // Re-throw for CI visibility
}

// Container-specific error handling
if (error.message.includes('timeout') || error.message.includes('health check')) {
  toConsole('warn', 'Container may not be ready, retrying...');
  await retryWithBackoff(3);
} else {
  throw error; // Unexpected error
}
```

**Assertion Error Handling**:
```typescript
// Use descriptive error messages
expect(result).toBe(expected, 
  `Template rendering failed: 
   Expected: ${expected}  
   Got: ${result}`
);

// Catch expected errors
await expect(async () => {
  await executeInvalidServiceCall();
}).rejects.toThrow('Invalid configuration');
```

---

## Rule 9: Timeout Configuration

### Priority: LOW

**Requirement**: All asynchronous operations must have appropriate timeouts.

**Timeout Standards**:
```typescript
// Docker container startup
const waitForContainer = async (port: number, retries: number = 30) => {
  for (let i = 0; i < retries; i++) {
    if (await isHealthy(port)) {
      break;
    }
    await delay(1000);
  }
};

// Playwright navigation timeout
await page.goto('url', { waitUntil: 'networkidle', timeout: 30000 });

// Template rendering timeout
const result = await renderTemplate(timeout: 5000);

// API call timeout
const data = await api.fetch(endpoint, { timeout: 10000 });
```

**Standard Timeouts**:
| Operation | Timeout | Notes |
|----------|-- -----|-------|
| Container startup | 30s | Account for HA initialization |
| Page navigation | 30s | Allow for slow connections |
| Template rendering | 5s | Should be fast |
| API calls | 10s | Standard REST timeout |
| Browser actions | 10s | Interaction timeout |

---

## Rule 10: CI/CD Integration

### Priority: HIGH

**Requirement**: All tests must support CI/CD execution.

**CI Requirements**:
```yaml
# .github/workflows/build.yml
on:
  push:
    branches: [master]
  pull_request:
    branches: [master]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      # Run unit tests
      - name: Run Jest tests
        run: yarn test
        
      # Build project
      - name: Build with Rollup
        run: yarn build
        
      # Integration tests (optional - run on demand)
      - name: Integration tests
        if: github.event_name == 'push'
        run: |
          npm run test:integration
        
      # E2E tests (optional - run on demand)
      - name: E2E tests with Playwright
        if: github.event_name == 'push'
        run: |
          npx playwright test
```

**Environment Configuration**:
```bash
# Required CI environment variables
- CI=true (enables CI-specific behaviors)
- HA_TOKEN= (for integration tests, from secret store)
- PLAYWRIGHT_TOKEN= (for E2E tests, from secret store)
- GITHUB_TOKEN= (for API access)
```

---

## Rule 11: Performance Metrics

### Priority: LOW

**Requirement**: Performance benchmarks must be documented and validated.

**Performance Requirements**:
```typescript
// Template rendering performance
describe('Performance Benchmarks', () => {
  it('should render templates within acceptable time', () => {
    const start = performance.now();
    const result = engine.render(template, context);
    const duration = performance.now() - start;
    
    // Must be < 100ms
    expect(duration).toBeLessThan(100);
    expect(result).toBeDefined();
  });
});
```

**Browser Performance Targets**:
- Card initialization: < 2s
- Template rendering: < 500ms per card
- Dashboard load: < 5s (with < 10 cards)
- Scroll/render 100+ cards: < 2s

---

## Rule 12: Test Reporting

### Priority: LOW

**Requirement**: Test results must be reported in standardized formats.

**Report Formats**:
```bash
# Console reports (default)
npm test -- --verbose

# XML reports for CI
npm test -- --ci --reporters=default --reporters=jest-junit

# HTML reports
npm test -- --coverage --coverageReporters=html

# Playwright reports
npx playwright test --reporter=list
npx playwright show-report
```

**Report Structure**:
```
test-results/
  ├── jest-report.xml
  ├── coverage/
  │   ├── index.html
  │   └── lcov.info
  └── playwright/
      ├── report.html
      └── traces/
```

---

## Rule Exceptions and Workarounds

### Exception 1: Legacy Test Code
**When**: Existing test files do not follow current patterns
**Remedy**: Fix in next test update, document exception

### Exception 2: Third-Party Integration Testing
**When**: Testing external APIs with rate limits
**Remedy**: Use mock data, document limitations

### Exception 3: Performance Testing Under Load
**When**: Testing with concurrent requests
**Remedy**: Separate performance testing framework, document requirements

---

## Enforcement

### Pre-Commit
- Run unit tests: `npm test`
- Verify coverage: `npm test -- --coverage`
- Check for hardcoded tokens: `grep -r "token" tests/`

### Pre-Deployment
- All tests pass (unit + integration + E2E)
- Coverage maintained at 90%+
- All browser compatibility tests pass
- Performance benchmarks met

### CI/CD Validation
- Unit tests must pass (coverage threshold)
- All integration tests must pass
- All E2E tests must pass across 3 browsers
- Build artifacts must be valid

---

## Related Files

- `.opencode/context/core/standards/test-execution.md` - Execution standards
- `.opencode/agents/testing-agent.md` - Testing agent definition
- `jest.config.cjs` - Jest configuration
- `playwright.config.ts` - Playwright configuration
- `scripts/setup-hass-test-container.sh` - Docker container management
- `tests/integration/` - Integration test templates

---

**Status**: Active | **Last Updated**: 2026-02-27
