# Issues and Enhancements - Linked Lovelace UI

## Critical Issues

### Issue #1: Context Variable Renders as "undefined"

**Severity:** High
**Status:** Confirmed
**Location:** `src/helpers/templates.ts`

**Description:**
When a template references a context variable that is not provided, it renders as the string "undefined" instead of being handled gracefully.

**Example:**
```yaml
# Template
type: markdown
content: <%= context.content %> <%= context.suffix %>
title: <%=context.title %>

# Usage with missing 'suffix'
type: custom:linked-lovelace-template
ll_template: text
ll_context:
  title: My Title
  content: My Content
  # suffix is missing

# Result
content: My Content undefined
title: My Title
```

**Impact:**
- Renders "undefined" in UI
- User confusion
- Breaks cards that rely on optional context variables

**Root Cause:**
The Eta template engine renders the template with all context variables. If a variable is `undefined` in the context object, it renders as the string "undefined" in the output.

**Proposed Solutions:**

1. **Add default values in templates** (User responsibility)
   ```yaml
   content: <%= context.content %> <%= context.suffix || '' %>
   ```

2. **Pre-process context to provide empty string defaults** (Plugin responsibility)
   ```typescript
   const processedContext = {};
   Object.keys(context).forEach(key => {
     processedContext[key] = context[key] === undefined ? '' : context[key];
   });
   ```

3. **Configure Eta to handle undefined values gracefully** (Engine configuration)
   ```typescript
   this.eta = new Eta({
     varName: 'context',
     autoEscape: false,
     rmWhitespace: true,
     // Add undefined handling
     // This may require a custom Eta configuration or plugin
   });
   ```

**Recommended Solution:**
Option 2 - Pre-process context to provide empty string defaults. This provides the best user experience without requiring template authors to add default values everywhere.

**Priority:** Critical - This affects every user with optional context variables

---

### Issue #2: ll_keys Feature Partially Broken

**Severity:** Medium
**Status:** Confirmed
**Location:** `src/helpers/templates.ts` lines 52-84

**Description:**
The `ll_keys` feature for array-based nested templates has 2 failing tests. This feature allows templates to reference other templates in arrays.

**Example:**
```yaml
# Template with nested array
ll_template: parentCard
ll_context:
  cards:
    - ll_template: childCard
      ll_keys:
        card: content
ll_keys:
  cards: cards
```

**Impact:**
- Nested arrays with templates may not work
- Regression from V1 to V2
- 2 failing tests in the test suite

**Root Cause:**
Complex logic for handling nested arrays with templates. The code attempts to:
1. Process arrays of objects with `ll_context`
2. Recursively update nested templates
3. Merge context data
4. Handle edge cases

The logic is fragile and doesn't handle all edge cases correctly.

**Affected Code:**
```typescript
Object.keys(originalCardData.ll_keys || {}).forEach((cardKey) => {
  const originalDataFromTemplate = Object.assign({}, dataFromTemplate)
  if (typeof originalDataFromTemplate[cardKey] === 'object') {
    if (Array.isArray(originalDataFromTemplate[cardKey]) && typeof originalDataFromTemplate[cardKey][0] === 'object') {
      // Complex array handling
      updatedData[cardKey] = [];
      for (let i = 0; i < originalDataFromTemplate[cardKey]['length']; i++) {
        const newLLData = { ...originalDataFromTemplate[cardKey][i].ll_context, ...originalDataFromTemplate };
        delete newLLData[cardKey]
        const oldData = {...{ ...originalDataFromTemplate[cardKey][i] }};
        const result = updateCardTemplate(oldData, templateData, newLLData);
        updatedData[cardKey].push(result)
      }
    } else {
      // Object handling
      try {
        const newLLData = { ...originalDataFromTemplate };
        delete newLLData[cardKey]
        const oldData = { ...originalDataFromTemplate[cardKey]};
        updatedData[cardKey] = updateCardTemplate(oldData, templateData, newLLData)
      } catch (e) {
        console.log(`Couldn't Update card key '${cardKey}. Provide the following object when submitting an issue to the developer.`, data, e)
      }
    }
  }
})
```

**Proposed Solutions:**

1. **Fix the ll_keys feature**
   - Refactor the complex logic
   - Add comprehensive tests
   - Add error handling
   - Document the feature better

2. **Remove the ll_keys feature**
   - Document removal in migration guide
   - Provide alternative approaches
   - Remove from codebase
   - Remove failing tests

