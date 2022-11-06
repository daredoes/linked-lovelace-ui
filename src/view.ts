/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, PropertyValues, CSSResultGroup } from 'lit';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { customElement, property, state } from 'lit/decorators';

import type { DashboardCard, DashboardView } from './types';
import './types';
import { log } from './helpers';
import StaticLinkedLovelace from './shared-linked-lovelace';

const getCardTypesInCard = (card: DashboardCard): any[] => {
  return (
    card.cards?.map((c) => {
      const results: any[] = [];
      if (c.template) {
        results.push(`template: ${c.template}`);
      } else {
        results.push(`type: ${c.type}`);
      }
      if (c.cards) {
        results.push(getCardTypesInCard(c));
      }
      return results;
    }) || []
  );
};

const getCardTypesInView = (view: DashboardView): string[] => {
  return (
    view.cards?.map((c) => {
      if (c.template) {
        return `template: ${c.template}`;
      }
      return `type: ${c.type}`;
    }) || []
  );
};

@customElement('linked-lovelace-view')
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class LinkedLovelaceViewCard extends LitElement {
  constructor() {
    super();
  }

  log(msg, ...values) {
    if (this.debug) {
      log(msg, ...values);
    }
  }

  // TODO Add any properities that should cause your element to re-render here
  // https://lit.dev/docs/components/properties/
  @property({ attribute: false }) public view!: DashboardView;
  @property({ attribute: false }) public debug = false;
  @property({ attribute: false }) public dashboardKey = '';

  @state() private expanded = false;

  // https://lit.dev/docs/components/lifecycle/#reactive-update-cycle-performing
  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (changedProps.has('expanded')) {
      return true;
    }
    return true;
  }

  protected renderContent(): TemplateResult | void {
    if (this.expanded) {
      return html`
        <div class="card-content">
          <div>
            <ha-settings-row>
              <span slot="heading">Cards</span>
              <span slot="description"> ${getCardTypesInView(this.view).join(', ')} </span>
            </ha-settings-row>
          </div>
        </div>
      `;
    }
  }

  // https://lit.dev/docs/components/rendering/
  protected render(): TemplateResult | void {
    const dashboardUrl = StaticLinkedLovelace.instance.dashboards[this.dashboardKey].url_path;
    const dashboardConfig = StaticLinkedLovelace.instance.dashboardConfigs[dashboardUrl];
    const isTemplate =
      dashboardConfig.template && this.view.path
        ? Boolean(StaticLinkedLovelace.instance.templates[this.view.path])
        : false;
    return html`
      <ha-card>
        <ha-settings-row
          @click=${() => {
            this.expanded = !this.expanded;
          }}
        >
          <a
            href=${`/${dashboardUrl}/${this.view.path || ''}`}
            @click=${(ev) => {
              ev.stopPropagation();
            }}
            slot="heading"
            >${this.view.title}</a
          >
          <span slot="description">View${isTemplate ? ' and Template' : ''}</span>
        </ha-settings-row>
        ${this.renderContent()}
      </ha-card>
    `;
  }

  // https://lit.dev/docs/components/styles/
  static get styles(): CSSResultGroup {
    return css``;
  }
}
