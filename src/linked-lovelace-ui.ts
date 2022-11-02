/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, PropertyValues, CSSResultGroup } from 'lit';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { customElement, property, state } from 'lit/decorators';
import { HomeAssistant, hasConfigOrEntityChanged, LovelaceCardEditor, getLovelace } from 'custom-card-helpers'; // This is a community maintained npm module with common helper functions/types. https://github.com/custom-cards/custom-card-helpers

import type { Dashboard, DashboardCard, DashboardConfig, DashboardView, LinkedLovelaceCardConfig } from './types';
import './types';
import { CARD_VERSION } from './const';
import { localize } from './localize/localize';
import { LinkedLovelaceCardEditor } from './editor';
import LinkedLovelace from './linked-lovelace';
import { log } from './helpers';

log(`${localize('common.version')} ${CARD_VERSION}`);

// This puts your card into the UI card picker dialog
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'linked-lovelace-ui',
  name: 'Linked Lovelace Card',
  description: 'A card that handles Linked Lovelace',
});

const getTemplatesUsedInCard = (card: DashboardCard): string[] => {
  if (card.template) {
    return [card.template];
  }
  if (card.cards) {
    return card.cards.flatMap((c) => {
      return getTemplatesUsedInCard(c);
    });
  }
  return [];
};

const getTemplatesUsedInView = (view: DashboardView): string[] => {
  return (
    view.cards?.flatMap((c) => {
      return getTemplatesUsedInCard(c);
    }) || []
  );
};

const parseDashboards = (data) => {
  const dashboards: Record<string, Dashboard> = {};
  data.forEach((dashboard) => {
    if (dashboard.mode == 'storage') {
      dashboards[dashboard.id] = dashboard;
    }
  });
  return dashboards;
};

const parseDashboardGenerator = (dashboardId, dashboardUrl) => {
  const func = async (dashboardConfig: DashboardConfig) => {
    const response = {
      templates: {},
      dashboard: dashboardConfig,
      views: {},
      dashboardId,
      dashboardUrl,
    };
    if (dashboardConfig.template) {
      dashboardConfig.views.forEach((view) => {
        if (view.cards?.length == 1) {
          response.templates[`${view.path}`] = view.cards[0];
        }
      });
    }
    dashboardConfig.views.forEach((view) => {
      response.views[`${dashboardId}${view.path ? `.${view.path}` : ''}`] = view;
    });
    dashboardConfig.views = Object.values(response.views);
    return response;
  };
  return func;
};

