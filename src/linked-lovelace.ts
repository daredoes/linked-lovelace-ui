/* eslint-disable @typescript-eslint/no-explicit-any */
import { HomeAssistant } from 'custom-card-helpers';
import { log } from './helpers';
import { Dashboard, DashboardCard, DashboardConfig, DashboardView } from './types';

class LinkedLovelace {
  templates: Record<string, DashboardCard> = {};
  views: Record<string, DashboardView> = {};
  dashboards: Record<string, Dashboard> = {};
  hass!: HomeAssistant;
  debug = false;
  dryRun = false;

  constructor(hass: HomeAssistant, debug = false, dryRun = false) {
    this.hass = hass;
    this.debug = debug;
    this.dryRun = dryRun;
  }

  getDashboards = async (): Promise<Dashboard[]> => {
    if (this.debug) {
      log('Getting Lovelace User-Created Dashboards');
    }
    return this.hass.callWS<Dashboard[]>({
      type: 'lovelace/dashboards/list',
    });
  };

  getDashboardConfig = async (urlPath: string): Promise<DashboardConfig> => {
    if (this.debug) {
      log(`Getting Lovelace User-Created Dashboard: ${urlPath}`);
    }
    return this.hass.callWS<DashboardConfig>({
      type: 'lovelace/config',
      url_path: urlPath,
    });
  };

  toggleDashboardAsTemplate = async (urlPath: string, isTemplate?: boolean): Promise<DashboardConfig> => {
    const dashboardConfig = await this.getDashboardConfig(urlPath);
    dashboardConfig.template = typeof isTemplate === 'undefined' ? !Boolean(dashboardConfig.template) : isTemplate;
    if (typeof dashboardConfig.template !== 'undefined' && !dashboardConfig.template) {
      delete dashboardConfig.template;
    }
    await this.setDashboardConfig(urlPath, dashboardConfig);
    return dashboardConfig;
  };

  setDashboardConfig = async (urlPath: string, config: Record<string, any>): Promise<null> => {
    if (this.debug) {
      log(`${this.dryRun ? 'Not Actually ' : ''}Setting Lovelace User-Created Dashboard: ${urlPath}`, config);
    }
    if (!this.dryRun) {
      return this.hass.callWS({
        type: 'lovelace/config/save',
        url_path: urlPath,
        config: config,
      });
    }
    return null;
  };
}

export default LinkedLovelace;
