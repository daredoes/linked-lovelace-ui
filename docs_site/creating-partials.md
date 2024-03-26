---
outline: deep
---

# Creating Partials

::: danger NOTE

Linked Lovelace runs commands on behalf of the user's browser to modify dashboard configurations, not on behalf of the Home Assistant system. A user's access may modify the outcome of the program.

__Always back-up your configs if you feel unsure about what you are about to do!__
:::

## What is a partial?

A partial is a snippet of Eta JS Templating code that can be reused. By setting some context unique to the partial, we can create helper partials that do some basic logic for us.

For `Linked Lovelace`, there is a specific card type `type: custom:linked-lovelace-partials`. This can hold a list of partials that get collected by the Status card.

Consider the following example partial card.

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

What follows is known as a Switch case, using `if-else`. This checks if the `mode` is a certain value, and renders the text inside the conditonal block. It includes an `else` block to provide a default answer if none of the conditions are met.

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
