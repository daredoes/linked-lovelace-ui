/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, PropertyValues, CSSResultGroup } from 'lit';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
import { log } from './helpers';

log(`${localize('common.version')} ${CARD_VERSION}`);

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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class LinkedLovelaceCard extends LitElement {

  constructor() {
    super();
    this.dashboards = {}
    this.dashboardConfigs = {}
    this.templates = {}
    this.views = {}
  }

  log(msg, ...values) {
    if (this.config.debug) {
      log(msg, ...values)
    }
  }

  getDashboardConfigs = async () => {
    const dashboards = await this.linkedLovelace.getDashboards().then(parseDashboards)
    this.log(`Parsed Dashboards`, dashboards)
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
    // this.linkedLovelace = new LinkedLovelace(this.hass, this.config.debug, this.config.dryRun)
  }

  private getLinkedLovelaceData = async () => {
    const response = await this.getDashboardConfigs()
    this.log(`Got Dashboard Configs`, response)
    const { dashboards, views, templates, dashboardsConfigs } = response
    const allTemplates = Object.assign({}, this.templates, templates)
    Object.keys(templates).forEach((templateKey) => {
      this.log(`Updating template '${templateKey}' with other template data`, templates[templateKey])
      templates[templateKey] = this.linkedLovelace.updateTemplate(templates[templateKey], allTemplates)
      this.log(`Updated template '${templateKey}' with other template data`, templates[templateKey])
    })
    this.dashboards = Object.assign({}, this.dashboards, dashboards)
    this.views = Object.assign({}, this.views, views)
    this.templates = Object.assign({}, this.templates, templates)
    Object.keys(dashboardsConfigs).forEach((dashboardId) => {
      const dashboard = dashboardsConfigs[dashboardId]
      const updatedDashboard = this.linkedLovelace.updateTemplate(dashboard, this.templates);
      this.dashboardConfigs[dashboardId] = updatedDashboard as DashboardConfig;
      this.log(`Updated Dashboard Data (original) (updated)'${dashboardId}'`, dashboard, updatedDashboard)
    })
    this.log(`Updated dashboards, dashboard configs, views, templates`, this.dashboards, this.dashboardConfigs, this.views, this.templates)
  }

  private updateLinkedLovelace = async () => {
    await Promise.all(Object.keys(this.dashboardConfigs).map(async (dashboardId) => {
      const dashboard = this.dashboardConfigs[dashboardId]
      return this.linkedLovelace.setDashboardConfig(dashboardId, dashboard)
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
  @state() public dashboardConfigs: Record<string, DashboardConfig>;

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

    const name = `${config.name || 'Linked Lovelace'}${config.debug ? `${config.debugText || ' (Debug)'}` : ''}`

    this.config = {
      ...config,
      name
    };
  }

  // https://lit.dev/docs/components/lifecycle/#reactive-update-cycle-performing
  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (!this.config) {
      return false;
    }
    if (!this.hass) {
      return false;
    }
    if (!this.linkedLovelace) {
      this.linkedLovelace = new LinkedLovelace(this.hass, this.config.debug, this.config.dryRun)
      this.getLinkedLovelaceData()
      return false;
    }

    return hasConfigOrEntityChanged(this, changedProps, false);
  }

  protected renderTemplates(): TemplateResult | void {
    return html`
      <div>
        <h4>Templates</h4>
        <h5>${Object.keys(this.templates).join(", ")}</h5>
      </div>
    `;
  }

  protected renderDashboards(): TemplateResult | void {
    return html`
      <div>
        <h4>Dashboards</h4>
        <h5>${Object.keys(this.dashboardConfigs).join(", ")}</h5>
      </div>
    `;
  }

  protected renderViews(): TemplateResult | void {
    return html`
      <div>
        <h4>Views</h4>
        <h5>${Object.keys(this.views).join(", ")}</h5>
      </div>
    `;
  }

  protected renderLinkedLoveData(): TemplateResult | void {
    return html`
      <div>
        ${this.renderTemplates()}
        ${this.renderDashboards()}
        ${this.renderViews()}
      </div>
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
        ${this.renderLinkedLoveData()}
        <ha-progress-button
          @click=${this.updateLinkedLovelace}
          >
          ${localize(this.config.dryRun ? 'common.reload' : 'common.reload_ui')}
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
