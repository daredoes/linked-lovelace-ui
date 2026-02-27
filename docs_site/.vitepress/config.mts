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
        text: 'Quick Start',
        items: [
                    { text: 'usingTheStatusCard', link: '/using-the-status-card' },
                    { text: 'providingTemplateContext', link: '/providing-template-context' },
                    { text: 'linkedPartials', link: '/linked-partials' },
                    { text: 'index', link: '/index' },
                    { text: 'idealPlugin', link: '/ideal-plugin' },
                    { text: 'history', link: '/history' },
                    { text: 'gettingStarted', link: '/getting-started' },
                    { text: 'creatingPartials', link: '/creating-partials' },
                    { text: 'createYourFirstTemplate', link: '/create-your-first-template' },
        ]
      }
    ],
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/daredoes/linked-lovelace-ui' }
    ]
  }
})
