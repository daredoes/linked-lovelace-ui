import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { fireEvent } from 'custom-card-helpers';
import { diffLines, Change } from 'diff';

class DiffViewer extends LitElement {
  @property({ attribute: false }) originalConfig!: any;
  @property({ attribute: false }) newConfig!: any;
  @property({ state: true }) _expanded = false;

  static styles = css`
    .container {
      border: 1px solid var(--divider-color);
      border-radius: var(--ha-card-border-radius, 4px);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
      cursor: pointer;
    }
    .content {
      padding: 16px;
      border-top: 1px solid var(--divider-color);
    }
    .diff {
      font-family: monospace;
      white-space: pre;
    }
    .added {
      color: green;
    }
    .removed {
      color: red;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      padding-top: 16px;
    }
  `;

  render() {
    return html`
      <div class="container">
        <div class="header" @click=${this._toggle}>
          <span>View Changes</span>
          <ha-icon
            icon=${this._expanded ? 'mdi:chevron-up' : 'mdi:chevron-down'}
          ></ha-icon>
        </div>
        ${this._expanded
          ? html`
              <div class="content">
                <div class="diff">${this._generateDiff()}</div>
                <div class="actions">
                  <mwc-button @click=${this._handleCancel}>Cancel</mwc-button>
                  <mwc-button @click=${this._handleApprove}>Approve</mwc-button>
                </div>
              </div>
            `
          : ''}
      </div>
    `;
  }

  private _toggle() {
    this._expanded = !this._expanded;
  }

  private _generateDiff() {
    const originalStr = JSON.stringify(this.originalConfig, null, 2);
    const newStr = JSON.stringify(this.newConfig, null, 2);
    const diff = diffLines(originalStr, newStr);

    return diff.map((part: Change) => {
      const className = part.added ? 'added' : part.removed ? 'removed' : '';
      return html`<span class=${className}>${part.value}</span>`;
    });
  }

  private _handleApprove() {
    fireEvent(this, 'approve-changes');
  }

  private _handleCancel() {
    fireEvent(this, 'cancel-changes');
  }
}

customElements.define('linked-lovelace-diff-viewer', DiffViewer);
