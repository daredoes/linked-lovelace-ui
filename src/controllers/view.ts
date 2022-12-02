import { Dashboard, DashboardView } from '../types';

class ViewController {
  views: Record<string, DashboardView> = {};

  addView(dashboard: Dashboard, view: DashboardView, overwrite = true): boolean {
    const key = `${dashboard.id}${view.path ? `.${view.path}` : ''}`;
    if (overwrite) {
      this.views[key] = view;
      return true;
    } else {
      if (!this.views[key]) {
        this.views[key] = view;
        return true;
      }
    }
    return false;
  }

  viewsByDashboard = (dashboardId: string): Record<string, DashboardView> => {
    const response: Record<string, DashboardView> = {};
    Object.keys(this.views)
      .filter((viewKey) => {
        return viewKey.split('.')[0] === dashboardId;
      })
      .forEach((viewKey) => {
        response[viewKey] = this.views[viewKey];
      });
    return response;
  };
}

export default ViewController;
