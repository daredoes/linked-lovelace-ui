import StaticLinkedLovelace from '../shared-linked-lovelace';
import { Dashboard, DashboardConfig } from '../types';

class UpdateController {
  static refresh = async (): Promise<{ dbs: Record<string, Dashboard>, configs: Record<string, DashboardConfig>}> => {
    const dashboards = await StaticLinkedLovelace.linkedLovelace.getDashboards();
    const dbs = {}
    const configs = {}
    await Promise.all(
      dashboards.map(async (db) => {
        try {
          const config = await StaticLinkedLovelace.linkedLovelace.getDashboardConfig(db.url_path);
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
        return StaticLinkedLovelace.linkedLovelace.setDashboardConfig(urlPath, config);
      } catch (e) {
        console.error(`Failed to update DB`, urlPath, config, e)
      }
      return null
  };
}

export default UpdateController;
