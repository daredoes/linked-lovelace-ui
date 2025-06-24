import { DashboardCard, DashboardConfig, DashboardView, LinkedLovelacePartial } from '../types';
import TemplateController from '../controllers/template';
import { GlobalLinkedLovelace } from '../instance'
import TemplatePartialController from '../controllers/partial';

const sortTemplatesByPriority = (templates: Record<string, DashboardCard>) => {
  return Object.keys(templates).sort((kA, kB) => {
    const priorityA = templates[kA].ll_priority || 0
    const priorityB = templates[kB].ll_priority || 0
    return priorityA - priorityB
  })
}

class LinkedLovelaceController {
  templateController: TemplateController = new TemplateController();
  templatePartialController: TemplatePartialController = new TemplatePartialController();

  // Register templates asynchronously, ensuring all templates are rendered and added
  registerTemplates = async (templates: Record<string, DashboardCard>): Promise<void> => {
    for (const key of sortTemplatesByPriority(templates)) {
      const template = templates[key];
      await this.templateController.renderAndAddTemplate(key, template);
    }
  };

  registerPartials = async (card: DashboardCard): Promise<Record<string, LinkedLovelacePartial>> => {
    return await this.templatePartialController.addPartialsFromCard(card)
  };

  get eta() {
    return this.templatePartialController.engine.eta
  }

  get jinja2() {
    return this.templatePartialController.engine.jinja2
  }

  getUpdatedDashboardConfig = async (urlPath: string | null): Promise<DashboardConfig> => {
    const config = await GlobalLinkedLovelace.instance.api.getDashboardConfig(urlPath);
    if (!config.views) return config;

    const views = config.views;

    for (const viewKey of Object.keys(views)) {
      const view: DashboardView = views[viewKey];

      if (view.cards) {
        const renderedCards = await Promise.all(
          view.cards.map((card) => this.templateController.renderCard(card))
        );
        views[viewKey].cards = renderedCards;
      }

      if (view.sections && Array.isArray(view.sections)) {
        for (const section of view.sections) {
          if (section.cards && Array.isArray(section.cards)) {
            section.cards = await Promise.all(
              section.cards.map((card) => this.templateController.renderCard(card))
            );
          }
        }
      }
    }

    config.views = views;
    return config;
  };

  getUpdatedDashboardConfigs = async (): Promise<Record<string, DashboardConfig>> => {
    const response: Record<string, DashboardConfig> = {};
    const dashboards = await GlobalLinkedLovelace.instance.api.getDashboards()
    await Promise.all(dashboards.map(async (dashboard) => {
      const config = await this.getUpdatedDashboardConfig(dashboard.url_path)
      response[dashboard.url_path || "null"] = config
    }))
    return response;
  };
}

export default LinkedLovelaceController;
