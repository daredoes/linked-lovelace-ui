---
outline: deep
---

# API Reference

Complete reference for all Linked Lovelace card types and their configuration keys.

---

## Card Types

### `custom:linked-lovelace-template`

The **consumer** card. Place this wherever you want a template to appear. It is replaced at sync-time with the rendered output of the referenced template.

```yaml
type: custom:linked-lovelace-template
ll_template: my-template-key
ll_context:
  variable1: value1
  variable2: value2
ll_keys:
  cards: cards
ll_priority: 0
```

| Key | Type | Required | Description |
|-----|------|----------|-------------|
| `ll_template` | `string` | ✅ | Key of the template to use (must match an `ll_key` on a source card). |
| `ll_context` | `object` | — | Variables passed to the Eta template engine. Accessible as `context.variableName`. |
| `ll_keys` | `object` | — | Maps a template property to a context value, enabling dynamic injection of rendered sub-cards. See [ll_keys](#ll-keys). |
| `ll_priority` | `number` | — | Load order for this template reference. Lower numbers run first. Defaults to `0`. |

---

### `custom:linked-lovelace-status`

The **control** card. Add this to any dashboard to see which templates are registered, preview diffs, and push updates to your dashboards.

```yaml
type: custom:linked-lovelace-status
```

No additional configuration keys are required. The card provides an interactive UI with the following tabs:

- **Dashboards** – see which dashboards will be affected and preview the diff
- **Templates** – list of all registered `ll_key` cards
- **Partials** – list of all registered Eta partials
- **Logs** – runtime log output

---

### `custom:linked-lovelace-partials`

The **partial definition** card. Defines reusable Eta template snippets that can be called with `<%~ include('partialName', context) %>` inside any template.

```yaml
type: custom:linked-lovelace-partials
partials:
  - key: modeToIcon
    template: |-
      <% let mode = (context.mode || '').toLowerCase() _%>
      <%_ if (mode === 'off') { _%>mdi:power
      <%_ } else { _%>mdi:progress-question
      <%_ } _%>
  - key: remotePartial
    url: https://example.com/my-partial.eta
    priority: 10
```

#### Partial object

| Key | Type | Required | Description |
|-----|------|----------|-------------|
| `key` | `string` | ✅ | Name used to call this partial with `include()`. |
| `template` | `string` | ✅ (or `url`) | Inline Eta template string. |
| `url` | `string` | ✅ (or `template`) | URL to fetch the template from at run-time. |
| `priority` | `number` | — | Load order. Lower numbers are loaded first. Defaults to `0`. |

::: tip
When both `template` and `url` are supplied, `url` takes precedence. Use `priority` when one partial depends on another.
:::

---

## Source Card Keys

Any existing card can become a **template source** by adding `ll_key` to its YAML. These keys do **not** affect how the card looks or behaves in the UI.

### `ll_key`

```yaml
ll_key: my-button
type: button
name: My Button
```

- **Type:** `string`
- Marks the card as a reusable template. The value becomes the identifier used by `ll_template` on consumer cards.
- Must be unique across all dashboards.
- Breaks the visual card editor (expected behaviour).

### `ll_priority`

```yaml
ll_key: complex-card
ll_priority: 10
type: custom:...
```

- **Type:** `number` (default `0`)
- Controls the order in which templates are registered. A template with `ll_priority: 10` is registered after one with `ll_priority: 0`. This lets higher-priority templates reference lower-priority ones.

### `ll_context`

```yaml
ll_key: help-button
ll_context:
  message: A user needs help
  title: Help Wanted!
type: button
name: "<%= context.title %>"
```

- **Type:** `object`
- When placed on a **source** card, provides default variable values shown in the card editor.
- When placed on a **consumer** card (`ll_template`), provides the variable values used during rendering.
- Child cards inherit the context accumulated so far as `parentContext`.

### `ll_keys`

```yaml
ll_template: list-template
ll_context:
  myCards:
    - ll_template: item-template
      ll_context:
        label: First
    - ll_template: item-template
      ll_context:
        label: Second
ll_keys:
  cards: cards
```

- **Type:** `Record<string, string>`
- A map where both key and value are the **same context property name**. Each entry causes the system to:
  1. Read the context array/object for that property.
  2. Render any `ll_template` references found within it.
  3. Inject the rendered result into the corresponding template property.
- See [ll_keys in depth](./advanced-features#ll-keys-in-depth) for full details.

---

## Template Syntax

Templates use **[Eta JS](https://eta.js.org/)** with `varName: 'context'` and `autoEscape: false`.

| Syntax | Purpose |
|--------|---------|
| `<%= context.name %>` | Output the value of `name` |
| `<%~ include('partial', context) %>` | Include an Eta partial |
| `<% if (condition) { %> ... <% } %>` | Conditional block |
| `<% for (let x of arr) { %> ... <% } %>` | Loop |
| `<%_ ... _%>` | Trim surrounding whitespace |

::: warning
Missing context variables render as the string `"undefined"`. Use conditionals to provide defaults:

```
<% context.name ? context.name : 'Default' %>
```
:::

See the full [Template Syntax Guide](./template-syntax) for examples.

---

## Key Interactions & Rendering Order

1. The Status card collects all **partials** (`custom:linked-lovelace-partials`) from all dashboards and registers them with Eta.
2. It collects all **source cards** (`ll_key`) and registers them as templates, sorted by `ll_priority` (ascending).
3. When syncing a dashboard, each card is recursively traversed. Cards with `ll_template` are replaced with the rendered template output.
4. Context flows **downward**: a `ll_context` on a consumer card is merged with any `parentContext` inherited from containing non-template cards.
