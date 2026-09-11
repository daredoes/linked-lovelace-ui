import HassController from './hass';
import { GlobalLinkedLovelace } from '../instance';
import { Dashboard, DashboardConfig, LINKED_LOVELACE_PARTIALS } from '../types';

const mockApi = (dashboards: Dashboard[], configs: Record<string, DashboardConfig>) => {
  const key = (urlPath: string | null) => (urlPath ? urlPath : '');
  // The instance getter returns the stubbed self without needing a real hass connection
  (GlobalLinkedLovelace as any).self = {
    api: {
      getDashboards: jest.fn().mockImplementation(async () => dashboards),
      getDashboardConfig: jest
        .fn()
        .mockImplementation(async (urlPath: string | null) => JSON.parse(JSON.stringify(configs[key(urlPath)] || {}))),
      setDashboardConfig: jest.fn(),
    },
  };
};

const dashboard: Dashboard = {
  id: 'test',
  mode: 'storage',
  require_admin: false,
  show_in_sidebar: true,
  title: 'Test',
  url_path: 'test',
};

describe('[class] HassController discovery', () => {
  test('discovers templates defined in a view', async () => {
    mockApi([dashboard], {
      test: { views: [{ title: 'V', cards: [{ type: 'markdown', content: 'hi', ll_key: 'in_view' }] }] },
    });
    const controller = new HassController();
    await controller.refresh();
    expect(Object.keys(controller.linkedLovelaceController.templateController.templates)).toContain('in_view');
  });

  test('discovers templates defined inside a sections view', async () => {
    mockApi([dashboard], {
      test: {
        views: [
          {
            title: 'V',
            type: 'sections',
            sections: [{ type: 'grid', cards: [{ type: 'markdown', content: 'hi', ll_key: 'in_section' }] }],
          },
        ],
      },
    });
    const controller = new HassController();
    await controller.refresh();
    expect(Object.keys(controller.linkedLovelaceController.templateController.templates)).toContain('in_section');
  });

  test('keeps partials from every card in a view', async () => {
    mockApi([dashboard], {
      test: {
        views: [
          {
            title: 'V',
            path: 'v',
            cards: [
              { type: `custom:${LINKED_LOVELACE_PARTIALS}`, partials: [{ key: 'first', template: 'A' }] },
              { type: `custom:${LINKED_LOVELACE_PARTIALS}`, partials: [{ key: 'second', template: 'B' }] },
              { type: 'markdown', content: 'no partials here' },
            ],
          },
        ],
      },
    });
    const controller = new HassController();
    await controller.refresh();
    expect(Object.keys(controller.linkedLovelaceController.etaController.partials).sort()).toStrictEqual([
      'first',
      'second',
    ]);
    expect(Object.keys(controller.dashboardsToViews['test']['v'].partials).sort()).toStrictEqual(['first', 'second']);
  });

  test('warns and keeps the lowest priority when two views declare the same ll_key', async () => {
    mockApi([dashboard], {
      test: {
        views: [
          { title: 'A', cards: [{ type: 'markdown', content: 'first', ll_key: 'dupe' }] },
          { title: 'B', cards: [{ type: 'markdown', content: 'second', ll_key: 'dupe' }] },
        ],
      },
    });
    const controller = new HassController();
    await controller.refresh();
    expect(controller.logs.filter((l) => l.includes('Template already exists with tag dupe'))).toHaveLength(1);
  });
});
