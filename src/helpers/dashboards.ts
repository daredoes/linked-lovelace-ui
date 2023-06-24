import { Dashboard, DashboardCard, DashboardConfig, DashboardView } from '../types';
import { extractTemplateData, updateCardTemplate } from './templates';

export const parseDashboards = (data: Dashboard[]): Record<string, Dashboard> => {
  const dashboards: Record<string, Dashboard> = {};
  data.forEach((dashboard) => {
    dashboards[dashboard.id] = dashboard;
  });
  return dashboards;
};

export const updateDashboardConfigTemplates = (data: DashboardConfig, templateData = {}): DashboardConfig => {
  const views: DashboardView[] = [];
  // Iterate through each view in top-level config
  data.views.forEach((view: DashboardView) => {
    const cards: DashboardCard[] = [];
    if (view.cards) {
      // For every card in the config, store a copy of the rendered card
      view.cards.forEach((card) => {
        const newCard = Object.assign({}, updateCardTemplate(card, templateData));
        if (newCard.template) {
          cards.push(extractTemplateData(newCard));
        } else {
          cards.push(newCard);
        }
      });
      // Replace the cards in the view
      view.cards = cards;
    }
    views.push(Object.assign({}, view));
  });
  // Replace the views in the config
  data.views = views;
  return data;
};

export const updateOrAddViewsToDashboardConfig = (
  dashboard: Dashboard,
  config: DashboardConfig,
  views: Record<string, DashboardView>,
): DashboardConfig => {
  const updatedConfig = { ...config };
  const viewsCopy = { ...views };
  config.views.forEach((view, index) => {
    const key = `${dashboard.id}${view.path ? `.${view.path}` : ''}`;
    if (viewsCopy[key]) {
      updatedConfig.views[index] = viewsCopy[key];
      delete viewsCopy[key];
    }
  });
  updatedConfig.views = updatedConfig.views.concat(Object.values(viewsCopy));
  return updatedConfig;
};
