import { Dashboard, DashboardConfig } from 'src/types';
import { GlobalLinkedLovelace } from '../instance';
import LinkedLovelaceController from './linkedLovelace';
import { TemplateEngine } from 'src/v2/template-engine';

class HassController {
  linkedLovelaceController: LinkedLovelaceController = new LinkedLovelaceController();

  refresh = async (): Promise<void> => {
    this.linkedLovelaceController = new LinkedLovelaceController();
    const dashboards = await GlobalLinkedLovelace.instance.api.getDashboards();
    const dashboardConfigs = await Promise.all(
      dashboards.map(async (db) => {
        try {
          const config = await GlobalLinkedLovelace.instance.api.getDashboardConfig(db.url_path);
          return [config, db]
        } catch (e) {
          console.error(`Failed to get DB`, db, e)
        }
        return [undefined, undefined]
      }),
    );
    await Promise.all(dashboardConfigs.map(async (dbcs) => {
      const config = dbcs[0] as DashboardConfig
      if (config) {
        return config.views.map(async (view) => {
          return view.cards?.map(async (card) => {
            this.linkedLovelaceController.etaController.addTemplatesFromCard(card)
          })
        })
      }
      return undefined
    }))
    console.log(this.linkedLovelaceController.etaController.loadTemplates())
    TemplateEngine.instance.eta = this.linkedLovelaceController.etaController.engine.eta
    await Promise.all(
      dashboardConfigs.map(async (dbcs) => {
        const config = dbcs[0] as DashboardConfig
        const db = dbcs[1] as Dashboard
        try {
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
        return GlobalLinkedLovelace.instance.api.setDashboardConfig(urlPath, config);
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
        return GlobalLinkedLovelace.instance.api.setDashboardConfig(urlPath, config);
      } catch (e) {
        console.error(`Failed to update DB`, urlPath, config, e)
      }
      return null
    }));
  };
}

export default HassController;
