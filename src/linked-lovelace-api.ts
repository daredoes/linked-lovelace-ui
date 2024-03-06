/* eslint-disable @typescript-eslint/no-explicit-any */
import { HomeAssistant } from 'custom-card-helpers';
import { log } from './helpers';
import { Dashboard, DashboardConfig } from './types';
import { Debug } from './debug';

class LinkedLovelaceApi {
  hass!: HomeAssistant;

  constructor(hass: HomeAssistant) {
    this.hass = hass;
  }

  getDashboards = async (): Promise<Dashboard[]> => {
    if (Debug.instance.debug) {
      log('Getting Lovelace User-Created Dashboards');
    }
    return this.hass.callWS<Dashboard[]>({
      type: 'lovelace/dashboards/list',
    }).then((data) => {
      const overviewDashboard: Dashboard = {
        url_path: '',
        id: "overview",
        title: "Overview",
        mode: "unknown",
        require_admin: false,
        show_in_sidebar: false,
      }
      return [overviewDashboard,...data]
    });
  };

  getDashboardConfig = async (urlPath: string | null): Promise<DashboardConfig> => {
    if (Debug.instance.debug) {
      log(`Getting Lovelace User-Created Dashboard: ${urlPath}`);
    }
    return this.hass.callWS<DashboardConfig>({
      type: 'lovelace/config',
      url_path: urlPath,
    }).then((data) => {
      return {...data, views: data.views || []}
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

  setDashboardConfig = async (urlPath: string | null, config: Record<string, any>): Promise<null> => {
    if (Debug.instance.debug) {
      log(`${Debug.instance.dryRun ? 'Not Actually ' : ''}Setting Lovelace User-Created Dashboard: ${urlPath}`, config);
    }
    if (!Debug.instance.dryRun) {
      return this.hass.callWS({
        type: 'lovelace/config/save',
        url_path: urlPath,
        config: config,
      });
    }
    return null;
  };
}

export default LinkedLovelaceApi;
