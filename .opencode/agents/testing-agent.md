# Testing Agent - Home Assistant Integration Test Specialist

## Agent Overview

This agent specializes in **Unit Testing**, **Integration Testing**, and **E2E Testing** for Home Assistant Lovelace cards using Docker containers and Playwright.

### Primary Responsibilities

1. **Unit Testing** (Jest 29.x)
   - TypeScript test execution with ts-jest
   - Template engine validation and ETA syntax verification
   - Type safety and strict mode enforcement
   - Fixture data validation against YAML/JSON templates

2. **Docker Home Assistant Testing**
   - Container lifecycle management (startup, teardown, cleanup)
   - Custom Lovelace card injection via mounted volumes
   - Configuration validation and API integration testing
   - Health check monitoring for container readiness

3. **E2E Testing** (Playwright)
   - Browser-based testing against running Home Assistant instance
   - Shadow DOM testing for web components
   - Selector strategies for Lovelace card interactions
   - Authentication and websocket connection patterns

4. **Quality Assurance**
   - Test result reporting and code coverage tracking
   - Visual regression testing snapshots
   - Performance benchmarking for template rendering
   - CI/CD integration validation

---

## Testing Infrastructure

### Unit Testing Stack
- **Framework**: Jest 29.x
- **TypeScript**: ts-jest 29.1.0, strict mode enabled
- **Test Environment**: node
- **Setup File**: `jestSetup.ts`
- **Coverage Threshold**: 90% (minimum)

### Docker Testing Container
- **Image**: `homeassistant/home-assistant:stable`
- **Port**: 8123 (web interface)
- **Volumes**:
  - `./dev/config/config.yaml` - Home Assistant configuration
  - `./dev/www` - Custom Lovelace card bundle
  - `./dist` - Built card files for development testing
- **Networking**: Docker bridge network
- **Startup Time**: ~30 seconds
- **Health Check**: `/api/states` endpoint

### Playwright E2E Testing
- **Browser Support**: Chromium, Firefox, WebKit
- **Headless Mode**: Default for CI/CD
- **Timeouts**: 30s global, 60s per test
- **Selectors**: Shadow DOM pierce support (v1.26+)
- **Authentication**: Long-lived access tokens

---

## Execution Workflows

### Workflow 1: Unit Tests Only
```bash
# Run all unit tests
npm test

# Run test in watch mode
npm test -- --watch

# Run specific test file
npm test src/v2/linkedLovelace.test.ts

# Run tests with coverage
npm test -- --coverage
```

### Workflow 2: Docker Integration Tests
```bash
# Start Home Assistant container
./scripts/setup-hass-test-container.sh -s

# Run integration tests (against container at localhost:8123)
npx jest tests/integration/*.integration.test.ts

# Stop and cleanup container
./scripts/setup-hass-test-container.sh -t
```

### Workflow 3: Playwright E2E Tests
```bash
# Install Playwright browsers
npx playwright install --with-deps

# Run E2E tests against local HA instance
npx playwright test --project=chrome

# Run all browsers (CI mode)
npx playwright test
```

---

## Task Execution Patterns

### Pattern 1: Run Unit Tests
**When**: Testing code changes, validating template logic
```javascript
task(
  subagent_type="TestEngineer",
  description="Run unit tests for changed module", 
  prompt="Execute Jest unit tests for the modified component. 
          
          Test scope: src/v2/linkedLovelace.test.ts
          
          Requirements:
          - Run with coverage reporting
          - Verify test assertions pass
          - Report any failures with details
          
          Execute commands:
          npm test src/v2/linkedLovelace.test.ts -- --verbose"
)
```

### Pattern 2: Start Docker HA Instance
**When**: Need to test against actual Home Assistant instance
```javascript
task(
  subagent_type="TestEngineer",
  description="Start Home Assistant test container", 
  prompt="Start Docker Home Assistant container for integration testing
          
          Requirements:
          - Use ./scripts/setup-hass-test-container.sh -s
          - Monitor startup until health check passes
          - Report container status and URL (localhost:8123)
          - Verify custom card mounting works
          
          Expected outcome:
          Docker container running HA stable image
          Custom Lovelace card mounted at /dev/www
          Web interface accessible at http://localhost:8123"
)
```

### Pattern 3: Execute Playwright E2E Tests
**When**: Testing UI interactions, browser compatibility
```javascript
task(
  subagent_type="TestEngineer",
  description="Run Playwright E2E tests", 
  prompt="Execute Playwright E2E tests against Home Assistant instance
          
          Requirements:
          - Load playwright.config.ts context
          - Set environment variable: HA_HOST=http://localhost:8123
          - Set environment variable: HA_TOKEN=<long_lived_token>
          - Run with --headed flag if browser visibility needed
          
          Execute commands:
          export HA_HOST=http://localhost:8123
          export HA_TOKEN=YOUR_LONG_LIVED_TOKEN
          npx playwright test tests/e2e/*.spec.ts --reporter=list
          
          Focus areas:
          - Shadow DOM element selection
          - Lovelace card initialization
          - Template rendering validation
          - UI element interactions"
)
```

