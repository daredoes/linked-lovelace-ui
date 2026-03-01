# Plugin Demo and Feature Showcase

## Documentation: Video Demonstration of Linked Lovelace Features

This document provides guidance on how to capture video demonstrations and screenshots of the Linked Lovelace plugin showcasing its various features using Playwright and Docker.

---

## Setup Requirements

### Prerequisites

1. **Docker Desktop** - Running locally
2. **Home Assistant** - Docker container instance
3. **Playwright** - Installed and browsers configured
4. **Node.js** - v16+

### Quick Start

```bash
# 1. Start Home Assistant test container
docker-compose up -d

# 2. Wait for container to be ready (approx. 60 seconds)
sleep 60

# 3. Verify Home Assistant is running
# Open browser to http://localhost:8123
```

### Run Video Capture Tests

```bash
# Install Playwright browsers if not already done
npx playwright install --with-deps

# Run video capture demo tests
npx playwright test tests/e2e/feature-demo-capture.test.ts

# View captured results
open test-results
```

---

## Feature Captures

### 1. Card Registration & Initialization

**What it demonstrates:**
- All three Linked Lovelace card types registering correctly
- Window.customCards registry population
- Card type detection and validation

**Test file:** `features/card-registration/`  
**Screenshots captured:**
- `01-initial-load.png` - Dashboard loading state
- `02-card-registration.png` - Custom cards registry

**Expected output:**
```
Card Registration: All 3 Linked Lovelace card types successfully registered
type: custom:linked-lovelace-template
name: Linked Lovelace Template Card  
type: custom:linked-lovelace-status
name: Linked Lovelace Status Card
type: custom:linked-lovelace-partials
name: Linked Lovelace Partials Card
```

---

### 2. Template Engine Functionality

**What it demonstrates:**
- ETA template engine availability
- Template processing capabilities
- Template variable resolution

**Test file:** `features/template-engine/`  
**Screenshots captured:**
- `01-page-state.png` - Page before template operations  
- `02-template-availability.png` - Template system status

**Expected output:**
```javascript
// Console check:
typeof Eta !== 'undefined' // true

type: custom:linked-lovelace-template
name: Linked Lovelace Template Card
description: Help select an existing template for a card
```

---

### 3. Status Card Display Features

**What it demonstrates:**
- Status card component registration
- UI visibility check  
- Template status dashboard
- Partial registration view

**Test file:** `features/status-card/`  
**Screenshots captured:**
- `01-initial-state.png` - Status card not present
- `02-status-card-availability.png` - Status card ready

**Console output:**
```
Status Card: Linked Lovelace Status Card component successfully registered
type: custom:linked-lovelace-status
name: Linked Lovelace Status Card
description: An overview card for Linked Lovelace
```

---

### 4. Partial Registration System

**What it demonstrates:**
- Partials card type registration
- ETA partial inclusion system
- Partial key handling

**Test file:** `features/partials/`  
**Screenshots captured:**
- `01-initial-state.png` - Partials not yet loaded
- `02-partials-card-available.png` - Partials system active

**Console output:**
```
Partials System: Linked Lovelace Partials Card component registered
type: custom:linked-lovelace-partials
name: Linked Lovelace Partials Card
```

---

### 5. Dashboard Configuration Loading

**What it demonstrates:**
- Dashboard YAML/JSON configuration loading
- Views and sections parsing
- Card configuration extraction

**Test file:** `features/dashboard-config/`  
**Screenshots captured:**  
- `01-config-loading.png` - Configuration parsing
- `02-dashboard-config-loaded.png` - Config loaded

**Console output:**
```
Dashboard Config: Lovelace configuration loaded successfully
title: Test Dashboard
views: [{"cards": [...], "title": "Main View"}]
```

---

### 6. Template Rendering

**What it demonstrates:**
- Card template resolution from registries
- Dynamic template application
- ll_template attribute processing

**Test file:** `features/card-rendering/`  
**Screenshots captured:**
- `01-page-loaded.png` - Initial page state
- `02-cards-rendered.png` - Templates applied

**Console output:**
```
Card Rendering: Dashboard displaying X Lovelace cards
Template cards resolved: X
```

---

### 7. Error Handling

**What it demonstrates:**
- Console error monitoring
- Page error interception
- Graceful degradation

**Test file:** `features/error-handling/`  
**Screenshots captured:**
- `01-page-stable.png` - Page error monitoring

**Console output:**
```
Error Handling: Page loaded without critical errors
criticalErrors: 0
consoleErrors: <2 (expected)
```

---

### 8. Multi-Load Stability

