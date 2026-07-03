---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Linked Lovelace"
  text: "Reusable Card Templates"
  tagline: Keep your Home Assistant dashboards in sync with zero copy-pasting.
  actions:
    - theme: brand
      text: Try the Live Demo
      link: /demo
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: API Reference
      link: /api-reference

features:
  - title: Define Once, Use Everywhere
    details: Mark any card with ll_key and it becomes a template. Place it on as many dashboards as you like, then sync them all with one click.
  - title: Dynamic Variables
    details: Pass ll_context to inject variables at render time. Different dashboards can use the same template with different values.
  - title: Eta JS Templating
    details: Full if/else, loops, and partials via Eta JS. Write logic once in a partial and reuse it in any template.
  - title: ll_keys for Card Arrays
    details: Inject rendered card objects into template arrays, so one template can build a whole row, list, or grid.
  - title: Sections Support
    details: Works with the Home Assistant 2024.3+ sections dashboard layout out of the box.
  - title: Verified by Tests
    details: The core rendering logic has a unit test suite, so a sync produces the same output every time.
---
