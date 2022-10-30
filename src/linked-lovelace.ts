/* eslint-disable @typescript-eslint/no-explicit-any */
import { HomeAssistant } from "custom-card-helpers"
import { log } from "./helpers"
import { Dashboard, DashboardCard, DashboardConfig, DashboardView } from "./types"

class LinkedLovelace {
    templates: Record<string, DashboardCard> = {}
    views: Record<string, DashboardView> = {}
    dashboards: Record<string, Dashboard> = {}
    hass!: HomeAssistant
    debug = false;
    dryRun = false;

    constructor(hass: HomeAssistant, debug = false, dryRun = false) {
        this.hass = hass
        this.debug = debug;
        this.dryRun = dryRun;
    }

    updateTemplate = (data: DashboardConfig | DashboardCard, templateData = {}): DashboardCard | DashboardConfig => {
        // Check if data is top-level config, or card config
        if (data.views && data.views.length) {
            const views: DashboardView[] = []
            // Iterate through each view in top-level config
            data.views.forEach((view: DashboardView) => {
                const cards: DashboardCard[] = []
                if (view.cards) {
                    // For every card in the config, store a copy of the rendered card
                    view.cards.forEach((card) => {
                        cards.push(Object.assign({}, this.updateTemplate(card, templateData) as DashboardCard))
                    })
                    // Replace the cards in the view
                    view.cards = cards
                }
                views.push(Object.assign({}, view))
            })
            // Replace the views in the config
            data.views = views
            return data;
        } else {
            // Get key and data for template
            const templateKey = data.template
            const dataFromTemplate: Record<string, any> = data.template_data || {}
            if (templateKey && templateData[templateKey]) {
                if (dataFromTemplate) {
                    // If data in template, find and replace each key
                    let template = JSON.stringify(templateData[templateKey])
                    Object.keys(dataFromTemplate).forEach((key) => {
                        template = template.replaceAll(`\$${key}\$`, dataFromTemplate[key])
                    })
                    try {
                        // Convert rendered string back to JSON
                        data = JSON.parse(template)
                    } catch (e) {
                        console.error(e)
                        // Return original value if parse fails
                        data = templateData[templateKey]
                    }
                    // Put template data back in card
                    data.template_data = dataFromTemplate
                } else {
                    // Put template value as new value
                    data = templateData[templateKey]
                }
                // Put template key back in card
                data.template = templateKey
            }
            if (data.cards) {
                // Update any cards in the card
                const cards: DashboardCard[] = []
                data.cards.forEach((card) => {
                    cards.push(Object.assign({}, this.updateTemplate(card, templateData) as DashboardCard))
                })
                data.cards = cards
            }
            return data;
        }
    }



    getDashboards = async (): Promise<Dashboard[]> => {
        if (this.debug) {
            log('Getting Lovelace User-Created Dashboards')
        }
        return this.hass.callWS<Dashboard[]>({
            type: 'lovelace/dashboards/list'
        })
    }

    getDashboardConfig = async (urlPath: string): Promise<DashboardConfig> => {
        if (this.debug) {
            log(`Getting Lovelace User-Created Dashboard: ${urlPath}`)
        }
        return this.hass.callWS<DashboardConfig>({
            type: 'lovelace/config',
            url_path: urlPath
        })
    }

    setDashboardConfig = async (urlPath: string, config: Record<string, any>): Promise<null> => {
        if (this.debug) {
            log(`${this.dryRun ? 'Not Actually ' : ''}Setting Lovelace User-Created Dashboard: ${urlPath}`, config)
        }
        if (!this.dryRun) {
            return this.hass.callWS({
                type: 'lovelace/config/save',
                url_path: urlPath,
                config: config
            })
        }
        return null;
    }
}

export default LinkedLovelace