/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, PropertyValues, CSSResultGroup } from 'lit';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { customElement, property, state } from 'lit/decorators';
import { localize } from './localize/localize';
import type { Dashboard, DashboardCard, DashboardView } from './types';
import './types';
import { log } from './helpers';
import StaticLinkedLovelace from './shared-linked-lovelace';
import { mdiArrowDownBold, mdiArrowRightBold, mdiArrowUp, mdiArrowDown, mdiArrowLeft, mdiArrowRight } from '@mdi/js';

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

type Template = {
  template: string;
  template_data?: Record<string, any>;
};

const getTemplatesInCard = (card: DashboardCard): Template[] => {
  return (
    card.cards?.flatMap((c) => {
      const results: Template[] = [];
      if (c.template) {
        results.push({
          template: c.template,
          template_data: c.template_data,
        });
      } else if (c.cards) {
        results.concat(getTemplatesInCard(c));
      }
      return results;
    }) || []
  );
};

const getTemplatesInView = (view: DashboardView): Template[] => {
  return view.cards?.flatMap((c) => getTemplatesInCard(c)) || [];
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

const clickHelper = (top?: number, left?: number) => {
  return (ev: Event) => {
    const elements = (
      ev.currentTarget as HTMLElement
    )?.parentElement?.parentElement?.parentElement?.getElementsByTagName('pre');
    if (elements) {
      for (let i = 0; i < elements.length; i++) {
        const element = elements.item(i);
        if (element) {
          if (top == -1) {
            top = element.scrollHeight;
          }
          if (left == -1) {
            left = element.scrollWidth;
          }
          element.scroll({ top, left, behavior: 'smooth' });
        }
      }
    }
  };
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

  @state() uniqueId = ``;

  @state() private expanded = false;

  // https://lit.dev/docs/components/lifecycle/#reactive-update-cycle-performing
  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (changedProps.has('expanded') || changedProps.has('uniqueId')) {
      return true;
    }
    return true;
  }

  async firstUpdated() {
    // TODO: Style, because this doesn't work at all
    await new Promise((r) => setTimeout(r, 0));
    this.uniqueId = `${this.dashboardKey}${this.view.path ? `.${this.view.path}` : ''}`;
    const element = this.renderRoot?.querySelector(`#${this.uniqueId}`);
    if (element) {
      element.innerHTML = element.innerHTML.replaceAll('"template":', '<span class="template">"template"</span>:');
    }
  }

  protected renderContent(): TemplateResult | void {
    if (this.expanded) {
      return html`
        <div class="card-content">
          <div>
            <div>
              <code class="linked-lovelace">
                <pre
                  @valueChanged=${() => {
                    console.log('valeu');
                  }}
                  id=${this.uniqueId}
                >
${JSON.stringify(this.view, undefined, 2)}</pre
                >
                <div>
                  <span>${localize('common.scroll_controls')}</span>
                  <div>
                    <ha-icon-button
                      @click=${clickHelper(0)}
                      .label=${`${localize('common.scroll_directions.prefix')}${localize(
                        'common.scroll_directions.directions.top',
                      )}${localize('common.scroll_directions.suffix')}`}
                      .path=${mdiArrowUp}
                    ></ha-icon-button>
                    <ha-icon-button
                      @click=${clickHelper(undefined, 0)}
                      .label=${`${localize('common.scroll_directions.prefix')}${localize(
                        'common.scroll_directions.directions.left',
                      )}${localize('common.scroll_directions.suffix')}`}
                      .path=${mdiArrowLeft}
                    ></ha-icon-button>
                    <ha-icon-button
                      @click=${clickHelper(undefined, -1)}
                      .label=${`${localize('common.scroll_directions.prefix')}${localize(
                        'common.scroll_directions.directions.right',
                      )}${localize('common.scroll_directions.suffix')}`}
                      .path=${mdiArrowRight}
                    ></ha-icon-button>
                    <ha-icon-button
                      @click=${clickHelper(-1)}
                      .label=${`${localize('common.scroll_directions.prefix')}${localize(
                        'common.scroll_directions.directions.bottom',
                      )}${localize('common.scroll_directions.suffix')}`}
                      .path=${mdiArrowDown}
                    ></ha-icon-button>
                  </div>
                </div>
              </code>
            </div>
          </div>
        </div>
      `;
    }
  }

  // https://lit.dev/docs/components/rendering/
  protected render(): TemplateResult | void {
    console.log(this.dashboardKey);
    const dashboard: Dashboard | undefined = StaticLinkedLovelace.instance.dashboards[this.dashboardKey];
    if (!dashboard) {
      return html`Bug - Reload Page`;
    }
    const dashboardUrl = StaticLinkedLovelace.instance.dashboards[this.dashboardKey].url_path;
    const dashboardConfig = StaticLinkedLovelace.instance.dashboardConfigs[dashboardUrl];
    const isTemplate =
      dashboardConfig.template && this.view.path
        ? Boolean(StaticLinkedLovelace.instance.templates[this.view.path])
        : false;

    const templates = getTemplatesInView(this.view);
    const templatesCount = templates.length;
    return html`
      <ha-card outlined>
        <ha-settings-row>
          <a
            href=${`/${dashboardUrl}/${this.view.path || ''}`}
            @click=${(ev) => {
              ev.stopPropagation();
            }}
            slot="heading"
            >${this.view.title}</a
          >
          <span slot="description"
            >${localize('common.view')}${
      isTemplate ? ` ${localize('common.and')} ${localize('common.template')}` : ''
    }${
      templatesCount > 0
        ? html` <br />${templatesCount}
                  ${templatesCount != 1 ? localize('common.templates') : localize('common.template')}
                  ${localize('common.in_use')}`
        : html``
    }</span
          >
          <ha-icon-button
            @click=${() => {
              this.expanded = !this.expanded;
            }}
            .label=${localize(this.expanded ? 'common.condense' : 'common.expand')}
            .path=${this.expanded ? mdiArrowDownBold : mdiArrowRightBold}
          ></ha-icon-button>
        </ha-settings-row>
        ${this.renderContent()}
      </ha-card>
    `;
  }

  // https://lit.dev/docs/components/styles/
  static get styles(): CSSResultGroup {
    return css`
      code.linked-lovelace .template {
        font-weight: bolder;
      }
      code.linked-lovelace > div {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-direction: row;
      }
      code.linked-lovelace pre {
        max-height: 500px;
        overflow: scroll;
      }
    `;
  }
}