**Recommended Solution:**
Option 2 - Remove the ll_keys feature. Reasons:
- Feature is partially broken and complex to fix
- Adds significant complexity to the codebase
- Likely not widely used (based on lack of issues about it)
- Alternative: Users can use ll_priority and ll_template directly

**Priority:** Medium - Feature is broken but may not be widely used

---

### Issue #3: No Circular Dependency Detection

**Severity:** Medium
**Status:** Not yet implemented
**Location:** `src/v2/linkedLovelace.ts` - `sortTemplatesByPriority()`

**Description:**
Templates can reference each other in a circular manner, causing infinite loops or stack overflow errors.

**Example:**
```yaml
# Template A (priority 0)
type: custom:linked-lovelace-template
ll_template: A
ll_context:
  ref: <%= templateB %>

# Template B (priority 1)
type: custom:linked-lovelace-template
ll_template: B
ll_context:
  ref: <%= templateA %>
```

**Impact:**
- Potential infinite loops
- Stack overflow errors
- Dashboard fails to load
- Poor user experience

**Root Cause:**
Priority-based sorting doesn't detect circular dependencies. The system assumes that if templates are sorted by priority, there are no circular references.

**Proposed Solution:**

1. **Add dependency graph analysis**
   ```typescript
   interface DependencyGraph {
     [key: string]: string[]
   }

   function detectCircularDependencies(
     templates: Record<string, DashboardCard>
   ): string[] | null {
     const graph: DependencyGraph = {};
     const visiting = new Set<string>();
     const visited = new Set<string>();

     // Build graph
     Object.keys(templates).forEach(key => {
       graph[key] = getTemplateDependencies(templates[key]);
     });

     // Detect cycles using DFS
     function dfs(node: string): boolean {
       if (visiting.has(node)) return true; // Cycle detected
       if (visited.has(node)) return false;

       visiting.add(node);

       for (const dependency of graph[node] || []) {
         if (dfs(dependency)) {
           console.error(`Circular dependency detected: ${node} -> ${dependency}`);
           return true;
         }
       }

       visiting.delete(node);
       visited.add(node);
       return false;
     }

     // Check all nodes
     for (const node of Object.keys(graph)) {
       if (dfs(node)) {
         return Object.keys(visiting);
       }
     }

     return null;
   }
   ```

2. **Add validation before rendering**
   ```typescript
   registerTemplates(templates: Record<string, DashboardCard>): void {
     const cycle = detectCircularDependencies(templates);
     if (cycle) {
       throw new Error(
         `Circular dependency detected in templates: ${cycle.join(' -> ')}`
       );
     }

     sortTemplatesByPriority(templates).forEach((key) => {
       const template = templates[key];
       this.templateController.renderAndAddTemplate(key, template);
     });
   }
   ```

**Recommended Solution:**
Implement dependency graph analysis with DFS to detect cycles. Provide clear error messages to users.

**Priority:** Medium - Can cause dashboard failures but is likely rare in practice

---

### Issue #4: URL Fetching Fails Silently

**Severity:** Medium
**Status:** Confirmed
**Location:** `src/helpers/eta.ts` - `loadPartials()`

**Description:**
When fetching partials from URL, failures are logged but don't prevent rendering or provide user feedback.

**Example:**
```yaml
# URL returns 404 or times out
type: custom:linked-lovelace-partials
partials:
  - key: myPartial
    url: https://example.com/nonexistent
```

**Impact:**
- Partial is missing
- Templates referencing it fail
- No user-visible error message
- Difficult to debug

**Root Cause:**
`try-catch` in `loadPartials()` only logs errors to console, doesn't throw or show to user.

**Current Code:**
```typescript
loadPartials = () => {
  const loaded: string[] = [];
  sortPartialsByPriority(this.partials).forEach((key) => {
    const partial = this.partials[key]
    if (partial.template) {
      try {
        this.engine.eta.loadTemplate(key, partial.template)
      } catch (e) {
        console.error(e)
        // Error is logged but not reported to user
      }
      loaded.push(key)
    }
  })
  return loaded;
}
```

**Proposed Solution:**

