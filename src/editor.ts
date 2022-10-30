/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, CSSResultGroup } from 'lit';
import { HomeAssistant, fireEvent, LovelaceCardEditor } from 'custom-card-helpers';

import { ScopedRegistryHost } from '@lit-labs/scoped-registry-mixin';
import { LinkedLovelaceCardConfig } from './types';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { customElement, property, state } from 'lit/decorators';
import { formfieldDefinition } from '../elements/formfield';
import { selectDefinition } from '../elements/select';
import { switchDefinition } from '../elements/switch';
import { textfieldDefinition } from '../elements/textfield';

@customElement('linked-lovelace-editor')
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class LinkedLovelaceCardEditor extends ScopedRegistryHost(LitElement) implements LovelaceCardEditor {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config?: LinkedLovelaceCardConfig;

  @state() private _helpers?: any;

  private _initialized = false;

  static elementDefinitions = {
    ...textfieldDefinition,
    ...selectDefinition,
    ...switchDefinition,
    ...formfieldDefinition,
  };

  public setConfig(config: LinkedLovelaceCardConfig): void {
    this._config = config;

    this.loadCardHelpers();
  }

  protected shouldUpdate(): boolean {
    if (!this._initialized) {
      this._initialize();
    }

    return true;
  }

  get _name(): string {
    return this._config?.name || '';
  }

  get _debugText(): string {
    return this._config?.debugText || '';
  }

  get _debug(): boolean {
    return this._config?.debug || false;
  }

  get _dryRun(): boolean {
    return this._config?.dryRun || false;
  }

  protected render(): TemplateResult | void {
    if (!this.hass || !this._helpers) {
      return html``;
    }

    return html`
    <div class="linked-lovelace-config">
      <mwc-textfield
        label="Name (Optional)"
        .value=${this._name}
        .configValue=${'name'}
        @input=${this._valueChanged}
      ></mwc-textfield>
      <mwc-textfield
        label="Debug Text (Optional)"
        .value=${this._debugText}
        .configValue=${'debugText'}
        @input=${this._valueChanged}
      ></mwc-textfield>
      <mwc-formfield .label=${`Read Only?`}>
        <mwc-switch
          .checked=${this._dryRun !== false}
          .configValue=${'dryRun'}
          @change=${this._valueChanged}
        ></mwc-switch>
      </mwc-formfield>
      <mwc-formfield .label=${`Debug Mode: ${this._debug ? 'Enabled' : 'Disabled'}`}>
        <mwc-switch
          .checked=${this._debug !== false}
          .configValue=${'debug'}
          @change=${this._valueChanged}
        ></mwc-switch>
      </mwc-formfield>
    </div>
    `;
  }

  private _initialize(): void {
    if (this.hass === undefined) return;
    if (this._config === undefined) return;
    if (this._helpers === undefined) return;
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
        this._config = tmpConfig;
      } else {
        this._config = {
          ...this._config,
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
