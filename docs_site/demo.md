---
outline: deep
---

# Live Demo

This playground runs the actual Linked Lovelace template engine, the same code that ships to Home Assistant, right here in your browser. The window below simulates a Home Assistant dashboard. Click **Edit YAML** in its header to open the raw YAML config behind it, just like HA's *Raw configuration editor*, then **Done** to get back to the dashboard.

You don't need Home Assistant and there is nothing to install. Everything stays in your browser tab.

## Watch It Run In Home Assistant

If you would rather watch the real card first, here is the same feature set running in an actual Home Assistant, recorded by the end-to-end suite. The panel on the left holds the YAML under discussion, so each feature appears beside the card it produces.

It runs about two and a half minutes, in eight chapters: three duplicated cards, one source card that replaces them, discovery, the dry-run diff and the sync that follows it, editing the source once, partials with `ll_keys` and `ll_priority`, a source inside a sections view, and key chips.

<div class="ll-demo-video">
  <video controls playsinline preload="metadata" poster="./images/linked-lovelace-demo-poster.jpg" src="./images/linked-lovelace-demo.mp4"></video>
</div>

<p class="ll-caption">Captions rather than narration, so it plays fine with the sound off. To record it against your own build, run <code>./scripts/video.sh</code> from the repo.</p>

## Try It

1. On the **Demo** view, find the **Linked Lovelace Status** card and click **Load Data**. This first pass reads the dashboard's YAML config: the templates, the partials, and the `ll_context` shown on each dashed placeholder card all come from that YAML. Click **Edit YAML** if you want to see the source before you sync.
2. Click **Update All**. The dashed template placeholders become fully rendered cards, each filled in with its `ll_context` from the YAML, and the config updates to exactly what a real sync would write back to Home Assistant (open **Edit YAML** to inspect it).
3. Open **Edit YAML** and find the `room` template (it lives on the **Templates** view). Change its `content`, add an emoji, anything, then click **Done**.
4. Click **Update All** again. Every room card updates at once, which is the job Linked Lovelace does.

<ClientOnly>
  <HaPlayground />
</ClientOnly>

## What's Real and What's Simulated

| Piece | Real or simulated? |
|-------|--------------------|
| Template rendering (`ll_key`, `ll_template`, `ll_context`, priorities) | Real. Imported from the library source. |
| Template discovery (view cards, cards inside `sections`, key-chip wrappers, duplicate `ll_key`) | Real. The same walk and the same collision rule the status card uses. |
| Eta partials (`include(...)`) | Real. Same Eta engine and options as in HA. |
| The YAML written back after a sync | Real. Identical pipeline to a dashboard update. |
| Partials loaded from a `url:` | Not fetched. The playground logs a warning and skips them, so use an inline `template:` here. |
| The dashboard window, cards, and status card UI | Simulated. A lightweight look-alike so you can see results. |
| Dashboards / websockets / saving to storage | Not used. Everything stays in your browser tab. |

The default content is the same showcase the [Starter Dashboard](./starter-dashboard) card creates in a real Home Assistant, so anything you work out here applies there unchanged.

## Things to Experiment With

- In **Edit YAML**, change `state: 'on'` to `state: 'off'` in a room card's `ll_context` and re-sync. The `stateToIcon` partial picks a different icon.
- Add a fourth room by copying one of the `custom:linked-lovelace-template` cards in the `Demo` view's YAML and giving its `ll_context` a new `name`.
- Break it on purpose: misspell an `ll_template` value and sync. The card passes through unrendered, which is exactly what happens in HA (see [Troubleshooting](./troubleshooting#template-not-found)).
- Edit the `stateToIcon` partial on the Templates view to return different emoji, then re-sync.

## Ready for the Real Thing?

- [Getting Started](./getting-started) covers installing the card in Home Assistant.
- [Starter Dashboard](./starter-dashboard) drops this exact demo into your HA.
- [Creating Your First Template](./create-your-first-template) walks through building your own.
