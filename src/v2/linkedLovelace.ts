import { DashboardCard, DashboardConfig, DashboardView, LinkedLovelacePartial } from '../types';
import TemplateController from '../controllers/template';
import {GlobalLinkedLovelace} from '../instance'
import EtaTemplateController from '../controllers/eta';

const sortTemplatesByPriority = (templates: Record<string, DashboardCard>) => {
  return Object.keys(templates).sort((kA, kB) => {
    const priorityA = templates[kA].ll_priority || 0
    const priorityB = templates[kB].ll_priority || 0
    return priorityA - priorityB
  })
}

class LinkedLovelaceController {
  templateController: TemplateController = new TemplateController();
  etaController: EtaTemplateController = new EtaTemplateController();

  registerTemplates = (templates: Record<string, DashboardCard>): void => {
    sortTemplatesByPriority(templates).forEach((key) => {
      const template = templates[key];
      this.templateController.renderAndAddTemplate(key, template);
    });
  };

  registerPartials = async (card: DashboardCard): Promise<void> => {
    await this.etaController.addPartialsFromCard(card)
  };

  get eta() {
    return this.etaController.engine.eta
  }

  getUpdatedDashboardConfig = async (urlPath: string): Promise<DashboardConfig> => {
    const config = await GlobalLinkedLovelace.instance.api.getDashboardConfig(urlPath);
    const views = config.views;
    Object.keys(views).forEach((viewKey: string) => {
      const view: DashboardView = views[viewKey];
      const cards: DashboardCard[] = [];
      if (view.cards) {
        // For every card in the config, store a copy of the rendered card
        view.cards.forEach((card) => {
          const newCard = this.templateController.renderCard(card);
          cards.push(newCard);
        });
        // Replace the cards in the view
        views[viewKey].cards = cards;
      }
    });
    config.views = views;
    return config;
  };

  getUpdatedDashboardConfigs = async (): Promise<Record<string, DashboardConfig>> => {
    const response: Record<string, DashboardConfig> = {};
    const dashboards = await GlobalLinkedLovelace.instance.api.getDashboards()
    await Promise.all(dashboards.map(async (dashboard) => {
      const config = await this.getUpdatedDashboardConfig(dashboard.url_path)
      response[dashboard.url_path] = config
    }))
    return response;
  };
}

export default LinkedLovelaceController;
