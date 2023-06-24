import { GlobalLinkedLovelace } from '../instance';
import LinkedLovelaceController from './linkedLovelace';

class HassController {
  linkedLovelaceController: LinkedLovelaceController = new LinkedLovelaceController();

  refresh = async (): Promise<void> => {
    this.linkedLovelaceController = new LinkedLovelaceController();
    const dashboards = await GlobalLinkedLovelace.instance.api.getDashboards();
    await Promise.all(
      dashboards.map(async (db) => {
        try {
          const config = await GlobalLinkedLovelace.instance.api.getDashboardConfig(db.url_path);
          this.linkedLovelaceController.registerDashboard(db, config);
        } catch (e) {
          console.error(`Failed to get/register DB`, db, e)
        }
      }),
    );
  };

  update = async (dashboardId: string, v2 = false): Promise<void> => {
    const records = this.linkedLovelaceController.getUpdatedDashboardConfigRecord(dashboardId, v2);
    await Promise.all(Object.keys(records).map(async (urlPath) => {
      const config = records[urlPath];
      try {
        return GlobalLinkedLovelace.instance.api.setDashboardConfig(urlPath, config);
      } catch (e) {
        console.error(`Failed to update DB`, urlPath, config, e)
      }
      return null
    }));
  };

  updateAll = async (v2 = false): Promise<void> => {
    const records = this.linkedLovelaceController.getUpdatedDashboardConfigs(v2);
    await Promise.all(Object.keys(records).map(async (urlPath) => {
      const config = records[urlPath];
      try {
        return GlobalLinkedLovelace.instance.api.setDashboardConfig(urlPath, config);
      } catch (e) {
        console.error(`Failed to update DB`, urlPath, config, e)
      }
      return null
    }));
  };
}

export default HassController;
