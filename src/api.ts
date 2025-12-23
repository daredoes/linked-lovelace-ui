import { HomeAssistant } from 'custom-card-helpers';
import { Dashboard, DashboardConfig } from './types';

class Api {
  private hass: HomeAssistant;

  constructor(hass: HomeAssistant) {
    this.hass = hass;
  }

  public async getDashboards(): Promise<Dashboard[]> {
    return this.hass.callWS<Dashboard[]>({
      type: 'lovelace/dashboards/list',
    });
  }

  public async getDashboardConfig(urlPath: string | null): Promise<DashboardConfig> {
    return this.hass.callWS<DashboardConfig>({
      type: 'lovelace/config',
      url_path: urlPath,
    });
  }

  public async setDashboardConfig(urlPath: string | null, config: DashboardConfig): Promise<void> {
    await this.hass.callWS({
      type: 'lovelace/config/save',
      url_path: urlPath,
      config,
    });
  }
}

export default Api;