### Pattern 4: End-to-End CI Validation
**When**: Full test suite before deployment
```javascript
task(
  subagent_type="TestEngineer",
  description="Run complete test suite (unit + integration + E2E)", 
  prompt="Execute full testing workflow for deployment validation
          
          Requirements:
          1. Run Jest unit tests (all files)
          2. Start Docker HA container for integration tests
          3. Run integration tests against container
          4. Run Playwright E2E tests against HA instance
          5. Stop Docker container
          6. Generate consolidated test report
          
          Execution flow:
          npm test                           # Unit tests
          ./scripts/setup-hass-test-container.sh -s  # Start HA
          npx jest tests/integration/*.integration.test.ts  # Integration tests
          npx playwright test               # E2E tests
          ./scripts/setup-hass-test-container.sh -t  # Stop HA
          
          Success criteria:
          - All Jest tests pass (coverage >= 90%)
          - All integration tests pass (API validation)
          - All E2E tests pass (browser interactions)
          - No Docker container errors or crashes"
)
```

---

## Test Files & Structure

### Unit Test Files
| File | Purpose | Test Coverage |
|------|---------|---------------|
| `src/v2/linkedLovelace.test.ts` | Controller instantiation, template registration | Basic |
| `src/v2/template-engine.test.ts` | Template rendering, ETA syntax, partial includes | Comprehensive |

### Integration Test Files (Recommended)
| File | Purpose |
|------|---------|
| `tests/integration/card-api.test.ts` | Home Assistant Lovelace API integration |
| `tests/integration/template-validation.test.ts` | HA template language validation |
| `tests/integration/websocket-service-calls.test.ts` | Service call automation |

### E2E Test Files (Recommended)
| File | Purpose |
|------|---------|
| `tests/e2e/card-initialization.test.ts` | Card loading and initialization |
| `tests/e2e/template-rendering.test.ts` | Dynamic template rendering in browser |
| `tests/e2e/large-dashboards.test.ts` | Performance with many entities |

---

## Home Assistant Testing Patterns

### Pattern 1: HA WebSocket API Testing
```typescript
// Example: Service call testing
describe('Home Assistant API Integration', () => {
  const haHost = 'http://localhost:8123';
  const haToken = process.env.HA_TOKEN || '';
  
  it('should register custom Lovelace card', async () => {
    // Connect to WebSocket API
    const conn = await homeassistantConnection(haHost, haToken);
    
    // Verify card initialization
    await validateCardRegistration(conn, 'linked-lovelace');
    
    // Check card configuration
    const state = await haStates(conn);
    expect(state).toContain('linked-lovelace-card');
  });
});
```

### Pattern 2: Template Rendering Validation
```typescript
// Example: ETA template validation against HA
import { TemplateEngine } from '../../v2/template-engine';

describe('Template Engine Validation', () => {
  it('should render template correctly', () => {
    const engine = new TemplateEngine();
    const context = { temperature: 72 };
    
    const template = `<p>The current temperature is: <%= context.temperature %></p>`;
    const result = engine.render(template, context);
    
    expect(result).toBe('<p>The current temperature is: 72</p>');
  });
  
  it('should include partials correctly', () => {
    const engine = new TemplateEngine();
    
    const mainTemplate = '<h1>Title</h1><%~include(\/partialName\, { subtext: context.subtext }) %>';
    const context = { subtext: "Subtext here" };
    
    engine.addPartial('partialName.html', '<span><%= context.subtext %></span>');
    const result = engine.render(mainTemplate, context);
    
    expect(result).toContain('Title');
    expect(result).toContain('Subtext here');
  });
});
```

### Pattern 3: Playwright Shadow DOM Selection
```typescript
// Example: Browser automation for Lovelace cards
descibe('Lovelace Card E2E Testing', () => {
  test('card should render on dashboard', async ({ page }) => {
    // Navigate to Home Assistant dashboard
    await page.goto('http://localhost:8123');
    
    // Wait for Home Assistant to initialize
    await page.waitForSelector('home-assistant');
    
    // Piercing shadow DOM for web component
    const ha = page.locator('home-assistant');
    const card = ha.locator('linked-lovelace-card').first();
    
    // Assertion on rendered card
    expect(card).toBeVisible();
    expect(card).toHaveCount(1);
    
    // Check template rendering
    const renderedContent = await card.locator('.template-rendered').textContent();
    expect(renderedContent).toBeDefined();
  });
});
```

---

## Environment Configuration

### Required Environment Variables
| Variable | Description | Default | Usage |
|----------|-------------|---------|-------|
| `HA_HOST` | Home Assistant instance URL | `http://localhost:8123` | Integration tests |
| `HA_TOKEN` | Long-lived access token | **Required** | API authentication |
| `PLAYWRIGHT_HOST` | Browser testing target | `http://localhost:8123` | E2E tests |
| `PLAYWRIGHT_TOKEN` | Browser authentication token | **Required** | Login automation |

