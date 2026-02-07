# Workflow Analysis - Linked Lovelace UI

## Current Workflows

### 1. Template Registration Workflow

**Steps:**
1. User adds `ll_key` to any top-level card in a dashboard view
2. On dashboard load, LinkedLovelaceController scans all cards
3. Cards with `ll_key` are identified as templates
4. Templates are sorted by `ll_priority` (lower number = higher priority)
5. Templates are processed in priority order
6. Each template is rendered and stored in TemplateController registry

**Entry Points:**
- `linked-lovelace-ui.ts` - UI component
- `linked-lovelace-partials.ts` - Partial templates

**Critical Functions:**
- `sortTemplatesByPriority()` - Sorts templates by priority
- `registerTemplates()` - Registers templates in registry
- `renderAndAddTemplate()` - Renders and stores template

**Success Criteria:**
- All templates registered in correct order
- Templates can reference earlier templates (via priority)
- Template data is properly stored

**Known Issues:**
- None in registration phase

---

### 2. Template Rendering Workflow

**Steps:**
1. Card with `ll_template` is encountered
2. TemplateController retrieves template from registry
3. Template is merged with `ll_context` data
4. Eta engine renders the template with context
5. Nested templates are processed recursively
6. Final rendered card is returned

**Entry Points:**
- `renderCard()` - Render a single card
- `renderAndAddTemplate()` - Render and store template

**Critical Functions:**
- `updateCardTemplate()` - Main template update logic
- `TemplateEngine.instance.eta.renderString()` - Eta rendering
- Recursive template processing

**Success Criteria:**
- Template variables are replaced with context values
- Nested templates work correctly
- JSON structure is preserved
- Context merging works as expected

**Known Issues:**
- Context variable substitution appears to fail in some cases
- `ll_keys` feature is partially broken
- Sample dashboard shows "undefined" in rendered output

**Example Failure:**
```yaml
# Template
type: markdown
content: <%= context.content %> <%= context.suffix %>
title: <%=context.title %>

# Context
title: This is a unique title
content: This is some dang ole unique content
# Note: suffix is not provided

# Expected
content: This is some dang ole unique content
title: This is a unique title

# Actual (from sample-dashboard-rendered.yml)
content: This is some dang ole unique content undefined
title: This is a unique title
```

---

### 3. Partial Template Workflow

**Steps:**
1. User adds `custom:linked-lovelace-partials` card
2. Partials are loaded from card configuration
3. Partials with `url` are fetched via HTTP GET
4. Partials are sorted by `priority`
5. Partials are loaded into Eta engine
6. Templates can reference partials via `@partialName`

**Entry Points:**
- `linked-lovelace-partials.ts` - Partial templates card
- `registerPartials()` - Register partials

**Critical Functions:**
- `getPartialsFromCard()` - Extract partials from card
- `addPartialsFromCard()` - Add partials to controller
- `loadPartials()` - Load partials into Eta engine

**Success Criteria:**
- Partials load correctly
- URL fetching works
- Partials are available in templates
- Priority ordering works

**Known Issues:**
- URL fetching may fail silently
- No error handling for malformed partials

---

### 4. Dashboard Update Workflow

**Steps:**
1. `getUpdatedDashboardConfig()` is called with URL path
2. Original dashboard config is fetched
3. All views are processed
4. Cards in each view are rendered
5. Sections (new dashboard format) are supported
6. Updated config is returned

**Entry Points:**
- `getUpdatedDashboardConfig()` - Update single dashboard
- `getUpdatedDashboardConfigs()` - Update all dashboards

**Critical Functions:**
- `updateCardTemplate()` - Recursive card update
- View iteration
- Section support

**Success Criteria:**
- All cards are rendered
- Nested cards work
- Sections are supported
- Performance is acceptable

**Known Issues:**
- May be slow for large dashboards
- No caching mechanism

---

### 5. Nested Template Workflow

**Steps:**
1. Template A (priority 0) references template B (priority 1)
2. Template B is rendered first (lower priority)
3. Template A is rendered second
4. Template A can include Template B's rendered output

**Entry Points:**
- Priority-based sorting
- Recursive `updateCardTemplate()`

**Critical Functions:**
- `sortTemplatesByPriority()` - Sort by priority
- `ll_keys` feature - For array-based nested templates

**Success Criteria:**
- Templates can reference each other
- Priority ordering prevents circular dependencies
- Array-based nested templates work

**Known Issues:**
- `ll_keys` feature is partially broken (2 test failures)
- Circular dependency detection is missing
- No error messages for missing dependencies

---

## Bug Analysis

### Bug #1: Context Variable Substitution Failure

**Location:** `src/helpers/templates.ts` - `updateCardTemplate()`

**Issue:**
When `ll_context` variables are not provided, they render as "undefined" instead of being handled gracefully.

**Root Cause:**
The Eta template engine renders the template with all context variables. If a variable is not provided in `ll_context`, it renders as the string "undefined" in the output.

**Example:**
```yaml
# Template
content: <%= context.content %> <%= context.suffix %>

# Context (suffix missing)
content: This is content

# Result
content: This is content undefined
```

**Impact:**
- Renders "undefined" in UI
- User confusion
- Breaks cards that rely on optional context variables

**Proposed Fix:**
1. Add default values in templates: `<%= context.suffix || '' %>`
2. Or pre-process context to provide empty string defaults
3. Or configure Eta to handle undefined values gracefully

---

### Bug #2: ll_keys Feature Partially Broken

**Location:** `src/helpers/templates.ts` - Lines 52-84

