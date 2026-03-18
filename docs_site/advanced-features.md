---
outline: deep
---

# Advanced Features

---

## ll_keys In Depth

`ll_keys` is the mechanism for **dynamically injecting rendered card objects** into a template. It is most useful when a template has an array property (like `cards`) that should be populated from context.

### The Problem

If you put card objects directly in `ll_context.cards`, the Eta engine serializes them as a JSON string. The result is a string in a field that expects an array of objects.

`ll_keys` tells Linked Lovelace: _"take this context property, render any `ll_template` references within it, and inject the result as a proper object/array into the named template field."_

### How It Works

```yaml
# Template: row-of-buttons
ll_key: row-of-buttons
type: horizontal-stack
cards: []   # placeholder – will be overwritten by ll_keys
```

Consumer card:

```yaml
type: custom:linked-lovelace-template
ll_template: row-of-buttons
ll_context:
  cards:
    - ll_template: my-button
      ll_context:
        name: Lights
        entity: light.kitchen
    - ll_template: my-button
      ll_context:
        name: Fan
        entity: fan.bedroom
ll_keys:
  cards: cards   # KEY and VALUE must be the same property name
```

After sync, the `cards` array in `row-of-buttons` is replaced with the fully-rendered button cards.

::: info ll_keys format
Each entry is `{ propertyName: propertyName }`. Both key and value are the **same string** – the name of the context property (and the template property) to inject.
:::

### Supported Value Types

| Context value type | Behaviour |
|--------------------|-----------|
| Primitive (string, number) | Copies the value directly into the template property |
| Plain object | Passes through `updateCardTemplate`; template references inside it are rendered |
| Array of objects | Each item passes through `updateCardTemplate`; items with `ll_template` are rendered |

### Priority for Nested Cards

When using `ll_keys` to inject card arrays, the `ll_priority` of the **inner** templates controls the order they are registered. Make sure all referenced templates have a lower `ll_priority` than the outer template that uses `ll_keys`.

---

## Template Priority

### Why Priority Matters

Templates are registered in order of `ll_priority` (ascending). When a template is registered, it is immediately rendered against all previously registered templates. This means:

- A template with `ll_priority: 0` is registered first and cannot reference templates registered later.
- A template with `ll_priority: 10` sees all templates with `ll_priority: 0–9` already in the registry.

```yaml
# This should have a LOWER priority – it is referenced by others
ll_key: icon-chip
ll_priority: 0
type: custom:mushroom-chips-card
chips:
  - type: entity
    entity: "<%= context.entity %>"

# This references icon-chip, so it needs a HIGHER priority
ll_key: room-row
ll_priority: 10
type: horizontal-stack
cards:
  - ll_template: icon-chip
    ll_context:
      entity: light.kitchen
```

### Default Priority

All templates default to `ll_priority: 0`. Explicit values are only needed when you have dependencies between templates.

---

## Nested Templates

Templates can reference other templates. There are two patterns:

### Pattern 1 – Registration-Time Nesting

Register a dependency first (lower priority), then register the parent at a higher priority. The parent template body is rendered against the already-registered child template at registration time.

```yaml
# child.yaml (ll_priority: 0)
ll_key: status-badge
ll_priority: 0
type: custom:mushroom-chips-card
chips:
  - type: template
    entity: "<%= context.entity %>"

# parent.yaml (ll_priority: 10)
ll_key: room-card
ll_priority: 10
type: vertical-stack
cards:
  - ll_template: status-badge   # resolved at registration time
    ll_context:
      entity: "<%= context.entity %>"
```

### Pattern 2 – Runtime Injection via ll_keys

Use `ll_keys` to inject template arrays at sync-time rather than registration-time. This is more flexible because the child templates are evaluated with the context available when the consumer card is rendered.

See [ll_keys In Depth](#ll-keys-in-depth) above for details.

---

## Partials

Partials are Eta template snippets, not full card configs. They are ideal for logic that appears in multiple templates – for example, mapping a mode name to an icon.

### Defining Partials

```yaml
type: custom:linked-lovelace-partials
partials:
  - key: stateColor
    priority: 0
    template: |-
      <% const s = (context.state || '').toLowerCase() _%>
      <%_ if (s === 'on') { _%>green
      <%_ } else if (s === 'unavailable') { _%>red
      <%_ } else { _%>grey
      <%_ } _%>

  - key: entityIcon
    priority: 0
    template: |-
      <% const d = (context.domain || '') _%>
      <%_ if (d === 'light') { _%>mdi:lightbulb
      <%_ } else if (d === 'switch') { _%>mdi:toggle-switch
      <%_ } else { _%>mdi:help-circle
      <%_ } _%>
```

### Using Partials in Templates

```yaml
ll_key: status-chip
type: custom:mushroom-chips-card
chips:
  - type: template
    entity: "<%= context.entity %>"
    icon_color: "<%~ include('stateColor', context) %>"
    icon: "<%~ include('entityIcon', { domain: context.entity.split('.')[0] }) %>"
```

### Loading Partials From a URL

```yaml
type: custom:linked-lovelace-partials
partials:
  - key: myRemotePartial
    url: https://raw.githubusercontent.com/you/repo/main/partials/my-partial.eta
    priority: 5
```

The URL is fetched at sync-time. Make sure the endpoint is CORS-accessible from your Home Assistant instance's browser.

---

## Context Inheritance

Context flows **downward** through the card tree. When a non-template card (one without `ll_template`) contains child cards, it passes its accumulated context as `parentContext` to each child. The child can supplement or override it with its own `ll_context`.

```
View
└── grid card (no ll_template)          parentContext: {}
    └── fake card (ll_template: btn)    sees parentContext + own ll_context
        ll_context: { label: "Hi" }
```

**Rules:**
1. `ll_context` on a consumer card merges with `parentContext` (parent wins for keys not overridden by child).
2. `ll_context` on a **source** card (the template definition itself) provides the default context merged in at render time.
3. Template bodies are rendered as strings – child cards inside a template body are **not** automatically re-rendered with context propagation; use `ll_keys` for that.

---

## The Status Card

The `custom:linked-lovelace-status` card is the control panel for Linked Lovelace. It should be placed on one dashboard (typically a dedicated "admin" view).

### What It Does

1. **Collects** all partials and templates from every dashboard.
2. **Renders** preview diffs between the current state and the updated state.
3. **Pushes** the updated configurations to all dashboards when you click Apply.

### Dry Run Mode

Enable Dry Run to preview the diff without making any changes. This is the default for the first run.

### Tabs

| Tab | Description |
|-----|-------------|
| Dashboards | Shows affected dashboards with before/after diff |
| Templates | Lists all registered template source cards |
| Partials | Lists all registered Eta partials |
| Logs | Runtime output for debugging |

---

## Migration From V1

V1 used a different key scheme. The key differences:

| Feature | V1 | V2 |
|---------|----|----|
| Template source marker | `ll_v1_key` | `ll_key` |
| Consumer card | `type: linked-lovelace` | `type: custom:linked-lovelace-template` |
| Template engine | Custom | Eta JS |
| Variable syntax | `{{ variable }}` | `<%= context.variable %>` |
| Partial support | ❌ | ✅ |
| Sections support | ❌ | ✅ (HA 2024.3+) |

V1 cards continue to work in V2 but will be deprecated. Migrate by:

1. Renaming `ll_v1_key` → `ll_key` on source cards.
2. Updating consumer cards from `type: linked-lovelace` to `type: custom:linked-lovelace-template`.
3. Replacing `{{ variable }}` syntax with `<%= context.variable %>`.
