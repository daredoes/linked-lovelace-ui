import { GlobalLinkedLovelace } from '../instance';
import { Dashboard, DashboardConfig } from '../types';

class UpdateController {
  static refresh = async (): Promise<{ dbs: Record<string, Dashboard>, configs: Record<string, DashboardConfig>}> => {
    const dashboards = await GlobalLinkedLovelace.instance.api.getDashboards();
    const dbs = {}
    const configs = {}
    await Promise.all(
      dashboards.map(async (db) => {
        try {
          const config = await GlobalLinkedLovelace.instance.api.getDashboardConfig(db.url_path);
          dbs[db.id] = db
          configs[db.id] = config
        } catch (e) {
          console.error(`Failed to get DB`, db, e)
        }
      }),
    );
    return { dbs, configs }
  };

  static update = async (urlPath: string, config: DashboardConfig): Promise<null> => { 
      try {
        return GlobalLinkedLovelace.instance.api.setDashboardConfig(urlPath, config);
      } catch (e) {
        console.error(`Failed to update DB`, urlPath, config, e)
      }
      return null
  };
}

export default UpdateController;
