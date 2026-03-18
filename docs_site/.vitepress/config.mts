import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Linked Lovelace",
  description: "Reusable card templates for Home Assistant dashboards",
  base: "/linked-lovelace-ui/",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Getting Started', link: '/getting-started' },
      { text: 'API Reference', link: '/api-reference' },
    ],

    sidebar: [
      {
        text: 'Quick Start',
        items: [
          { text: 'Getting Started', link: '/getting-started' },
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
  }
})