**What it demonstrates:**
- Page reload behavior
- Memory leak detection
- State persistence across loads

**Test file:** `features/multi-load/`  
**Screenshots captured:**
- `01-first-load.png` - Initial load state
- `02-second-load.png` - After reload
- `03-third-load.png` - After second reload

**Console output:**
```
Multi-Load Stability: Page stable after multiple loads and reloads
Custom card registration stable across reloads
type: custom:linked-lovelace-template - persistent
```

---

### 9. Custom Card Type Detection

**What it demonstrates:**
- All custom card type detection
- Type registration verification
- Card type metadata

**Test file:** `features/card-types/`  
**Screenshots captured:**
- `01-custom-card-detection.png` - Card types detected
- `02-all-types-detected.png` - Full type list

**Console output:**
```
Custom Card Types:
- custom:linked-lovelace-template
- custom:linked-lovelace-status
- custom:linked-lovelace-partials

All 3 card types detected and registered
```

---

### 10. WebSocket API Connectivity

**What it demonstrates:**
- Home Assistant WebSocket connection
- API call availability
- Communication capabilities

**Test file:** `features/websocket/`  
**Screenshots captured:**
- `01-page-load.png` - Initial connection
- `02-api-available.png` - API callable

**Console output:**
```
WebSocket API: Home Assistant WebSocket API connection available
callWS: function
connected: true
```

---

### 11. Card Editor Integration

**What it demonstrates:**
- Card editor component registration
- Configuration editor availability
- Editor dialogs

**Test file:** `features/card-editors/`  
**Screenshots captured:**
- `01-page-loaded.png` - Page loaded
- `02-editors-registered.png` - Editors available

**Console output:**
```
Card Editors: 2 editor components registered
- linked-lovelace-template-editor
- linked-lovelace-status-editor
```

---

### 12. Template Priority Handling

**What it demonstrates:**
- Template priority sorting
- Priority-based resolution
- Conflict resolution

**Test file:** `features/template-priority/`  
**Screenshots captured:**
- `01-template-system-loaded.png` - Temperature system ready
- `02-priority-system-available.png` - Priority system active

**Console output:**
```
Template Priority: Template priority sorting system available
Priority values: 1-100
templates: Record<string, DashboardCard>
```

---

### 13. Full Dashboard Interaction Flow

**What it demonstrates:**
- Complete user journey
- All features working together
- Real-world usage scenarios

**Test file:** `features/full-flow/`  
**Screenshots captured:**
- `01-initial-state.png` - Fresh dashboard
- `02-interactions-complete.png` - All features active

**Console output:**
```
Full Interaction Flow: All Linked Lovelace features loaded and functional
Detected Card Types: 
- custom:linked-lovelace-template
- custom:linked-lovelace-status  
- custom:linked-lovelace-partials
```

---

## Running Captures Locally

### Manual Video Recording

```bash
# 1. Install Playwright browsers
npx playwright install chromium --with-deps

# 2. Run demo tests with video enabled
npx playwright test tests/e2e/feature-demo-capture.test.ts --project=chromium

# 3. Open captured videos
open test-results/feature-demo-capture/
open test-outputs/
```

### Individual Feature Screenshots

```bash
# Run specific test and capture
npx playwright test tests/e2e/feature-demo-capture.test.ts -g "Card Registration"
npx playwright test tests/e2e/feature-demo-capture.test.ts -g "Template Engine"
npx playwright test tests/e2e/feature-demo-capture.test.ts -g "Status Card"

# Repeat for all feature demos
```

### CI/CD Capture

For automated capture in CI:

```yaml
# .github/workflows/demo-capture.yml
name: Video Capture Demo

on:
  workflow_dispatch:
  schedule:
    - cron: '0 0 * * 0'

jobs:
  capture:
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
      
      - name: Run feature capture
        run: npx playwright test tests/e2e/feature-demo-capture.test.ts 
          --output-dir=video-captures
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: feature-demos
          path: video-captures/
```

---

## Generated Content

