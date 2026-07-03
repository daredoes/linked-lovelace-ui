<script setup lang="ts">
import { computed, provide, ref } from 'vue'
import HaCard from './HaCard.vue'
import {
  defaultDashboardYaml,
  demoDashboardTitle,
  parseDashboardYaml,
  stringifyDashboard,
  syncDashboardConfig,
  type DashboardConfig,
} from './engine'

const yamlText = ref(defaultDashboardYaml())
const activeView = ref(0)
const loaded = ref(false)
const templateCount = ref(0)
const partialCount = ref(0)
const logs = ref<string[]>([])
const flash = ref(false)

const parsed = computed<{ config: DashboardConfig | null; error: string | null }>(() => {
  try {
    return { config: parseDashboardYaml(yamlText.value), error: null }
  } catch (e) {
    return { config: null, error: String(e instanceof Error ? e.message : e) }
  }
})

const views = computed(() => parsed.value.config?.views || [])
const currentView = computed(() => views.value[activeView.value] || views.value[0])

const loadData = () => {
  if (!parsed.value.config) return
  // Dry run: discover + register, but do not write anything back.
  const outcome = syncDashboardConfig(parsed.value.config)
  templateCount.value = Object.keys(outcome.templates).length
  partialCount.value = outcome.partials.length
  logs.value = outcome.logs
  loaded.value = true
}

const updateAll = () => {
  if (!parsed.value.config) return
  const outcome = syncDashboardConfig(parsed.value.config)
  templateCount.value = Object.keys(outcome.templates).length
  partialCount.value = outcome.partials.length
  logs.value = outcome.logs
  loaded.value = true
  // "Write" the rendered config back, exactly like a real sync writes to
  // Home Assistant storage — the editor shows what would be saved.
  yamlText.value = stringifyDashboard(outcome.config)
  flash.value = true
  setTimeout(() => (flash.value = false), 700)
}

const reset = () => {
  yamlText.value = defaultDashboardYaml()
  loaded.value = false
  logs.value = []
  activeView.value = 0
}

provide('ll-status-bridge', {
  loaded,
  templateCount,
  partialCount,
  loadData,
  updateAll,
})
</script>

<template>
  <div class="ll-playground">
    <div class="ll-columns">
      <!-- Left: the raw configuration editor, as in HA -->
      <section class="ll-editor-pane">
        <header class="ll-pane-header">
          <span>Raw configuration editor</span>
          <button class="ll-btn" @click="reset">Reset demo</button>
        </header>
        <textarea
          v-model="yamlText"
          class="ll-editor"
          :class="{ 'll-flash': flash }"
          spellcheck="false"
          aria-label="Dashboard YAML configuration"
        />
        <p v-if="parsed.error" class="ll-error">⚠ {{ parsed.error }}</p>
        <details v-if="logs.length" class="ll-logs">
          <summary>Sync logs ({{ logs.length }})</summary>
          <pre>{{ logs.join('\n') }}</pre>
        </details>
      </section>

      <!-- Right: the simulated Home Assistant window -->
      <section class="ll-ha-frame">
        <header class="ll-ha-header">
          <span class="ll-ha-menu">☰</span>
          <span class="ll-ha-title">{{ parsed.config?.title || demoDashboardTitle }}</span>
        </header>
        <nav v-if="views.length" class="ll-ha-tabs">
          <button
            v-for="(view, i) in views"
            :key="i"
            class="ll-ha-tab"
            :class="{ active: i === activeView }"
            @click="activeView = i"
          >
            {{ view.title || view.path || `View ${i + 1}` }}
          </button>
        </nav>
        <div class="ll-ha-body">
          <template v-if="currentView">
            <HaCard v-for="(card, i) in currentView.cards || []" :key="i" :card="card" />
          </template>
          <p v-else class="ll-muted">Fix the YAML on the left to see the dashboard.</p>
        </div>
      </section>
    </div>
  </div>
</template>

<style>
.ll-playground {
  margin: 1.5rem 0;
  font-size: 0.85rem;
}
.ll-columns {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 1rem;
}
@media (max-width: 860px) {
  .ll-columns {
    grid-template-columns: 1fr;
  }
}

