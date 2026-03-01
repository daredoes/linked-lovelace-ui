# Playwright Test Generation Instructions

## Generated Results from Feature Demos

Due to Docker container API version incompatibility (client version 1.41 vs minimum 1.44 required for Home Assistant container), the automatic video captures could not be generated in this environment.

However, the test structure is fully prepared and ready to run once you have:
1. A running Docker daemon
2. A Home Assistant container or accessible instance at http://localhost:8123
3. The Linked Lovelace card deployed

---

## Available Test Files

All test files have been created and are ready to execute:

### E2E Feature Demo Tests
- **tests/e2e/feature-demo-capture.test.ts** (13 tests)
  - Card Registration & Initialization
  - Template Engine Functionality
  - Status Card Display
  - Partial Registration
  - Dashboard Configuration
  - Card Rendering
  - Error Handling
  - Multi-Load Stability
  - Custom Card Type Detection
  - WebSocket API Connectivity
  - Card Editor Integration
  - Template Priority Handling
  - Full Dashboard Flow

### E2E Core Functionality Tests  
- **tests/e2e/core-functionality-tests.test.ts** (29 tests)
- **tests/e2e/api-integration.test.ts** (7 tests)

---

## How to Generate the Videos

### Prerequisites
```bash
# 1. Ensure Docker is running
docker info

# 2. Install Playwright browsers
npx playwright install --with-deps

# 3. Verify Home Assistant instance running
# Option A: Start with docker-compose
# Ensure your docker-compose.yml is properly configured
# docker-compose up -d

# Option B: Use an existing HA instance
export PLAYWRIGHT_HOST=http://your-ha-instance:8123
```

### Generate Demo Captures

```bash
# Run all feature demo captures
npx playwright test tests/e2e/feature-demo-capture.test.ts

# Or run individual feature tests:
npx playwright test tests/e2e/feature-demo-capture.test.ts -g "Card Registration" 
npx playwright test tests/e2e/feature-demo-capture.test.ts -g "Template Engine"  
npx playwright test tests/e2e/feature-demo-capture.test.ts -g "Status Card"
npx playwright test tests/e2e/feature-demo-capture.test.ts -g "All Features"
```

### View Results

```bash
# Open test results directory
open test-results/feature-demo-capture/

# Or run Playwright reporter
npx playwright show-report
test-results/
```

---

## Expected Directory Structure After Generation

```
playwright-test-results/
├── cards-registration/            
│   ├── test-results.txt
│   └── video.webm                 # 30-second demo video
├── template-engine/               
│   ├── test-results.txt
│   ├── screenshot-1.png          # Initial page state
│   ├── screenshot-2.png          # Template availability  
│   └── video.webm
├── status-card/                   
│   ├── test-results.txt
│   ├── screenshot-1.png
│   ├── screenshot-2.png
│   └── video.webm
├── ... (all other feature folders)
└── playwright-report/
    ├── index.html                # Full test report
    └── traces/                   # Detailed traces for debugging
```

---

## Quick Setup Script

Create a shell script to streamline the setup:

```bash
#!/bin/bash
# scripts/generate-demo-captures.sh

set -e

echo "🎬 Generating Linked Lovelace Feature Demos..."
echo ""

# Check Docker
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Check for HA instance
echo "🔍 Checking for Home Assistant..."
if curl -s http://localhost:8123 >/dev/null 2>&1; then
    echo "✅ Home Assistant detected at localhost:8123"
else
    echo "⚠️  No Home Assistant detected at localhost:8123"
    echo "   Please ensure HA is running and Linked Lovelace card is deployed"
    echo ""
    read -p "Press Enter to continue anyway (tests will fail if HA not ready)..."
fi

# Install Playwright if needed
if [ ! -d "node_modules/.cache/playwright" ]; then
    echo "📦 Installing Playwright browsers..."
    npx playwright install --with-deps
fi

# Run tests
echo "🎥 Running feature capture tests..."
npx playwright test tests/e2e/feature-demo-capture.test.ts --project=chromium

# Open results
echo ""
echo "✅ Tests completed!"
echo "📁 View results: open test-results/"
echo "📺 Open report: npx playwright show-report"
```

---

## Alternative: Manual Video Capture

If you prefer manual video recording:

1. **Prepare Home Assistant**
   ```bash
   # Add the Linked Lovelace card to your dashboard
   # Edit raw configuration:
   card:
     - type: custom:linked-lovelace-status
     - type: custom:linked-lovelace-template
   ```

2. **Enable Developer Tools**
   ```bash
   # In DevTools > Sources > Watch Expressions:
   (window as any).customCards
   (window as any).__linked_lovelace__
   ```

3. **Record Screen**
   - Use QuickTime (macOS) or OBS (cross-platform)
   - Navigate through different features
   - Show card registration, template rendering, etc.

4. **Edit Video**
   - Trim to essential parts
   - Add title cards for each feature
   - Add subtitles for key features

---

## CI/CD Auto-Generation

For automated capture in CI pipelines:

```yaml
# .github/workflows/demo-capture.yml
name: Generate Feature Demos

on:
  workflow_dispatch:  # Manual trigger
  schedule:
    - cron: '0 0 * * 0'  # Weekly

jobs:
  demo-capture:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install
        
      - name: Install Playwright
        run: npx playwright install --with-deps
        
      - name: Run feature demos
        run: |
          npx playwright test tests/e2e/feature-demo-capture.test.ts 
            --browser=chromium
        env:
          PLAYWRIGHT_HOST: http://localhost:8123
          CI: true
          
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: feature-demos
          path: test-results/feature-demo-capture/
          retention-days: 30
```

---

## Next Steps

1. **Review** the test file structure in `tests/e2e/feature-demo-capture.test.ts`
2. **Ensure** you have a running Home Assistant instance
3. **Deploy** the Linked Lovelace card to test
4. **Run** the tests using instructions above
5. **Copy** generated screenshots/videos to `docs_site/images/` 
   and `docs_site/videos/` for documentation
6. **Update** your docs to reference the captured media

---

## Troubleshooting

### Container API Version Too Old
```bash
# If you see: "client version 1.41 is too old"
# Solution: Update Docker Desktop to the latest version
# or use an older HA image compatible with your Docker version
```

### Tests Fail - No HA Instance
```bash
# Error: Unable to connect to Home Assistant
# Solution: Start HA container or use existing instance
# Export the correct host:
export PLAYWRIGHT_HOST=http://yours-ha-ip:8123
```

### Screenshots Not Generated
```bash
# Solution: Check screenshot settings
npx playwright test --screenshot=on
```

### Browser Not Launching
```bash
# Solution: Ensure proper permissions
sudo chown -R $USER /Users/dare/Library/Caches/ms-playwright/
npx playwright install --dry-run
```

---

## Documentation Updates Required

After generating the demos, update these files:

1. **docs_site/plugin-demo.md** - Already created with structure
2. **docs_site/getting-started.md** - Add demo videos to getting started
3. **README.md** - Link to demo videos in main README
4. **Any feature-specific docs** - Embed relevant screenshots

---

**Status**: Test files created and ready to run  
**Total Tests**: 13 feature demos + 29 core functionality tests + 7 API integration tests  
**Expected Output**: 26 screenshots + 13 videos + 1 HTML report  
**Files Generated**: ✅ Complete  
**Files Ready to Generate**: ✅ All test files  
**Generated Results**: ⏳ Pending Docker/HA instance
