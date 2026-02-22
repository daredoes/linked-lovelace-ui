import { Dashboard, DashboardCard, DashboardConfig, LinkedLovelacePartial, DiscoveryView } from '../types';
import { GlobalLinkedLovelace } from '../instance';
import LinkedLovelaceController from '../v2/linkedLovelace';
import { TemplateEngine } from 'src/v2/template-engine';
import { toConsole } from 'src/helpers/log';

interface AddToLog {
  msg: string, 
  level?: 'INFO' | 'WARN' | 'ERROR'
}

class HassController {
  linkedLovelaceController: LinkedLovelaceController = new LinkedLovelaceController();
  dashboardsToViews: Record<string, Record<string, DiscoveryView>> = {}
  logs: string[] = [];
  forwardLogs = false;

  addToLogs = ({msg, level = 'INFO'}: AddToLog, ...values: any[]) => {
    const timestamp = new Date().toISOString()
    const logText = `[${level}]:${msg}`;
    this.logs.push(logText)
    if (this.forwardLogs) {
      toConsole(level.toLowerCase() as any, msg, {timestamp} ,...values)
    }
  }


  refresh = async (): Promise<void> => {
    this.addToLogs({msg: `Beginning Refresh`})
    this.linkedLovelaceController = new LinkedLovelaceController();
    
    this.addToLogs({msg: `Discovering Templates and Partials` })
    const result = await this.linkedLovelaceController.discoverAndRegisterAll();
    this.dashboardsToViews = result.dashboardsToViews as any;
    
    TemplateEngine.instance.eta = this.linkedLovelaceController.eta
    this.addToLogs({msg: `Finished Refresh` })
  };

  update = async (urlPath: string | null, dryRun = false): Promise<DashboardConfig | null | undefined> => {
    const validatedUrlPath = urlPath === '' ? null : urlPath;
    const urlStatus = `[url:${urlPath ? urlPath : ''}]`;
    const dryRunStatus = `[dryRun:${dryRun ? 'enabled' : 'disabled'}]`;
    this.addToLogs({msg: `${dryRunStatus} ${urlStatus} Starting Update`}, {dryRun, urlPath})
    try {
      this.addToLogs({msg: `${dryRunStatus} ${urlStatus} Rendering latest dashboard with templates and partials`}, {dryRun, urlPath})
      const config = await this.linkedLovelaceController.getUpdatedDashboardConfig(validatedUrlPath);
      if (!dryRun) {
        try {
          this.addToLogs({msg: `${dryRunStatus} ${urlStatus} Saving latest rendered dashboard`}, {dryRun, urlPath, config})
          await GlobalLinkedLovelace.instance.api.setDashboardConfig(validatedUrlPath, config);
        } catch (e) {
          this.addToLogs({msg: `${dryRunStatus} ${urlStatus} Failed to update ${e}`, level: 'ERROR'}, {dryRun, urlPath, config})
          console.error(`Failed to update DB`, validatedUrlPath, config, e)
        }
      } else {
        this.addToLogs({msg: `${dryRunStatus} ${urlStatus} Would save latest rendered dashboard`}, {dryRun, urlPath, config})
      }
      this.addToLogs({msg: `${dryRunStatus} ${urlStatus} Finished Update`}, {dryRun, urlPath})
      return config
    } catch (e) {
      this.addToLogs({msg: `${dryRunStatus} ${urlStatus} Failed to render latest dashboard with templates and partials`}, {dryRun, urlPath})      
      return null;
    }
  };

  updateAll = async (dryRun = false): Promise<Record<string, DashboardConfig | null | undefined>> => {
    const dryRunStatus = `[dryRun:${dryRun ? 'enabled' : 'disabled'}]`;
    this.addToLogs({msg: `${dryRunStatus} Starting Update All`}, {dryRun})
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
