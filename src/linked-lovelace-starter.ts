/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, CSSResultGroup } from 'lit';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { customElement, property, state } from 'lit/decorators';
import { HomeAssistant } from 'custom-card-helpers';

import './types';
import { localize } from './localize/localize';
import { GlobalLinkedLovelace } from './instance';
import { buildDemoDashboardConfig, DEMO_DASHBOARD_TITLE, DEMO_DASHBOARD_URL_PATH } from './demoDashboard';

// Card picker entry.
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'linked-lovelace-starter',
  name: 'Linked Lovelace Starter Card',
  description: 'One click to drop in a pre-built dashboard that showcases Linked Lovelace.',
});

type Status = 'idle' | 'working' | 'done' | 'error';

@customElement('linked-lovelace-starter')
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class LinkedLovelaceStarterCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private config!: Record<string, any>;
  @state() private _status: Status = 'idle';
  @state() private _message = '';
  @state() private _link = '';

  public static getStubConfig(): Record<string, unknown> {
    return {};
  }

  public setConfig(config: Record<string, any>): void {
    if (!config) {
      throw new Error(localize('common.invalid_configuration'));
    }
    this.config = { ...config };
  }

  // Builds (or re-uses) the demo dashboard and fills it with the showcase config.
  private _install = async (): Promise<void> => {
    this._status = 'working';
    this._message = 'Creating demo dashboard…';
    const urlPath = this.config?.url_path || DEMO_DASHBOARD_URL_PATH;
    const api = GlobalLinkedLovelace.instance.api;
    try {
      try {
        await api.createDashboard(urlPath, this.config?.title || DEMO_DASHBOARD_TITLE, true);
      } catch (e) {
        // Most likely the dashboard already exists — keep going and overwrite it.
        console.info('Linked Lovelace starter: dashboard may already exist, continuing', e);
      }
      await this.hass.callWS({
        type: 'lovelace/config/save',
        url_path: urlPath,
        config: buildDemoDashboardConfig(),
      });
      this._link = `/${urlPath}`;
      this._status = 'done';
      this._message = 'Demo dashboard ready!';
    } catch (e) {
      console.error('Linked Lovelace starter failed', e);
      this._status = 'error';
      this._message = `Could not create the demo dashboard: ${e}`;
    }
  };

  protected render(): TemplateResult | void {
    if (!this.config) return html``;
    return html`
      <ha-card .header=${'Linked Lovelace Starter'}>
        <div class="card-content">
          <p>
            New to Linked Lovelace? Drop in a ready-made dashboard that shows the
            whole feature set in action — reusable templates, context variables,
            partials, and nested templates — all in one place.
          </p>
          <ol>
            <li>Click <b>Create Demo Dashboard</b> below.</li>
            <li>Open the new <b>${this.config?.title || DEMO_DASHBOARD_TITLE}</b> dashboard.</li>
            <li>On its status card, click <b>Load Data</b> then <b>Update All</b>.</li>
          </ol>
          ${this._message
            ? html`<p class="status status-${this._status}" data-status=${this._status}>${this._message}</p>`
            : ''}
          ${this._status === 'done' && this._link
            ? html`<p><a class="open-link" href=${this._link}>Open the demo dashboard →</a></p>`
            : ''}
        </div>
        <div class="card-actions">
          <ha-progress-button
            data-testid="create-demo"
            @click=${this._status === 'working' ? undefined : this._install}
          >
            ${this._status === 'done' ? 'Recreate Demo Dashboard' : 'Create Demo Dashboard'}
          </ha-progress-button>
        </div>
      </ha-card>
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      .card-content ol {
        margin: 0.5em 0 0 0;
        padding-left: 1.2em;
      }
      .status {
        font-weight: 600;
      }
      .status-error {
        color: var(--error-color, #db4437);
      }
      .status-done {
        color: var(--success-color, #43a047);
      }
      .open-link {
        color: var(--primary-color);
        font-weight: 600;
        text-decoration: none;
      }
    `;
  }
}
