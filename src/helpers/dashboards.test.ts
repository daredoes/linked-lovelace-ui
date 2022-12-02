import { Dashboard, DashboardCard, DashboardConfig, DashboardView } from '../types';
import {
  parseDashboardGenerator,
  parseDashboards,
  updateDashboardConfigTemplates,
  updateOrAddViewsToDashboardConfig,
} from './dashboards';

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

  test('returns an expected response', async () => {
    const dbConfig: DashboardConfig = {
      views: [],
    };
    const dashboardId = 'a';
    const dashboardUrl = 'b';
    const generatedFunc = parseDashboardGenerator(dashboardId, dashboardUrl);
    const response = await generatedFunc(dbConfig);
    const expectedResponse = {
      templates: {},
      dashboard: dbConfig,
      views: {},
      dashboardId,
      dashboardUrl,
    };
    expect(response).toStrictEqual(expectedResponse);
  });

  test('pulls views from config as expected', async () => {
    const view: DashboardView = {
      title: 'test',
      path: 'home',
    };

    const viewWithoutPath: DashboardView = {
      title: 'test',
    };
    const dbConfig: DashboardConfig = {
      views: [view, viewWithoutPath],
    };
    const dashboardId = 'a';
    const dashboardUrl = 'b';
    const generatedFunc = parseDashboardGenerator(dashboardId, dashboardUrl);
    const response = await generatedFunc(dbConfig);
    const expectedResponse = {
      templates: {},
      dashboard: dbConfig,
      views: {
        [`${dashboardId}.${view.path}`]: view,
        [`${dashboardId}`]: viewWithoutPath,
      },
      dashboardId,
      dashboardUrl,
    };
    expect(response).toStrictEqual(expectedResponse);
  });
  test('pulls templates from config as expected', async () => {
    const card: DashboardCard = {
      type: 'test',
    };
    const view: DashboardView = {
      title: 'test',
      path: 'home',
      cards: [card],
    };

    const viewWithoutPath: DashboardView = {
      title: 'test',
      cards: [card],
    };

    const viewWithMultipleCards: DashboardView = {
      title: 'test',
      cards: [card, card],
      path: 'cards',
    };
    const dbConfig: DashboardConfig = {
      views: [view, viewWithoutPath, viewWithMultipleCards],
      template: true,
    };
    const dashboardId = 'a';
    const dashboardUrl = 'b';
    const generatedFunc = parseDashboardGenerator(dashboardId, dashboardUrl);
    const response = await generatedFunc(dbConfig);
    const expectedResponse = {
      templates: {
        home: card,
      },
      dashboard: dbConfig,
      views: {
        [`${dashboardId}.${view.path}`]: view,
        [`${dashboardId}.${viewWithMultipleCards.path}`]: viewWithMultipleCards,
        [`${dashboardId}`]: viewWithoutPath,
      },
      dashboardId,
      dashboardUrl,
    };
    expect(response).toStrictEqual(expectedResponse);
  });
});

describe('[function] updateDashboardConfigTemplates', () => {
  test('returns an expected response', () => {
    const dbConfig: DashboardConfig = {
      views: [],
    };
    const response = updateDashboardConfigTemplates(dbConfig);
    const expectedResponse: DashboardConfig = {
      views: [],
    };
    expect(response).toStrictEqual(expectedResponse);
  });

  test('returns an expected response when view has non-templated cards', () => {
    const view: DashboardView = {
      title: 'test',
      path: 'test',
      cards: [
        {
          type: 'test',
        },
      ],
    };
    const dbConfig: DashboardConfig = {
      views: [view],
    };
    const response = updateDashboardConfigTemplates(dbConfig);
    const expectedResponse: DashboardConfig = {
      views: [view],
    };
    expect(response).toStrictEqual(expectedResponse);
  });

  test('returns an expected response when view has templated cards', () => {
    const template: DashboardCard = {
      type: 'demo',
    };
    const view: DashboardView = {
      title: 'test',
      path: 'test',
      cards: [
        {
          type: 'test',
          template: 'template',
        },
      ],
    };
    const dbConfig: DashboardConfig = {
      views: [view],
    };
    const response = updateDashboardConfigTemplates(dbConfig, { template });
    const expectedResponse: DashboardConfig = {
      views: [{ ...view, cards: [{ ...template, template: 'template' }] }],
    };
    expect(response).toStrictEqual(expectedResponse);
  });

  test('returns an expected response when view has templated cards with data', () => {
    const template: DashboardCard = {
      type: 'demo',
      name: '$dynamic$',
    };
    const view: DashboardView = {
      title: 'test',
      path: 'test',
      cards: [
        {
          type: 'test',
          template: 'template',
          template_data: {
            dynamic: 'yes',
          },
        },
      ],
    };
    const dbConfig: DashboardConfig = {
      views: [view],
    };
    const response = updateDashboardConfigTemplates(dbConfig, { template });
    const expectedResponse: DashboardConfig = {
      views: [
        { ...view, cards: [{ ...template, template: 'template', name: 'yes', template_data: { dynamic: 'yes' } }] },
      ],
    };
    expect(response).toStrictEqual(expectedResponse);
  });
});

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
