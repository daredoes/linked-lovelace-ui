/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, PropertyValues, CSSResultGroup } from 'lit';
 
import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant, hasConfigOrEntityChanged, getLovelace } from 'custom-card-helpers'; // This is a community maintained npm module with common helper functions/types. https://github.com/custom-cards/custom-card-helpers

import type { Dashboard, DashboardCard, DashboardConfig, LinkedLovelacePartial, LinkedLovelaceStatusCardConfig } from './types';
import './types';
import { localize } from './localize/localize';
import { log } from './helpers';
import HassController from './controllers/hass';
import { GlobalLinkedLovelace } from './instance';
import Diff from './helpers/diff';
import {unsafeHTML} from 'lit/directives/unsafe-html.js';


const stringify = (text) => {
  return JSON.stringify(text, null, 2)
}

const createDiff = (obj1 = {}, obj2 = {}) => {
  try {

    const differ = new Diff()
    const di = differ.main(stringify(obj1), stringify(obj2), false, 0) 
    return di;
  } catch (e) {
    console.error(e)
    return []
  }
}

// Templates and partials are not diffs, but running them through the same
// pretty-printer keeps their formatting identical to the dashboard previews.
const prettyPrint = (obj = {}) => makeDiff(obj, obj)

const hasDiff = (obj1 = {}, obj2 = {}) => {
  const di = createDiff(obj1, obj2)
  return di.length > 1;
}

