---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Linked Lovelace"
  text: "Reusable Card Templates"
  tagline: Keep your Home Assistant dashboards in sync with zero copy-pasting.
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: API Reference
      link: /api-reference

features:
  - title: Define Once, Use Everywhere
    details: Mark any card with ll_key and it becomes a template. Place it on as many dashboards as you like – one click syncs them all.
  - title: Dynamic Variables
    details: Pass ll_context to inject variables at render-time. Different dashboards can use the same template with different values.
  - title: Eta JS Templating
    details: Full if/else, loops, and partials via Eta JS. Write logic once in a partial and reuse it across all your templates.
  - title: ll_keys for Card Arrays
    details: Dynamically inject rendered card objects into template arrays. Build rows, lists, and grids with a single template.
  - title: Sections Support
    details: Works with the Home Assistant 2024.3+ sections dashboard layout out of the box.
  - title: Verified by Tests
    details: Core rendering logic is covered by a comprehensive test suite. Consistent output you can rely on.
---