1. **Add user-facing error messages**
   ```typescript
   loadPartials = () => {
     const loaded: string[] = [];
     const errors: string[] = [];

     sortPartialsByPriority(this.partials).forEach((key) => {
       const partial = this.partials[key];
       if (partial.template) {
         try {
           this.engine.eta.loadTemplate(key, partial.template);
           loaded.push(key);
         } catch (e) {
           const errorMsg = `Failed to load partial '${key}': ${e}`;
           console.error(errorMsg);
           errors.push(errorMsg);
         }
       }
     });

     if (errors.length > 0) {
       // Show errors to user via UI notification or card
       this.showErrorsToUser(errors);
     }

     return loaded;
   }
   ```

2. **Allow partials to fail gracefully with warning**
   - Continue rendering even if some partials fail
   - Show which partials failed
   - Allow dashboard to load

3. **Add retry logic for network failures**
   - Retry failed URL fetches
   - Exponential backoff
   - Max retry limit

**Recommended Solution:**
Implement option 1 (user-facing error messages) combined with option 2 (graceful failure). This provides clear feedback while allowing the dashboard to load.

**Priority:** Medium - Affects user experience but doesn't prevent functionality

---

### Issue #5: No Caching Mechanism

**Severity:** Low
**Status:** Not yet implemented
**Location:** Global - `LinkedLovelaceController`

**Description:**
Templates and dashboards are re-rendered on every load, causing performance issues for large dashboards or many templates.

**Impact:**
- Slow dashboard loads
- Unnecessary re-rendering
- Poor user experience for large dashboards
- Higher CPU usage

**Root Cause:**
No caching of rendered templates or dashboard configs. Every dashboard load triggers full re-rendering.

**Proposed Solution:**

1. **Cache rendered templates**
   ```typescript
   class TemplateController {
     templates: Record<string, DashboardCard> = {};
     renderedTemplates: Record<string, DashboardCard> = {};

     renderAndAddTemplate(key: string, template: DashboardCard): boolean {
       const cacheKey = this.getCacheKey(template);
       if (this.renderedTemplates[cacheKey]) {
         return this.addTemplate(key, this.renderedTemplates[cacheKey], true);
       }

       const data = {...template};
       delete data.ll_key;
       delete data.ll_priority;

       const renderedTemplate = updateCardTemplate(data, this.templates);
       this.renderedTemplates[cacheKey] = renderedTemplate;
       return this.addTemplate(key, renderedTemplate, true);
     }

     getCacheKey(template: DashboardCard): string {
       return JSON.stringify(template);
     }
   }
   ```

2. **Cache dashboard configs**
   ```typescript
   class LinkedLovelaceController {
     dashboardCache: Record<string, DashboardConfig> = {};

     getUpdatedDashboardConfig = async (urlPath: string | null): Promise<DashboardConfig> => {
       const cacheKey = urlPath || 'null';
       if (this.dashboardCache[cacheKey]) {
         return this.dashboardCache[cacheKey];
       }

       const config = await GlobalLinkedLovelace.instance.api.getDashboardConfig(urlPath);
       // ... process config ...

       this.dashboardCache[cacheKey] = config;
       return config;
     };
   }
   ```

3. **Invalidate cache on template changes**
   ```typescript
     invalidateCache(templateKey: string): void {
       delete this.renderedTemplates[templateKey];
       Object.keys(this.dashboardCache).forEach(key => {
         delete this.dashboardCache[key];
       });
     }
   ```

**Recommended Solution:**
Implement template caching with cache invalidation. Dashboard caching can be added later if needed.

**Priority:** Low - Performance optimization, not a functional issue

---

## Enhancements

### Enhancement #1: Switch to Jinja Templating

**Status:** Requested by user
**Priority:** High

**Description:**
Replace Eta JS with Jinja templating, which is built into Home Assistant.

**Benefits:**
- Native Home Assistant integration
- Familiar syntax for HA users
- Better documentation
- Community support
- Potentially better performance

**Challenges:**
- Jinja is server-side, this is client-side
- Need to either:
  1. Use a JS-based Jinja implementation (e.g., nunjucks)
  2. Render templates server-side via Home Assistant API
  3. Keep Eta as a fallback

**Proposed Approach:**
1. Research JS-based Jinja alternatives (nunjucks, twig.js, etc.)
2. Implement template engine abstraction layer
3. Support both Eta and Jinja with config option
4. Migrate documentation
5. Deprecate Eta in future version

**Migration Path:**
```yaml
# Eta (current)
content: <%= context.content %>

# Jinja (new)
content: {{ content }}
```

---

### Enhancement #2: Template Preview in Editor

**Status:** Not implemented
**Priority:** Medium

