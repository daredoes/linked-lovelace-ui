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

  test('a lower ll_priority replaces an existing template with the same key', async () => {
    mockApi([dashboard], {
      test: {
        views: [
          { title: 'A', cards: [{ type: 'markdown', content: 'high', ll_key: 'dupe', ll_priority: 5 }] },
          { title: 'B', cards: [{ type: 'markdown', content: 'low', ll_key: 'dupe', ll_priority: 1 }] },
        ],
      },
    });
    const controller = new HassController();
    await controller.refresh();
    expect(controller.linkedLovelaceController.templateController.templates['dupe'].content).toBe('low');
  });

  test('keeps the first template when a duplicate has a higher ll_priority', async () => {
    mockApi([dashboard], {
      test: {
        views: [
          { title: 'A', cards: [{ type: 'markdown', content: 'low', ll_key: 'dupe', ll_priority: 1 }] },
          { title: 'B', cards: [{ type: 'markdown', content: 'high', ll_key: 'dupe', ll_priority: 5 }] },
        ],
      },
    });
    const controller = new HassController();
    await controller.refresh();
    expect(controller.linkedLovelaceController.templateController.templates['dupe'].content).toBe('low');
  });

  test('one unreadable dashboard does not block the others', async () => {
    mockApi([{ ...dashboard, url_path: 'broken' }, dashboard], {
      test: { views: [{ title: 'V', cards: [{ type: 'markdown', content: 'hi', ll_key: 'survivor' }] }] },
    });
    const api = GlobalLinkedLovelace.instance.api as any;
    const read = api.getDashboardConfig.getMockImplementation();
    api.getDashboardConfig.mockImplementation(async (urlPath: string) => {
      if (urlPath === 'broken') throw new Error('no access');
      return read(urlPath);
    });
    const controller = new HassController();
    await controller.refresh();
    expect(controller.logs.some((l) => l.startsWith('[ERROR]') && l.includes('broken'))).toBe(true);
    expect(Object.keys(controller.linkedLovelaceController.templateController.templates)).toStrictEqual(['survivor']);
  });

  test('skips a strategy dashboard during discovery', async () => {
    mockApi([dashboard], { test: { strategy: { type: 'map' } } });
    const controller = new HassController();
    await controller.refresh();
    expect(controller.dashboardsToViews).toStrictEqual({});
  });

  test('files the overview dashboard and pathless views under an empty key', async () => {
    mockApi([{ ...dashboard, url_path: '' }], {
      '': { views: [{ title: 'V', cards: [{ type: 'markdown', content: 'hi', ll_key: 'home' }] }] },
    });
    const controller = new HassController();
    await controller.refresh();
    expect(Object.keys(controller.dashboardsToViews[''][''].templates)).toStrictEqual(['home']);
  });

  test('reports cards that use a missing template, per dashboard', async () => {
    mockApi([dashboard, { ...dashboard, url_path: '' }], {
      test: {
        views: [
          {
            title: 'V',
            cards: [
              { type: 'markdown', content: 'hi', ll_key: 'room' },
              { type: 'markdown', content: 'ok', ll_template: 'room' },
              { type: 'markdown', content: 'typo', ll_template: 'rom' },
            ],
          },
        ],
      },
      '': { views: [{ title: 'H', cards: [{ type: 'markdown', content: 'typo', ll_template: 'gone' }] }] },
    });
    const controller = new HassController();
    await controller.refresh();
    expect(controller.missingTemplates).toStrictEqual({ test: ['rom'], '': ['gone'] });
    expect(controller.logs.some((l) => l.startsWith('[WARN]') && l.includes('rom'))).toBe(true);
  });

  test('never writes during discovery', async () => {
    mockApi([dashboard], {
      test: { views: [{ title: 'V', cards: [{ type: 'markdown', content: 'hi', ll_key: 'k' }] }] },
    });
    await new HassController().refresh();
    expect(GlobalLinkedLovelace.instance.api.setDashboardConfig).not.toHaveBeenCalled();
  });
});

