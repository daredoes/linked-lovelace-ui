// Thin browser wrapper around the real Linked Lovelace engine.
// Everything template-related below is imported straight from `src/` —
// the same code that ships to Home Assistant — so the playground renders
// exactly what a real sync would write back to your dashboards.
import { Eta } from 'eta'
import YAML from 'yaml'
import { updateCardTemplate } from '../../../../src/helpers/templates'
import { TemplateEngine } from '../../../../src/v2/template-engine'
import type { DashboardCard, DashboardConfig } from '../../../../src/types'
import {
  buildDemoDashboardConfig,
  DEMO_DASHBOARD_TITLE,
} from '../../../../src/demoDashboard'

export type { DashboardCard, DashboardConfig }

export interface SyncOutcome {
  config: DashboardConfig
  templates: Record<string, DashboardCard>
  partials: string[]
  logs: string[]
}

interface PlaygroundPartial {
  key?: string
  template?: string
  url?: string
  priority?: number
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

export const demoDashboardTitle = DEMO_DASHBOARD_TITLE

export const defaultDashboardYaml = (): string =>
  YAML.stringify(buildDemoDashboardConfig())

export const parseDashboardYaml = (text: string): DashboardConfig => {
  const parsed = YAML.parse(text)
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.views)) {
    throw new Error('Dashboard config must be a mapping with a `views:` list')
  }
  return parsed as DashboardConfig
}

export const stringifyDashboard = (config: DashboardConfig): string =>
  YAML.stringify(config)

// Mirrors HassController.refresh() + LinkedLovelaceController, minus the
// websocket calls: discover partials and templates from top-level view
// cards, register them in priority order, then re-render every view.
export const syncDashboardConfig = (input: DashboardConfig): SyncOutcome => {
  const logs: string[] = []
  const config = clone(input)

  // Fresh Eta engine, same options the card uses in Home Assistant.
  TemplateEngine.instance.eta = new Eta({ varName: 'context', autoEscape: false })
  const eta = TemplateEngine.instance.eta

  // -- Discover partials and template source cards --------------------------
  const partials: Record<string, PlaygroundPartial> = {}
  const templates: Record<string, DashboardCard> = {}

  config.views?.forEach((view) => {
    view.cards?.forEach((card) => {
      if (card.type === 'custom:linked-lovelace-partials') {
        ;((card.partials as PlaygroundPartial[]) || []).forEach((partial) => {
          if (!partial.key) return
          if (partial.url && !partial.template) {
            logs.push(
              `[WARN] Partial '${partial.key}' uses url: – not fetched in the playground. Use template: instead.`,
            )
            return
          }
          partials[partial.key] = partial
          logs.push(`[INFO] Discovered partial '${partial.key}'`)
        })
      }
      if (card.ll_key) {
        templates[card.ll_key] = card
        logs.push(
          `[INFO] Discovered template '${card.ll_key}' (priority ${card.ll_priority || 0})`,
        )
      }
    })
  })

  // -- Register partials in priority order (EtaTemplateController) ----------
  Object.keys(partials)
    .sort((a, b) => (partials[a].priority || 0) - (partials[b].priority || 0))
    .forEach((key) => {
      try {
        eta.loadTemplate(key, partials[key].template as string)
      } catch (e) {
        logs.push(`[ERROR] Could not load partial '${key}': ${e}`)
      }
    })

  // -- Register templates in priority order (TemplateController) ------------
  const registry: Record<string, DashboardCard> = {}
  Object.keys(templates)
    .sort((a, b) => (templates[a].ll_priority || 0) - (templates[b].ll_priority || 0))
    .forEach((key) => {
      const data = { ...templates[key] }
      delete data.ll_key
      delete data.ll_priority
      registry[key] = updateCardTemplate(clone(data), registry)
      logs.push(`[INFO] Registered template '${key}'`)
    })

  // -- Re-render every view (LinkedLovelaceController.getUpdatedDashboardConfig)
  config.views?.forEach((view) => {
    if (view.cards) {
      view.cards = view.cards.map((card) => updateCardTemplate(clone(card), registry))
    }
    if (Array.isArray(view.sections)) {
      view.sections.forEach((section) => {
        if (Array.isArray(section.cards)) {
          section.cards = section.cards.map((card) =>
            updateCardTemplate(clone(card), registry),
          )
        }
      })
    }
  })

  logs.push(
    `[INFO] Sync complete: ${Object.keys(registry).length} template(s), ${Object.keys(partials).length} partial(s)`,
  )
  return { config, templates: registry, partials: Object.keys(partials), logs }
}
