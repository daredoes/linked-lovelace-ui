/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, PropertyValues, CSSResultGroup } from 'lit';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { customElement, property, state } from 'lit/decorators';
import { HomeAssistant, hasConfigOrEntityChanged, getLovelace } from 'custom-card-helpers'; // This is a community maintained npm module with common helper functions/types. https://github.com/custom-cards/custom-card-helpers

import type { DashboardTemplatesCard } from './types';
import './types';
import { localize } from './localize/localize';
import { log } from './helpers';

// This puts your card into the UI card picker dialog
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'linked-lovelace-templates',
  name: 'Linked Lovelace Templates Card',
  description: 'Use this card to add ETA partials',
});

@customElement('linked-lovelace-templates')
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class LinkedLovelaceTemplatesCard extends LitElement {
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

  public static getStubConfig(): Record<string, unknown> {
    return {};
  }

  // TODO Add any properities that should cause your element to re-render here
  // https://lit.dev/docs/components/properties/
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() public loaded = false;

  @state() private config!: DashboardTemplatesCard;

  // https://lit.dev/docs/components/properties/#accessors-custom
  public setConfig(config: DashboardTemplatesCard): void {
    // TODO Check for required fields and that they are of the proper format
    if (!config) {
      throw new Error(localize('common.invalid_configuration'));
    }

    if (config.test_gui) {
      getLovelace().setEditMode(true);
    }

    const name = `Linked Lovelace Eta JS Partials`;

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
    const editMode = false;
    return html`
      <ha-card .header=${this.config.name} tabindex="0" .label=${`Linked Lovelace Eta JS Partials`}
        class="linked-lovelace-container">
        <div class="card-content">${Object.values(this.config.templates || {}).map((t) => t.key).join(" ")}</div>
        <div class="card-actions">
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
    `;
  }
}
