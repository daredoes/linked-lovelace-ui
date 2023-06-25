import { Dashboard, DashboardConfig } from '../types';
import LinkedLovelaceController from './linkedLovelace';

const dashboard: Dashboard = {
  id: 'test',
  mode: 'storage',
  require_admin: false,
  show_in_sidebar: false,
  title: 'test',
  url_path: 'test',
};

const config: DashboardConfig = {
  views: [
    {
      path: 'test',
      title: 'a'
    }
  ]
}

describe('[class] LinkedLovelaceController', () => {
  test('sets up as expected', () => {
    const controller = new LinkedLovelaceController();
    expect(controller).toBeDefined;
  });

  test('gets nothing with nothing', () => {
    const controller = new LinkedLovelaceController();
    expect(controller.getUpdatedDashboardConfigs()).toEqual({});
  });

  test('gets nothing with nothing when given id', () => {
    const controller = new LinkedLovelaceController();
    expect(controller.getUpdatedDashboardConfigRecord('a')).toEqual({});
  });

  test('gets something with something', () => {
    const controller = new LinkedLovelaceController();
    controller.registerDashboard(dashboard, config)
    expect(controller.getUpdatedDashboardConfigs()).toEqual({
      [dashboard.url_path]: config
    });
  });

  test('gets something with something when given an ID', () => {
    const controller = new LinkedLovelaceController();
    controller.registerDashboard(dashboard, config)
    expect(controller.getUpdatedDashboardConfigRecord(dashboard.id)).toEqual({
      [dashboard.url_path]: config
    });
  });

  test('gets something with something when given an ID', () => {
    const controller = new LinkedLovelaceController();
    controller.templateController.templates
    controller.registerTemplates({'test': {
      type: 'test'
    }})
    expect(Object.keys(controller.templateController.templates)).toHaveLength(1)
  });
  
  
});
