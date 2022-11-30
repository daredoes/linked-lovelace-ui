import { Dashboard } from '../types';
import { parseDashboardGenerator, parseDashboards } from './dashboards';

export { updateDashboardConfigTemplates, parseDashboardGenerator, parseDashboards } from './dashboards';

describe('[function] parseDashboards', () => {
  test('empty array returns empty map of Dashboards', () => {
    expect(parseDashboards([])).toStrictEqual({});
  });

  test('array returns map of Dashboards', () => {
    const dashboard: Dashboard = {
      id: 'test',
      mode: 'storage',
      require_admin: false,
      show_in_sidebar: true,
      title: 'test',
      url_path: 'test-name',
    };
    const dashboards: Dashboard[] = [dashboard];
    expect(parseDashboards(dashboards)).toStrictEqual({
      [dashboard.id]: dashboard,
    });
  });
  test('results ignore non-storage mode dashboards', () => {
    const dashboard: Dashboard = {
      id: 'test',
      mode: 'storage',
      require_admin: false,
      show_in_sidebar: true,
      title: 'test',
      url_path: 'test-name',
    };
    const badDashboard = { ...dashboard, mode: 'failure', id: 'badTest' };
    const dashboards: Dashboard[] = [dashboard, badDashboard];
    expect(parseDashboards(dashboards)).toStrictEqual({
      [dashboard.id]: dashboard,
    });
  });
});

describe('[function] parseDashboardGenerator', () => {
  test('returns an executable', () => {
    expect(typeof parseDashboardGenerator('a', 'b')).toBe('function');
  });
});
