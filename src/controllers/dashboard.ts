import { Dashboard, DashboardCard, DashboardConfig, DashboardView } from '../types';

export interface AddDashboardConfigResponse {
  views: Record<string, DashboardView>;
}

class DashboardController {
  configs: Record<string, DashboardConfig> = {};
  dashboards: Record<string, Dashboard> = {};

  _addDashboardConfig(dashboard: Dashboard, config: DashboardConfig, overwrite = true): boolean {
    if (overwrite) {
      this.configs[dashboard.id] = config;
      this.dashboards[dashboard.id] = dashboard;
      return true;
    } else {
      if (!this.dashboards[dashboard.id]) {
        this.configs[dashboard.id] = config;
        this.dashboards[dashboard.id] = dashboard;
        return true;
      }
    }
    return false;
  }

  addDashboardConfig(dashboard: Dashboard, config: DashboardConfig, overwrite = true): AddDashboardConfigResponse {
    const didAdd = this._addDashboardConfig(dashboard, config, overwrite);
    const response: AddDashboardConfigResponse = {
      views: {},
    };
    if (didAdd) {
      config.views.forEach((view) => {
        response.views[`${dashboard.id}${view.path ? `.${view.path}` : ''}`] = view;
      });
    }
    return response;
  }
}

export default DashboardController;