@customElement('linked-lovelace-ui')
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class LinkedLovelaceCard extends LitElement {
  constructor() {
    super();
    this.dashboards = {};
    this.dashboardConfigs = {};
    this.templates = {};
    this.views = {};
    this.templatesToViews = {};
  }

  log(msg, ...values) {
    if (this.config.debug) {
      log(msg, ...values);
    }
  }

  parseDashboardConfigs = async (dashboards: Record<string, Dashboard>) => {
    const responses = await Promise.all(
      Object.keys(dashboards).map(async (dashboardId) => {
        const dashboard = dashboards[dashboardId];
        return await this.parseDashboardConfig(dashboard);
      }),
    );
    return responses;
  };

  parseDashboardConfig = async (dashboard: Dashboard) => {
    return await this.linkedLovelace
      .getDashboardConfig(dashboard.url_path)
      .then(parseDashboardGenerator(dashboard.id, dashboard.url_path));
  };

  flattenParsedDashboardConfigs = (responses) => {
    const templates = {};
    const views = {};
    const dashboardConfigs = {};
    responses.forEach((response) => {
      Object.assign(templates, response.templates);
      Object.assign(views, response.views);
      dashboardConfigs[response.dashboardUrl] = response.dashboard;
    });
    const response = {
      templates,
      views,
      dashboardConfigs,
    };
    return response;
  };

  getDashboardConfigs = async () => {
    const dashboards: Record<string, Dashboard> = await this.linkedLovelace.getDashboards().then(parseDashboards);
    this.log(`Parsed Dashboards`, dashboards);
    const responses = await this.parseDashboardConfigs(dashboards);
    const flattenedResponses = this.flattenParsedDashboardConfigs(responses);
    return {
      dashboards,
      ...flattenedResponses,
    };
  };

  async firstUpdated() {
    // Give the browser a chance to paint
    await new Promise((r) => setTimeout(r, 0));
    this.linkedLovelace = new LinkedLovelace(this.hass, this.config.debug, this.config.dryRun);
    await this.getLinkedLovelaceData();
    this.loaded = true;
  }

  private _updateTemplates = (templates: Record<string, DashboardCard>) => {
    const tmplts = templates;
    const allTemplates = Object.assign({}, this.templates, templates);
    Object.keys(templates).forEach((templateKey) => {
      this.log(`Updating template '${templateKey}' with other template data`, templates[templateKey]);
      tmplts[templateKey] = this.linkedLovelace.updateTemplate(tmplts[templateKey], allTemplates) as DashboardCard;
      this.log(`Updated template '${templateKey}' with other template data`, templates[templateKey]);
    });
    this.templates = Object.assign({}, this.templates, templates);
  };

  private _updateDashboards = (dashboards: Record<string, Dashboard>) => {
    this.dashboards = Object.assign({}, this.dashboards, dashboards);
  };

  private _updateViews = (views: Record<string, DashboardView>) => {
    this.views = Object.assign({}, this.views, views);
  };

  private _updateDashboardConfigs = (dashboardConfigs: Record<string, DashboardConfig>) => {
    Object.keys(dashboardConfigs).forEach((dashboardId) => {
      const dashboard = dashboardConfigs[dashboardId];
      const updatedDashboard = this.linkedLovelace.updateTemplate(dashboard, this.templates);
      this.dashboardConfigs[dashboardId] = updatedDashboard as DashboardConfig;
      this.log(`Updated Dashboard Data (original) (updated)'${dashboardId}'`, dashboard, updatedDashboard);
    });
  };

  private _updateFromLatest = async () => {
    const response = await this.getDashboardConfigs();
    this.log(`Got Dashboard Configs`, response);
    const { dashboards, views, templates, dashboardConfigs } = response;
    this._updateTemplates(templates);
    this._updateDashboards(dashboards);
    this._updateViews(views);
    this._updateDashboardConfigs(dashboardConfigs);
  };

  private _getTemplatesUsedInViews = (views: Record<string, DashboardView>) => {
    Object.keys(views).forEach((viewKey) => {
      const view = this.views[viewKey];
      const templates = getTemplatesUsedInView(view);
      templates.forEach((template) => {
        if (!this.templatesToViews[template]) {
          this.templatesToViews[template] = {};
        }
        this.templatesToViews[template][viewKey] = true;
      });
    });
  };

  private getLinkedLovelaceData = async () => {
    await this._updateFromLatest();
    this._getTemplatesUsedInViews(this.views);
  };

  private updateLinkedLovelace = async () => {
    await Promise.all(
      Object.keys(this.dashboardConfigs).map(async (dashboardId) => {
        const dashboard = this.dashboardConfigs[dashboardId];
        return this.linkedLovelace.setDashboardConfig(dashboardId, dashboard);
      }),
    );
  };

  private handleClick = async () => {
    await this.getLinkedLovelaceData();
    await this.updateLinkedLovelace();
    this.requestUpdate();
  };

  private toggleDashboard = async (urlPath: string) => {
    await this.linkedLovelace.toggleDashboardAsTemplate(urlPath);
    await this._updateFromLatest();
    this.requestUpdate();
  };

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
  @state() public loaded = false;

  @property({ attribute: false }) public linkedLovelace!: LinkedLovelace;

  @state() public templates: Record<string, DashboardCard>;
  @state() public templatesToViews: Record<string, Record<string, boolean>>;
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

    const name = `${config.name || 'Linked Lovelace'}${config.debug ? `${config.debugText || ' (Debug)'}` : ''}`;

    this.config = {
      ...config,
      name,
    };
  }

  // https://lit.dev/docs/components/lifecycle/#reactive-update-cycle-performing
  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (!this.config) {
      return false;
    }

    if (changedProps.has('dashboards') || changedProps.has('views') || changedProps.has('templates')) {
      return true;
    }
    return hasConfigOrEntityChanged(this, changedProps, false);
  }

  protected renderTemplates(): TemplateResult | void {
    return html`
      <div>
        <span class="lovelace-items-header">${localize('common.headers.templates')}</span>
        <div class="lovelace-items-grid">
          ${Object.keys(this.templatesToViews).map((templateKey) => {
            const myViews = Object.keys(this.templatesToViews[templateKey]);
            return html`
              <div>
                <span>${templateKey}</span>
                <div>
                  ${myViews.map((v) => {
                    return html` <span>${v}</span> `;
                  })}
                </div>
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }

  protected renderViews(): TemplateResult | void {
    const views: Record<string, DashboardView[]> = {};
    Object.keys(this.views).forEach((viewKey) => {
      const view = this.views[viewKey];
      const key = viewKey.split('.', 1)[0];
      if (!views[key]) {
        views[key] = [];
      }
      views[key].push(view);
    });
    return html`
      <div>
        <span class="lovelace-items-header">${localize('common.headers.dashboards')}</span>
        <div class="lovelace-items-grid">
          ${Object.keys(views).map((dashboardKey) => {
            const myViews = views[dashboardKey];
            const dashboardConfig = this.dashboardConfigs[this.dashboards[dashboardKey].url_path];
            return html`
              <div>
                <span>${this.dashboards[dashboardKey].title}</span>
                <mwc-formfield .label=${`Template Dashboard`}>
                  <ha-switch
                    .disabled=${this.config.dryRun}
                    @change=${() => {
                      this.toggleDashboard(this.dashboards[dashboardKey].url_path);
                    }}
                    .checked=${dashboardConfig.template}
                  ></ha-switch>
                </mwc-formfield>
                <div>
                  ${myViews.map((v) => {
                    return html` <span>${v.title}</span> `;
                  })}
                </div>
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }

  protected renderLinkedLovelaceData(): TemplateResult | void {
    return html`
      <div>
        <hr />
        ${this.renderTemplates()}
        <hr />
        ${this.renderViews()}
      </div>
    `;
  }

  // https://lit.dev/docs/components/rendering/
  protected render(): TemplateResult | void {
    return html`
      <ha-card .header=${this.config.name} tabindex="0" .label=${`Linked Lovelace Reloader`}>
        <div class="card-content">${this.renderLinkedLovelaceData()}</div>
        <div class="card-actions">
          ${!this.config.dryRun
            ? html`
                <ha-progress-button @click=${this.getLinkedLovelaceData}>
                  ${localize('common.reload')}
                </ha-progress-button>
              `
            : ''}
          <ha-progress-button @click=${this.handleClick}>
            ${localize(this.config.dryRun ? 'common.reload' : 'common.reload_ui')}
          </ha-progress-button>
        </div>
      </ha-card>
    `;
  }

  // https://lit.dev/docs/components/styles/
  static get styles(): CSSResultGroup {
    return css`
      .lovelace-items-header {
        font-weight: bolder;
        font-size: large;
      }
      .lovelace-dashboard-template {
        font-weight: bolder;
      }
      .lovelace-items-grid {
        display: flex;
        flex-direction: column;
      }
      .lovelace-items-grid > div {
        display: flex;
        flex-direction: column;
        flex-wrap: wrap;
        gap: 1em;
        margin-top: 0.75em;
        margin-bottom: 0.75em;
      }
      .lovelace-items-grid > div > div {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        gap: 1em;
      }
      .lovelace-items-grid > div > div > span {
        border-radius: 5px;
        padding: 2px;
        border: 1px solid;
      }
      .linked-lovelace-config {
        display: flex;
        flex-direction: column;
      }
      .linked-lovelace-config > * {
        margin-top: 10px;
        margin-bottom: 10px;
      }
      mwc-select,
      mwc-textfield {
        margin-bottom: 16px;
        display: block;
      }
      mwc-formfield {
        padding-bottom: 8px;
      }
      mwc-switch {
        --mdc-theme-secondary: var(--switch-checked-color);
      }
    `;
  }
}
