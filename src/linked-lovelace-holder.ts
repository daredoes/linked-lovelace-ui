/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, PropertyValues, CSSResultGroup } from 'lit';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { customElement, property, state } from 'lit/decorators';
import { HomeAssistant, hasConfigOrEntityChanged, getLovelace, LovelaceCardEditor } from 'custom-card-helpers'; // This is a community maintained npm module with common helper functions/types. https://github.com/custom-cards/custom-card-helpers

import { LINKED_LOVELACE_HOLDER } from './constants';
import type { DashboardHolderCard } from './types/DashboardHolderCard';
import { localize } from './localize/localize';

interface LinkedLovelaceHolderCardEditor extends LovelaceCardEditor {
  ll_key?: string
  ll_template?: string
}

// This puts your card into the UI card picker dialog
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: LINKED_LOVELACE_HOLDER,
  name: 'Linked Lovelace Holder Card',
  description: 'Use this card to hold a card with a key while supporting the UI editor',
});

@customElement(LINKED_LOVELACE_HOLDER)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class LinkedLovelaceHolderCard extends LitElement {
  constructor() {
    super();
  }

  static async getVerticalStackConfigElement() {
    // Ensure the hui-stack-card-editor is loaded.
    let cls = customElements.get('hui-vertical-stack-card');
    if (!cls) {
      const helpers = await (window as any).loadCardHelpers();
      helpers.createCardElement({ type: 'vertical-stack', cards: [] });
      await customElements.whenDefined('hui-vertical-stack-card');
      cls = customElements.get('hui-vertical-stack-card');
    }
    const configElement = await (cls as any).getConfigElement();

    // Patch setConfig to remove non-VSIC config options.
    const originalSetConfig = configElement.setConfig;
    configElement._config = {};
    const newSetConfig = (config) =>
      {
        // The original call does some basic validation, but we don't need it.
        originalSetConfig.call(configElement, {
          type: config.type,
          title: config.title,
          cards: config.cards || [],
        })
        // This is a hack to make the editor work with our custom keys
        configElement._config = config;
    }
    configElement.setConfig = newSetConfig;

    // Patch render to remove non-VSIC config options.
    const originalRender = configElement.render;

    const _valueChanged = (ev): void => {
      // Debug why this doesn't save.
      if (!configElement._config || !configElement.hass) {
        return;
      }
      const target = ev.target;
      if (configElement._config[`_${target.configValue}`] === target.value) {
        return;
      }
      if (target.configValue) {
        if (target.value === '') {
          const tmpConfig = { ...configElement._config };
          delete tmpConfig[target.configValue];
          configElement._config = tmpConfig;
        } else {
          newSetConfig({
            ...configElement._config,
            [target.configValue]: target.checked !== undefined ? target.checked : target.value,
          });
        }
      }
    }
    configElement.render = () =>
      {
        // The original call does some basic validation, but we don't need it.
        const result = originalRender.call(configElement)
        let templateElement;
        if (configElement._config.ll_template) {
          templateElement = html`
            <ha-textfield
              dialogInitialFocus
              .value=${configElement._config.ll_template}
              .label=${"Template: Change in Code Editor"}
              readonly
              type="text"
              @change=${_valueChanged}
              style="margin-bottom: 16px;"
            ></ha-textfield>
          `
        } else {
          templateElement = html`
            <ha-textfield
              dialogInitialFocus
              .value=${configElement._config.ll_key}
              .label=${"Key: Change in Code Editor"}

              type="text"
              @change=${_valueChanged}
              style="margin-bottom: 16px;"
            ></ha-textfield>
          `
        }
        return html`
        <div>
          ${templateElement}
          ${result}
        </div>
        `
    };

    return configElement;
  }

  public static async getConfigElement(): Promise<LinkedLovelaceHolderCardEditor> {
    return LinkedLovelaceHolderCard.getVerticalStackConfigElement()
    }

  

  public static getStubConfig(): Record<string, unknown> {
    return {
      cards: [],
    };
  }

  // TODO Add any properities that should cause your element to re-render here
  // https://lit.dev/docs/components/properties/
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() public loaded = false;

  @state() private config!: DashboardHolderCard;

  // https://lit.dev/docs/components/properties/#accessors-custom
  public setConfig(config: DashboardHolderCard): void {
    // TODO Check for required fields and that they are of the proper format
    if (!config) {
      throw new Error(localize('common.invalid_configuration'));
    }

    if (config.test_gui) {
      getLovelace().setEditMode(true);
    }

    console.log(">> s", config)

    this.config = {
      ...config,
    };
    this.loadCardHelpers().then(() => {
      this.renderCard();
    })
  }

  // https://lit.dev/docs/components/lifecycle/#reactive-update-cycle-performing
  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (!this.config) {
      return false;
    }
    if (changedProps.get('loaded') !== undefined) {
      return true;
    }

    return hasConfigOrEntityChanged(this, changedProps, false);
  }

  private async loadCardHelpers(): Promise<void> {
    await (window as any).loadCardHelpers();
  }

  // Some shadow magic in here automatically renders the child cards.
  async renderCard() {
    const config = this.config;
    // Create the card
    const card = document.createElement('ha-card') as any;
    const cardContent = document.createElement('div');
    card.header = config.title;
    card.style.overflow = 'hidden';
    if (config.horizontal) {
      cardContent.style.display = 'flex';
      (cardContent.childNodes as NodeListOf<any>).forEach((card) => {
        card.style.flex = '1 1 0';
        card.style.minWidth = 0;
      });
    }
    card.appendChild(cardContent);

    const shadowRoot = this.shadowRoot || this.attachShadow({ mode: 'open' });
    while (shadowRoot.hasChildNodes()) {
      if (shadowRoot.lastChild) shadowRoot.removeChild(shadowRoot.lastChild);
    }
    shadowRoot.appendChild(card);
  }

  // https://lit.dev/docs/components/rendering/
  protected render(): TemplateResult | void {
    return html`
      <ha-card .header=${this.config.name} tabindex="0" .label=${`Linked Lovelace Holder`}
        class="linked-lovelace-container">
      </ha-card>
    `;
  }

  // https://lit.dev/docs/components/styles/
  static get styles(): CSSResultGroup {
    return css`
      .linked-lovelace-container {
        background-color: rgba(0, 0, 0, 0);
        border: 1px solid;
      }
    `;
  }
}