### Screenshots Directory
```
test-results/
├── feature-demo-capture/
│   ├── Card Registration & Initialization/
│   │   ├── 01-initial-load.png
│   │   └── 02-card-registration.png
│   ├── Template Engine Functionality/
│   │   ├── 01-page-state.png
│   │   └── 02-template-availability.png
│   ├── Status Card Display Features/
│   │   ├── 01-initial-state.png
│   │   └── 02-status-card-availability.png
│   ├── Partial Registration System/
│   │   ├── 01-initial-state.png
│   │   └── 02-partials-card-available.png
│   ├── Dashboard Configuration Loading/
│   │   ├── 01-config-loading.png
│   │   └── 02-dashboard-config-loaded.png
│   ├── Template Rendering/
│   │   ├── 01-page-loaded.png
│   │   └── 02-cards-rendered.png
│   ├── Error Handling/
│   │   └── 01-page-stable.png
│   ├── Multi-Load Stability/
│   │   ├── 01-first-load.png
│   │   ├── 02-second-load.png
│   │   └── 03-third-load.png
│   - Custom Card Type Detection/
│   │   ├── 01-custom-card-detection.png
│   │   └── 02-all-types-detected.png
│   ├── WebSocket API Connectivity/
│   │   ├── 01-page-load.png
│   │   └── 02-api-available.png
│   ├── Card Editor Integration/
│   │   ├── 01-page-loaded.png
│   │   └── 02-editors-registered.png
│   ├── Template Priority Handling/
│   │   ├── 01-template-system-loaded.png
│   │   └── 02-priority-system-available.png
│   └── Full Dashboard Interaction Flow/
│       ├── 01-initial-state.png
│       └── 02-interactions-complete.png
```

### Video Files
```npx playwright output
video-chromium/  (webm files for each test)
video-firefox/
video-webkit/
```

---

## Usage in Documentation

### Adding Screenshots to Docs

```markdown
# Feature Showcase

## Card Registration

![Card Registration](./images/card-registration.png)

The status card provides a comprehensive overview of all discovered components.

## Template Engine

![Template Engine](./images/template-engine.png)

ETA template engine with full priority-based sorting.
```

### Embedding Videos

```html
<!-- In VitePress documentation -->
<video controls width="100%">
  <source src="/videos/card-registration-demo.webm" type="video/webm">
  Your browser does not support the video tag.
</video>
```

---

## Best Practices

1. **Consistent Naming** - Use descriptive, feature-based file naming
2. **High Quality** - Use fullPage screenshots for complete context
3. **Captions** - Add context in test console output
4. **Timing** - Allow sufficient wait times for stable captures
5. **Clarity** - Each test demonstrates one specific feature

---

## Troubleshooting

### Container Not Starting
```bash
docker-compose logs homeassistant
# Check for configuration errors
docker-compose up -d --force-recreate
```

### Playwright Not Capturing
```bash
# Ensure browser is installed
npx playwright install chromium

# Check playwright status
npx playwright test --list
```

### Screenshots Not Generated
```bash
# Force screenshot capture
npx playwright test --screenshot=on
cat test-results/*/Screenshot-*.png
```

---

## Expected Test Output

```bash
Running 13 tests with 3 workers

[1/13] tests/e2e/feature-demo-capture.test.ts:14:3 › Card Registration & Initialization ✓
[2/13] tests/e2e/feature-demo-capture.test.ts:47:3 › Template Engine Functionality ✓
[3/13] tests/e2e/feature-demo-capture.test.ts:70:3 › Status Card Display Features ✓
[4/13] tests/e2e/feature-demo-capture.test.ts:92:3 › Partial Registration System ✓
[5/13] tests/e2e/feature-demo-capture.test.ts:113:3 › Dashboard Configuration Loading ✓
[6/13] tests/e2e/feature-demo-capture.test.ts:142:3 › Template Rendering ✓
[7/13] tests/e2e/feature-demo-capture.test.ts:171:3 › Error Handling ✓
[8/13] tests/e2e/feature-demo-capture.test.ts:196:3 › Multi-Load Stability ✓
[9/13] tests/e2e/feature-demo-capture.test.ts:227:3 › Custom Card Type Detection ✓
[10/13] tests/e2e/feature-demo-capture.test.ts:262:3 › WebSocket API Connectivity ✓
[11/13] tests/e2e/feature-demo-capture.test.ts:287:3 › Card Editor Integration ✓
[12/13] tests/e2e/feature-demo-capture.test.ts:307:3 › Template Priority Handling ✓
[13/13] tests/e2e/feature-demo-capture.test.ts:330:3 › Full Dashboard Interaction Flow ✓

  13 passed (100%)
  Screenshots: 26 captured
  Videos: 13 webm files captured
```

---

## Documentation Integration

To add these captures to your docs site:

1. **Copy screenshots** to `docs_site/images/` or `docs_site/videos/`
2. **Update documentation** to reference the captured content
3. **Verify paths** are correct for VitePress media references
4. **Test locally** with `npm run docs:dev`

---

**Last Updated**: 2026-02-28  
**Test Files**: 13 feature demonstration tests  
**Framework**: Playwright with Docker integration  
**Target**: Full plugin feature showcase with video/screenshots
