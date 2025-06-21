import { Dashboard, DashboardCard, DashboardConfig, LinkedLovelacePartial } from 'src/types';
import { GlobalLinkedLovelace } from '../instance';
import LinkedLovelaceController from '../v2/linkedLovelace';
import { TemplateEngine } from 'src/v2/template-engine';
import { toConsole } from '../util';

const getS = (array) => {
  return array?.length !== 1 ? 's' : ''
}

interface View {
  id: string
  templates: Record<string, DashboardCard>
  partials: Record<string, LinkedLovelacePartial>
}

interface AddToLog {
  msg: string,
  level?: 'INFO' | 'WARN' | 'ERROR'
}

class HassController {
  linkedLovelaceController: LinkedLovelaceController = new LinkedLovelaceController();
  dashboardsToViews: Record<string, Record<string, View>> = {}
  logs: string[] = [];
  forwardLogs = false;

  addToLogs = ({ msg, level = 'INFO' }: AddToLog, ...values: any[]) => {
    const timestamp = new Date().toISOString()
    const logText = `[${level}]:${msg}`;
    this.logs.push(logText)
    if (this.forwardLogs) {
      toConsole(level.toLowerCase() as any, msg, { timestamp }, ...values)
    }
  }


  refresh = async (): Promise<void> => {
    this.addToLogs({ msg: `Beginning Refresh` })
    this.linkedLovelaceController = new LinkedLovelaceController();
    this.dashboardsToViews = {}
    this.addToLogs({ msg: `Discovering Dashboards` })
    const dashboards = await GlobalLinkedLovelace.instance.api.getDashboards();
    this.addToLogs({ msg: `Discovered ${dashboards.length} Dashboard${getS(dashboards)}` }, dashboards)
    this.addToLogs({ msg: `Retrieving Dashboard Configs` })
    const dashboardConfigs = await Promise.all(
      dashboards.map(async (db) => {
        try {
          this.addToLogs({ msg: `[url:"${window.location.origin}/${db.url_path}"] Retrieving details for dashboard` }, db)
          const config = await GlobalLinkedLovelace.instance.api.getDashboardConfig(db.url_path);
          this.addToLogs({ msg: `[url:"${window.location.origin}/${db.url_path}"] Retrieved ${config.views?.length} View${getS(config.views)} for dashboard` }, db, config)
          return [config, db]
        } catch (e) {
          this.addToLogs({ msg: `[url:"${window.location.origin}/${db.url_path}"] Failed to retrieve details for dashboard`, level: 'ERROR' }, db, e)
        }
        return [undefined, undefined]
      }),
    );
    this.addToLogs({ msg: `Retrieved ${dashboardConfigs.length}/${dashboards.length} Dashboard Config${getS(dashboards)}` }, dashboards, dashboardConfigs)
    this.addToLogs({ msg: `Discovering Templates and Partials within Dashboard Configs` })
    const templates: Record<string, DashboardCard> = {};
    await Promise.all(dashboardConfigs.map(async (dbcs) => {
      const config = dbcs[0] as DashboardConfig
      const dashboard = dbcs[1] as Dashboard
      if (config?.views) {
        const dashboardPath = dashboard.url_path ? dashboard.url_path : '';
        if (!this.dashboardsToViews[dashboardPath]) {
          this.dashboardsToViews[dashboardPath] = {}
        }
        return await Promise.all(config.views.map(async (view) => {
          const viewKey = view.path || '';
          if (!this.dashboardsToViews[dashboardPath][viewKey]) {
            this.dashboardsToViews[dashboardPath][viewKey] = {
              id: viewKey,
              templates: {},
              partials: {}
            }
          }
          this.addToLogs({ msg: `[url:"${window.location.origin}/${dashboard.url_path}"] [view:${view.title}] Discovering Templates and Partials` }, dashboard, view)
          return await Promise.all((view.cards || []).map(async (card) => {
            if (card.ll_key) {
              this.addToLogs({ msg: `[url:"${window.location.origin}/${dashboard.url_path}"] [view:${view.title}] [template:${card.ll_key}] [priority:${card.ll_priority || 0}] Discovered Template` }, dashboard, view, card)
              if (templates[card.ll_key] && (templates[card.ll_key].ll_priority || 0) < (card.ll_priority || 0)) {
                this.addToLogs({ msg: `[url:"${window.location.origin}/${dashboard.url_path}"] [view:${view.title}] Template already exists with tag ${card.ll_key}`, level: "WARN" }, dashboard, view, card)
              } else {
                templates[card.ll_key] = card
              }
              this.dashboardsToViews[dashboardPath][viewKey].templates = { ...this.dashboardsToViews[dashboardPath][viewKey].templates, ...{ [card.ll_key]: card } }
            }

            const partials = await this.linkedLovelaceController.registerPartials(card)
            const partialKeys = Object.keys(partials);
            if (partialKeys.length) {
              this.addToLogs({ msg: `[url:"${window.location.origin}/${dashboard.url_path}"] [view:${view.title}] Discovered ${partialKeys.length} Partial${getS(partialKeys)}` }, dashboard, view, partials)
            }
            this.dashboardsToViews[dashboardPath][viewKey].partials = partials;
          }))
        }))
      }
      return undefined
    }))
    // The above await puts the partials into the controller
    this.addToLogs({ msg: "Registering Partials" })
    this.linkedLovelaceController.templatePartialController.loadPartials()
    TemplateEngine.instance.eta = this.linkedLovelaceController.eta
    this.addToLogs({ msg: "Registering Templates" })
    this.linkedLovelaceController.registerTemplates(templates)
  };

