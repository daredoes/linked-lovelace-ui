---
outline: deep
---

# Providing Template Context

::: danger NOTE

Linked Lovelace runs commands on behalf of the user's browser to modify dashboard configurations, not on behalf of the Home Assistant system. A user's access may modify the outcome of the program.

__Always back-up your configs if you feel unsure about what you are about to do!__
:::

## Background

Consider the following scenario.

We have created the following template, `help-button`, to help us quickly make a card that a user can click to call the service that creates a persistent notification.

```yaml
ll_key: help-button
show_name: true
show_icon: true
type: button
tap_action:
  action: call-service
  service: notify.persistent_notification
  target: {}
  data:
    message: A user needs help
    title: Help Wanted!
icon: mdi:help
name: Request Help
```

By using what we know so far, we can place this button on multiple dashboards, and keeping the values such as the message or title synchronized with the original template card using the Status card.

What if we want to alter the title on one dashboard, and have it use a default value for all the others? That's where template context comes into play.

## What Powers Templating

Templating is powered by [Eta JS](https://eta.js.org/docs/intro/syntax-cheatsheet). This is because **I didn't want to figure out how to use the Jinja library built into Home Assistant. _The documentation is weak_.**

**If you would like to add support for Jinja templating, please [submit a PR.](https://github.com/daredoes/linked-lovelace-ui/pulls)**

Practically speaking, this means we can use conditionals, loops, and variables.

To use variables, we have to set variables. In Eta JS, variables can be accessed from the object `it`. `it` felt weird to me, luckily they provide a way to set this value to something else. So we use `context`, hopefully that's easy to remember!

## Setting Context

Now that we know about context and variables, we need to set the variables in our context.

To do this, we can provide any card the top-level key `ll_context` - which is a [dictionary](https://gist.github.com/carlessanagustin/50dab6d642e34f8f617d#dictionary) - to add variables to our context.

Given our example template above - `help-button` - we can update the template to use variables from our context to support a dynamic message. - fallback variable not yet supported.

__We can__ help our users by providing some defaults that will get added to the code editor when using the Linked Lovelace Template card editor.

**Unfortunately, this will break the beauty of our original template card.**

```yaml
ll_key: help-button
ll_context:
  message: A user needs help
  title: Help Wanted!
  name: Request Help
show_name: true
show_icon: true
type: button
tap_action:
  action: call-service
  service: notify.persistent_notification
  target: {}
  data:
    message: <%= context.message %>
    title: <%= context.title %>
icon: mdi:help
name: <%= context.name %>
```

## Using Context

Thanks to the above template, we can create a customized version by adding the following lines to any card we want to mark for synchronization.

```yaml
ll_template: help-button
ll_context:
  message: A user needs help
  title: Help Wanted!
  name: Request Help
```

## Demonstration

The following demonstration will update our template to use context, and create two variations of the card to demonstrate how they can use the same template while having different results.

![Linked Lovelace Adding Context](./images/linked-lovelace-adding-context.gif)

## What's Next?

It's time for you to create your own powerful cards.

We're working on providing some useful example cards, but as-is with most things in Home Assistant, you'll find that most of your templates are unique to your setup.
