# Streamlined Implementation Plan

## Status: Phase 1 - Planning

**Current State:**
- ✅ Complete repository analysis done (158 commits reviewed)
- ✅ Branch `streamlined-logic-and-ui` created
- ⚠️ Tests blocked by sandbox cache permission issues
- ✅ Comprehensive analysis notes saved in `/notes/engineering/`

## Implementation Roadmap

### Phase 1: Critical Bug Fixes (Priority: HIGH)

These issues directly affect user experience and should be fixed first.

#### 1.1 Fix Context Variable "undefined" Rendering
**Issue:** When template variables are missing, they render as "undefined"
**Example:** `<%= context.suffix %>` → "undefined" (if not provided)

**Solution:**
```typescript
// Pre-process context to provide empty string defaults
function safeContext(context: Record<string, any>): Record<string, any> {
  return new Proxy(context, {
    get: (target, prop) => {
      if (prop in target) return target[prop];
      return ''; // Return empty string instead of undefined
    }
  });
}
```

**Files to modify:**
- `src/v2/template-engine.ts` (rendering logic)
- `src/controllers/template.ts` (context preparation)

#### 1.2 Add Circular Dependency Detection
**Issue:** No detection of circular template references

**Solution:**
```typescript
function detectCircularDependencies(
  key: string,
  visited: Set<string> = new Set(),
  visiting: Set<string> = new Set()
): boolean {
  if (visiting.has(key)) return true; // Circular dependency found
  if (visited.has(key)) return false;

  visiting.add(key);
  const template = templateRegistry.get(key);
  if (template?.ll_template) {
    const dependencies = extractTemplateKeys(template.ll_template);
    for (const dep of dependencies) {
      if (detectCircularDependencies(dep, visited, visiting)) return true;
    }
  }
  visiting.delete(key);
  visited.add(key);
  return false;
}
```

**Files to modify:**
- `src/controllers/template.ts` (template registration)
- `src/helpers/templates.ts` (dependency extraction)

#### 1.3 Improve Error Messages for URL Fetching
**Issue:** Partial URL fetches fail silently with no user feedback

**Solution:**
```typescript
async function fetchTemplate(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    const message = `Failed to fetch template from ${url}: ${error.message}`;
    console.error(message);
    throw new Error(message); // Propagate with clear error
  }
}
```

**Files to modify:**
- `src/v2/linked-lovelace-partials.ts` (URL fetching)
- `src/v2/linkedLovelace.ts` (error display in UI)

### Phase 2: Remove Complex/Broken Features (Priority: MEDIUM)

#### 2.1 Remove ll_keys Feature
**Issue:** Partially broken (2 test failures), adds significant complexity
**Decision:** Remove entirely as recommended in analysis

**Action:**
1. Remove all `ll_keys` related code
2. Remove tests for ll_keys
3. Update documentation to remove ll_keys references
4. Deprecate v1 support if migration is complete

**Files to modify:**
- `src/v2/linkedLovelace.ts` (ll_keys handling)
- `src/v2/template-engine.ts` (ll_keys template keys)
- Test files (remove ll_keys tests)
- `README.md` (remove ll_keys section)

### Phase 3: Architecture Improvements (Priority: MEDIUM)

#### 3.1 Add Template Caching
**Issue:** Templates re-rendered on every load, performance issues

**Solution:**
```typescript
class TemplateCache {
  private cache: Map<string, { rendered: string; timestamp: number }> = new Map();
  private TTL = 60000; // 1 minute cache

  get(key: string, contextHash: string): string | null {
    const entry = this.cache.get(`${key}:${contextHash}`);
    if (entry && Date.now() - entry.timestamp < this.TTL) {
      return entry.rendered;
    }
    return null;
  }

  set(key: string, contextHash: string, rendered: string): void {
    this.cache.set(`${key}:${contextHash}`, {
      rendered,
      timestamp: Date.now()
    });
  }

  clear(): void {
    this.cache.clear();
  }
}
```

