import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

// https://vitepress.dev/reference/site-config
// withMermaid wraps the standard config so ```mermaid code fences render as diagrams.
export default withMermaid(defineConfig({
  title: "Linked Lovelace",
  description: "Reusable card templates for Home Assistant dashboards",
  base: "/linked-lovelace-ui/",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Getting Started', link: '/getting-started' },
      { text: 'Starter Dashboard', link: '/starter-dashboard' },
      { text: 'Lifecycles', link: '/lifecycles' },
      { text: 'API Reference', link: '/api-reference' },
    ],

    sidebar: [
      {
        text: 'Quick Start',
        items: [
          { text: 'Getting Started', link: '/getting-started' },
          { text: 'Starter Dashboard', link: '/starter-dashboard' },
          { text: 'Creating Your First Template', link: '/create-your-first-template' },
          { text: 'Using the Status Card', link: '/using-the-status-card' },
          { text: 'Providing Template Context', link: '/providing-template-context' },
          { text: 'Creating Partials', link: '/creating-partials' },
        ]
      },
      {
        text: 'Reference',
        items: [
          { text: 'API Reference', link: '/api-reference' },
          { text: 'Template Syntax', link: '/template-syntax' },
        ]
      },
      {
        text: 'Guides',
        items: [
          { text: 'Advanced Features', link: '/advanced-features' },
          { text: 'Troubleshooting', link: '/troubleshooting' },
        ]
      },
      {
        text: 'Internals',
        items: [
          { text: 'Lifecycles', link: '/lifecycles' },
        ]
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/daredoes/linked-lovelace-ui' }
    ],

    search: {
      provider: 'local'
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © Daniel Evans'
    }
  },

  mermaid: {
    // mermaid options — inherit theme from the page, leave defaults otherwise
  }
}))