const makeDiff = (obj1 = {}, obj2 = {}) => {
  try {
    const differ = new Diff()
    const diff = createDiff(obj1, obj2)
    const result = differ.prettyHtml(diff)
    return result;
  } catch (e) {
    console.error(e)
    return `Could not create diff. Check browser logs for details.`
  }
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
 
export class LinkedLovelaceStatusCard extends LitElement {
  constructor() {
    super();
  }

  @state() private _partials: Record<string, LinkedLovelacePartial> = {};
  @state() private _templates: Record<string, DashboardCard> = {};
  @state() private _dashboards: Record<string,Dashboard> = {};
  @state() private _diffedDashboards: Record<string, string> = {};
  @state() private _backedUpDashboardConfigs: Record<string, DashboardConfig | null | undefined> = {};
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
      try {
        if (oldDashboardData && dashboardData && hasDiff(oldDashboardData, dashboardData)) {
          this._diffedDashboards[dashboardKey] = makeDiff(oldDashboardData, dashboardData)
        }
      } catch {
        console.error(`Failed to make Diff of dashboard '${dashboardKey}'`, oldDashboardData, dashboardData, dashboardKey)
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

  // Dashboard titles are nicer than url paths, and the overview dashboard has
  // no path at all.
  private dashboardName(dashboardKey: string): string {
    return this._dashboards[dashboardKey]?.title || dashboardKey || 'Overview';
  }

  // The configs read before any write, offered as a file so a sync can be
  // undone by pasting them back into the raw configuration editor. Built as a
  // Blob: a full set of dashboards is far past what a data: URI can carry.
  private handleDownloadBackup = () => {
    const blob = new Blob([stringify(this._backedUpDashboardConfigs)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `linked-lovelace-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  private overwriteDashboard = async (dashboardKey, skipConfirm = false) => {
    if (skipConfirm || confirm(`This will overwrite the contents of the dashboard located at the url '${window.location.origin}/${dashboardKey}'. Proceed at your own risk. Be sure to back up your system before making changes you are not sure about.`)) {
      await this._controller!.update(dashboardKey)
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

  // The card takes no options, so Home Assistant falls back to its YAML editor.
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
              <div class="entry">
                <div class="header">
                  <a class="entry-name" href="/${dashboardUrl ? dashboardUrl : 'lovelace'}/${view.id}">${templateKey}</a>
                  <span class="entry-source">${this.dashboardName(dashboardUrl)}</span>
                </div>
                <pre class="${this._show_templates ? '' : 'hidden'}"><code>${unsafeHTML(prettyPrint(templateData))}</code></pre>
              </div>
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
            <div class="entry">
              <div class="header">
                <a class="entry-name" href="/${dashboardUrl ? dashboardUrl : 'lovelace'}/${view.id}">${partialKey}</a>
                <span class="entry-source">${this.dashboardName(dashboardUrl)}</span>
              </div>
              <pre class="${this._show_partials ? '' : 'hidden'}"><code>${unsafeHTML(prettyPrint(partialData))}</code></pre>
            </div>
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
          <pre class="${this._show_logs ? '' : 'hidden'}"><code>${this._controller?.logs.map((logText) => html`<p>${logText}</p>`)}</code></pre>
          </div>
        </div>
        </div>
        `: ''}
        </div>
        ${this._loaded ? html`
        <div class="tab-content ${this._tab === TAB_DASHBOARDS ? 'active' : ''}">
        ${diffedDashboardKeys.length ? html`
        <div class="dashboard-list">
        ${diffedDashboardKeys.map((dashboardKey) => {
          return html`
          <div class="header">
            <p class="dashboard-name">${this.dashboardName(dashboardKey)}</p>
            <ha-progress-button @click=${() => {this.overwriteDashboard(dashboardKey)}}>
                 Update
            </ha-progress-button>
          </div>
          `
        })}
        </div>
        <div class="unsafe-html">
        <div class="accordion expanded">
        <span class="accordion-bar" @click=${this.toggleShowDryRun}><span class="icon">${this._show_difference ? html`&#9660;` : html`&#9658;`} </span><span class="title">Preview Changes</span></span>
        </div>
        ${this._show_difference ? html`<div>
        ${diffedDashboardKeys.map((dashboardKey) => {
          return html`
          <div class="entry">
            <p class="entry-name">${this.dashboardName(dashboardKey)}</p>
            <pre><code>${unsafeHTML(this._diffedDashboards[dashboardKey])}</code></pre>
          </div>
          `
        })}
        </div>` : ''}
        </div>
        ` : html`<p class="in-sync">Every dashboard is already up to date. Nothing to update.</p>`}
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
          <ha-progress-button @click=${this.handleDownloadBackup}>
            Download Backup
          </ha-progress-button>
          ${diffedDashboardKeys.length ? html`<ha-progress-button @click=${!editMode ? this.handleRun : undefined}>
            Update All
          </ha-progress-button>` : ''}
          ` }
        </div>
      </ha-card>
    `;
  }

  // https://lit.dev/docs/components/styles/
  static get styles(): CSSResultGroup {
    return css`
      .linked-lovelace-container {
        background: var(--ha-card-background, var(--card-background-color));
        border: 1px solid var(--divider-color);
        border-radius: var(--ha-card-border-radius, 12px);
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
        gap: 4px;
        border-bottom: 1px solid var(--divider-color);
        .tab {
          padding: 8px 14px;
          cursor: pointer;
          border: 1px solid transparent;
          border-bottom: none;
          border-radius: 8px 8px 0 0;
          color: var(--secondary-text-color);
          font-weight: 500;
          transition: background-color 120ms ease, color 120ms ease;
          &:hover {
            background-color: var(--secondary-background-color);
            color: var(--primary-text-color);
          }
          &.active {
            background-color: var(--secondary-background-color);
            border-color: var(--divider-color);
            color: var(--primary-color);
            box-shadow: inset 0 -2px 0 0 var(--primary-color);
          }
        }
      }
      .accordion.expanded {
        & .accordion-bar {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          padding: 4px 0;
          font-size: 18px;
          color: var(--primary-text-color);
          &:hover {
            color: var(--primary-color);
          }
        }
        & .icon {
          color: var(--secondary-text-color);
          font-size: 14px;
        }
      }
      .header {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        margin-top: 8px;
      }
      .dashboard-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-bottom: 8px;
      }
      .dashboard-name {
        margin: 0;
        font-weight: 500;
      }
      /* One rendered block per template, partial, or dashboard preview: a name
         row above a code surface. The three tabs share it so a template reads
         the same way as a dashboard diff. */
      .entry {
        margin-top: 12px;
      }
      .entry .header {
        margin: 0 0 2px;
      }
      .entry-name {
        margin: 0;
        font-weight: 500;
        font-size: 15px;
        color: var(--primary-text-color);
        text-decoration: none;
      }
      a.entry-name {
        color: var(--primary-color);
        &:hover {
          text-decoration: underline;
        }
      }
      .entry-source {
        color: var(--secondary-text-color);
        font-size: 12px;
      }
      .in-sync {
        margin: 0;
        color: var(--secondary-text-color);
      }
      /* Code blocks follow the theme's own code surface. The previous rules
         painted them with --text-primary-color, which is the color for text
         *on* a primary-colored background (white in most themes), so the
         blocks stayed light no matter which theme was active. */
      .unsafe-html {
        a {
          color: var(--primary-color);
        }
        pre {
          overflow: auto;
          max-height: 400px;
          margin: 4px 0 12px;
          padding: 10px 12px;
          border: 1px solid var(--divider-color);
          border-radius: 8px;
          background-color: var(--markdown-code-background-color, var(--secondary-background-color));
          &.hidden {
            display: none;
          }
        }
        code {
          max-width: 100%;
          background-color: transparent;
          color: var(--primary-text-color);
          font-family: var(--code-font-family, ui-monospace, SFMono-Regular, Menlo, monospace);
          font-size: 0.85em;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: flex-start;
          p {
            margin: 0;
          }
        }
        del,
        ins {
          border-radius: 3px;
          padding: 0 2px;
          color: var(--text-primary-color);
        }
        del {
          background-color: var(--error-color);
        }
        ins {
          background-color: var(--success-color);
          text-decoration: none;
        }
        /* Where color-mix is available, tint the theme's error and success
           colors instead of filling with them, so a long changed block stays
           readable rather than turning into a solid slab. */
        @supports (background-color: color-mix(in srgb, red 20%, transparent)) {
          del,
          ins {
            color: var(--primary-text-color);
          }
          del {
            background-color: color-mix(in srgb, var(--error-color) 22%, transparent);
          }
          ins {
            background-color: color-mix(in srgb, var(--success-color) 24%, transparent);
          }
        }
      }
    `;
  }
}
