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
      :host {
        display: block;
      }
      .ll-chip-wrapper {
        position: relative;
        display: block;
      }
      /* Colors come from the active Home Assistant theme. Override
         --ll-chip-background-color / --ll-chip-text-color in a theme to
         restyle the chip without touching the card. */
      .ll-chip {
        position: absolute;
        top: -0.6rem;
        right: 0.75rem;
        z-index: 1;
        box-sizing: border-box;
        max-width: calc(100% - 1.5rem);
        padding: 0.15rem 0.6rem;
        border-radius: 999px;
        border: 1px solid var(--ha-card-background, var(--card-background-color, transparent));
        background: var(--ll-chip-background-color, var(--primary-color));
        color: var(--ll-chip-text-color, var(--text-primary-color));
        box-shadow: var(--ha-card-box-shadow, 0 1px 3px rgba(0, 0, 0, 0.24));
        font-family: var(--code-font-family, ui-monospace, SFMono-Regular, Menlo, monospace);
        font-size: 0.72rem;
        line-height: 1.5;
        letter-spacing: 0.02em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        pointer-events: none;
      }
    `;
  }
}
