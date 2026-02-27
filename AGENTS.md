# Agents.md - AI Coding Agent Guidelines

## Project Overview
A Home Assistant Lovelace UI library for template creation and re-use. TypeScript + Lit framework.

## Project Type
- **Primary language**: TypeScript (strict mode)
- **Framework**: Lit v2+ (web components)
- **Build tool**: Rollup 3.x for ES modules
- **Testing**: Jest 29.x with ts-jest
- **Linter**: ESLint with @typescript-eslint/recommended
- **Export format**: ES6 modules ("type": "module")

## Commands

### Tests
- **Run all tests**: `npm test` (or `npx jest`)
- **Run tests in watch mode**: `jest --watch`
- **Run single test file**: `npm test src/v2/linkedLovelace.test.ts`
- **Run specific test**: `npm test -- --testNamePattern="name"`

### Build/Lint/Dev
- **Development**: `npm start` (Rollup watch)
- **Production build**: `npm run build` (Rollup)
- **Clean build**: `npm run clean` (removes dist and parcel cache)
- **Parcel dev**: `npm run ostart`
- **Parcel build**: `npm run obuild`
- **Auto versioning**: Pre-build hooks run `npm run make-version`

No lint script found - add `npx eslint src/**/*.ts` if needed.

## Code Style Guidelines

### Imports
- Use ES6 `import`/`export` syntax (ESM modules)
- Group relative imports with `./` prefix, external with package name
- Order: relative imports first, then package imports
- Example:
  ```typescript
  import { ClassName } from 'external-package';
  import { helper } from '../helpers';
  import './relative-type';
  ```

### TypeScript & Types
- **Strict mode enabled**: `noImplicitAny: false` allows `any`, but prefer explicit types
- **Type annotations**: Use for function params/return types where clear
- **Interface naming**: PascalCase (e.g., `DashboardCard`, `LinkedLovelaceConfig`)
- **Type aliases**: Use for union/intersection types
- **Export types**: Prefix with `interface` or export type aliases
- **Generic patterns**:
  ```typescript
  templates: Record<string, DashboardCard> = {};
  ll_context?: Record<string, any>;
  config?: CustomCardConfig[];
  ```

### Naming Conventions
- **Classes**: PascalCase (e.g., `LinkedLovelaceController`, `TemplateController`)
- **Functions**: camelCase (e.g., `sortTemplatesByPriority`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `LIB_VERSION`, `LINKED_LOVELACE_PARTIALS`)
- **Files**: Match class names (PascalCase.ts) or lowercase with hyphens

### Functions & Methods
- **Return types**: Include explicit return types (e.g., `: void`, `: string`)
- **Async functions**: Use `async`/`await` for promises, never `.then()` chains
- **Default values**: Optional params with `=` for defaults
- **Side effects**: Document or use `void` return for void methods

### Classes & Methods
- **Classes**: Start with descriptive noun (e.g., `LinkedLovelaceController`, `TemplateController`)
- **Constructor**: Use explicit constructor or rely on Lit's `@customElement()`
- **Properties**: Initialize inline with `=`, use `public/private/protected` modifiers
- **Methods**: Use arrow functions `=` for class methods to preserve `this` context

### Error Handling
- **Logging**: Use project's `log()` helper (colored console output) and `toConsole()` for error/warn
- **Logging format**: `%c` styles applied for branding
- **Console methods**: `/* eslint no-console: 0 */` comment required before `console.*` calls
- **Error propagation**: Reject promises with specific error types, throw exceptions for sync code
- **Type safety**: Use explicit `Record<string, any>` for flexible data structures

### Testing Patterns (Jest)
- **Test file naming**: `<filename>.test.ts`
- **Describe blocks**: Use `describe('[type] Name', () => {...})` format
  ```typescript
  describe('[class] LinkedLovelaceController', () => {});
  ```
- **Test naming**: test('description', () => {...}) or test('sets up X correctly when Y', () => {})
- **Assertions**: Use `.toBeDefined`, `.toHaveLength(n)`, `.toBe()`, `.toEqual()`
- **Mocking**: Mock imports for external dependencies (e.g., API calls)
- **Setup**: Use `jestSetup.ts` for global test configuration

### Code Organization
- **Controllers**: Group related functionality in `src/controllers/`
- **Helpers**: Utility functions in `src/helpers/`
- **Types**: Shared interfaces in `src/types.ts`
- **Main entry**: `src/index.ts` or `src/linked-lovelace-ui.ts`
- **Tests**: Co-located with source or `__tests__` folder

### Error Handling Patterns
```typescript
// Error logging
toConsole('error', 'Failed to fetch dashboard', error);

// Type-safe error handling
const processTemplate = (data: TemplateData): Promise<void> => {
  try {
    return api.fetchTemplate(data);
  } catch (error) {
    toConsole('error', 'Template processing failed', error);
    throw error;
  }
};

// Strict mode enforcement
noFallthroughCasesInSwitch: true
noImplicitReturns: true
noUnusedParameters: true
```

### CSS & Styling
- **Lit CSS**: Use `css` tagged template literals
- **Shadow DOM**: Styles encapsulated via WebComponents
- **Custom properties**: Define with `--` prefix for theming

### Files to Reference
- `src/types.ts` - All interface/type definitions
- `src/helpers/log.ts` - Logging patterns
- `src/controllers/` - Controller patterns
- `src/helpers/` - Helper function patterns

## Special Considerations

### Home Assistant Integration
- **Card configs**: All configs extend `LovelaceCardConfig` or `LovelaceCardEditor`
- **Custom elements**: Use `declare global` to extend `HTMLElementTagNameMap`
- **API communication**: Follow Home Assistant websocket protocol
- **Lovelace API**: Integrate with `custom-card-helpers` types

### Performance
- **Template rendering**: Use priority sorting for template execution
- **Memory management**: Clean up unused templates and partials
- **Bundle size**: Tree-shake unused imports, use lazy loading for templates

### Documentation
- **Inline docs**: Add JSDoc comments for public APIs
- **TODOs**: Use `// TODO` format for future improvements
- **Comments**: Explain complex logic, not basic code behavior
- **External docs**: Reference `docs_site/` for user-facing documentation

## Quick Reference
| Pattern | Example |
|--------|---------|
| Class | `class TemplateController` |
| Function | `const renderCard()` |
| Property | `templates: Record<string, Card> = {}` |
| Async | `async function fetchConfig()` |
| Import | `import { Type } from 'pkg'` |
| Test | `test('description', () => { ... })` |
| Log | `console.info(\`%c...\`, styles)` |

---
Created for: linked-lovelace-ui
Last updated: 2026-02-26
