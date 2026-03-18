---
outline: deep
---

# Template Syntax

Linked Lovelace templates use **[Eta JS](https://eta.js.org/)** – a fast, lightweight templating engine. This page is a focused reference for using Eta inside your Home Assistant card configs.

::: info Key settings
- Variable object: `context` (not `it`)
- Auto-escape: **disabled** (raw output – needed for YAML values)
- Whitespace trimming: available with `_` modifiers
:::

---

## Outputting Variables

Use `<%= %>` to output the value of a context variable.

```yaml
# Template source card (ll_key: room-button)
ll_key: room-button
ll_context:
  room: Kitchen
  entity: light.kitchen
type: custom:button-card
entity: "<%= context.entity %>"
name: "<%= context.room %>"
```

Consumer card:

```yaml
type: custom:linked-lovelace-template
ll_template: room-button
ll_context:
  room: Living Room
  entity: light.living_room
```

Result after sync:

```yaml
type: custom:button-card
entity: light.living_room
name: Living Room
ll_template: room-button
ll_context:
  room: Living Room
  entity: light.living_room
```

---

## Default Values

Eta does not support a native default-value operator, but you can use JavaScript's `||` or a ternary:

```yaml
name: "<%= context.label || 'Unnamed' %>"
```

```yaml
# Ternary
icon: "<%= context.icon ? context.icon : 'mdi:help-circle' %>"
```

---

## Conditionals

Use JavaScript `if/else` inside `<% %>` blocks:

```yaml
# Template: status-icon
ll_key: status-icon
type: custom:mushroom-template-card
icon: |-
  <% if (context.state === 'on') { %>
  mdi:lightbulb
  <% } else if (context.state === 'unavailable') { %>
  mdi:lightbulb-off-outline
  <% } else { %>
  mdi:lightbulb-off
  <% } %>
```

Consumer:

```yaml
type: custom:linked-lovelace-template
ll_template: status-icon
ll_context:
  state: "on"
```

::: tip Whitespace trimming
Use `_%>` or `<%_` to trim whitespace around a tag:

```
<%_ if (context.active) { _%>mdi:power<%_ } _%>
```

This produces `mdi:power` without extra spaces or newlines.
:::

---

## Loops

Iterate over a context array to generate repeated content:

```yaml
ll_key: entity-list
type: custom:auto-entities
filter:
  include: []
card_param: entities
entities: |-
  <% for (let e of context.entities) { %>
  - entity: <%= e %>
  <% } %>
```

> **Note:** Loops produce YAML strings inline. Prefer [ll_keys](./advanced-features#ll-keys-in-depth) when you need to dynamically inject rendered card objects into an array.

---

## Partials

Partials are reusable Eta snippets defined with `custom:linked-lovelace-partials`. Include them with `<%~ include('key', data) %>`.

### Defining a partial

```yaml
type: custom:linked-lovelace-partials
partials:
  - key: modeToIcon
    template: |-
      <% let mode = (context.mode || '').toLowerCase() _%>
      <%_ if (mode === 'off') { _%>mdi:power
      <%_ } else if (mode === 'movie') { _%>mdi:video
      <%_ } else if (mode === 'party') { _%>mdi:party-popper
      <%_ } else { _%>mdi:progress-question
      <%_ } _%>
```

### Using a partial

```yaml
ll_key: mode-button
ll_context:
  mode: Movie
type: custom:button-card
icon: "<%~ include('modeToIcon', { ...context }) %>"
name: "<%= context.mode %>"
```

Consumer:

```yaml
type: custom:linked-lovelace-template
ll_template: mode-button
ll_context:
  mode: Party
```

Result:

```yaml
type: custom:button-card
icon: mdi:party-popper
name: Party
ll_template: mode-button
ll_context:
  mode: Party
```

### Passing extra data to a partial

```yaml
icon: "<%~ include('modeToIcon', { mode: context.hvacMode, extra: 'value' }) %>"
```

---

## Complex Object Values

Context variables can hold objects and arrays. Access nested properties with standard JavaScript dot notation:

```yaml
ll_context:
  device:
    name: Thermostat
    entity: climate.living_room
```

```yaml
entity: "<%= context.device.entity %>"
name: "<%= context.device.name %>"
```

---

## Practical Example: Mushroom Chip with Dynamic Icon and Color

```yaml
# Partial: chipColor
type: custom:linked-lovelace-partials
partials:
  - key: chipColor
    template: |-
      <%_ if (context.state === 'on') { _%>green<%_ } else { _%>grey<%_ } _%>

# Template: room-chip
ll_key: room-chip
ll_context:
  entity: light.example
  label: Room
  state: "off"
type: custom:mushroom-chips-card
chips:
  - type: template
    entity: "<%= context.entity %>"
    content: "<%= context.label %>"
    icon_color: "<%~ include('chipColor', context) %>"
```

Consumer:

```yaml
type: custom:linked-lovelace-template
ll_template: room-chip
ll_context:
  entity: light.kitchen
  label: Kitchen
  state: "on"
```

---

## Syntax Quick Reference

| Goal | Syntax |
|------|--------|
| Output variable | `<%= context.key %>` |
| Output partial | `<%~ include('partialName', context) %>` |
| Silent code (no output) | `<% let x = 1 %>` |
| If block | `<% if (cond) { %> ... <% } %>` |
| If/else | `<% if (a) { %> ... <% } else { %> ... <% } %>` |
| For loop | `<% for (const x of arr) { %> ... <% } %>` |
| Trim leading whitespace | `<%_ ... %>` |
| Trim trailing whitespace | `<% ... _%>` |
| Trim both | `<%_ ... _%>` |
| Default value | `<%= context.x \|\| 'default' %>` |
| Ternary | `<%= context.x ? context.x : 'fallback' %>` |
| Null-safe access | `<%= context.obj?.key %>` |