  update = async (urlPath: string | null, dryRun = false): Promise<DashboardConfig | null | undefined> => {
    const validatedUrlPath = urlPath === '' ? null : urlPath;
    const urlStatus = `[url:${urlPath ? urlPath : ''}]`;
    const dryRunStatus = `[dryRun:${dryRun ? 'enabled' : 'disabled'}]`;
    this.addToLogs({ msg: `${dryRunStatus} ${urlStatus} Starting Update` }, { dryRun, urlPath })
    try {
      this.addToLogs({ msg: `${dryRunStatus} ${urlStatus} Rendering latest dashboard with templates and partials` }, { dryRun, urlPath })
      const config = await this.linkedLovelaceController.getUpdatedDashboardConfig(validatedUrlPath);
      if (!dryRun) {
        try {
          this.addToLogs({ msg: `${dryRunStatus} ${urlStatus} Saving latest rendered dashboard` }, { dryRun, urlPath, config })
          await GlobalLinkedLovelace.instance.api.setDashboardConfig(validatedUrlPath, config);
        } catch (e) {
          this.addToLogs({ msg: `${dryRunStatus} ${urlStatus} Failed to update ${e}`, level: 'ERROR' }, { dryRun, urlPath, config })
          console.error(`Failed to update DB`, validatedUrlPath, config, e)
        }
      } else {
        this.addToLogs({ msg: `${dryRunStatus} ${urlStatus} Would save latest rendered dashboard` }, { dryRun, urlPath, config })
      }
      this.addToLogs({ msg: `${dryRunStatus} ${urlStatus} Finished Update` }, { dryRun, urlPath })
      return config
    } catch (e) {
      this.addToLogs({ msg: `${dryRunStatus} ${urlStatus} Failed to render latest dashboard with templates and partials` }, { dryRun, urlPath })
      return null;
    }
  };

  updateAll = async (dryRun = false): Promise<Record<string, DashboardConfig | null | undefined>> => {
    const dryRunStatus = `[dryRun:${dryRun ? 'enabled' : 'disabled'}]`;
    this.addToLogs({ msg: `${dryRunStatus} Starting Update All` }, { dryRun })
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
