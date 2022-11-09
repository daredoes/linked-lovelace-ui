/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, CSSResultGroup } from 'lit';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { customElement, property, state } from 'lit/decorators';
import { localize } from './localize/localize';
import './types';
import { log } from './helpers';
import StaticLinkedLovelace from './shared-linked-lovelace';

import { mdiArrowRightBold, mdiArrowDownBold } from '@mdi/js';

@customElement('linked-lovelace-dashboard')
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class LinkedLovelaceViewCard extends LitElement {
  constructor() {
    super();
  }

  log(msg, ...values) {
    if (this.debug) {
      log(msg, ...values);
    }
  }

  // TODO Add any properities that should cause your element to re-render here
  // https://lit.dev/docs/components/properties/
  @property({ attribute: false }) public debug = false;
  @property({ attribute: false }) public key!: string;

  @state() private expanded = true;

  // https://lit.dev/docs/components/lifecycle/#reactive-update-cycle-performing
  protected shouldUpdate(): boolean {
    return true;
  }

  private toggleDashboard = async (urlPath: string) => {
    await StaticLinkedLovelace.linkedLovelace.toggleDashboardAsTemplate(urlPath);
    await StaticLinkedLovelace.instance.getLinkedLovelaceData();
    this.requestUpdate();
  };

  private updateDashboard = async (urlPath: string) => {
    await StaticLinkedLovelace.instance.getLinkedLovelaceData();
    await StaticLinkedLovelace.instance.setDashboardConfig(urlPath);
    await StaticLinkedLovelace.instance.getLinkedLovelaceData();
    this.requestUpdate();
  };

  private _dashboard() {
    return StaticLinkedLovelace.instance.dashboards[this.key];
  }

  private _dashboardConfig() {
    return StaticLinkedLovelace.instance.dashboardConfigs[this._dashboard().url_path];
  }

  protected renderContent(): TemplateResult | void {
    if (this.expanded) {
      const debug = StaticLinkedLovelace.instance.debug;
      const myViews = StaticLinkedLovelace.instance.viewsByDashboard[this.key];
      return html`
        <div class="card-content">
          <div class="lovelace-items-grid">
            ${myViews.map((v) => {
              return html`
                <linked-lovelace-view .dashboardKey=${this.key} .view=${v} .debug=${debug}></linked-lovelace-view>
              `;
            })}
          </div>
        </div>
      `;
    }
  }

  // https://lit.dev/docs/components/rendering/
  protected render(): TemplateResult | void {
    const dashboard = this._dashboard();

    const dryRun = StaticLinkedLovelace.instance.dryRun;
    const dashboardConfig = this._dashboardConfig();

    return html`
      <ha-card raised>
        <ha-settings-row
          @click=${() => {
            this.expanded = !this.expanded;
          }}
        >
          <a
            href=${`/${dashboard.url_path}`}
            @click=${(ev) => {
              ev.stopPropagation();
            }}
            slot="heading"
            >${dashboard.title}</a
          >
          <span slot="description">${dashboardConfig.template ? 'Template ' : ''}Dashboard</span>
          <ha-icon-button
            .label=${this.expanded ? 'Condense' : 'Expand'}
            .path=${this.expanded ? mdiArrowDownBold : mdiArrowRightBold}
          ></ha-icon-button>
        </ha-settings-row>
        ${this.renderContent()}
        <div class="card-actions">
          <ha-progress-button
            .disabled=${dryRun}
            @click=${() => {
              this.toggleDashboard(dashboard.url_path);
            }}
          >
            ${dashboardConfig.template ? 'Disable Template Mode' : 'Enable Template Mode'}
          </ha-progress-button>
          <ha-progress-button
            .disabled=${dryRun}
            @click=${() => {
              this.updateDashboard(dashboard.url_path);
            }}
          >
            ${localize('common.reload_ui')}
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
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        gap: 0.5em;
      }
      .card-header.dashboard {
        font-size: 16px;
        line-height: 24px;
      }
      .card-header.view {
        font-size: 14px;
        line-height: 24px;
      }
      .lovelace-items-grid > div {
        display: flex;
        flex-direction: column;
        flex-wrap: wrap;
        gap: 1em;
        margin-top: 0.75em;
        margin-bottom: 0.75em;
      }
      .lovelace-items-grid .card-content {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        gap: 1em;
      }
      .lovelace-items-grid > ha-card {
        border: 1px solid;
      }
      .lovelace-items-grid .card-content > span {
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
