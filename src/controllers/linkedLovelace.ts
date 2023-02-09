import { updateOrAddViewsToDashboardConfig } from '../helpers/dashboards';
import { Dashboard, DashboardCard, DashboardConfig, DashboardView } from '../types';
import DashboardController from './dashboard';
import TemplateController from './template';
import ViewController from './view';

class LinkedLovelaceController {
  dashboardController: DashboardController = new DashboardController();
  viewController: ViewController = new ViewController();
  templateController: TemplateController = new TemplateController();

  registerDashboard = (dashboard: Dashboard, config: DashboardConfig): void => {
    const { templates, views } = this.dashboardController.addDashboardConfig(dashboard, config);
    Object.values(views).forEach((view) => {
      this.viewController.addView(dashboard, view);
    });
    Object.keys(templates).forEach((key) => {
      const template = templates[key];
      this.templateController.renderAndAddTemplate(key, template);
    });
  };

  getUpdatedDashboardConfig = (dashboardId: string): DashboardConfig => {
    const dashboard = this.dashboardController.dashboards[dashboardId];
    if (!dashboard) {
      throw new Error(`There is no dashboard with the ID: ${dashboardId}`);
    }
    const config = this.dashboardController.configs[dashboardId];
    const views = this.viewController.viewsByDashboard(dashboardId);
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
    const updatedConfig = updateOrAddViewsToDashboardConfig(dashboard, config, views);
    return updatedConfig;
  };

  getUpdatedDashboardConfigs = (): Record<string, DashboardConfig> => {
    const response: Record<string, DashboardConfig> = {};
    Object.keys(this.dashboardController.dashboards).forEach((dbId) => {
      const url_path = this.dashboardController.dashboards[dbId].url_path;
      response[url_path] = this.getUpdatedDashboardConfig(dbId);
    });
    return response;
  };

  getUpdatedDashboardConfigRecord = (dashboardId: string): Record<string, DashboardConfig> => {
    const db = this.dashboardController.dashboards[dashboardId]
    if (db) {
      const url_path = db.url_path;
      return {
        [url_path]: this.getUpdatedDashboardConfig(dashboardId),
      };
    }
    return {};
  };
}

export default LinkedLovelaceController;