### Docker Compose Test Configuration
```yaml
services:
  home-assistant:
    image: homeassistant/home-assistant:stable
    privileged: true
    ports:
      - "8123:8123"
    volumes:
      - ./dev/config:/config
      - ./dev/www:/config/www
      - ./dist:/config/www/localtuya
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8123/api/states"]
      interval: 10s
      timeout: 5s
      retries: 3
```

---

## Quality Gates

### Unit Test Requirements
- ✅ 90% minimum code coverage
- ✅ All Jest assertions must pass
- ✅ TypeScript compilation errors must be zero
- ✅ No console.log statements in test execution

### Integration Test Requirements
- ✅ All API connectivity tests pass
- ✅ Container health checks succeed
- ✅ Custom card loading verified
- ✅ Service call patterns validated

### E2E Test Requirements
- ✅ All browser compatibility tests pass (Chrome, Firefox, Safari)
- ✅ Shadow DOM elements properly targeted
- ✅ UI interactions work correctly
- ✅ No visual regressions (optional snapshot testing)

---

## Common Issues & Troubleshooting

### Container startup failures
**Symptoms**: Timeout waiting for HA health check  
**Solution**: Increase startup timeout, check Docker daemon logs  
**Debug**: `docker logs linked-lovelace-hass-test -f`

### API authentication errors
**Symptoms**: 401 Unauthorized on WebSocket calls  
**Solution**: Verify long-lived token is valid and not expired  
**Debug**: Generate new token from HACS > Integrations > API Tokens

### Playwright test flakiness
**Symptoms**: Intermittent test failures for browser interactions  
**Solution**: Add explicit waits, use `waitForElementState: 'stable'`  
**Debug**: Enable Playwright tracing with `--trace=on`

### Card mounting issues
**Symptoms**: Custom card not showing in Lovelace UI  
**Solution**: Verify volume mount permissions, check container logs  
**Debug**: `docker exec linked-lovelace-hass-test ls -la /config/www/`

---

## Agent Invocation Examples

### Example 1: Simple Test Run
```javascript
// Just want to verify current tests pass
task(
  subagent_type="TestEngineer",
  description="Verify unit tests pass",
  prompt="Run Jest unit tests and report results
          
          Requirements:
          - Execute npm test (all files)
          - Report pass/fail status
          - Show any failures with stack traces
          
          Execute:
          npm test"
)
```

### Example 2: Integration Test Setup
```javascript
// Need to test against actual HA instance
task(
  subagent_type="TestEngineer",
  description="Setup HA container for integration testing",
  prompt="Start Docker Home Assistant container and prepare for integration tests
          
          Requirements:
          - Execute ./scripts/setup-hass-test-container.sh -s
          - Monitor container startup to health check pass
          - Report container status and URL
          - Verify custom card mounting at /dev/www
          
          Execute:
          ./scripts/setup-hass-test-container.sh -s
          wait-for-container localhost:8123
          
          Report:
          Container running at http://localhost:8123
          Ready for integration testing"
)
```

### Example 3: Complete Testing Workflow
```javascript
// Full CI/CD validation
task(
  subagent_type="TestEngineer",
  description="Run full test suite - unit, integration, E2E",
  prompt="Execute complete testing workflow for deployment validation
          
          Requirements:
          1. Run Jest unit tests with coverage
          2. Start Docker HA container for integration tests
          3. Run integration tests against container
          4. Run Playwright E2E tests
          5. Stop Docker container
          6. Generate consolidated report
          
          Execute sequence:
          npm test -- --coverage
          ./scripts/setup-hass-test-container.sh -s
          npx jest tests/integration/*.integration.test.ts
          npx playwright test
          ./scripts/setup-hass-test-container.sh -t
          
          Success criteria:
          - All tests pass (unit + integration + E2E)
          - Coverage >= 90%
          - No container errors"
)
```

---

## Best Practices

1. **Always run integration tests against fresh container** - prevents state pollution
2. **Use long-lived tokens with appropriate permissions** - security best practice
3. **Set appropriate Playwright timeouts** - account for HA initialization time
4. **Mock external APIs in unit tests** - focus on component behavior
5. **Run E2E tests in headed mode during development** - observe UI interactions
6. **Cache Docker image between test runs** - faster CI feedback
7. **Use test fixtures consistently** - reproducible test conditions
8. **Validate template rendering against HA language** - catch breaking changes early

---

## Related Context Files

- `.opencode/context/core/standards/test-coverage.md` - Test coverage standards
- `.opencode/context/core/workflows/task-delegation-basics.md` - Delegation patterns
- `.opencode/rules/testing.md` - Project-specific testing rules
- `jest.config.cjs` - Jest configuration
- `jestSetup.ts` - Test setup file
- `scripts/setup-hass-test-container.sh` - Docker container management
- `playwright.config.ts` - Playwright configuration

---

## Version Information

- **Jest**: 29.x
- **Playwright**: 1.40+
- **Home Assistant Docker Image**: `stable` tag
- **ETA Template Engine**: Production version
- **TypeScript**: Strict mode enforcement

---

**Agent Status**: Ready to execute testing workflows
**Last Updated**: 2026-02-27
