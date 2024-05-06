/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, PropertyValues, CSSResultGroup } from 'lit';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { customElement, property, state } from 'lit/decorators';
import { HomeAssistant, hasConfigOrEntityChanged, getLovelace } from 'custom-card-helpers'; // This is a community maintained npm module with common helper functions/types. https://github.com/custom-cards/custom-card-helpers

import type { Dashboard, DashboardCard, DashboardConfig, LinkedLovelacePartial, LinkedLovelaceStatusCardConfig } from './types';
import './types';
import { localize } from './localize/localize';
import { LinkedLovelaceTemplateCardEditor } from './template-editor';
import { log } from './helpers';
import HassController from './controllers/hass';
import { GlobalLinkedLovelace } from './instance';
import Diff from './helpers/diff';
import {unsafeHTML} from 'lit/directives/unsafe-html.js';


const stringify = (text) => {
  return JSON.stringify(text, null, 2)
}

const getS = (array) => {
  return array.length !== 1 ? 's' : ''
}

const hasDiff = (obj1, obj2) => {
  const differ = new Diff()
  const di = differ.main(stringify(obj1), stringify(obj2), false, 0) 
  return di.length > 1;
}

const makeDiff = (obj1, obj2) => {
  const differ = new Diff()
  const di = differ.main(stringify(obj1), stringify(obj2), false, 0) 
  const result = differ.prettyHtml(di)
  return result;
}

// This puts your card into the UI card picker dialog
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'linked-lovelace-status',
  name: 'Linked Lovelace Status Card',
  description: 'An overview card for Linked Lovelace',
});

const TAB_DASHBOARDS = "dashboards";
const TAB_TEMPLATES = "templates";
const TAB_PARTIALS = "partials";
const TAB_LOGS = "logs";

