import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { HomeAssistant } from 'custom-card-helpers';
import { fireEvent } from 'custom-card-helpers';

class TemplateEditor extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) config!: any;

  static styles = css`
    .container {
      padding: 16px;
    }
  `;

  render() {
    return html`
      <div class="container">
        <ha-form
          .hass=${this.hass}
          .data=${this.config}
          .schema=${[
            { name: 'll_template', selector: { text: {} } },
            { name: 'll_context', selector: { object: {} } },
          ]}
          .computeLabel=${this._computeLabel}
          @value-changed=${this._valueChanged}
        ></ha-form>
      </div>
    `;
  }

  private _computeLabel(schema: any) {
    return schema.name;
  }

  private _valueChanged(ev: CustomEvent) {
    fireEvent(this, 'config-changed', { config: ev.detail.value });
  }
}

customElements.define('linked-lovelace-template-editor', TemplateEditor);
