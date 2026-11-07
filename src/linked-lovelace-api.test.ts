import LinkedLovelaceApi from './linked-lovelace-api';
import { Debug } from './debug';

const makeApi = (response: unknown = null) => {
  const callWS = jest.fn().mockImplementation(async () => JSON.parse(JSON.stringify(response)));
  return { api: new LinkedLovelaceApi({ callWS } as any), callWS };
};

describe('[class] LinkedLovelaceApi', () => {
  beforeEach(() => {
    Debug.instance.debug = false;
    Debug.instance.dryRun = false;
  });

  afterEach(() => {
    Debug.instance.debug = false;
    Debug.instance.dryRun = false;
    jest.restoreAllMocks();
  });

  describe('getDashboards', () => {
    test('prepends an overview entry with an empty url path', async () => {
      const listed = { id: 'home', url_path: 'home', title: 'Home' };
      const { api, callWS } = makeApi([listed]);
      const dashboards = await api.getDashboards();
      expect(callWS).toHaveBeenCalledWith({ type: 'lovelace/dashboards/list' });
      expect(dashboards.map((d) => d.url_path)).toStrictEqual(['', 'home']);
      expect(dashboards[0].id).toBe('overview');
    });
  });

  describe('createDashboard', () => {
    test('creates a storage dashboard shown in the sidebar by default', async () => {
      const { api, callWS } = makeApi({ id: 'new' });
      await api.createDashboard('new', 'New');
      expect(callWS).toHaveBeenCalledWith({
        type: 'lovelace/dashboards/create',
        url_path: 'new',
        title: 'New',
        mode: 'storage',
        show_in_sidebar: true,
      });
    });

    test('can hide the dashboard from the sidebar', async () => {
      const { api, callWS } = makeApi({ id: 'new' });
      await api.createDashboard('new', 'New', false);
      expect(callWS.mock.calls[0][0].show_in_sidebar).toBe(false);
    });
  });

  describe('getDashboardConfig', () => {
    test('requests a dashboard by its url path', async () => {
      const { api, callWS } = makeApi({ views: [] });
      await api.getDashboardConfig('home');
      expect(callWS).toHaveBeenCalledWith({ type: 'lovelace/config', url_path: 'home' });
    });

    test('requests the overview dashboard with a null url path', async () => {
      const { api, callWS } = makeApi({ views: [] });
      await api.getDashboardConfig('');
      expect(callWS).toHaveBeenCalledWith({ type: 'lovelace/config', url_path: null });
    });

    test('does not add views to a strategy dashboard', async () => {
      const strategy = { strategy: { type: 'map' } };
      const { api } = makeApi(strategy);
      expect(await api.getDashboardConfig('map')).toStrictEqual(strategy);
    });
  });

  describe('setDashboardConfig', () => {
    test('saves the config', async () => {
      const { api, callWS } = makeApi();
      const config = { views: [] };
      await api.setDashboardConfig('home', config);
      expect(callWS).toHaveBeenCalledWith({ type: 'lovelace/config/save', url_path: 'home', config });
    });

    test('does not write in dry run mode', async () => {
      Debug.instance.dryRun = true;
      const { api, callWS } = makeApi();
      expect(await api.setDashboardConfig('home', { views: [] })).toBeNull();
      expect(callWS).not.toHaveBeenCalled();
    });
  });

  describe('toggleDashboardAsTemplate', () => {
    const savedConfig = (callWS: jest.Mock) =>
      callWS.mock.calls.find(([message]) => message.type === 'lovelace/config/save')?.[0].config;

    test('turns the flag on when it is unset', async () => {
      const { api, callWS } = makeApi({ views: [] });
      const config = await api.toggleDashboardAsTemplate('home');
      expect(config.template).toBe(true);
      expect(savedConfig(callWS).template).toBe(true);
    });

    test('removes the flag when toggling it off', async () => {
      const { api, callWS } = makeApi({ views: [], template: true });
      const config = await api.toggleDashboardAsTemplate('home');
      expect(config).not.toHaveProperty('template');
      expect(savedConfig(callWS)).not.toHaveProperty('template');
    });

    test('uses an explicit value over the current one', async () => {
      const { api } = makeApi({ views: [], template: true });
      expect(await api.toggleDashboardAsTemplate('home', true)).toHaveProperty('template', true);
      expect(await api.toggleDashboardAsTemplate('home', false)).not.toHaveProperty('template');
    });
  });

  describe('debug logging', () => {
    test('logs each call, and says when a write is skipped', async () => {
      const info = jest.spyOn(console, 'info').mockImplementation(() => undefined);
      Debug.instance.debug = true;
      const { api } = makeApi([]);
      await api.getDashboards();
      await api.createDashboard('new', 'New');
      await api.getDashboardConfig('home');
      await api.setDashboardConfig('home', {});
      Debug.instance.dryRun = true;
      await api.setDashboardConfig('home', {});
      const messages = info.mock.calls.map(([message]) => message);
      expect(messages).toHaveLength(5);
      expect(messages[3]).toContain('Setting Lovelace');
      expect(messages[3]).not.toContain('Not Actually');
      expect(messages[4]).toContain('Not Actually');
    });
  });
});
