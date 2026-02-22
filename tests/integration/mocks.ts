import { HomeAssistant } from 'custom-card-helpers';
import { DashboardCard, DashboardConfig, LinkedLovelacePartial, Dashboard } from '../../src/types';

export class MockLinkedLovelaceApi {
    dashboards: Dashboard[] = [];
    configs: Record<string, DashboardConfig> = {};

    async getDashboards(): Promise<Dashboard[]> {
        return this.dashboards;
    }

    async getDashboardConfig(urlPath: string | null): Promise<DashboardConfig> {
        return this.configs[urlPath || 'null'] || { views: [] };
    }

    async setDashboardConfig(urlPath: string | null, config: DashboardConfig): Promise<void> {
        this.configs[urlPath || 'null'] = config;
    }
}

export const mockHass: HomeAssistant = {
    states: {},
    callService: async () => {},
    callApi: async () => ({}),
    localize: (key: string) => key,
    // ... add more if needed
} as any;
