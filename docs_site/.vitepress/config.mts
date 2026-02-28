import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Linked Lovelace",
  description: "Usage and Development Notes",
  base: "/linked-lovelace-ui/",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' }
    ],

    sidebar: [
      {
        text: 'Documentation',
        items: [
          { text: 'Home', link: '/' },
          { text: 'Getting Started', link: '/getting-started' },
          { text: 'Creating Your First Template', link: '/create-your-first-template' },
          { text: 'Using the Status Card', link: '/using-the-status-card' },
          { text: 'Providing Template Context', link: '/providing-template-context' },
          { text: 'Creating Partials', link: '/creating-partials' },
          { text: 'API Examples', link: '/api-examples' },
        ]
      },
      {
        text: 'Project',
        items: [
          { text: 'Project History', link: '/project-history' },
          { text: 'API Evolution', link: '/api-evolution' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/daredoes/linked-lovelace-ui' }
    ]
  }
})