@customElement('linked-lovelace-status')
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class LinkedLovelaceStatusCard extends LitElement {
  constructor() {
    super();
  }

  @state() private _partials: Record<string, LinkedLovelacePartial> = {};
  @state() private _templates: Record<string, DashboardCard> = {};
  @state() private _dashboards: Record<string,Dashboard> = {};
  @state() private _diffedDashboards: Record<string, string> = {};
  @state() private _backedUpDashboardConfigs: Record<string, DashboardConfig | null | undefined> = {};
  @state() private _backupString: string = "";
  @state() private _loaded = false;
  @state() private _show_difference = false;
  @state() private _show_logs = false;
  @state() private _show_partials = false;
  @state() private _show_templates = false;
  @state() private _difference = "";
  @state() private _tabs = {
    [TAB_DASHBOARDS]: {
      name: "Dashboards"
    },
    [TAB_TEMPLATES]: {
      name: "Templates"
    },
    [TAB_PARTIALS]: {
      name: "Partials"
    },
    [TAB_LOGS]: {
      name: "Logs"
    },
  }
  @state() private _tab = Object.keys(this._tabs)[0] || ""

  private _controller?: HassController = new HassController();

  log(msg, ...values) {
    if (this.config.debug) {
      log(msg, ...values);
    }
  }

  private _repaint() {
    this.loaded = !this.loaded;
  }
  async firstUpdated() {
    // Give the browser a chance to paint
    await new Promise((r) => setTimeout(r, 0));
    this._repaint();
  }

  private handleDryRun = async () => {
    // await this.handleClick()
    const newDashboardConfigs = await this._controller!.updateAll(true)
    this._difference = makeDiff(this._backedUpDashboardConfigs, newDashboardConfigs)
    this._diffedDashboards = {};
    Object.keys(newDashboardConfigs).forEach((dashboardKey) => {
      const dashboardData = newDashboardConfigs[dashboardKey]
      const oldDashboardData = this._backedUpDashboardConfigs[dashboardKey]
      if (hasDiff(oldDashboardData, dashboardData)) {
        this._diffedDashboards[dashboardKey] = makeDiff(oldDashboardData, dashboardData)
      }
    })
    this._repaint()
  }

  private handleClick = async () => {
    this._difference = "";
    const oldForward = this._controller?.forwardLogs || false;
    this._controller = new HassController();
    this._controller.forwardLogs = oldForward;
    this._controller!.addToLogs({msg: "Backing up current dashboard data. Ignore 'Update' Messages. Dry-Run is enabled."})
    const backupDashboardConfigs = {}
    await GlobalLinkedLovelace.instance.api.getDashboards().then(async (dashboards) => {
      return Promise.all(dashboards.map(async (dashboard) => {
        return await GlobalLinkedLovelace.instance.api.getDashboardConfig(dashboard.url_path).then((config) => {
          backupDashboardConfigs[dashboard.url_path ? dashboard.url_path : ''] = config; 
        }).catch((e) => {
          console.error(`Failed to get dashboard at url ${dashboard.url_path}`, dashboard, e)
        });
      }))
    }).catch((e) => {
      console.error(`Failed getting all existing dashboards. Contact developer via Github Issues.`, e)
    });
    this._backedUpDashboardConfigs = backupDashboardConfigs;
    this._backupString = "text/json;charset=utf-8," + encodeURIComponent(stringify(backupDashboardConfigs));
    this._controller!.addToLogs({msg: "Backed up current dashboard data. Download as JSON via button."})
    await this._controller.refresh();
    this._partials = this._controller.linkedLovelaceController.etaController.partials
    this._templates = this._controller.linkedLovelaceController.templateController.templates
    const dashboards = await GlobalLinkedLovelace.instance.api.getDashboards()
    dashboards.forEach((dashboard) => {
      this._dashboards[dashboard.url_path ? dashboard.url_path : ''] = dashboard
    })
    this._controller!.addToLogs({msg: "Determining Changes. Ignore 'Update' Messages. Dry-Run is enabled."})
    await this.handleDryRun()
    this._controller!.addToLogs({msg: "Determined Changes. Ignore 'Update' Messages. Dry-Run is enabled."})
    this._controller!.addToLogs({msg: "Ready for user input."})
    this._loaded = true;
    this._repaint();
  };

  
  

  private toggleShowDryRun = async () => {
    this._show_difference = !this._show_difference;
    this._repaint()
  }

  private toggleShowLogs = async () => {
    this._show_logs = !this._show_logs;
    this._repaint()
  }

  private toggleShowPartials = async () => {
    this._show_partials = !this._show_partials;
    this._repaint()
  }
  private toggleShowTemplates = async () => {
    this._show_templates = !this._show_templates;
    this._repaint()
  }

  private toggleLogs = async () => {
    if (this._controller) {
      this._controller.forwardLogs = !this._controller.forwardLogs;
    }
    this._repaint()
  }

  private overwriteDashboard = async (dashboardKey, skipConfirm = false) => {
    if (skipConfirm || confirm(`This will overwrite the contents of the dashboard located at the url '${window.location.origin}/${dashboardKey}'. Proceed at your own risk. Be sure to back up your system before making changes you are not sure about.`)) {
      const newDashboard = await this._controller!.update(dashboardKey)
      this._repaint()
    }
  }

  private handleRun = async () => {
    if (confirm(`This will overwrite the contents of all modified dashboards. Proceed at your own risk. Be sure to back up your system before making changes you are not sure about.`)) {
      const dashboardKeys = Object.keys(this._diffedDashboards)
      for(let i = 0; i < dashboardKeys.length; i++) {
        await this.overwriteDashboard(dashboardKeys[i], true)
      }
      this._repaint()
    }
  }

  public static async getConfigElement(): Promise<LinkedLovelaceTemplateCardEditor> {
    await import('./status-editor');
    return document.createElement('linked-lovelace-status-editor') as unknown as LinkedLovelaceTemplateCardEditor;
  }

  public static getStubConfig(): Record<string, unknown> {
    return {};
  }

  // TODO Add any properities that should cause your element to re-render here
  // https://lit.dev/docs/components/properties/
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() public loaded = false;

  @state() private config!: LinkedLovelaceStatusCardConfig;

  // https://lit.dev/docs/components/properties/#accessors-custom
  public setConfig(config: LinkedLovelaceStatusCardConfig): void {
    // TODO Check for required fields and that they are of the proper format
    if (!config) {
      throw new Error(localize('common.invalid_configuration'));
    }

    if (config.test_gui) {
      getLovelace().setEditMode(true);
    }

    const name = `Linked Lovelace Status`;

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
    if (changedProps.get('loaded') !== undefined) {
      return true;
    }

    return hasConfigOrEntityChanged(this, changedProps, false);
  }

  // https://lit.dev/docs/components/rendering/
  protected render(): TemplateResult | void {
    //  Finish edit mode
    const editMode = false;
    const diffedDashboardKeys = Object.keys(this._diffedDashboards);
    return html`
      <ha-card .header=${this.config.name} tabindex="0" .label=${`Linked Lovelace Template`}
        class="linked-lovelace-container">
        <div class="card-content">
        <div class="content">
        ${this._loaded ? html`
        <div class="tabs">
        ${Object.keys(this._tabs).map((tabKey) => {
          const tabData = this._tabs[tabKey];
          return html`
            <div class="tab ${this._tab === tabKey ? 'active' : ''}" @click="${() => {this._tab = tabKey; this._repaint()}}">${tabData.name}</div>
          `
        })}
        </div>
        <div>
        <div class="tab-content ${this._tab === TAB_DASHBOARDS ? 'active' : ''}">
        </div>
        <div class="tab-content ${this._tab === TAB_TEMPLATES ? 'active' : ''}">
          <div class="unsafe-html">
          <div class="accordion expanded">
          <span class="accordion-bar" @click=${this.toggleShowTemplates}><span class="icon">${this._show_templates ? html`&#9660;` : html`&#9658;`} </span><span class="title">Templates</span></span>
          </div>
          ${Object.keys(this._controller?.dashboardsToViews || {}).map((dashboardUrl) => {
            const views = this._controller?.dashboardsToViews[dashboardUrl]
            return Object.keys(views || {}).map((viewKey) => {
              const view = views![viewKey]
              const templates = view.templates
              return Object.keys(templates || {}).map((templateKey) => {
                const templateData = templates![templateKey]
              return html`
              <a href="/${dashboardUrl ? dashboardUrl : 'lovelace'}/${view.id}">${templateKey}</a>
              <pre class="${this._show_templates ? '' : 'hidden'}">
              <code>
              ${unsafeHTML(makeDiff(templateData, templateData))}
              </code>
              </pre>
                `
              })
            })
          }
          )}
          </div>
        </div>
        <div class="tab-content ${this._tab === TAB_PARTIALS ? 'active' : ''}">
          <div class="unsafe-html">
          <div class="accordion expanded">
          <span class="accordion-bar" @click=${this.toggleShowPartials}><span class="icon">${this._show_partials ? html`&#9660;` : html`&#9658;`} </span><span class="title">Partials</span></span>
          </div>
          ${Object.keys(this._controller?.dashboardsToViews || {}).map((dashboardUrl) => {
            const views = this._controller?.dashboardsToViews[dashboardUrl]
            return Object.keys(views || {}).map((viewKey) => {
              const view = views![viewKey]
              const partials = view.partials
            return Object.keys(partials || {}).map((partialKey) => {
              const partialData = partials![partialKey]
            return html`
            <a href="/${dashboardUrl ? dashboardUrl : 'lovelace'}/${view.id}">${partialKey}</a>
            <pre class="${this._show_partials ? '' : 'hidden'}">
            <code>
            ${unsafeHTML(makeDiff(partialData, partialData))}
            </code>
            </pre>
              `
            })
            })
          }
          )}
          </div>
        </div>
        <div class="tab-content ${this._tab === TAB_LOGS ? 'active' : ''}">
          <div class="unsafe-html">
          <div class="accordion expanded">
          <span class="accordion-bar" @click=${this.toggleShowLogs}><span class="icon">${this._show_logs ? html`&#9660;` : html`&#9658;`} </span><span class="title">Logs</span></span>
          </div>
          <pre class="${this._show_logs ? '' : 'hidden'}">
          <code>
          ${this._controller?.logs.map((logText) => {
            return html`<p>${logText}</p>`
          })}
          </code>
          </pre>
          </div>
        </div>
        </div>
        `: ''}
        </div>
        ${diffedDashboardKeys.length && this._difference ? html`
        <div class="tab-content ${this._tab === TAB_DASHBOARDS ? 'active' : ''}">
        <div class="unsafe-html">
        <div class="accordion expanded">
        <span class="accordion-bar" @click=${this.toggleShowDryRun}><span class="icon">${this._show_difference ? html`&#9660;` : html`&#9658;`} </span><span class="title">Preview Changes</span></span>
        </div>
        ${this._difference && html`
        ${this._show_difference ? html`<div>
        ${diffedDashboardKeys.map((dashboardKey) => {
          const dashboardData = this._dashboards[dashboardKey]
          const myDiff = this._diffedDashboards[dashboardKey]
          return html`
          <div class="header">
            <p>Dashboard: ${dashboardData.title}</p>
            <ha-progress-button @click=${() => {this.overwriteDashboard(dashboardKey)}}>
                 Update
            </ha-progress-button>
          </div>
          <pre class="${this._show_difference ? '' : 'hidden'}">
          <code>
          ${unsafeHTML(myDiff)}
          </code>
          </pre>
          `
        })}
        </div>` : ''}
        `}
        </div>
        </div>
        ` : ''}
        <div class="card-actions">
          ${!this._loaded ? html`
          <ha-progress-button @click=${this.toggleLogs}>
            ${this._controller?.forwardLogs ? 'Silence Console Logging' : 'Activate Console Logging'}
          </ha-progress-button>
          <ha-progress-button @click=${this.handleClick}>
            Load Data
          </ha-progress-button>
          ` : html`
          <ha-progress-button @click=${this.toggleLogs}>
            ${this._controller?.forwardLogs ? 'Silence Console Logging' : 'Activate Console Logging'}
          </ha-progress-button>
          <ha-progress-button @click=${!editMode ? this.handleClick : undefined}>
            Refresh
          </ha-progress-button>
          
          ${diffedDashboardKeys.length ? html`<ha-progress-button @click=${!editMode ? this.handleRun : undefined}>
            Update All
          </ha-progress-button>` : ''}
          ` }
        </div>
      </ha-card>
    `;
    /*
    <a class="download" href="data:${this._backupString}" download="linked-lovelace-dashboards-backup.json">
          <ha-progress-button>
          Download Backup
          </ha-progress-button>
          </a>
          */
  }

  // https://lit.dev/docs/components/styles/
  static get styles(): CSSResultGroup {
    return css`
      .linked-lovelace-container {
        background-color: rgba(0, 0, 0, 0);
        border: 1px solid;
      }
      .content {
        padding: 0;
      }
      .tab-content {
        display: none;
        &.active {
          display: block;
          padding: 16px 0;
        }
      }
      .tabs {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        .tab {
          padding: 4px 8px;
          cursor: pointer;
          border-left: 0.5px solid var(--text-primary-color);
          border-right: 0.5px solid var(--text-primary-color);
          border-bottom: 1px solid var(--text-primary-color);
          &:not(.active):hover {
            background-color: var(--secondary-background-color);
          }
          &.active {
            background-color: var(--secondary-background-color);
          }
          &.active:hover {
            background-color: var(--fc-button-hover-bg-color);
            cursor: not-allowed;
          }
          &:not(.active):active {
            background-color: var(--fc-button-hover-bg-color);
          }
        }
      }
      .accordion.expanded {
        & .accordion-bar {
          cursor: pointer;
          font-size: 18px;          
        }
        & .icon {
          transform: rotate(-90deg);
        }
      }
      .header {
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
      }
      .download {
        text-decoration: none;
      }
      .unsafe-html {
        pre {
          overflow: auto;
          max-height: 400px;
          background-color: var(--text-primary-color);
          &.hidden {
            display: none;
          }
        }
        code {
          max-width: 100%;
          background-color: var(--text-primary-color);
          color: var(--card-background-color);
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: flex-start;
          p {
            margin: 0;
          }
        }
        del {
          background-color: var(--error-color);
        }
        ins {
          background-color: var(--success-color);
        }
      }
    `;
  }
}
