import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

// https://vitepress.dev/reference/site-config
// withMermaid wraps the standard config so ```mermaid code fences render as diagrams.
export default withMermaid(defineConfig({
  title: "Linked Lovelace",
  description: "Reusable card templates for Home Assistant dashboards",
  base: "/linked-lovelace-ui/",

  // Maintainer-facing docs live in internal/ (architecture, e2e design).
  // They stay in the repo for GitHub readers but never publish to the site.
  srcExclude: ["internal/**"],

  vite: {
    resolve: {
      alias: [
        // The live-demo playground imports the template engine straight from
        // ../src, whose `import 'eta'` would otherwise resolve against the
        // repo-root node_modules (absent in the docs-only CI build). Pin it
        // to the copy installed for the docs site.
        {
          find: /^eta$/,
          replacement: fileURLToPath(
            new URL('../node_modules/eta/dist/browser.module.mjs', import.meta.url),
          ),
        },
      ],
    },
  },

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Live Demo', link: '/demo' },
      { text: 'Getting Started', link: '/getting-started' },
      { text: 'Starter Dashboard', link: '/starter-dashboard' },
      { text: 'Lifecycles', link: '/lifecycles' },
      { text: 'API Reference', link: '/api-reference' },
    ],

    sidebar: [
      {
        text: 'Quick Start',
        items: [
          { text: 'Live Demo (in your browser)', link: '/demo' },
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
    // Light and dark themes come from the plugin, which re-renders on a theme
    // switch. Diagrams fit the content column; the theme frames them so they
    // read as figures rather than loose line art.
    flowchart: { curve: 'basis' },
  }
}))
