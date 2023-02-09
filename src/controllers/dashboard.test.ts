import { Dashboard, DashboardConfig, DashboardView } from '../types';
import DashboardController, { AddDashboardConfigResponse } from './dashboard';

const dashboard: Dashboard = {
  id: 'test',
  mode: 'storage',
  require_admin: false,
  show_in_sidebar: false,
  title: 'test',
  url_path: 'test',
};

const config: DashboardConfig = {
  views: []
}

describe('[class] ViewController', () => {
  test('sets up as expected', () => {
    const controller = new DashboardController();
    expect(controller).toBeDefined;
  });

  test('adds nothing when given an empty config as expected', () => {
    const controller = new DashboardController();
    const emptyResponse: AddDashboardConfigResponse = {
      templates: {},
      views: {}
    }
    expect(controller.addDashboardConfig(dashboard, config)).toEqual(emptyResponse);
  });

  test('adds a dashboard and config as expected', () => {
    const controller = new DashboardController();
    expect(controller.dashboards).toEqual({})
    const response = controller._addDashboardConfig(dashboard, config)
    expect(response).toBe(true)
    expect(controller.dashboards[dashboard.id]).toEqual(dashboard)
    expect(controller.configs[dashboard.id]).toEqual(config)
  });

  test('does not overwrite a dashboard and config as expected', () => {
    const controller = new DashboardController();
    expect(controller.dashboards).toEqual({})
    controller._addDashboardConfig(dashboard, config)
    expect(controller.dashboards[dashboard.id]).toEqual(dashboard)
    expect(controller.configs[dashboard.id]).toEqual(config)
    const modifiedDashboard: Dashboard = { ...dashboard, title: 'updated'}
    const response = controller._addDashboardConfig(modifiedDashboard, config, false)
    expect(response).toBe(false)
    expect(controller.dashboards[dashboard.id]).toEqual(dashboard)
  });

  test('does overwrite a dashboard and config as expected', () => {
    const controller = new DashboardController();
    expect(controller.dashboards).toEqual({})
    controller._addDashboardConfig(dashboard, config)
    expect(controller.dashboards[dashboard.id]).toEqual(dashboard)
    expect(controller.configs[dashboard.id]).toEqual(config)
    const modifiedDashboard: Dashboard = { ...dashboard, title: 'updated'}
    const response = controller._addDashboardConfig(modifiedDashboard, config, true)
    expect(response).toBe(true)
    expect(controller.dashboards[dashboard.id]).toEqual(modifiedDashboard)
  });

  test('constructs key with without view id properly', () => {
    const controller = new DashboardController();
    const testConfig: DashboardConfig = {...config, views: [{title: 'best'}]}
    const response: AddDashboardConfigResponse = {
      templates: {},
      views: {
        [dashboard.id]: {
          title: 'best'
        }
      }
    }
    expect(controller.addDashboardConfig(dashboard, testConfig)).toEqual(response);
  });

  test('constructs key with with view id properly', () => {
    const controller = new DashboardController();
    const testConfig: DashboardConfig = {...config, views: [{title: 'best', id: 'yes'}]}
    const response: AddDashboardConfigResponse = {
      templates: {},
      views: {
        [dashboard.id + ".yes" ]: {
          title: 'best',
          id: "yes"
        }
      }
    }
    expect(controller.addDashboardConfig(dashboard, testConfig)).toEqual(response);
  });
});
