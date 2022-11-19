import { Dashboard, DashboardCard, DashboardConfig, DashboardView } from '../types';
import { extractTemplateData, updateCardTemplate } from './templates';

export const parseDashboards = (data) => {
  const dashboards: Record<string, Dashboard> = {};
  data.forEach((dashboard) => {
    if (dashboard.mode == 'storage') {
      dashboards[dashboard.id] = dashboard;
    }
  });
  return dashboards;
};

export const parseDashboardGenerator = (dashboardId, dashboardUrl) => {
  const func = async (dashboardConfig: DashboardConfig) => {
    const response = {
      templates: {},
      dashboard: dashboardConfig,
      views: {},
      dashboardId,
      dashboardUrl,
    };
    if (dashboardConfig.template) {
      dashboardConfig.views.forEach((view) => {
        if (view.cards?.length == 1) {
          response.templates[`${view.path}`] = view.cards[0];
        }
      });
    }
    dashboardConfig.views.forEach((view) => {
      response.views[`${dashboardId}${view.path ? `.${view.path}` : ''}`] = view;
    });
    dashboardConfig.views = Object.values(response.views);
    return response;
  };
  return func;
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
