import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import HaPlayground from './components/HaPlayground.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('HaPlayground', HaPlayground)
  },
} satisfies Theme
