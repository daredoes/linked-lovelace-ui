import { HomeAssistant } from 'custom-card-helpers';
import { Card } from './types';
import { Debug } from './debug';
import { Eta } from 'eta';
import Api from './api';

export class TemplateManager {
  private hass: HomeAssistant;
  private api: Api;
  private templates: Map<string, Card> = new Map();
  private partials: Map<string, string> = new Map();
  private eta: Eta;

  constructor(hass: HomeAssistant) {
    this.hass = hass;
    this.api = new Api(hass);
    this.eta = new Eta({ useWith: true });
  }

  private configureEta() {
    Debug.instance.log('Configuring Eta...');
    for (const [key, template] of this.partials) {
      try {
        this.eta.loadTemplate(`@${key}`, template);
        Debug.instance.log(`Registered partial: ${key}`);
      } catch (e) {
        console.error(`[Linked Lovelace] Failed to compile partial '${key}':`, e);
      }
    }
  }

  public async discoverTemplatesAndPartials() {
    Debug.instance.log('Discovering templates and partials...');
    this.templates.clear();
    this.partials.clear();
    this.eta = new Eta({ useWith: true });
    const dashboards = await this.api.getDashboards();
    for (const dashboard of dashboards) {
      if (dashboard.url_path === null || dashboard.url_path === 'null') {
        // Skip the main dashboard for now
        continue;
      }
      const config = await this.api.getDashboardConfig(dashboard.url_path);
      if (config && config.views) {
        for (const view of config.views) {
          if (view.cards) {
            for (const card of view.cards) {
              if (card.ll_key) {
                this.templates.set(card.ll_key, card);
                Debug.instance.log(`Found template: ${card.ll_key}`);
              }
              if (card.type === 'custom:linked-lovelace-partials' && card.partials) {
                for (const partial of card.partials) {
                  if (partial.key && partial.template) {
                    this.partials.set(partial.key, partial.template);
                    Debug.instance.log(`Found partial: ${partial.key}`);
                  }
                }
              }
            }
          }
        }
      }
    }
    Debug.instance.log('Discovery complete.');
    this.configureEta();
  }

  public renderTemplate(templateKey: string, context: any): Card {
    const templateCard = this.templates.get(templateKey);
    if (!templateCard) {
      const error = `Template with key "${templateKey}" not found.`;
      console.error(`[Linked Lovelace] ${error}`);
      return {
        type: 'error',
        error: error,
      };
    }

    const { ll_key, ll_priority, ...restOfCard } = templateCard;
    const templateString = JSON.stringify(restOfCard);

    try {
      const renderedString = this.eta.renderString(templateString, { context });
      const renderedCard = JSON.parse(renderedString);
      return renderedCard;
    } catch (e: any) {
      console.error(`[Linked Lovelace] Error rendering template '${templateKey}':`, e);
      return {
        type: 'error',
        error: `Failed to render template ${templateKey}: ${e.message}`,
        origConfig: templateCard,
      };
    }
  }

  public async processDashboards(): Promise<{
    originalConfigs: Record<string, any>;
    newConfigs: Record<string, any>;
  }> {
    await this.discoverTemplatesAndPartials();
    const dashboards = await this.api.getDashboards();
    const originalConfigs: Record<string, any> = {};
    const newConfigs: Record<string, any> = {};

    for (const dashboard of dashboards) {
      if (dashboard.url_path === null || dashboard.url_path === 'null') {
        continue;
      }
      const originalConfig = await this.api.getDashboardConfig(dashboard.url_path);
      originalConfigs[dashboard.url_path] = originalConfig;
      const newConfig = JSON.parse(JSON.stringify(originalConfig));

      if (newConfig && newConfig.views) {
        for (const view of newConfig.views) {
          if (view.cards) {
            view.cards = view.cards.map((card: Card) => {
              if (card.ll_template) {
                return this.renderTemplate(card.ll_template, card.ll_context);
              }
              return card;
            });
          }
        }
      }
      newConfigs[dashboard.url_path] = newConfig;
    }
    return { originalConfigs, newConfigs };
  }
}
