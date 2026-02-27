---
source: Context7 API
library: Home Assistant Core
package: home-assistant
topic: Docker test environment setup
type: Docker HA Testing Environment Configuration
fetched: 2026-02-27T12:00:00Z
official_docs: https://developers.home-assistant.io/docs/supervisor/development.md
---

# Docker Home Assistant Testing Environments

## Best Practices for Test Containers

### Development Docker Setup

Use the official Home Assistant builder image for development:

```bash
docker run --rm \
    --privileged \
    -v /run/docker.sock:/run/docker.sock \
    -v "$(pwd):/data" \
    ghcr.io/home-assistant/amd64-builder:dev \
        --generic latest \
        --target /data \
        --aarch64 \
        --docker-hub awesome-user \
        --docker-user awesome-user \
        --docker-password secret-password \
        --no-cache
```

### Custom Card Development Environment

For custom Lovelace card development and testing:

```yaml
# docker-compose.yml for HA test environment
version: '3.8'
services:
  home-assistant:
    image: homeassistant/home-assistant:stable
    container_name: home-assistant-test
    network_mode: host
    privileged: true
    volumes:
      - ./config:/config
      - ./custom_cards:/config/custom_components
      - ./templates:/config/templates
    environment:
      - TZ=America/New_York
      - PYTHONUNBUFFERED=1
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8123"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
```

## Configuration Requirements for Custom Cards

### Custom Card Registration (YAML Dashboard)

```yaml
# Example dashboard configuration for custom Lovelace card
views:
  - name: Example
    cards:
      - type: "custom:wired-toggle-card"
        entities:
          - input_boolean.switch_ac_kitchen
          - input_boolean.switch_ac_livingroom
          - input_boolean.switch_tv
```

### JavaScript Custom Card Registration

```javascript
// Register your custom card in window.customCards
window.customCards = window.customCards || [];
window.customCards.push({
  type: "content-card-example",
  name: "Content Card",
  preview: false,
  description: "A custom card made by me!",
  documentationURL: "https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card"
});
```

### Card Editor Registration

```javascript
class ContentCardEditor extends LitElement {
  setConfig(config) {
    this._config = config;
  }

  configChanged(newConfig) {
    const event = new Event("config-changed", {
      bubbles: true,
      composed: true,
    });
    event.detail = { config: newConfig };
    this.dispatchEvent(event);
  }
}

customElements.define("content-card-editor", ContentCardEditor);
customElements.define("ContentCardEditor", ContentCardEditor);
```

## Startup Timing and Health Checks

### Health Check Configuration

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8123"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s  # Give HA time to fully initialize
```

### Waiting for HA to be Ready (Test Scenario)

```javascript
// Wait for Home Assistant to be ready before starting tests
async function waitForHomeAssistant(url, timeout = 120000) {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log('Home Assistant is ready!');
        return true;
      }
    } catch (e) {
      // Continue waiting
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  throw new Error('Home Assistant did not start within timeout');
}

// Usage in test setup
await waitForHomeAssistant('http://localhost:8123');
```

## Port Configurations and Network Setup

### Default Ports

| Service | Port | Protocol |
|---------|------|----------|
| HTTP API | 8123 | TCP |
| WebSocket | 8123 (same) | WebSocket |
| Frontend Dev | 8124 | TCP |
| Dev server custom | Configurable | TCP |

### Network Configuration Options

```yaml
# Method 1: Host network (recommended for testing)
network_mode: host
# HA accessible at localhost:8123 automatically

# Method 2: Port mapping
ports:
  - "8123:8123"

# Method 3: Custom port
ports:
  - "8654:8123"  # Custom port 8654 forwards to internal 8123
```

### Custom Development Server Port

```bash
# Start frontend dev server on custom port
script/develop_and_serve -p 8654
```

## Testing Environment Setup Pattern

### Recommended Test Flow

```javascript
// 1. Start HA in Docker container (or ensure it's running)
await startHomeAssistantContainer();

// 2. Wait for HA to be fully ready
await waitForHomeAssistant('http://localhost:8123');

// 3. Authenticate with long-lived token
const auth = createLongLivedTokenAuth(
  'http://localhost:8123',
  process.env.LONG_LIVED_TOKEN
);

// 4. Create WebSocket connection
const connection = await createConnection({ auth });

// 5. Run tests against ready HA instance
assertIsReady();
```

## Custom Card Testing Considerations

### Resource Loading

```yaml
# Custom cards must be loaded as resources
resources:
  - url: /local/cards/custom-card-name.js
    type: module
```

### Card Type Registration

```yaml
# Dashboard must reference custom: prefix
cards:
  - type: "custom:content-card-example"
    entity: input_boolean.switch_tv
```

### Development Workflow

```bash
# 1. Start HA container
$ docker-compose up -d

# 2. Wait for startup
$ docker-compose logs -f

# 3. Test custom cards via browser or automated tests
```