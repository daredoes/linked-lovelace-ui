<script lang="ts">
import { defineComponent, inject, type PropType } from 'vue'
import YAML from 'yaml'
import { renderMarkdown } from './markdown'
import type { DashboardCard } from './engine'

export interface StatusCardBridge {
  loaded: { value: boolean }
  templateCount: { value: number }
  partialCount: { value: number }
  loadData: () => void
  updateAll: () => void
}

// Fake Home Assistant card renderer. Recursion happens through the component
// name (`HaCard` inside stacks), the same way HA nests real cards.
export default defineComponent({
  name: 'HaCard',
  props: {
    card: { type: Object as PropType<DashboardCard>, required: true },
    // stacks render their children without card chrome, like HA does
    nested: { type: Boolean, default: false },
  },
  setup() {
    const status = inject<StatusCardBridge | null>('ll-status-bridge', null)
    return { status, renderMarkdown }
  },
  computed: {
    cardType(): string {
      return String(this.card?.type || 'unknown')
    },
    icon(): string {
      const icon = String(this.card?.icon || '')
      if (icon.includes('help')) return '❓'
      if (icon.includes('light')) return '💡'
      if (icon.includes('power')) return '⏻'
      return '🔘'
    },
    yamlDump(): string {
      return YAML.stringify(this.card)
    },
    contextDump(): string {
      return YAML.stringify({ ll_context: this.card.ll_context }).trim()
    },
  },
})
</script>

<template>
  <!-- Stacks: no chrome, just layout -->
  <div v-if="cardType === 'vertical-stack'" class="ll-stack ll-vertical">
    <HaCard v-for="(child, i) in card.cards || []" :key="i" :card="child" nested />
  </div>
  <div v-else-if="cardType === 'horizontal-stack' || cardType === 'grid'" class="ll-stack ll-horizontal">
    <HaCard v-for="(child, i) in card.cards || []" :key="i" :card="child" nested />
  </div>

  <!-- Markdown card -->
  <div v-else-if="cardType === 'markdown'" class="ha-card">
    <span v-if="card.ll_key" class="ll-chip ll-chip-template">ll_key: {{ card.ll_key }}</span>
    <div class="ll-markdown" v-html="renderMarkdown(String(card.content || ''))" />
  </div>

  <!-- Button card -->
  <div v-else-if="cardType === 'button'" class="ha-card ll-button-card">
    <span v-if="card.ll_key" class="ll-chip ll-chip-template">ll_key: {{ card.ll_key }}</span>
    <div class="ll-button-icon">{{ icon }}</div>
    <div v-if="card.show_name !== false" class="ll-button-name">{{ card.name || card.entity || 'Button' }}</div>
  </div>

  <!-- Simulated status card: the buttons actually drive the playground sync -->
  <div v-else-if="cardType === 'custom:linked-lovelace-status'" class="ha-card ll-status-card">
    <div class="ll-card-header">🔗 Linked Lovelace Status</div>
    <p v-if="!status?.loaded.value" class="ll-muted">
      No information loaded. <strong>Load Data</strong> reads this dashboard's YAML config:
      templates, partials, and each template card's <code>ll_context</code> all come from there.
    </p>
    <p v-else class="ll-muted">
      Found <strong>{{ status.templateCount.value }}</strong> template(s) and
      <strong>{{ status.partialCount.value }}</strong> partial(s) across this dashboard.
    </p>
    <div class="ll-status-actions">
      <button v-if="!status?.loaded.value" class="ll-btn ll-btn-primary" @click="status?.loadData()">
        Load Data
      </button>
      <button v-else class="ll-btn ll-btn-primary" @click="status?.updateAll()">
        Update All
      </button>
    </div>
  </div>

  <!-- Unsynced template placeholder -->
  <div v-else-if="cardType === 'custom:linked-lovelace-template'" class="ha-card ll-placeholder-card">
    <div class="ll-placeholder-title">🔗 linked-lovelace-template</div>
    <code>ll_template: {{ card.ll_template }}</code>
    <pre v-if="card.ll_context" class="ll-context-dump">{{ contextDump }}</pre>
    <div class="ll-muted">
      On the first sync this card is replaced by the rendered template,
      <template v-if="card.ll_context">using the <code>ll_context</code> above from the YAML config.</template>
      <template v-else>as defined in the YAML config.</template>
    </div>
  </div>

  <!-- Partials definition card -->
  <div v-else-if="cardType === 'custom:linked-lovelace-partials'" class="ha-card">
    <div class="ll-card-header">🧩 Linked Lovelace Partials</div>
    <div class="ll-chip-row">
      <span v-for="partial in card.partials || []" :key="partial.key" class="ll-chip">
        {{ partial.key }}
      </span>
    </div>
  </div>

  <!-- Anything else: generic card showing its config -->
  <div v-else class="ha-card">
    <span v-if="card.ll_key" class="ll-chip ll-chip-template">ll_key: {{ card.ll_key }}</span>
    <div class="ll-card-header">{{ cardType }}</div>
    <pre class="ll-yaml-dump">{{ yamlDump }}</pre>
  </div>
</template>
