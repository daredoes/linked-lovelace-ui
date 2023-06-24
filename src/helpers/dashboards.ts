import { Dashboard, DashboardConfig, DashboardView } from '../types';

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
