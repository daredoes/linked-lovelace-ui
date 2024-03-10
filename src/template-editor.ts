/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, CSSResultGroup } from 'lit';
import { HomeAssistant, fireEvent, LovelaceCardEditor } from 'custom-card-helpers';

import { ScopedRegistryHost } from '@lit-labs/scoped-registry-mixin';
import { DashboardCard, LinkedLovelaceTemplateCardConfig } from './types';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { customElement, property, state } from 'lit/decorators';
import HassController from './controllers/hass';
import { extractTemplateData } from './helpers/templates';

@customElement('linked-lovelace-template-editor')
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class LinkedLovelaceTemplateCardEditor extends ScopedRegistryHost(LitElement) implements LovelaceCardEditor {
  @property({ attribute: false }) public hass?: HomeAssistant;

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
    return this._config?.ll_template || '';
  }

  protected renderTemplates(): TemplateResult | void {
    if (!this._loaded) {
      return html`<p>loading</p>`;
    }
    const templateKeys = Object.keys(this._controller.linkedLovelaceController.templateController.templates);
    if (!templateKeys.length) {
      return html`
      <p>Discovered Templates:</p>
      <div class="linked-lovelace-chips">
        No templates found/created.
      </div>
    `;
    }
    return html`
      <p>Discovered Templates</p>
      <div class="linked-lovelace-chips">
        ${templateKeys.map(
          (template) => html`<button .value=${template}
          .configValue=${'ll_template'}
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
        <span>Read the following carefully. After clicking an option, all of this text will disappear.</span>
        <ol>
        <li>Click a template below to swap the contents of this card with the contents of the template.</li>
        <li>Variables can be provided in a dictionary under the top-level key <code>ll_context</code>.<ul><li>Examples may be provided automatically.</li><li>All other content in the card below the linked lovelace keys will be replaced.</li><li>Templating provided by <a href="https://eta.js.org/" target="_blank">ETA JS</a></li></ul></li>
        <li>The card may be broken when first saved. This is normal.</li>
        <li>It will be updated the next time a user performs an update from the Linked Lovelace Status card<ul><li>You may want to do this after placing all the template cards you need.</li></li>
        </ol>
        <p></p>
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
        if (target.configValue === 'll_template') {
          tmpConfig['ll_context'] = undefined;
        }
        this._config = tmpConfig;
      } else {
        let templateData: Record<string, any> | undefined = undefined;
        if (target.configValue === 'll_template') {
          const template: DashboardCard | undefined =
            this._controller?.linkedLovelaceController.templateController.templates[target.value];
          if (template) {
            templateData = extractTemplateData(template) || undefined;
          }
          this._config = {
            /* @ts-ignore we want this to be first in the output, but need to make sure the value is correct */
            [target.configValue]: target.checked !== undefined ? target.checked : target.value,
            ...template,
            ...{
              [target.configValue]: target.checked !== undefined ? target.checked : target.value,
            }
          };
        } else {
          this._config = {
            ...this._config,
            [target.configValue]: target.checked !== undefined ? target.checked : target.value,
          };
        }
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
