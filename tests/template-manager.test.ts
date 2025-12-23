import { TemplateManager } from '../src/template-manager';
import { HomeAssistant } from 'custom-card-helpers';
import Api from '../src/api';

jest.mock('../src/api');

describe('TemplateManager', () => {
  let hass: HomeAssistant;

  beforeEach(() => {
    hass = {} as HomeAssistant;
  });

  it('should be defined', () => {
    const templateManager = new TemplateManager(hass);
    expect(templateManager).toBeDefined();
  });

  it('should discover templates and partials', async () => {
    const mockDashboards = [
      {
        id: '1',
        url_path: 'test-dashboard',
        mode: 'test',
        title: 'Test Dashboard',
        require_admin: false,
        show_in_sidebar: false,
      },
    ];
    const mockConfig = {
      views: [
        {
          cards: [
            { ll_key: 'test-template', type: 'test' },
            {
              type: 'custom:linked-lovelace-partials',
              partials: [{ key: 'test-partial', template: 'partial-template' }],
            },
          ],
        },
      ],
    };
    (Api as jest.Mock).mockImplementation(() => {
      return {
        getDashboards: () => Promise.resolve(mockDashboards),
        getDashboardConfig: () => Promise.resolve(mockConfig),
      };
    });

    const templateManager = new TemplateManager(hass);
    await templateManager.discoverTemplatesAndPartials();

    expect(templateManager['templates'].get('test-template')).toEqual({
      ll_key: 'test-template',
      type: 'test',
    });
    expect(templateManager['partials'].get('test-partial')).toBe('partial-template');
  });

  it('should render a template', async () => {
    const templateManager = new TemplateManager(hass);
    templateManager['templates'].set('test-template', {
      type: 'markdown',
      content: '<%= context.name %>',
    });
    const renderedCard = templateManager.renderTemplate('test-template', { name: 'test' });
    expect(renderedCard).toEqual({
      type: 'markdown',
      content: 'test',
    });
  });

  it('should process dashboards', async () => {
    const mockDashboards = [
      {
        id: '1',
        url_path: 'test-dashboard',
        mode: 'test',
        title: 'Test Dashboard',
        require_admin: false,
        show_in_sidebar: false,
      },
    ];
    const mockConfig = {
      views: [
        {
          cards: [
            {
              ll_template: 'test-template',
              ll_context: { name: 'test' },
            },
          ],
        },
      ],
    };
    (Api as jest.Mock).mockImplementation(() => {
      return {
        getDashboards: () => Promise.resolve(mockDashboards),
        getDashboardConfig: () => Promise.resolve(mockConfig),
      };
    });
    const templateManager = new TemplateManager(hass);
    templateManager.discoverTemplatesAndPartials = jest.fn();
    templateManager['templates'].set('test-template', {
      type: 'markdown',
      content: '<%= context.name %>',
    });
    const { originalConfigs, newConfigs } = await templateManager.processDashboards();
    expect(originalConfigs['test-dashboard']).toEqual(mockConfig);
    expect(newConfigs['test-dashboard'].views[0].cards[0]).toEqual({
      type: 'markdown',
      content: 'test',
    });
  });
});
