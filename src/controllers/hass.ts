import StaticLinkedLovelace from '../shared-linked-lovelace';
import LinkedLovelaceController from './linkedLovelace';

class HassController {
  linkedLovelaceController: LinkedLovelaceController = new LinkedLovelaceController();

  refresh = async (): Promise<void> => {
    this.linkedLovelaceController = new LinkedLovelaceController();
    const dashboards = await StaticLinkedLovelace.linkedLovelace.getDashboards();
    await Promise.all(
      dashboards.map(async (db) => {
        const config = await StaticLinkedLovelace.linkedLovelace.getDashboardConfig(db.url_path);
        this.linkedLovelaceController.registerDashboard(db, config);
      }),
    );
  };

  update = async (dashboardId: string): Promise<void> => {
    const records = this.linkedLovelaceController.getUpdatedDashboardConfigRecord(dashboardId);
    await Object.keys(records).map(async (urlPath) => {
      const config = records[urlPath];
      return await StaticLinkedLovelace.linkedLovelace.setDashboardConfig(urlPath, config);
    });
  };

  updateAll = async (): Promise<void> => {
    const records = this.linkedLovelaceController.getUpdatedDashboardConfigs();
    await Object.keys(records).map(async (urlPath) => {
      const config = records[urlPath];
      await StaticLinkedLovelace.linkedLovelace.setDashboardConfig(urlPath, config);
    });
  };
}

export default HassController;