**Description:**
Add live preview of template rendering in the card editor.

**Benefits:**
- Better developer experience
- Catch errors early
- Visual feedback
- Faster iteration

**Implementation:**
- Add preview panel to editor
- Render template with sample context
- Show both template and rendered output
- Update in real-time

---

### Enhancement #3: Better Error Messages

**Status:** Not implemented
**Priority:** High

**Description:**
Improve error messages to be more helpful and actionable.

**Current Issues:**
- Generic error messages
- No context about what failed
- No suggestions for fixes

**Proposed Error Messages:**

1. **Template not found**
   ```
   Template 'myTemplate' not found. Available templates: templateA, templateB.
   ```

2. **Missing context variable**
   ```
   Template references 'context.missingVariable' but it's not provided.
   Add it to ll_context or use a default value: <%= context.missingVariable || 'default' %>
   ```

3. **Circular dependency**
   ```
   Circular dependency detected: templateA -> templateB -> templateA.
   Use ll_priority to break the cycle or remove the circular reference.
   ```

4. **Partial load failure**
   ```
   Failed to load partial 'myPartial' from URL: 404 Not Found.
   Check the URL and try again.
   ```

---

### Enhancement #4: Comprehensive Test Suite

**Status:** Partially implemented
**Priority:** High

**Description:**
Expand test coverage to include integration tests, regression tests, and edge cases.

**Missing Tests:**
1. Integration tests
   - End-to-end dashboard rendering
   - Complex nested templates
   - Multiple dashboards
   - Error scenarios

2. Regression tests
   - V1 to V2 migration scenarios
   - ll_keys feature (before removal)
   - Edge cases from previous bugs

3. Error handling tests
   - Circular dependencies
   - Missing templates
   - Invalid context
   - URL fetch failures

4. Performance tests
   - Large dashboard rendering
   - Many templates
   - Caching effectiveness

---

### Enhancement #5: Better Migration Documentation

**Status:** Partially documented
**Priority:** Medium

**Description:**
Improve documentation for migrating from V1 to V2, including common issues and solutions.

**Current Documentation:**
- README has basic migration guide
- Some examples
- No troubleshooting guide

**Proposed Documentation:**
1. **Migration Guide**
   - Step-by-step migration process
   - Common issues and solutions
   - Before/after examples
   - Troubleshooting checklist

2. **Feature Comparison**
   - V1 vs V2 features
   - Removed features
   - New features
   - Breaking changes

3. **Examples**
   - Real-world migration examples
   - Complex template scenarios
   - Best practices

---

## Prioritization Matrix

| Issue/Enhancement | Impact | Effort | Priority |
|------------------|--------|--------|----------|
| Context "undefined" rendering | High | Low | Critical |
| Switch to Jinja templating | High | High | High |
| Better error messages | High | Medium | High |
| Circular dependency detection | Medium | Medium | Medium |
| URL fetching error handling | Medium | Low | Medium |
| Remove ll_keys feature | Medium | Low | Medium |
| Template preview in editor | Medium | Medium | Medium |
| Comprehensive test suite | High | High | High |
| Better migration docs | Medium | Medium | Medium |
| Caching mechanism | Low | Medium | Low |

---

## Implementation Plan

### Phase 1: Critical Fixes (Week 1)
1. Fix context variable "undefined" rendering
2. Add circular dependency detection
3. Improve error messages
4. Add URL fetch error handling

### Phase 2: Testing & Documentation (Week 2)
1. Add comprehensive test suite
2. Improve migration documentation
3. Add integration tests
4. Add regression tests

### Phase 3: Cleanup (Week 3)
1. Remove ll_keys feature
2. Add caching mechanism
3. Code cleanup and refactoring
4. Performance optimization

### Phase 4: Jinja Migration (Week 4+)
1. Research Jinja JS implementations
2. Implement template engine abstraction
3. Add Jinja support
4. Migrate documentation
5. Deprecate Eta

---

## Success Criteria

### Phase 1 Success
- All critical issues resolved
- All tests passing
- Clear error messages for all error scenarios
- No silent failures

### Phase 2 Success
- Test coverage > 80%
- Complete migration documentation
- All integration tests passing
- No regressions from V1

### Phase 3 Success
- Code complexity reduced
- Performance improved
- All tests still passing
- Documentation updated

### Phase 4 Success
- Jinja templating works
- Eta deprecated but still supported
- Documentation migrated
- User community informed
