# Test Plan for Linked Lovelace

This plan outlines the set of tests required to ensure the plugin is functioning correctly after any changes or refactors.

## Core Functionality Tests

### 1. Simple Template Substitution
- **Scenario**: A card uses `ll_template` with simple context variables.
- **Card**: `tests/test-cards/basic-template.yml`
- **Expected Result**: The rendered card should have variables replaced correctly by the Eta engine.

### 2. Context Passing
- **Scenario**: Passing a nested `ll_context` object to a template.
- **Card**: `tests/test-cards/basic-template.yml` (using `ll_context`)
- **Expected Result**: Variables within `ll_context` are available in the template scope.

### 3. Nested Templates
- **Scenario**: A template that references another template.
- **Card**: `tests/test-cards/nested-template.yml`
- **Expected Result**: Both the parent and the child templates should be rendered correctly.

### 4. LL_Keys Data Mapping
- **Scenario**: Using `ll_keys` to map context variables to top-level card properties.
- **Card**: `tests/test-cards/ll-keys.yml`
- **Expected Result**: The `name` and `icon` properties of the button card should be overwritten with values from `ll_context` based on the mapping in `ll_keys`.

### 5. Eta Partials
- **Scenario**: A template that uses the `<%~ include("partial_name", context) %>` syntax.
- **Card**: `tests/test-cards/eta-partial.yml`
- **Expected Result**: The partial should be correctly resolved and included in the rendered output.

## Regression Tests

### 1. Max Stack Call / Infinite Recursion
- **Scenario**: A template that references itself.
- **Expected Result**: The system should NOT crash. It should either stop rendering at a certain depth or render a warning.

### 2. Invalid Variable Characters
- **Scenario**: Variables with special characters (other than alphanumeric and underscore).
- **Expected Result**: The system should handle these gracefully and not crash.

## UI Tests

### 1. Card Picker
- **Scenario**: Adding a `Linked Lovelace` card via the Home Assistant UI card picker.
- **Expected Result**: The card should appear in the list of available cards.

### 2. Editor Card
- **Scenario**: Using the `linked-lovelace-editor` to configure a template.
- **Expected Result**: Changes made in the editor should reflect correctly in the card preview.

## Automation
- Run all existing unit tests: `npm test`
- Run integration tests (if available): `npm run test:integration`
- Ensure build succeeds: `npm run build`
