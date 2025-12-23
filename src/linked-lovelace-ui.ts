import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { HomeAssistant, fireEvent } from 'custom-card-helpers';
import { TemplateManager } from './template-manager';
import { Card } from './types';
import './diff-viewer';
import { Debug } from './debug';

class LinkedLovelaceUI extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) config!: any;
  private templateManager!: TemplateManager;

  @state() private _originalConfig?: Card;
  @state() private _newConfig?: Card;

  static styles = css`
    :host {
      display: block;
    }
  `;

  setConfig(config: any) {
    this.config = config;
    this.templateManager = new TemplateManager(this.hass);
  }

  render() {
    return html`
      <div>
        <h1>Linked Lovelace UI</h1>
        <ha-formfield label="Enable Debug Mode">
          <ha-switch
            .checked=${this.config.debug}
            @change=${this._toggleDebugMode}
          ></ha-switch>
        </ha-formfield>
        <button @click=${this._processDashboards}>Update All</button>
        ${this._newConfig
          ? html`
              <linked-lovelace-diff-viewer
                .originalConfig=${this._originalConfig}
                .newConfig=${this._newConfig}
                @approve-changes=${this._handleApprove}
                @cancel-changes=${this._handleCancel}
              ></linked-lovelace-diff-viewer>
            `
          : ''}
      </div>
    `;
  }

  private async _processDashboards() {
    const { originalConfigs, newConfigs } = await this.templateManager.processDashboards();
    this._originalConfig = originalConfigs;
    this._newConfig = newConfigs;
  }

  private _handleApprove() {
    if (this._newConfig) {
      Object.keys(this._newConfig).forEach((urlPath) => {
        this.templateManager['api'].setDashboardConfig(urlPath, this._newConfig![urlPath]);
      });
    }
    this._newConfig = undefined;
    this._originalConfig = undefined;
  }

  private _handleCancel() {
    // Logic to revert the changes
    this._newConfig = undefined;
    this._originalConfig = undefined;
  }

  private _toggleDebugMode() {
    this.config = { ...this.config, debug: !this.config.debug };
    Debug.instance.debug = this.config.debug;
    fireEvent(this, 'config-changed', { config: this.config });
  }
}

customElements.define('linked-lovelace-ui', LinkedLovelaceUI);
