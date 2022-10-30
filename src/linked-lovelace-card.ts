/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, PropertyValues, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators';
import {
  HomeAssistant,
  hasConfigOrEntityChanged,
  LovelaceCardEditor,
  getLovelace,
} from 'custom-card-helpers'; // This is a community maintained npm module with common helper functions/types. https://github.com/custom-cards/custom-card-helpers

import type { Dashboard, DashboardCard, DashboardConfig, DashboardView, LinkedLovelaceCardConfig } from './types';
import './types'
import { CARD_VERSION } from './const';
import { localize } from './localize/localize';
import { LinkedLovelaceCardEditor } from './editor';
import LinkedLovelace from './linked-lovelace';

/* eslint no-console: 0 */
console.info(
  `%c  LINKED-LOVELACE-CARD \n%c  ${localize('common.version')} ${CARD_VERSION}    `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

// This puts your card into the UI card picker dialog
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'linked-lovelace',
  name: 'Linked Lovelace Card',
  description: 'A card that handles Linked Lovelace',
});

const parseDashboards = (data) => {
  const dashboards: Record<string, Dashboard> = {}
        data.forEach((dashboard) => {
            dashboards[dashboard.id] = dashboard
        })
        return dashboards
}

const parseDashboardGenerator = (dashboardId, dashboardUrl) => {
  const func = async (dashboardConfig: DashboardConfig) => {
    const response = {
      templates: {},
      dashboard: dashboardConfig,
      views: {},
      dashboardId,
      dashboardUrl
    }
    if (dashboardConfig.template) {
      dashboardConfig.views.forEach((view) => {
            if (view.cards?.length == 1) {
              response.templates[`${view.path}`] = view.cards[0]
            }
        })
    }
    dashboardConfig.views.forEach((view) => {
      response.views[`${dashboardId}${view.path ? `.${view.path}`: ''}`] = view
    })
    dashboardConfig.views = Object.values(response.views)
    return response
  }
  return func
}

@customElement('linked-lovelace')
export class LinkedLovelaceCard extends LitElement {

  constructor() {
    super();
    this.dashboards = {}
    this.templates = {}
    this.views = {}
  }

  getDashboardConfigs = async () => {
    const dashboards = await this.linkedLovelace.getDashboards().then(parseDashboards)
    const responses = await Promise.all(Object.keys(dashboards).map(async (dashboardId) => {
        const dashboard = dashboards[dashboardId]
        return await this.linkedLovelace.getDashboardConfig(dashboard.url_path).then(parseDashboardGenerator(dashboardId, dashboard.url_path))
    }))
    const templates = {}
    const views = {}
    const dashboardsConfigs = {}
    responses.forEach((response) => {
      Object.assign(templates, response.templates)
      Object.assign(views, response.views)
      dashboardsConfigs[response.dashboardUrl] = response.dashboard
    })
    const response = {
      templates, views, dashboards, dashboardsConfigs
    }
    return response
}


  async firstUpdated() {
    // Give the browser a chance to paint
    await new Promise((r) => setTimeout(r, 0));
    this.linkedLovelace = new LinkedLovelace(this.hass)

  }

  private updateLinkedLovelace = async () => {
    const response = await this.getDashboardConfigs()
    const { dashboards, views, templates, dashboardsConfigs } = response
    const allTemplates = Object.assign({}, this.templates, templates)
    Object.keys(templates).forEach((templateKey) => {
      templates[templateKey] = this.linkedLovelace.updateTemplate(templates[templateKey], allTemplates)
    })
    this.dashboards = Object.assign({}, this.dashboards, dashboards)
    this.views = Object.assign({}, this.views, views)
    this.templates = Object.assign({}, this.templates, templates)
    await Promise.all(Object.keys(dashboardsConfigs).map(async (dashboardId) => {
      const dashboard = dashboardsConfigs[dashboardId]
      const updatedDashboard = this.linkedLovelace.updateTemplate(dashboard, this.templates);
      return this.linkedLovelace.setDashboardConfig(dashboardId, updatedDashboard)
    }))
  }

  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import('./editor');
    return document.createElement('linked-lovelace-editor') as LinkedLovelaceCardEditor;
  }

  public static getStubConfig(): Record<string, unknown> {
    return {};
  }

  // TODO Add any properities that should cause your element to re-render here
  // https://lit.dev/docs/components/properties/
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public linkedLovelace!: LinkedLovelace;

  @state() public templates: Record<string, DashboardCard>;
  @state() public views: Record<string, DashboardView>;
  @state() public dashboards: Record<string, Dashboard>;
  @state() private templateCount = 0;

  @state() private config!: LinkedLovelaceCardConfig;

  // https://lit.dev/docs/components/properties/#accessors-custom
  public setConfig(config: LinkedLovelaceCardConfig): void {
    // TODO Check for required fields and that they are of the proper format
    if (!config) {
      throw new Error(localize('common.invalid_configuration'));
    }

    if (config.test_gui) {
      getLovelace().setEditMode(true);
    }

    this.config = {
      name: 'Linked Lovelace',
      ...config,
    };
  }

  // https://lit.dev/docs/components/lifecycle/#reactive-update-cycle-performing
  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (!this.config) {
      return false;
    }

    return hasConfigOrEntityChanged(this, changedProps, false);
  }

  protected renderTemplates(): TemplateResult | void {
    return html`
    <span>Templates: ${this.templateCount}</span>
    `;
  }

  // https://lit.dev/docs/components/rendering/
  protected render(): TemplateResult | void {
    return html`
      <ha-card
        .header=${this.config.name}
        tabindex="0"
        .label=${`Linked Lovelace Reloader`}
      >
      <div class="card-content">
        <ha-progress-button
          @click=${this.updateLinkedLovelace}
          >
          ${localize('common.reload')}
        </ha-progress-button>
      </div>
    </ha-card>
    `;
  }


  // https://lit.dev/docs/components/styles/
  static get styles(): CSSResultGroup {
    return css``;
  }
}
