import StaticLinkedLovelace from '../shared-linked-lovelace';
import LinkedLovelaceController from './linkedLovelace';

class HassController {
  linkedLovelaceController: LinkedLovelaceController = new LinkedLovelaceController();

  refresh = async (): Promise<void> => {
    this.linkedLovelaceController = new LinkedLovelaceController();
    const dashboards = await StaticLinkedLovelace.linkedLovelace.getDashboards();
    await Promise.all(
      dashboards.map(async (db) => {
        try {
          const config = await StaticLinkedLovelace.linkedLovelace.getDashboardConfig(db.url_path);
          this.linkedLovelaceController.registerDashboard(db, config);
        } catch (e) {
          console.error(`Failed to get/register DB`, db, e)
        }
      }),
    );
  };

  update = async (dashboardId: string): Promise<void> => {
    const records = this.linkedLovelaceController.getUpdatedDashboardConfigRecord(dashboardId);
    await Promise.all(Object.keys(records).map(async (urlPath) => {
      const config = records[urlPath];
      try {
        return StaticLinkedLovelace.linkedLovelace.setDashboardConfig(urlPath, config);
      } catch (e) {
        console.error(`Failed to update DB`, urlPath, config, e)
      }
      return null
    }));
  };

  updateAll = async (): Promise<void> => {
    const records = this.linkedLovelaceController.getUpdatedDashboardConfigs();
    await Promise.all(Object.keys(records).map(async (urlPath) => {
      const config = records[urlPath];
      try {
        return StaticLinkedLovelace.linkedLovelace.setDashboardConfig(urlPath, config);
      } catch (e) {
        console.error(`Failed to update DB`, urlPath, config, e)
      }
      return null
    }));
  };
}

export default HassController;