/* ---- Editor pane ---- */
.ll-editor-pane {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  background: var(--vp-c-bg-soft);
}
.ll-pane-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  font-weight: 600;
  border-bottom: 1px solid var(--vp-c-divider);
}
.ll-editor {
  flex: 1;
  min-height: 480px;
  padding: 0.75rem;
  border: 0;
  resize: vertical;
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  line-height: 1.5;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  transition: background-color 0.4s ease;
}
.ll-editor:focus {
  outline: 2px solid #03a9f4;
  outline-offset: -2px;
}
.ll-editor.ll-flash {
  background: rgba(3, 169, 244, 0.18);
}
.ll-error {
  margin: 0;
  padding: 0.5rem 0.75rem;
  color: var(--vp-c-danger-1, #d33);
  background: var(--vp-c-danger-soft, rgba(221, 51, 51, 0.1));
}
.ll-logs summary {
  cursor: pointer;
  padding: 0.4rem 0.75rem;
  font-weight: 600;
}
.ll-logs pre {
  margin: 0;
  padding: 0.5rem 0.75rem;
  max-height: 160px;
  overflow: auto;
  font-size: 0.7rem;
  background: var(--vp-c-bg);
}

/* ---- Fake Home Assistant window ---- */
.ll-ha-frame {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  background: var(--vp-c-bg-alt);
  display: flex;
  flex-direction: column;
}
.ll-ha-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.9rem;
  background: #03a9f4;
  color: #fff;
  font-weight: 600;
}
.ll-ha-tabs {
  display: flex;
  background: #03a9f4;
  padding: 0 0.5rem;
}
.ll-ha-tab {
  padding: 0.45rem 1rem;
  color: rgba(255, 255, 255, 0.75);
  font-weight: 600;
  border-bottom: 2px solid transparent;
  text-transform: uppercase;
  font-size: 0.72rem;
  letter-spacing: 0.05em;
}
.ll-ha-tab.active {
  color: #fff;
  border-bottom-color: #fff;
}
.ll-ha-body {
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 480px;
  max-height: 620px;
  overflow: auto;
}

/* ---- Cards ---- */
.ll-playground .ha-card {
  position: relative;
  background: var(--vp-c-bg);
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  padding: 0.8rem 1rem;
}
.ll-card-header {
  font-weight: 700;
  margin-bottom: 0.35rem;
}
.ll-stack {
  display: flex;
  gap: 0.75rem;
}
.ll-vertical {
  flex-direction: column;
}
.ll-horizontal > * {
  flex: 1;
  min-width: 0;
}
.ll-markdown h1,
.ll-markdown h2,
.ll-markdown h3 {
  margin: 0.3rem 0;
  border: none;
  padding: 0;
  font-size: 1.05em;
  font-weight: 700;
}
.ll-markdown h1 { font-size: 1.25em; }
.ll-markdown h2 { font-size: 1.15em; }
.ll-markdown p { margin: 0.35rem 0; line-height: 1.45; }
.ll-markdown ul, .ll-markdown ol { margin: 0.35rem 0; padding-left: 1.2rem; }
.ll-markdown code {
  background: var(--vp-c-bg-soft);
  padding: 0.1em 0.35em;
  border-radius: 4px;
  font-size: 0.85em;
}
.ll-button-card {
  text-align: center;
  padding: 1rem;
}
.ll-button-icon { font-size: 1.8rem; }
.ll-button-name { font-weight: 600; margin-top: 0.25rem; }

.ll-placeholder-card {
  border: 2px dashed #03a9f4;
  box-shadow: none;
  background: rgba(3, 169, 244, 0.06);
}
.ll-placeholder-title { font-weight: 700; }
.ll-placeholder-card code {
  display: inline-block;
  margin: 0.25rem 0;
  background: var(--vp-c-bg-soft);
  padding: 0.1em 0.4em;
  border-radius: 4px;
}

.ll-status-card { border-left: 4px solid #03a9f4; }
.ll-status-actions { margin-top: 0.5rem; }

.ll-chip-row { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.ll-chip {
  display: inline-block;
  padding: 0.1rem 0.6rem;
  border-radius: 999px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  font-size: 0.7rem;
  font-family: var(--vp-font-family-mono);
}
.ll-chip-template {
  position: absolute;
  top: -0.55rem;
  right: 0.6rem;
  background: #03a9f4;
  color: #fff;
  border: none;
}

.ll-muted { color: var(--vp-c-text-2); margin: 0.25rem 0; }
.ll-yaml-dump {
  margin: 0;
  font-size: 0.7rem;
  max-height: 200px;
  overflow: auto;
  background: var(--vp-c-bg-soft);
  border-radius: 6px;
  padding: 0.5rem;
}

.ll-btn {
  padding: 0.3rem 0.9rem;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-weight: 600;
  font-size: 0.75rem;
  cursor: pointer;
}
.ll-btn:hover { border-color: #03a9f4; }
.ll-btn-primary {
  background: #03a9f4;
  border-color: #03a9f4;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.ll-btn-primary:hover { background: #29b6f6; }
</style>
