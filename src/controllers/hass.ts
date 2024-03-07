import { Dashboard, DashboardCard, DashboardConfig, LinkedLovelacePartial } from 'src/types';
import { GlobalLinkedLovelace } from '../instance';
import LinkedLovelaceController from '../v2/linkedLovelace';
import { TemplateEngine } from 'src/v2/template-engine';

const getS = (array) => {
  return array.length !== 1 ? 's' : ''
}

class HassController {
  linkedLovelaceController: LinkedLovelaceController = new LinkedLovelaceController();
  dashboardsToPartials: Record<string, Record<string, LinkedLovelacePartial>> = {}
  dashboardsToTemplates: Record<string, Record<string, DashboardCard>> = {}
  logs: string[] = [];
  forwardLogs = false;

  addToLogs = (text: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO') => {
    const timestamp = new Date().toISOString()
    const logText = `${timestamp} [${level}]:${text}`;
    this.logs.push(logText)
    if (this.forwardLogs) {
      if (level === 'INFO') {
        console.log(logText)
      } else if (level === 'ERROR') {
        console.error(logText)
      } else if (level === 'WARN') {
        console.warn(logText)
      }
    }
  }


  refresh = async (): Promise<void> => {
    this.addToLogs(`Beginning Refresh`)
    this.linkedLovelaceController = new LinkedLovelaceController();
    this.dashboardsToPartials = {}
    this.addToLogs(`Discovering Dashboards`)
    const dashboards = await GlobalLinkedLovelace.instance.api.getDashboards();
    this.addToLogs(`Discovered ${dashboards.length} Dashboard${getS(dashboards)}`)
    this.addToLogs(`Retrieving Dashboard Configs`)
    const dashboardConfigs = await Promise.all(
      dashboards.map(async (db) => {
        try {
          this.addToLogs(`[url:"${window.location.origin}/${db.url_path}"] Retrieving details for dashboard`)
          const config = await GlobalLinkedLovelace.instance.api.getDashboardConfig(db.url_path);
          this.addToLogs(`[url:"${window.location.origin}/${db.url_path}"] Retrieved ${config.views.length} View${getS(config.views)} for dashboard`)
          return [config, db]
        } catch (e) {
          console.error(`Failed to get DB`, db, e)
          this.addToLogs(`[url:"${window.location.origin}/${db.url_path}"] Failed to retrieve details for dashboard`, "ERROR")
        }
        return [undefined, undefined]
      }),
    );
    this.addToLogs(`Retrieved ${dashboardConfigs.length}/${dashboards.length} Dashboard Config${getS(dashboards)}`)
    this.addToLogs(`Discovering Templates and Partials within Dashboard Configs`)
    const templates: Record<string, DashboardCard> = {};
    await Promise.all(dashboardConfigs.map(async (dbcs) => {
      const config = dbcs[0] as DashboardConfig
      const dashboard = dbcs[1] as Dashboard
      if (config) {
        const dashboardPath = dashboard.url_path ? dashboard.url_path : '';
        if (!this.dashboardsToTemplates[dashboardPath]) {
          this.dashboardsToTemplates[dashboardPath] = {}
        }
        return await Promise.all(config.views.map(async (view) => {
          this.addToLogs(`[url:"${window.location.origin}/${dashboard.url_path}"] [view:${view.title}] Discovering Templates and Partials`)
          return await Promise.all((view.cards || []).map(async (card) => {
            if (card.ll_key) {
              this.addToLogs(`[url:"${window.location.origin}/${dashboard.url_path}"] [view:${view.title}] [template:${card.ll_key}] [priority:${card.ll_priority || 0}] Discovered Template`)
              if (templates[card.ll_key] && (templates[card.ll_key].ll_priority || 0) < (card.ll_priority || 0)) { 
                this.addToLogs(`[url:"${window.location.origin}/${dashboard.url_path}"] [view:${view.title}] Template already exists with tag ${card.ll_key}`, 'WARN')
              } else {
                templates[card.ll_key] = card
              }
              this.dashboardsToTemplates[dashboardPath] = {...this.dashboardsToTemplates[dashboardPath], ...{[card.ll_key]: card}}
            }
            
            const partials = await this.linkedLovelaceController.registerPartials(card)
            const partialKeys = Object.keys(partials);
            if (partialKeys.length) {
              this.addToLogs(`[url:"${window.location.origin}/${dashboard.url_path}"] [view:${view.title}] Discovered ${partialKeys.length} Partial${getS(partialKeys)}`)
            }
            this.dashboardsToPartials[dashboardPath] = partials;
          }))
        }))
      }
      return undefined
    }))
    // The above await puts the partials into the controller
    this.addToLogs("Registering Partials")
    this.linkedLovelaceController.etaController.loadPartials()
    TemplateEngine.instance.eta = this.linkedLovelaceController.eta
    this.addToLogs("Registering Templates")
    this.linkedLovelaceController.registerTemplates(templates)
  };

  update = async (urlPath: string | null, dryRun = false): Promise<DashboardConfig | null | undefined> => {
    const validatedUrlPath = urlPath === '' ? null : urlPath;
    const urlStatus = `[url:${urlPath ? urlPath : ''}]`;
    const dryRunStatus = `[dryRun:${dryRun ? 'enabled' : 'disabled'}]`;
    this.addToLogs(`${dryRunStatus} ${urlStatus} Starting Update`)
    try {
      this.addToLogs(`${dryRunStatus} ${urlStatus} Rendering latest dashboard with templates and partials`)
      const config = await this.linkedLovelaceController.getUpdatedDashboardConfig(validatedUrlPath);
      if (!dryRun) {
        try {
          this.addToLogs(`${dryRunStatus} ${urlStatus} Saving latest rendered dashboard`)
          await GlobalLinkedLovelace.instance.api.setDashboardConfig(validatedUrlPath, config);
        } catch (e) {
          this.addToLogs(`${dryRunStatus} ${urlStatus} Failed to update ${e}`, 'ERROR')
          console.error(`Failed to update DB`, validatedUrlPath, config, e)
        }
      }
      this.addToLogs(`${dryRunStatus} ${urlStatus} Finished Update`)
      return config
    } catch (e) {
      this.addToLogs(`${dryRunStatus} ${urlStatus} Failed to render latest dashboard with templates and partials`)
      console.error(`Failed to get DB`, validatedUrlPath, e)
      this.addToLogs(`${dryRunStatus} ${urlStatus} Failed Update`)
      return null;
    }
  };

  updateAll = async (dryRun = false): Promise<Record<string, DashboardConfig | null | undefined>> => {
    const dryRunStatus = `[dryRun:${dryRun ? 'enabled' : 'disabled'}]`;
    this.addToLogs(`${dryRunStatus} Starting Update All`)
    const records = await GlobalLinkedLovelace.instance.api.getDashboards();
    const configs = {}
    await Promise.all(records.map(async (dashboard) => {
      const newConfig = await this.update(dashboard.url_path, dryRun)
      configs[dashboard.url_path ? dashboard.url_path : ''] = newConfig;
    }));
    return configs
  };
}

export default HassController;
