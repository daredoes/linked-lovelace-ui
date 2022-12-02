// import replaceAllInserter from 'string.prototype.replaceall';

// replaceAllInserter.shim();
/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, PropertyValues, CSSResultGroup } from 'lit';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { customElement, property, state } from 'lit/decorators';
import { HomeAssistant, hasConfigOrEntityChanged, LovelaceCardEditor, getLovelace } from 'custom-card-helpers'; // This is a community maintained npm module with common helper functions/types. https://github.com/custom-cards/custom-card-helpers

import type { DashboardView, LinkedLovelaceCardConfig } from './types';
import './types';
import { LIB_VERSION } from './version';
import { localize } from './localize/localize';
import { LinkedLovelaceCardEditor } from './editor';
import StaticLinkedLovelace from './shared-linked-lovelace';
import { log } from './helpers';

log(`${localize('common.version')} ${LIB_VERSION}`);
(async () => {
  // Wait for scoped customElements registry to be set up
  // otherwise the customElements registry card-mod is defined in
  // may get overwritten by the polyfill if card-mod is loaded as a module
  while (customElements.get('home-assistant') === undefined)
    await new Promise((resolve) => window.setTimeout(resolve, 100));

  StaticLinkedLovelace.instance.getLinkedLovelaceData();
})();

import './view';
import './dashboard';
import './linked-lovelace-template';

// This puts your card into the UI card picker dialog
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'linked-lovelace-ui',
  name: 'Linked Lovelace Card',
  description: 'A card that handles Linked Lovelace',
});

@customElement('linked-lovelace-ui')
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class LinkedLovelaceCard extends LitElement {
  constructor() {
    super();
  }

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
    // this.linkedLovelace = new LinkedLovelace(this.hass, this.config.debug, this.config.dryRun);
    StaticLinkedLovelace.instance._setDebug(this.config.debug);
    StaticLinkedLovelace.instance._setDryRun(this.config.dryRun);
    await StaticLinkedLovelace.instance.getLinkedLovelaceData();
    this._repaint();
  }

  private handleClick = async () => {
    await StaticLinkedLovelace.instance.getLinkedLovelaceData();
    await StaticLinkedLovelace.instance.updateLinkedLovelace();
    this._repaint();
  };

  private handleReloadClick = async () => {
    await StaticLinkedLovelace.instance.getLinkedLovelaceData();
    this.loaded = !this.loaded;
    this._repaint();
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
    if (changedProps.get('loaded') !== undefined) {
      return true;
    }

    return hasConfigOrEntityChanged(this, changedProps, false);
  }

  protected renderViews(): TemplateResult | void {
    const views: Record<string, DashboardView[]> = {};
    Object.keys(StaticLinkedLovelace.instance.views).forEach((viewKey) => {
      const view = StaticLinkedLovelace.instance.views[viewKey];
      const key = viewKey.split('.', 1)[0];
      if (!views[key]) {
        views[key] = [];
      }
      views[key].push(view);
    });
    return html`
      <div>
        <!-- <span class="lovelace-items-header">${localize('common.headers.dashboards')}</span> -->
        <div class="lovelace-items-grid">
          ${Object.keys(views).map((dashboardKey) => {
            return html`
              <linked-lovelace-dashboard .key=${dashboardKey} .debug=${this.config.debug}></linked-lovelace-dashboard>
            `;
          })}
        </div>
      </div>
    `;
  }

  protected renderLinkedLovelaceData(): TemplateResult | void {
    return html` <div>${this.renderViews()}</div> `;
  }

  // https://lit.dev/docs/components/rendering/
  protected render(): TemplateResult | void {
    return html`
      <ha-card
        .header=${this.config.name}
        tabindex="0"
        .label=${`Linked Lovelace Reloader`}
        class="linked-lovelace-container"
      >
        <div class="card-content">${this.renderLinkedLovelaceData()}</div>
        <div class="card-actions">
          ${
            !this.config.dryRun
              ? html`
                <ha-progress-button @click=${this.handleReloadClick}> ${localize('common.reload')} </ha-progress-button>
              `
              : ''
          }
          <ha-progress-button @click=${this.handleClick}>
            ${localize(this.config.dryRun ? 'common.reload' : 'common.update_all')}
          </ha-progress-button>
        </div>
      </ha-card>
    `;
  }

  // https://lit.dev/docs/components/styles/
  static get styles(): CSSResultGroup {
    return css`
      .linked-lovelace-container {
        background-color: rgba(0, 0, 0, 0);
        border: 1px solid;
      }
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
