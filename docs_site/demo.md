---
outline: deep
---

# Live Demo

This playground runs the **actual Linked Lovelace template engine** — the same
code that ships to Home Assistant — right here in your browser. The window on
the right simulates a Home Assistant dashboard; the editor on the left is the
raw YAML config behind it, just like HA's *Raw configuration editor*.

No Home Assistant required. Nothing to install. Nothing you do here touches a
real system.

## Try it

1. On the **Demo** view, find the **Linked Lovelace Status** card and click
   **Load Data** — it discovers the templates and partials on this dashboard.
2. Click **Update All**. The dashed template placeholders become fully rendered
   cards, and the YAML on the left updates to show exactly what a real sync
   would write back to Home Assistant.
3. Switch to the **Templates** view (or scroll the YAML) and edit the `room`
   template — change its `content`, add an emoji, anything.
4. Click **Update All** again. Every room card updates at once. That's the
   whole point: **author once, reuse everywhere, sync on demand.**

<ClientOnly>
  <HaPlayground />
</ClientOnly>

## What's real and what's simulated

| Piece | Real or simulated? |
|-------|--------------------|
| Template rendering (`ll_key`, `ll_template`, `ll_context`, priorities) | **Real** — imported from the library source |
| Eta partials (`include(...)`) | **Real** — same Eta engine and options as in HA |
| The YAML written back after a sync | **Real** — identical pipeline to a dashboard update |
| The dashboard window, cards, and status card UI | Simulated — a lightweight look-alike so you can see results |
| Dashboards / websockets / saving to storage | Not used — everything stays in your browser tab |

The default content is the same showcase the
[Starter Dashboard](./starter-dashboard) card creates in a real Home Assistant
— so what you learn here transfers one-to-one.

## Things to experiment with

- **Context variables** — change `state: 'on'` to `state: 'off'` on a room card
  and re-sync. The `stateToIcon` partial picks a different icon.
- **Add a fourth room** — copy one of the `custom:linked-lovelace-template`
  cards in the `Demo` view and give it a new `name`.
- **Break it on purpose** — misspell an `ll_template` value and sync. The card
  passes through unrendered, which is exactly what happens in HA (see
  [Troubleshooting](./troubleshooting#template-not-found)).
- **Partials** — edit the `stateToIcon` partial on the Templates view to return
  different emoji, then re-sync.

## Ready for the real thing?

- [Getting Started](./getting-started) — install the card in Home Assistant
- [Starter Dashboard](./starter-dashboard) — drop this exact demo into your HA
- [Creating Your First Template](./create-your-first-template) — build your own