**Files to create:**
- `src/helpers/template-cache.ts`

**Files to modify:**
- `src/v2/template-engine.ts` (integrate caching)
- `src/controllers/template.ts` (cache management)

#### 3.2 Refactor Component Structure
Based on analysis, improve separation of concerns:

**Current structure:**
```
src/
├── controllers/
│   ├── eta.ts
│   ├── hass.ts
│   └── template.ts
├── helpers/
│   ├── templates.ts
│   └── ...
└── v2/
    ├── linkedLovelace.ts
    ├── linked-lovelace-partials.ts
    ├── linked-lovelace-template.ts
    └── template-engine.ts
```

**Improved structure:**
```
src/
├── core/
│   ├── template-registry.ts (singleton pattern)
│   ├── template-renderer.ts (rendering logic)
│   └── template-cache.ts (caching)
├── controllers/
│   ├── template-controller.ts (template management)
│   └── hass-controller.ts (Home Assistant integration)
├── ui/
│   ├── linked-lovelace-ui.ts (reference card)
│   └── linked-lovelace-partials.ts (partial manager)
└── utils/
    ├── dependency-graph.ts (circular dependency detection)
    └── error-handling.ts (error messages)
```

### Phase 4: Add Testing Infrastructure (Priority: HIGH)

Since tests are blocked, we need to ensure comprehensive coverage once we can run them.

#### 4.1 Unit Tests for New Features
- Test safe context proxy
- Test circular dependency detection
- Test URL error handling
- Test template caching

#### 4.2 Integration Tests
- Test full template rendering flow
- Test nested template scenarios
- Test partial loading from URLs
- Test error scenarios

#### 4.3 E2E Tests (if possible)
- Test with sample dashboard
- Test with Home Assistant instance

### Phase 5: Documentation Updates (Priority: MEDIUM)

#### 5.1 Update README
- Remove ll_keys references
- Add circular dependency error documentation
- Update template syntax examples
- Add caching documentation

#### 5.2 Update Documentation Site
- Reflect all changes
- Add troubleshooting guide
- Add migration guide from v1/v2

### Phase 6: Jinja Migration (Future)

**Note:** Per USER.md, keep Eta initially, then switch to Jinja once stable.

**Preparation:**
1. Ensure Eta version is fully stable
2. Study Home Assistant's Jinja implementation
3. Design migration path
4. Implement Jinja renderer
5. Add option to choose renderer
6. Update tests for both renderers
7. Update documentation

## Implementation Order

1. **Week 1:** Critical fixes (1.1, 1.2, 1.3)
2. **Week 2:** Remove ll_keys, add caching
3. **Week 3:** Refactor architecture, add tests
4. **Week 4:** Documentation, review, polish

## Testing Strategy

Since tests are blocked in sandbox:

1. **Manual Testing:**
   - Use sample dashboard
   - Test each feature manually
   - Document test results

2. **Code Review:**
   - Each change reviewed against original issues
   - Ensure no regressions introduced

3. **Future Test Run:**
   - When sandbox permissions resolved
   - Run full test suite
   - Fix any failing tests

## Commit Strategy

Per rules/commits.md:
- Commit message format: "When merged this commit will..."
- Each commit represents a single logical change
- Tests must pass before commit (when possible)

## Next Steps

1. Start with Phase 1.1 (Fix undefined rendering)
2. Create each fix as separate commit
3. Document each change in notes
4. Request review from Dare before continuing

## Notes for Dare

- Tests are blocked by sandbox cache permission issues
- Need to either:
  a) Fix sandbox permissions, or
  b) Run tests in unrestricted environment
- All changes should be done on `streamlined-logic-and-ui` branch
- Once implementation is complete and tested, request review and merge

## Files to Track

Modified files will be tracked in `/notes/engineering/implementation-progress.json`
