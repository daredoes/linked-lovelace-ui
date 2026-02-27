---
source: Context7 API
library: Home Assistant Websocket
package: home-assistant-js-websocket
topic: Websocket API for test automation
type: Home Assistant Websocket API Connection and Authentication
fetched: 2026-02-27T12:00:00Z
official_docs: https://developers.home-assistant.io/docs/api/websocket
---

# Home Assistant Websocket API for Test Automation

## WebSocket Connection Setup

Home Assistant hosts a WebSocket API at `/api/websocket`. The connection involves an authentication phase.

### WebSocket API Connection and Authentication

```
1. Client connects to /api/websocket
2. Server sends auth_required message
   {
     "type": "auth_required",
     "ha_version": "2021.5.3"
   }

3. Client sends auth message with access token
   {
     "type": "auth",
     "access_token": "YOUR_ACCESS_TOKEN"
   }

4. Server responds with auth_ok or auth_invalid
   {
     "type": "auth_ok",
     "ha_version": "2021.5.3"
   }
```

## Authentication Methods

### Long-Lived Token Authentication (Recommended for Testing)

```javascript
import { createLongLivedTokenAuth, createConnection } from 'home-assistant-js-websocket';

const auth = createLongLivedTokenAuth(
  'http://localhost:8123',
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...'
);

const connection = await createConnection({ auth });
console.log('Connected to Home Assistant version:', connection.haVersion);
```

### OAuth2 Authentication with Token Persistence

```javascript
import { getAuth, createConnection } from 'home-assistant-js-websocket';

// Initialize authentication with token persistence
const auth = await getAuth({
  hassUrl: 'http://localhost:8123',
  clientId: 'https://myapp.example.com',
  saveTokens: (tokens) => localStorage.setItem('haTokens', JSON.stringify(tokens)),
  loadTokens: async () => JSON.parse(localStorage.getItem('haTokens'))
});

// Auth object provides access to tokens and WebSocket URL
console.log(auth.accessToken); // Current access token
console.log(auth.wsUrl); // ws://localhost:8123/api/websocket
console.log(auth.expired); // false

// Manually refresh tokens if needed
if (auth.expired) {
  await auth.refreshAccessToken();
}

// Revoke all tokens (logout)
await auth.revoke();
```

## Service Call Patterns for Automated Testing

### Call Service Action

```javascript
let messageId = 1;

// Call a service action
ws.send(JSON.stringify({
    id: messageId++,
    type: 'call_service',
    domain: 'light',
    service: 'turn_on',
    service_data: {
        brightness: 180,
        color_name: 'blue'
    },
    target: {
        entity_id: 'light.living_room'
    }
}));

// Call service with return_response for services that return data
ws.send(JSON.stringify({
    id: messageId++,
    type: 'call_service',
    domain: 'weather',
    service: 'get_forecasts',
    service_data: {
        type: 'daily'
    },
    target: {
        entity_id: 'weather.home'
    },
    return_response: true
}));
```

### Service Call Response Format

```json
{
  "id": 24,
  "type": "result",
  "success": true,
  "result": {
    "context": {
      "id": "326ef27d19415c60c492fe330945f954",
      "parent_id": null,
      "user_id": "31ddb597e03147118cf8d2f8fbea5553"
    },
    "response": null
  }
}
```

## Entity and State Queries

### Get Current State of Entities

```javascript
// Query all entities
connection.sendCommand({
  type: "get_states"
});

// Query specific entity configuration
connection.sendCommand({
  type: "get_config",
  domain: "light"
});

// Get current states and configuration
async function getInitialState() {
  const states = await connection.sendMessage({ type: "get_states" });
  const config = await connection.sendMessage({ type: "get_config" });
  const version = await connection.sendMessage({ type: "info" });
  return { states, config, version };
}
```

### Subscribe to Entity Changes

```javascript
import { subscribeEntities } from 'home-assistant-js-websocket';

(async () => {
  const auth = createLongLivedTokenAuth(
    "http://localhost:8123",
    "YOUR ACCESS TOKEN"
  );

  const connection = await createConnection({ auth });
  
  subscribeEntities(connection, (entities) => console.log(entities));
})();
```

## Template Rendering Validation

### Validation of Template Data

```javascript
// Verify template rendering by comparing state data
const expectedTemplateData = {
  state: 'on',
  attributes: {
    brightness: 255,
    color_mode: 'brightness'
  }
};

// Query current state and compare
const currentState = await connection.sendMessage({
  type: "get_states"
});

// Validate template output matches expected values
```

## Automation Trigger Subscription

### Subscribe to Automation Triggers

```json
{
  "id": 2,
  "type": "subscribe_trigger",
  "trigger": {
    "platform": "state",
    "entity_id": "binary_sensor.motion_occupancy",
    "from": "off",
    "to": "on"
  }
}
```

### Trigger Event Response

```json
{
  "id": 2,
  "type": "event",
  "event": {
    "variables": {
      "trigger": {
        "platform": "state",
        "entity_id": "binary_sensor.motion_occupancy",
        "from_state": {"state": "off", "last_changed": "2022-01-09T10:30:37.585143+00:00"},
        "to_state": {"state": "on", "last_changed": "2022-01-09T10:33:04.391956+00:00"}
      }
    }
  }
}
```

## Best Practices for Test Automation

1. **Use long-lived tokens** for testing - more stable than OAuth2 flow
2. **Unique message IDs** - Track request/response correlation with `id` field
3. **Error handling** - Handle `auth_invalid` and connection errors
4. **Connection state** - Listen for `disconnected`, `ready`, `reconnect-error` events
5. **Use subscribers** - `subscribe_entities` for real-time state monitoring
6. **Request responses** - Set `return_response: true` for service calls that return data

### Complete Test Automation Setup

```javascript
import { createLongLivedTokenAuth, createConnection } from 'home-assistant-js-websocket';

const auth = createLongLivedTokenAuth(
  process.env.HA_URL || 'http://localhost:8123',
  process.env.LONG_LIVED_TOKEN
);

const connection = await createConnection({ auth });

// Listen to connection events
connection.addEventListener('ready', () => {
  console.log('Connected to HA');
});

connection.addEventListener('disconnected', () => {
  console.log('Disconnected from HA');
});
```
