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
  @state() private _difference = "";

  private _controller?: HassController;

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
    this._controller = new HassController();
    this._controller!.addToLogs("Backing up current dashboard data. Ignore 'Update' Messages. Dry-Run is enabled.")
    const backupDashboardConfigs = {}
    await GlobalLinkedLovelace.instance.api.getDashboards().then(async (dashboards) => {
      return Promise.all(dashboards.map(async (dashboard) => {
        const config =  await GlobalLinkedLovelace.instance.api.getDashboardConfig(dashboard.url_path);
        backupDashboardConfigs[dashboard.url_path ? dashboard.url_path : ''] = config; 
        return config;
      }))
    });
    this._backedUpDashboardConfigs = backupDashboardConfigs;
    this._backupString = "text/json;charset=utf-8," + encodeURIComponent(stringify(backupDashboardConfigs));
    this._controller!.addToLogs("Backed up current dashboard data. Download as JSON via button.")
    await this._controller.refresh();
    this._partials = this._controller.linkedLovelaceController.etaController.partials
    this._templates = this._controller.linkedLovelaceController.templateController.templates
    const dashboards = await GlobalLinkedLovelace.instance.api.getDashboards()
    dashboards.forEach((dashboard) => {
      this._dashboards[dashboard.url_path ? dashboard.url_path : ''] = dashboard
    })
    this._controller!.addToLogs("Determining Changes. Ignore 'Update' Messages. Dry-Run is enabled.")
    await this.handleDryRun()
    this._controller!.addToLogs("Determined Changes. Ignore 'Update' Messages. Dry-Run is enabled.")
    this._controller!.addToLogs("Ready for user input.")
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
    const partialKeys = Object.keys(this._partials);
    const templateKeys = Object.keys(this._templates);
    const dashboardKeys = Object.keys(this._dashboards);
    const diffedDashboardKeys = Object.keys(this._diffedDashboards);
    return html`
      <ha-card .header=${this.config.name} tabindex="0" .label=${`Linked Lovelace Template`}
        class="linked-lovelace-container">
        <div class="card-content">
        <div>
        ${this._loaded ? html`
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
        `: ''}
        <ul>
        <li>${this._loaded ? 'Parsed' : 'Waiting to Parse'} Dashboards for Partials</li>
        ${this._loaded ? html`<ul><li>Found ${partialKeys.length} Partial${getS(partialKeys)}</li></ul>` : ''}
        <li>${this._loaded ? 'Parsed' : 'Waiting to Parse'} Dashboards for Templates</li>
        ${this._loaded ? html`<ul><li>Found ${templateKeys.length} Template${getS(templateKeys)}</li></ul>` : ''}
        <li>${this._loaded ? 'Retrieved' : 'Waiting to Retrieve'} Dashboards via Websocket</li>
        ${this._loaded ? html`
        <ul>
        <li>
        <div class="header">
        <span>Can Modify ${diffedDashboardKeys.length}/${dashboardKeys.length} Dashboard${getS(diffedDashboardKeys)}</span>
        </div>
        </li>
        </ul>` : ''}
        </ul>
        </div>
        ${diffedDashboardKeys.length ? html`
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
        ` : ''}
        <div class="card-actions">
          ${!this._loaded ? html`<ha-progress-button @click=${this.handleClick}>
            Load Data
          </ha-progress-button>` : html`
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
