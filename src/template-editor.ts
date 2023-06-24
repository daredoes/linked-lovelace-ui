/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, CSSResultGroup } from 'lit';
import { HomeAssistant, fireEvent, LovelaceCardEditor } from 'custom-card-helpers';

import { ScopedRegistryHost } from '@lit-labs/scoped-registry-mixin';
import { DashboardCard, LinkedLovelaceTemplateCardConfig } from './types';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { property, state } from 'lit/decorators';
import HassController from './controllers/hass';
import { extractTemplateData } from './helpers/templates';

export class LinkedLovelaceTemplateCardEditor extends ScopedRegistryHost(LitElement) implements LovelaceCardEditor {
  @property() public hass?: HomeAssistant;

  @state() private _config?: LinkedLovelaceTemplateCardConfig;

  @state() private _helpers?: any;
  @state() private _loaded = false;

  private _controller: HassController = new HassController();

  private _initialized = false;

  static elementDefinitions = {
  };

  public setConfig(config: LinkedLovelaceTemplateCardConfig): void {
    this._config = config;

    this.loadCardHelpers();
  }

  async firstUpdated() {
    // Give the browser a chance to paint
    await new Promise((r) => setTimeout(r, 0));
    await this._controller.refresh();
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
      <p>Options:</p>
      <div class="linked-lovelace-chips">
        ${Object.keys(this._controller.linkedLovelaceController.templateController.templates).map(
          (template) => html`<button .value=${template}
          .configValue=${'template'}
          @click=${this._valueChanged}>${template}</button>`,
        )}
      </div>
    `;
  }

  protected render(): TemplateResult | void {
    if (!this.hass || !this._helpers) {
      return html``;
    }

    return html`
      <div class="linked-lovelace-config">
        <mwc-textfield
          label="Template Name"
          placeholder="Fill me in, and switch to code editor"
          .value=${this._template}
          .configValue=${'template'}
          @input=${this._valueChanged}
        ></mwc-textfield>
        ${this.renderTemplates()}
      </div>
    `;
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

  private _valueChanged(ev): void {
    if (!this._config || !this.hass) {
      return;
    }
    const target = ev.target;
    if (this[`_${target.configValue}`] === target.value) {
      return;
    }
    if (target.configValue) {
      if (target.value === '') {
        const tmpConfig = { ...this._config };
        delete tmpConfig[target.configValue];
        if (target.configValue === 'template') {
          tmpConfig['ll_data'] = {};
        }
        this._config = tmpConfig;
      } else {
        let templateData = {};
        if (target.configValue === 'template') {
          const template: DashboardCard | undefined =
            this._controller?.linkedLovelaceController.templateController.templates[target.value];
          if (template) {
            templateData = extractTemplateData(template).template_data || {};
          }
        }
        this._config = {
          ...this._config,
          ll_data: templateData,
          [target.configValue]: target.checked !== undefined ? target.checked : target.value,
        };
      }
    }
    fireEvent(this, 'config-changed', { config: this._config });
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
customElements.define('linked-lovelace-template-editor', LinkedLovelaceTemplateCardEditor)