**Issue:**
The `ll_keys` feature for array-based nested templates has 2 failing tests.

**Root Cause:**
Complex logic for handling nested arrays with templates. The code tries to:
1. Process arrays of objects with `ll_context`
2. Recursively update nested templates
3. Merge context data
4. Handle edge cases

**Affected Code:**
```typescript
Object.keys(originalCardData.ll_keys || {}).forEach((cardKey) => {
  const originalDataFromTemplate = Object.assign({}, dataFromTemplate)
  if (typeof originalDataFromTemplate[cardKey] === 'object') {
    if (Array.isArray(originalDataFromTemplate[cardKey]) && typeof originalDataFromTemplate[cardKey][0] === 'object') {
      // Complex array handling
    } else {
      // Object handling
    }
  }
})
```

**Impact:**
- Nested arrays with templates may not work
- Regression from V1 to V2
- 2 failing tests

**Proposed Fix:**
1. Simplify the `ll_keys` feature or remove it
2. Add proper error handling
3. Add comprehensive tests for edge cases

---

### Bug #3: No Circular Dependency Detection

**Location:** `src/v2/linkedLovelace.ts` - `sortTemplatesByPriority()`

**Issue:**
Templates can reference each other in a circular manner, causing infinite loops or stack overflow.

**Root Cause:**
Priority-based sorting doesn't detect circular dependencies.

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

**Proposed Fix:**
1. Add dependency graph analysis
2. Detect cycles before rendering
3. Provide clear error messages

---

### Bug #4: URL Fetching Fails Silently

**Location:** `src/helpers/eta.ts` - `addPartialsFromCard()`

**Issue:**
When fetching partials from URL, failures are logged but don't prevent rendering.

**Root Cause:**
`try-catch` in `loadPartials()` only logs errors, doesn't throw.

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

**Proposed Fix:**
1. Add user-facing error messages
2. Allow partials to fail gracefully with warning
3. Add retry logic for network failures

---

### Bug #5: No Caching Mechanism

**Location:** Global - `LinkedLovelaceController`

**Issue:**
Templates and dashboards are re-rendered on every load, causing performance issues.

**Root Cause:**
No caching of rendered templates or dashboard configs.

**Impact:**
- Slow dashboard loads
- Unnecessary re-rendering
- Poor user experience for large dashboards

**Proposed Fix:**
1. Cache rendered templates
2. Cache dashboard configs
3. Invalidate cache on template changes
4. Consider using Home Assistant's built-in caching

---

## Regression History

### Regressions from V1 to V2

1. **ll_keys Feature**
   - V1: Fully functional
   - V2: Partially broken (2 test failures)
   - Impact: Nested array templates may not work
   - Status: Known issue, considered for removal

2. **Configuration Format**
   - V1: Separate template dashboards
   - V2: Any card can be template
   - Impact: Breaking change, requires migration
   - Status: Intentional, documented in README

3. **Template Data Variable**
   - V1: `template_data` or `ll_data`
   - V2: `ll_context` only
   - Impact: Breaking change
   - Status: Intentional, documented in README

4. **Variable Syntax**
   - V1: `$variable$`
   - V2: `<%= context.variable %>`
   - Impact: Breaking change
   - Status: Intentional, documented in README

---

## Test Coverage Analysis

### Existing Tests

1. **eta.test.ts** - Eta rendering tests
2. **template.test.ts** - Template management tests
3. **templates.test.ts** - Helper function tests
4. **linkedLovelace.test.ts** - Singleton tests
5. **template-engine.test.ts** - Rendering engine tests

### Test Gaps

1. **Integration Tests**
   - End-to-end dashboard rendering
   - Complex nested templates
   - Error scenarios

2. **Regression Tests**
   - V1 to V2 migration
   - ll_keys feature
   - Edge cases

3. **Performance Tests**
   - Large dashboard rendering
   - Many templates
   - Caching effectiveness

4. **Error Handling Tests**
   - Circular dependencies
   - Missing templates
   - Invalid context
   - URL fetch failures

---

## Recommendations

### Short Term (Critical)

1. Fix context variable "undefined" rendering
2. Add circular dependency detection
3. Improve error messages for users

### Medium Term (Important)

1. Fix or remove ll_keys feature
2. Add integration tests
3. Implement caching mechanism

### Long Term (Nice to Have)

1. Switch to Jinja templating (as requested)
2. Add template preview in editor
3. Performance optimization
4. Better migration documentation

---

## Optimal System Design

### Core Principles

1. **Simplicity** - Minimal configuration, automatic processing
2. **Reliability** - Comprehensive tests, error handling
3. **Performance** - Caching, efficient rendering
4. **User Experience** - Clear errors, helpful messages

### Architecture Recommendations

1. **Keep V2 Architecture**
   - Singleton pattern works well
   - Priority-based ordering is smart
   - Component-based design is maintainable

2. **Fix Known Issues**
   - Context variable handling
   - ll_keys or remove it
   - Error handling

3. **Add Missing Features**
   - Caching
   - Circular dependency detection
   - Better error messages

4. **Test Coverage**
   - Add integration tests
   - Add regression tests
   - Improve existing tests

### Feature Decisions

**Keep:**
- Priority-based template ordering
- Automatic template processing
- Partial templates with URL support
- Singleton pattern

**Remove:**
- ll_keys feature (partially broken, adds complexity)
- V1 support (if migration complete)
- Template editor (if not widely used)

**Add:**
- Caching mechanism
- Circular dependency detection
- Better error messages
- Jinja templating support
