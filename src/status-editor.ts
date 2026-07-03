/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, CSSResultGroup } from 'lit';
import { HomeAssistant, LovelaceCardEditor, fireEvent } from 'custom-card-helpers';

import { ScopedRegistryHost } from '@lit-labs/scoped-registry-mixin';
import {  LinkedLovelaceStatusCardConfig } from './types';
 
import { customElement, property, state } from 'lit/decorators.js';

@customElement('linked-lovelace-status-editor')
 
export class LinkedLovelaceStatusCardEditor extends ScopedRegistryHost(LitElement) implements LovelaceCardEditor {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config?: LinkedLovelaceStatusCardConfig;

  @state() private _helpers?: any;
  @state() private _loaded = false;



  private _initialized = false;

  static elementDefinitions = {
  };

  public setConfig(config: LinkedLovelaceStatusCardConfig): void {
    this._config = config;

    this.loadCardHelpers();
  }

  async firstUpdated() {
    // Give the browser a chance to paint
    await new Promise((r) => setTimeout(r, 0));
    this._loaded = true;
  }

  protected shouldUpdate(): boolean {
    if (!this._initialized) {
      this._initialize();
    }
    return true;
  }

  get _template(): string {
    return this._config?.template || '';
  }

  protected renderTemplates(): TemplateResult | void {
    if (!this._loaded) {
      return html`<p>loading</p>`;
    }
    return html`
      <p>Loaded</p>
    `;
  }

  protected render(): TemplateResult | void {
    if (!this.hass || !this._helpers) {
      return html``;
    }

    return html`
      <div class="linked-lovelace-config">
        <label>
          <input
            type="checkbox"
            .checked=${!!this._config?.show_key_chips}
            @change=${this._showKeyChipsChanged}
          />
          Show key chips on template definition cards (applied at next sync)
        </label>
      </div>
    `;
  }

  private _showKeyChipsChanged(ev): void {
    if (!this._config || !this.hass) {
      return;
    }
    this._config = {
      ...this._config,
      show_key_chips: ev.target.checked,
    };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  private _initialize(): void {
    if (this.hass === undefined) return;
    if (this._config === undefined) return;
    if (this._helpers === undefined) return;
    if (!this._loaded) return;

    this._initialized = true;
  }

  private async loadCardHelpers(): Promise<void> {
    this._helpers = await (window as any).loadCardHelpers();
  }


  static styles: CSSResultGroup = css`
    .linked-lovelace-config {
      display: flex;
      flex-direction: column;
    }
    .linked-lovelace-config > * {
      margin-top: 10px;
      margin-bottom: 10px;
    }
    .linked-lovelace-chips {
      display: flex;
      flex-direction: row;
      gap: 1rem;
      flex-wrap: wrap;
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
    ul {
      max-height: 500px;
      overflow-y: scroll;
    }
  `;
}
