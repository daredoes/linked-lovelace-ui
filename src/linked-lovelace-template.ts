import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { HomeAssistant, LovelaceCardEditor, createCard } from 'custom-card-helpers';
import { fireEvent } from 'custom-card-helpers';
import './template-editor';
import { TemplateManager } from './template-manager';

class LinkedLovelaceTemplate extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) config!: any;
  @property({ state: true }) _inEditor = false;
  private _renderer?: LitElement;

  static styles = css`
    .container {
      position: relative;
    }
    .edit-button {
      position: absolute;
      top: 8px;
      right: 8px;
    }
  `;

  static getConfigElement(): LovelaceCardEditor {
    return document.createElement('linked-lovelace-template-editor') as LovelaceCardEditor;
  }

  setConfig(config: any) {
    this.config = config;
    this._renderCard();
  }

  render() {
    if (this._inEditor) {
      return html`
        <linked-lovelace-template-editor
          .hass=${this.hass}
          .config=${this.config}
          @config-changed=${this._handleConfigChanged}
        ></linked-lovelace-template-editor>
      `;
    }

    return html`
      <div class="container">
        ${this._renderer}
        <ha-icon-button
          class="edit-button"
          icon="hass:pencil"
          @click=${this._toggleEditor}
        ></ha-icon-button>
      </div>
    `;
  }

  private async _renderCard() {
    const templateManager = new TemplateManager(this.hass);
    await templateManager.discoverTemplatesAndPartials();
    const cardConfig = templateManager.renderTemplate(this.config.ll_template, this.config.ll_context);
    this._renderer = createCard(cardConfig) as LitElement;
    this._renderer.hass = this.hass;
  }

  private _toggleEditor() {
    this._inEditor = !this._inEditor;
  }

  private _handleConfigChanged(ev: CustomEvent) {
    this.config = ev.detail.config;
    this._renderCard();
    fireEvent(this, 'config-changed', { config: this.config });
  }
}

customElements.define('linked-lovelace-template', LinkedLovelaceTemplate);
