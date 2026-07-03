/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, PropertyValues, CSSResultGroup } from 'lit';

import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant, LovelaceCard } from 'custom-card-helpers';

import { LINKED_LOVELACE_KEY_CHIP, type LinkedLovelaceKeyChipConfig } from './types';
import './types';
import { localize } from './localize/localize';

// This puts your card into the UI card picker dialog
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: LINKED_LOVELACE_KEY_CHIP,
  name: 'Linked Lovelace Key Chip Card',
  description:
    'Shows a template card with its ll_key as a corner chip. Managed automatically by the status card sync — no need to add it by hand.',
});

@customElement(LINKED_LOVELACE_KEY_CHIP)
export class LinkedLovelaceKeyChipCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private config!: LinkedLovelaceKeyChipConfig;
  @state() private _card?: LovelaceCard;

  public setConfig(config: LinkedLovelaceKeyChipConfig): void {
    if (!config?.card) {
      throw new Error(localize('common.invalid_configuration'));
    }
    this.config = config;
    this._createCard();
  }

  private async _createCard(): Promise<void> {
    const helpers = await (window as any).loadCardHelpers();
    const card: LovelaceCard = helpers.createCardElement(this.config.card);
    if (this.hass) {
      card.hass = this.hass;
    }
    card.addEventListener('ll-rebuild', (ev) => {
      ev.stopPropagation();
      this._createCard();
    });
    this._card = card;
  }

  protected updated(changedProps: PropertyValues): void {
    if (changedProps.has('hass') && this._card) {
      this._card.hass = this.hass;
    }
  }

  public async getCardSize(): Promise<number> {
    if (this._card?.getCardSize) {
      return await this._card.getCardSize();
    }
    return 1;
  }

  public getGridOptions(): Record<string, unknown> | undefined {
    return (this._card as any)?.getGridOptions?.();
  }

  public getLayoutOptions(): Record<string, unknown> | undefined {
    return (this._card as any)?.getLayoutOptions?.();
  }

  protected render(): TemplateResult | void {
    return html`
      <div class="ll-chip-wrapper">
        ${this._card ?? html`<ha-card></ha-card>`}
        <span class="ll-chip">${this.config.ll_key}</span>
      </div>
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      .ll-chip-wrapper {
        position: relative;
        display: block;
      }
      .ll-chip {
        position: absolute;
        top: -0.55rem;
        right: 0.6rem;
        display: inline-block;
        padding: 0.1rem 0.6rem;
        border-radius: 999px;
        background: #03a9f4;
        color: #fff;
        font-size: 0.7rem;
        font-family: monospace;
        z-index: 1;
      }
    `;
  }
}
