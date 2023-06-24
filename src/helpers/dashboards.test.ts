import { Dashboard, DashboardConfig, DashboardView } from '../types';
import {
  updateOrAddViewsToDashboardConfig,
} from './dashboards';

describe('[function] updateOrAddViewsToDashboardConfig', () => {
  test('concats non-updated views to the config', () => {
    const db: Dashboard = {
      id: 'test',
      title: 'test',
      mode: 'storage',
      require_admin: false,
      show_in_sidebar: false,
      url_path: '',
    };
    const config: DashboardConfig = {
      views: [],
    };
    const views: Record<string, DashboardView> = {
      test: {
        title: 'test',
      },
    };
    const response = updateOrAddViewsToDashboardConfig(db, config, views);
    expect(response.views.length).toEqual(1);
  });

  test('updates views in the config', () => {
    const db: Dashboard = {
      id: 'test',
      title: 'test',
      mode: 'storage',
      require_admin: false,
      show_in_sidebar: false,
      url_path: '',
    };
    const config: DashboardConfig = {
      views: [
        {
          title: 'bad',
          path: 'test'
        }
      ],
    };
    const views: Record<string, DashboardView> = {
      'test.test': {
        title: 'test',
      },
    };
    const response = updateOrAddViewsToDashboardConfig(db, config, views);
    expect(response.views[0].title).toEqual(views['test.test'].title);
  });
});
