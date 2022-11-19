/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, PropertyValues, CSSResultGroup } from 'lit';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { customElement, property, state } from 'lit/decorators';
import { HomeAssistant, hasConfigOrEntityChanged, LovelaceCardEditor, getLovelace } from 'custom-card-helpers'; // This is a community maintained npm module with common helper functions/types. https://github.com/custom-cards/custom-card-helpers

import type { DashboardView, LinkedLovelaceTemplateCardConfig } from './types';
import './types';
import { LIB_VERSION } from './version';
import { localize } from './localize/localize';
import { LinkedLovelaceTemplateCardEditor } from './template-editor';
import StaticLinkedLovelace from './shared-linked-lovelace';
import { log } from './helpers';

log(`Template card`);
// This puts your card into the UI card picker dialog
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'linked-lovelace-template',
  name: 'Linked Lovelace Template Card',
  description: 'Help select an existing template for a card',
});

@customElement('linked-lovelace-template')
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class LinkedLovelaceTemplateCard extends LitElement {
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
    this._repaint();
  }

  private handleClick = async () => {
    await StaticLinkedLovelace.instance.getLinkedLovelaceData();
    await StaticLinkedLovelace.instance.updateLinkedLovelace();
    this._repaint();
  };

  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import('./template-editor');
    return document.createElement('linked-lovelace-template-editor') as LinkedLovelaceTemplateCardEditor;
  }

  public static getStubConfig(): Record<string, unknown> {
    return {};
  }

  // TODO Add any properities that should cause your element to re-render here
  // https://lit.dev/docs/components/properties/
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() public loaded = false;

  @state() private config!: LinkedLovelaceTemplateCardConfig;

  // https://lit.dev/docs/components/properties/#accessors-custom
  public setConfig(config: LinkedLovelaceTemplateCardConfig): void {
    // TODO Check for required fields and that they are of the proper format
    if (!config) {
      throw new Error(localize('common.invalid_configuration'));
    }

    if (config.test_gui) {
      getLovelace().setEditMode(true);
    }

    const name = `Linked Lovelace Template`;

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
    return html`
      <ha-card
        .header=${this.config.name}
        tabindex="0"
        .label=${`Linked Lovelace Template`}
        class="linked-lovelace-container"
      >
        <div class="card-content">${this.config.template}</div>
        <div class="card-actions">
          <ha-progress-button @click=${this.handleClick}> ${localize('common.update_all')} </ha-progress-button>
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
