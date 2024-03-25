---
outline: deep
---

# Creating Your First Template

::: danger NOTE

Linked Lovelace runs commands on behalf of the user's browser to modify dashboard configurations, not on behalf of the Home Assistant system. A user's access may modify the outcome of the program.

__Always back-up your configs if you feel unsure about what you are about to do!__
:::

## Create A Reusable Card

By reusable card, we're looking to create a card that we want to use on more than one view or dashboard.

If you aren't setting up Home Assistant from scratch right now, you probably don't need to create a card, as any card can become your first template!

If you are setting up Home Assistant from scratch right now, create any card you want.

## Make it a template

To mark a card as a template for Linked Lovelace to consume, we need to add the key `ll_key` to the top-level of the card's YAML.

Before:

```yaml
type: light
entity: light.kitchen
```

After:

```yaml
ll_key: kitchen-card
type: light
entity: light.kitchen
```

By adding this single line Linked Lovelace becomes able to identify `kitchen-card` as a template.

## Use the template

Now that we've created our first template, we'll use the Template card to help us place it on a new Dashboard/View. We can do this in one of two ways.

1. Use the UI Selector to choose the Linked Lovelace Template card `type: custom:linked-lovelace-template`. This card will look up our available templates, and swap the code needed for the Status card to work properly into place with just a button click.
![Linked Lovelace Template Card](./images/linked-lovelace-template-card.png)
2. Modify any new or existing card yaml to have the top level key `ll_template` with a value that matches the `ll_key` value we created earlier. In our example. this would be `kitchen-card`.
![Linked Lovelace Template Card Code](./images/linked-lovelace-template-card-code.png)

## Synchronize the template

While we've created our template and placed it on a dashboard, we haven't actually done anything with it yet. To see the power of Linked Lovelace, we'll want to make a change to our original card and synchronize that to where we used the template.

Before moving onto the next step, update your original card, the one with `ll_key` to have some difference. Any at all! It can be purely in the code editor, but it's much more satisfying to see some visual change get synchronized.

Before:

```yaml
ll_key: kitchen-card
type: light
entity: light.kitchen
```

After:

```yaml
ll_key: kitchen-card
type: light
entity: light.kitchen
name: All Kitchen Lights
```

Once that's done, move ahead to get started [using the Status card](./using-the-status-card)