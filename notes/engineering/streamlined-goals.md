# Streamlined Linked Lovelace - Goals & Plan

## Core Objective

Create a streamlined, simple version of Linked Lovelace that:
1. Uses Eta JS templating (keeping current implementation)
2. Fixes all known bugs
3. Removes complexity and unused features
4. Has comprehensive test coverage
5. Passes all existing workflows

## Key Principles

- **Simplicity over features** - Remove what doesn't work
- **Mechanical output** - Pure, validated code
- **No imaginary problems** - Fix real issues only

## What to Keep

✅ **Essential Features:**
- Template cards with `ll_key`
- Template reference cards with `ll_template`
- Context variable injection (`ll_context`)
- Priority-based template ordering
- Partial templates (local and URL-based)
- Singleton pattern for template registry
- Automatic template processing
- Comprehensive test suite

✅ **Architecture:**
- V2 component-based design
- TemplateController for template management
- EtaTemplateController for Eta engine
- LinkedLovelaceController as orchestrator
- Separate helper modules

## What to Remove

❌ **Broken/Unused Features:**
- `ll_keys` feature (partially broken, 2 test failures, adds complexity)
- Template editor if not widely used (check usage)

❌ **V1 Support:**
- Remove any V1 backward compatibility code
- Clean up migration code if present

## Bugs to Fix

### Critical (High Priority)

1. **Context Variable "undefined" Rendering**
   - When template variables are missing, they render as "undefined"
   - Fix: Pre-process context to provide empty string defaults
   - File: `src/helpers/templates.ts`

2. **Circular Dependency Detection**
   - No detection of circular template references
   - Fix: Implement dependency graph analysis with DFS
   - File: `src/v2/linkedLovelace.ts`

3. **Better Error Messages**
   - Generic error messages are not helpful
   - Fix: Add specific, actionable error messages
   - All files

### Medium Priority

4. **URL Fetching Error Handling**
   - Partial URL fetches fail silently
   - Fix: Add user-facing error messages
   - File: `src/helpers/eta.ts`

5. **Add Caching Mechanism**
   - Templates re-rendered on every load
   - Fix: Implement template caching
   - File: `src/controllers/template.ts`

## Test Coverage Goals

### Existing Tests
- ✅ `src/controllers/eta.test.ts` - Eta rendering tests
- ✅ `src/controllers/template.test.ts` - Template management tests
- ✅ `src/helpers/templates.test.ts` - Helper function tests
- ✅ `src/v2/linkedLovelace.test.ts` - Singleton tests
- ✅ `src/v2/template-engine.test.ts` - Rendering engine tests

### Tests to Add

1. **Integration Tests**
   - End-to-end dashboard rendering
   - Complex nested templates
   - Multiple dashboards
   - Error scenarios

2. **Bug Regression Tests**
   - Context variable with missing values
   - Circular dependencies
   - URL fetch failures
   - Edge cases from previous bugs

3. **Workflow Tests**
   - Basic template creation and usage
   - Partial template usage
   - Priority-based ordering
   - Nested templates

## Implementation Plan

### Phase 1: Critical Bug Fixes (Priority 1)

**Week 1:**
1. Fix context variable "undefined" rendering
2. Add circular dependency detection
3. Improve error messages
4. Fix URL fetch error handling

**Success Criteria:**
- All critical bugs resolved
- All existing tests passing
- Clear error messages for all scenarios
- No silent failures

### Phase 2: Feature Cleanup (Priority 2)

**Week 2:**
1. Remove `ll_keys` feature
2. Add caching mechanism
3. Code cleanup and refactoring
4. Update documentation

**Success Criteria:**
- Broken features removed
- Code complexity reduced
- Performance improved
- Documentation updated

### Phase 3: Testing & Validation (Priority 3)

**Week 3:**
1. Add integration tests
2. Add regression tests
3. Add workflow tests
4. Test against sample dashboards

**Success Criteria:**
- Test coverage > 80%
- All tests passing
- All workflows working
- No regressions

### Phase 4: Polish & Release (Priority 4)

**Week 4:**
1. Performance optimization
2. Code review and cleanup
3. Final testing
4. Prepare for release

**Success Criteria:**
- Performance benchmarks met
- Code quality high
- All tests passing
- Ready for release

## What NOT to Do

❌ **Don't switch to Jinja templating**
   - Keep Eta JS
   - Focus on making Eta work well
   - Document Eta usage clearly

❌ **Don't add new features**
   - Focus on fixing existing bugs
   - Remove broken features
   - Simplify, not expand

❌ **Don't over-engineer**
   - Simple solutions preferred
   - Clear, readable code
   - Practical solutions

## Success Metrics

- ✅ All existing tests passing
- ✅ All critical bugs fixed
- ✅ All broken features removed
- ✅ Test coverage > 80%
- ✅ All workflows working
- ✅ No regressions
- ✅ Code simplified and clean
- ✅ Documentation updated

## Next Steps

1. Run existing test suite to see current state
2. Fix critical bugs one by one
3. Add tests as bugs are fixed
4. Remove broken features
5. Add integration tests
6. Validate all workflows
7. Prepare for release

## Files to Modify

**Core:**
- `src/helpers/templates.ts` - Fix context rendering
- `src/v2/linkedLovelace.ts` - Add circular dependency detection
- `src/helpers/eta.ts` - Fix URL fetch errors
- `src/controllers/template.ts` - Add caching

**Tests:**
- `src/v2/linkedLovelace.test.ts` - Expand tests
- `src/helpers/templates.test.ts` - Add more tests
- New: `tests/integration/` - Integration tests
- New: `tests/workflow/` - Workflow tests

**Documentation:**
- `README.md` - Update with streamlined features
- `docs/` - Update guides and examples
- `CONTRIBUTING.md` - Add testing guidelines

## Questions for Dare

1. Should template editor be kept or removed? (Need to check usage)
2. Should we keep V1 backward compatibility or remove it?
3. Any specific workflows that must be preserved?
4. Any performance benchmarks to meet?
