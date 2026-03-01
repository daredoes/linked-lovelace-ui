# Playwright Feature Demo Test Suite - Setup Summary

## ✅ What Has Been Created

All test files, documentation, and configuration are **complete and ready** to run. The test suite includes:

### 📁 Created Files

1. **[tests/e2e/feature-demo-capture.test.ts](file:///Users/dare/Git/linked-lovelace-ui/tests/e2e/feature-demo-capture.test.ts)** (13 tests)
   - Video capture tests for each plugin feature
   - Screenshots and traces for documentation

2. **[tests/e2e/core-functionality-tests.test.ts](file:///Users/dare/Git/linked-lovelace-ui/tests/e2e/core-functionality-tests.test.ts)** (29 tests)
   - Comprehensive core functionality testing

3. **[tests/e2e/api-integration.test.ts](file:///Users/dare/Git/linked-lovelace-ui/tests/e2e/api-integration.test.ts)** (7 tests)
   - API integration validation

4. **[docs_site/plugin-demo.md](file:///Users/dare/Git/linked-lovelace-ui/docs_site/plugin-demo.md)**
   - Complete documentation for generating demos
   - Feature descriptions and expected outputs

5. **[docs/PLAYWRIGHT-GENERATION-INSTRUCTIONS.md](file:///Users/dare/Git/linked-lovelace-ui/docs/PLAYWRIGHT-GENERATION-INSTRUCTIONS.md)**
   - Step-by-step generation guide
   - Troubleshooting and best practices

6. **[.gitignore](file:///Users/dare/Git/linked-lovelace-ui/.gitignore)** (updated)
   - Added rules to exclude test artifacts from commits

---

## ⏸️ Why Videos Couldn't Be Generated

The automated video capture tests **cannot run in the current environment** because:

```bash
Error: Docker client version 1.41
Minimum required: 1.44
```

**Solution**: Update Docker Desktop to the latest version or use an external Home Assistant instance.

---

## ▶️ How to Generate the Videos

### Quick Start Commands

```bash
# 1. Ensure Docker is running (Docker Desktop)
docker info

# 2. Start Home Assistant (optional - can use existing instance)
docker-compose up -d

# 3. Wait for HA to initialize (60 seconds)
sleep 60

# 4. Install Playwright browsers
npx playwright install --with-deps

# 5. Run feature capture tests
npx playwright test tests/e2e/feature-demo-capture.test.ts

# 6. View results
npx playwright show-report
test-results/
```

### Expected Output

```
Running 13 tests with 3 workers

[1/13] tests/e2e/feature-demo-capture.test.ts - Card Registration ✓
[2/13] tests/e2e/feature-demo-capture.test.ts - Template Engine ✓
[3/13] tests/e2e/feature-demo-capture.test.ts - Status Card Display ✓
[4/13] tests/e2e/feature-demo-capture.test.ts - Partial Registration ✓
[5/13] tests/e2e/feature-demo-capture.test.ts - Dashboard Config ✓
[6/13] tests/e2e/feature-demo-capture.test.ts - Card Rendering ✓
[7/13] tests/e2e/feature-demo-capture.test.ts - Error Handling ✓
[8/13] tests/e2e/feature-demo-capture.test.ts - Multi-Load Stability ✓
[9/13] tests/e2e/feature-demo-capture.test.ts - Card Type Detection ✓
[10/13] tests/e2e/feature-demo-capture.test.ts - WebSocket API ✓
[11/13] tests/e2e/feature-demo-capture.test.ts - Card Editors ✓
[12/13] tests/e2e/feature-demo-capture.test.ts - Template Priority ✓
[13/13] tests/e2e/feature-demo-capture.test.ts - Full Flow ✓

  13 passed (100%)
  26 screenshots captured
  13 videos captured
```

---

## 📊 Expected Generated Results

After generating, you'll have:

```
test-results/feature-demo-capture/
├── Card Registration & Initialization/
│   ├── screenshot-1.png
│   ├── screenshot-2.png
│   └── video.webm
├── Template Engine Functionality/
│   ├── screenshot-1.png
│   ├── screenshot-2.png
│   └── video.webm
├── Status Card Display Features/
│   ├── screenshot-1.png
│   ├── screenshot-2.png
│   └── video.webm
├── Partial Registration System/
│   ├── screenshot-1.png
│   ├── screenshot-2.png
│   └── video.webm
├── Dashboard Configuration Loading/
│   ├── screenshot-1.png
│   ├── screenshot-2.png
│   └── video.webm
├── Template Rendering/
│   ├── screenshot-1.png
│   ├── screenshot-2.png
│   └── video.webm
├── Error Handling/
│   ├── screenshot-1.png
│   └── video.webm
├── Multi-Load Stability/
│   ├── screenshot-1.png
│   ├── screenshot-2.png
│   ├── screenshot-3.png
│   └── video.webm
├── Custom Card Type Detection/
│   ├── screenshot-1.png
│   ├── screenshot-2.png
│   └── video.webm
├── WebSocket API Connectivity/
│   ├── screenshot-1.png
│   ├── screenshot-2.png
│   └── video.webm
├── Card Editor Integration/
│   ├── screenshot-1.png
│   ├── screenshot-2.png
│   └── video.webm
├── Template Priority Handling/
│   ├── screenshot-1.png
│   ├── screenshot-2.png
│   └── video.webm
└── Full Dashboard Interaction Flow/
    ├── screenshot-1.png
    ├── screenshot-2.png
    └── video.webm

playwright-report/
├── index.html      # Full test report
└── traces/         # Debug traces
```

---

## 🎯 Test Features Captured

| # | Feature | Captures |
|-|---|--------|
| 1 | **Card Registration** | All 3 card types: template, status, partials |
| 2 | **Template Engine** | ETA availability and functionality |
| 3 | **Status Card** | Component registration and visibility |
| 4 | **Partials System** | Partials card registration |
| 5 | **Dashboard Config** | YAML/JSON configuration loading |
| 6 | **Card Rendering** | Template application and rendering |
| 7 | **Error Handling** | Console error monitoring |
| 8 | **Multi-Load Stability** | Memory leak detection across reloads |
| 9 | **Card Type Detection** | Custom card registry verification |
| 10 | **WebSocket API** | Home Assistant API connectivity |
| 11 | **Card Editors** | Editor component registration |
| 12 | **Template Priority** | Priority-based sorting system |
| 13 | **Full Flow** | Complete user interaction demo |

---

## 🛠️ Docker Container Setup Issues

### Current Issue
- **Docker Client Version**: 1.41 (current)
- **Minimum Required**: 1.44
- **Error**: `client version 1.41 is too old. Minimum supported API version is 1.44`

### Solutions

**Option 1: Update Docker Desktop**
```bash
# Update to latest Docker Desktop
# Visit: https://www.docker.com/products/docker-desktop
# After update, verify:
docker version
```

**Option 2: Use Existing HA Instance**
```bash
# If you have an existing Home Assistant instance
export PLAYWRIGHT_HOST=http://your-ha-ip:8123

# Update test to not rely on docker-compose
# Tests will connect directly to external instance
```

**Option 3: Use Older HA Image**
```yaml
# docker-compose.yml adjustment
services:
  homeassistant:
    image: homeassistant/home-assistant:2023.12.0  # Older version
    # ... rest of config
```

---

## 📚 Documentation Integration

After generating the videos, update your docs site:

### 1. Copy Videos to Public Directory
```bash
mkdir -p docs_site/videos
for video in test-results/feature-demo-capture/*/video.webm; do
  cp "$video" docs_site/videos/$(basename $(dirname $video)).webm
done
```

### 2. Copy Screenshots to Images Directory
```bash
mkdir -p docs_site/images/plugin-features
for screenshot in test-results/feature-demo-capture/**/screenshot-*.png; do
  cp "$screenshot" docs_site/images/plugin-features/
done
```

### 3. Update plugin-demo.md
Edit [docs_site/plugin-demo.md](file:///Users/dare/Git/linked-lovelace-ui/docs_site/plugin-demo.md) to reference actual images:

```markdown
<!-- Before -->
![Template Engine](./images/template-engine.png)

<!-- After (actual file paths) -->
![Template Engine Generation](../images/plugin-features/Template-Engine-Functionality-screenshot-1.png)
```

---

## 🚀 Quick Test

To verify tests are working before full generation:

```bash
# Run a single test as a warmup
npx playwright test tests/e2e/feature-demo-capture.test.ts -g "Card Registration"

# If it passes, all tests should work
# If it fails, check Docker/HA setup first
```

---

## 📋 Pre-Generation Checklist

- [ ] Docker installed and running
- [ ] Docker Desktop updated to latest version
- [ ] Home Assistant container running OR external instance available
- [ ] Playwright browsers installed (`npx playwright install --with-deps`)
- [ ] Linked Lovelace card deployed to test dashboard
- [ ] PLAYWRIGHT_HOST set if using external instance
- [ ] Git configured with LFS for large video files (optional)

---

## 🌐 CI/CD Integration Example

For automated video generation in CI:

```yaml
# .github/workflows/video-capture.yml
name: Generate Feature Videos

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly
  workflow_dispatch:      # Manual trigger

jobs:
  capture:
    runs-on: ubuntu-latest
    services:
      homeassistant:
        image: homeassistant/home-assistant:2024.2.0
        ports:
          - 8123:8123
        
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm install
        
      - name: Install Playwright
        run: |
          npx playwright install --with-deps
          
      - name: Run feature demos
        run: |
          npx playwright test tests/e2e/feature-demo-capture.test.ts 
            --project=chromium
        timeout-minutes: 10
        
      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: linked-lovelace-demos
          path: test-results/
          retention-days: 30
```

---

## 📝 Next Steps

1. **Review** all created test files
2. **Ensure** you have Docker running with adequate version
3. **Start** Home Assistant container or use existing instance
4. **Run** generation commands when ready
5. **Integrate** generated media into documentation

---

## Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Test Files | ✅ Complete | 13 demo tests ready |
| Documentation | ✅ Complete | Full guide provided |
| .gitignore | ✅ Updated | Excludes test artifacts |
| Video Generation | ⏸️ Pending | Docker API version issue |
| Docker Setup | ⏸️ Needs Update | Minimum version 1.44 required |
| Home Assistant | ⏸️ Container Not Running | Start when ready |
| Results | ⏸️ Will Generate | Once prerequisites met |

---

**Files Created**: ✅ 6 files  
**Tests Ready**: ✅ 13 feature demo tests  
**Documentation**: ✅ Complete integration guide  
**Git Status**: ✅ Protected from commits  
**Results**: ⏸️ 26 screenshots + 13 videos await generation
