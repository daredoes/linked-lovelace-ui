---
outline: deep
---

# Creating Partials

::: danger NOTE

Linked Lovelace runs commands on behalf of the user's browser to modify dashboard configurations, not on behalf of the Home Assistant system. A user's access may modify the outcome of the program.

__Always back-up your configs if you feel unsure about what you are about to do!__
:::

## What is a partial?

A partial is a snippet of template code (EtaJS or Jinja2) that can be reused. By setting some context unique to the partial, you can create helper partials that do some basic logic for you.

For `Linked Lovelace`, there is a specific card type `type: custom:linked-lovelace-partials`. This can hold a list of partials that get collected by the Status card.

## Defining EtaJS partials

You can define partials for either engine. Example:

```yaml
type: custom:linked-lovelace-partials
partials:
  - key: modeToIcon
    template: |-
      <% let mode = context.mode ? context.mode.toLowerCase() : '' _%>
      <%_ if (mode === "passive") { _%>
      mdi:peace
      <%_ } else if (mode === 'party') { _%>
      mdi:party-popper
      <%_ } else if (mode === 'movie') { _%>
      mdi:video
      <%_ } else if (mode === 'off') { _%>
      mdi:power
      <%_ } else { _%>
      mdi:progress-question
      <%_ } _%>
```

This card creates a partial with the name `modeToIcon`. This partial uses Eta JS to set a local value of `mode`. If `context.mode` exists,  it is converted to lowercase. If it does not, a blank string is used as the value.

What follows is known as a Switch case, using `if-else`. This checks if the `mode` is a certain value, and renders the text inside the conditional block. It includes an `else` block to provide a default answer if none of the conditions are met.

## Using a partial

To use this partial, we are going to create a template button card that uses `mode` to set its values for `name` and `icon`. We will then implement that template using `ll_context` to set the `mode`.

```yaml
ll_key: icon-button
ll_context:
  mode: Movie
show_name: true
show_icon: true
type: button
icon: <%~include('modeToIcon', { ...context }) _%>
name: <%= context.mode %>
```

Now we can use this template by adding the following to any card config, marking it to be overridden by the status card.

```yaml
ll_template: icon-button
ll_context:
  mode: Passive
```

## Defining Jinja2 partials

You can also define partials for the Jinja2 engine. For Jinja2, you only provide the macro body in the `template` field, and the macro name is set to the value of `key` automatically. This allows you to use Home Assistant functions directly in your partials.

### Macro arguments with `args`

Jinja2 partials can accept arguments, just like Jinja2 macros. You can specify an `args:` field (a list of argument names) next to `key:`. If you do not specify `args`, the macro will have no arguments, and all context keys will be available as global variables in the template.

**Example with custom arguments:**

```yaml
type: custom:linked-lovelace-partials
partials:
  - key: greet
    args: [name]
    template: |
      Hello {{ name }}! Your entity: {{ entity_id }}
    ll_template_engine: jinja2
```

This will generate:

```jinja2
{% macro greet(name) %}Hello {{ name }}! Your entity: {{ entity_id }}{% endmacro %}
```

**Example with no arguments (all context keys are global):**

```yaml
- key: greet
  template: Hello {{ entity_id }}
  ll_template_engine: jinja2
```
Generates:
```jinja2
{% macro greet() %}Hello {{ entity_id }}{% endmacro %}
```

### Home Assistant-powered example

Here’s a Jinja2 version of the `modeToIcon` partial, which uses the `entity_attr` function to fetch the current mode from a climate entity:

```yaml
type: custom:linked-lovelace-partials
partials:
  - key: modeToIcon
    args: [mode]
    template: >-
      {% if mode == 'heat' %}
        mdi:fire
      {% elif mode == 'cool' %}
        mdi:snowflake
      {% elif mode == 'off' %}
        mdi:power
      {% else %}
        mdi:help
      {% endif %}
    ll_template_engine: jinja2
```

You can use this macro in your Jinja2 templates just like the EtaJS example:

```yaml
ll_key: icon-button
ll_template_engine: jinja2
show_name: true
show_icon: true
type: entities
icon: "{{ modeToIcon(mode) }}"
name: "{{ mode | capitalize }}"
```

Now we can use this template by adding the following to any card config, marking it to be overridden by the status card:

```yaml
ll_template: icon-button
ll_context:
  mode: heat
```

This approach lets you leverage Home Assistant’s template functions and state directly in your partials for powerful, dynamic UI logic.

---

### Advanced Example: Formatting a Table of Entities with Home Assistant Data

This example shows how you can use arguments and Home Assistant functions to create a reusable Jinja2 partial for formatting a table row. The macro is used in a loop, and arguments are passed from each entity_id in a list, demonstrating the power and clarity of macro arguments:

```yaml
type: custom:linked-lovelace-partials
partials:
  - key: entityRow
    args: [entity_id]
    template: >-
      <tr>
        <td>{{ state_attr(entity_id, 'friendly_name') or entity_id }}</td>
        <td>{{ states(entity_id) }} {{ state_attr(entity_id, 'unit_of_measurement') or '' }}</td>
      </tr>
    ll_template_engine: jinja2
```

This generates:

```jinja2
{% macro entityRow(entity_id) %}
  <tr>
    <td>{{ state_attr(entity_id, 'friendly_name') or entity_id }}</td>
    <td>{{ states(entity_id) }} {{ state_attr(entity_id, 'unit_of_measurement') or '' }}</td>
  </tr>
{% endmacro %}
```

**How to use in a card template:**

```yaml
ll_key: summary-table
ll_context:
  rows:
    - sensor.living_room_temperature
    - sensor.bedroom_temperature
type: custom:button-card
name: Temperature Summary
show_state: false
state_display: |-
  <table>
    <thead><tr><th>Entity</th><th>Value</th></tr></thead>
    <tbody>
      {% for entity_id in rows %}
        {{ entityRow(entity_id) }}
      {% endfor %}
    </tbody>
  </table>
ll_template_engine: jinja2
```

**How to use the template in a card config:**

```yaml
ll_template: summary-table
ll_context:
  rows:
    - sensor.office_temperature
    - sensor.kitchen_temperature
```

This approach lets you create a single partial that can be reused for any list of entities, clearly showing the value of macro arguments, Jinja2’s power, and Home Assistant integration for formatting and logic.