describe('[class] HassController update', () => {
  const definition = { type: 'markdown', content: 'Hi <%= context.name %>', ll_key: 'room' };
  const instance = { type: 'markdown', ll_template: 'room', ll_context: { name: 'Kitchen' } };
  const configs = { test: { views: [{ title: 'V', cards: [definition, instance] }] } };

  const loadedController = async () => {
    const controller = new HassController();
    await controller.refresh();
    return controller;
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('writes the rendered config', async () => {
    mockApi([dashboard], configs);
    const controller = await loadedController();
    const config = await controller.update('test');
    expect(config!.views![0].cards![1].content).toBe('Hi Kitchen');
    expect(GlobalLinkedLovelace.instance.api.setDashboardConfig).toHaveBeenCalledWith('test', config);
  });

  test('renders without writing on a dry run', async () => {
    mockApi([dashboard], configs);
    const controller = await loadedController();
    const config = await controller.update('test', true);
    expect(config!.views![0].cards![1].content).toBe('Hi Kitchen');
    expect(GlobalLinkedLovelace.instance.api.setDashboardConfig).not.toHaveBeenCalled();
  });

  test('addresses the overview dashboard with a null url path', async () => {
    mockApi([{ ...dashboard, url_path: '' }], { '': { views: [] } });
    const controller = await loadedController();
    await controller.update('');
    expect(GlobalLinkedLovelace.instance.api.getDashboardConfig).toHaveBeenLastCalledWith(null);
    expect(GlobalLinkedLovelace.instance.api.setDashboardConfig).toHaveBeenCalledWith(null, { views: [] });
  });

  test('returns null and logs an error when the save fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockApi([dashboard], configs);
    const controller = await loadedController();
    (GlobalLinkedLovelace.instance.api.setDashboardConfig as jest.Mock).mockRejectedValue(new Error('read only'));
    expect(await controller.update('test')).toBeNull();
    expect(controller.logs.some((l) => l.startsWith('[ERROR]') && l.includes('read only'))).toBe(true);
  });

  test('returns null without writing and logs an error when the dashboard cannot be read', async () => {
    mockApi([dashboard], configs);
    const controller = await loadedController();
    (GlobalLinkedLovelace.instance.api.getDashboardConfig as jest.Mock).mockRejectedValue(new Error('no access'));
    expect(await controller.update('test')).toBeNull();
    expect(GlobalLinkedLovelace.instance.api.setDashboardConfig).not.toHaveBeenCalled();
    expect(controller.logs.some((l) => l.startsWith('[ERROR]') && l.includes('Failed to render'))).toBe(true);
  });

  test('updateAll reports only the dashboard whose save failed', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockApi([{ ...dashboard, url_path: 'other' }, dashboard], { other: { views: [] }, ...configs });
    const controller = await loadedController();
    (GlobalLinkedLovelace.instance.api.setDashboardConfig as jest.Mock).mockImplementation(async (urlPath: string) => {
      if (urlPath === 'other') throw new Error('read only');
      return null;
    });
    const results = await controller.updateAll();
    expect(results['other']).toBeNull();
    expect(results['test']).not.toBeNull();
  });

  test('updateAll renders every dashboard, keying the overview as an empty string', async () => {
    mockApi([{ ...dashboard, url_path: '' }, dashboard], { '': { views: [] }, ...configs });
    const controller = await loadedController();
    const results = await controller.updateAll(true);
    expect(Object.keys(results).sort()).toStrictEqual(['', 'test']);
    expect(GlobalLinkedLovelace.instance.api.setDashboardConfig).not.toHaveBeenCalled();
  });

  test('updateAll writes every dashboard when it is not a dry run', async () => {
    mockApi([{ ...dashboard, url_path: '' }, dashboard], { '': { views: [] }, ...configs });
    const controller = await loadedController();
    await controller.updateAll();
    expect(GlobalLinkedLovelace.instance.api.setDashboardConfig).toHaveBeenCalledTimes(2);
  });
});

describe('[class] HassController logging', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete (globalThis as any).window;
  });

  test('forwards logs to the console at their level when enabled', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const controller = new HassController();
    controller.forwardLogs = true;
    controller.addToLogs({ msg: 'careful', level: 'WARN' });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('careful');
  });

  test('stays quiet when forwarding is off', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    new HassController().addToLogs({ msg: 'careful', level: 'WARN' });
    expect(warn).not.toHaveBeenCalled();
  });

  test('includes the browser origin in dashboard logs', async () => {
    (globalThis as any).window = { location: { origin: 'http://ha.local' } };
    mockApi([dashboard], { test: { views: [] } });
    const controller = new HassController();
    await controller.refresh();
    expect(controller.logs.some((l) => l.includes('http://ha.local/test'))).toBe(true);
  });
});
