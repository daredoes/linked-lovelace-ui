---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Linked Lovelace"
  text: "Reusable Card Templates"
  tagline: Write a Home Assistant dashboard card once, then sync it everywhere you used it.
  actions:
    - theme: brand
      text: Try the Live Demo
      link: /demo
    - theme: alt
      text: Get Started
      link: /getting-started
    - theme: alt
      text: API Reference
      link: /api-reference

features:
  - title: One Card, Many Dashboards
    details: Add ll_key to any card and it becomes a template. Use it on as many dashboards as you like, then sync them all from a single card.
  - title: Context Per Card
    details: Every card that uses a template passes its own ll_context, so the same source renders a different room, entity, or label each time.
  - title: Eta JS Templating
    details: Conditionals, loops, and partials through Eta JS. Write the logic once in a partial and include it from any template.
  - title: Card Arrays With ll_keys
    details: Inject rendered cards into a template's array property, so one template can build a whole row, list, or grid.
  - title: Sections Layouts
    details: Definitions and rendered cards both work in the sections dashboard layout Home Assistant shipped in 2024.3.
  - title: Covered By Tests
    details: A unit suite plus a Playwright run against a real Home Assistant cover the rendering pipeline, so a sync gives the same output every time.
---
