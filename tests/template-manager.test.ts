import { TemplateManager } from '../src/template-manager';
import { HomeAssistant } from 'custom-card-helpers';
import Api from '../src/api';

jest.mock('../src/api');

describe('TemplateManager', () => {
  let hass: HomeAssistant;
  let templateManager: TemplateManager;
  let mockApi: Api;

  beforeEach(() => {
    hass = {} as HomeAssistant;
    // Reset the singleton instance before each test
    (TemplateManager as any).instance = undefined;
    templateManager = TemplateManager.getInstance(hass);
    mockApi = (templateManager as any).api;
  });

  it('should be defined', () => {
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
    jest.spyOn(mockApi, 'getDashboards').mockResolvedValue(mockDashboards);
    jest.spyOn(mockApi, 'getDashboardConfig').mockResolvedValue(mockConfig);

    await templateManager.discoverTemplatesAndPartials();

    expect(templateManager['templates'].get('test-template')).toEqual({
      ll_key: 'test-template',
      type: 'test',
    });
    expect(templateManager['partials'].get('test-partial')).toBe('partial-template');
  });

  it('should render a template', async () => {
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
              type: 'custom:linked-lovelace-template',
              ll_template: 'test-template',
              ll_context: { name: 'test' },
            },
          ],
        },
      ],
    };
    jest.spyOn(mockApi, 'getDashboards').mockResolvedValue(mockDashboards);
    jest.spyOn(mockApi, 'getDashboardConfig').mockResolvedValue(mockConfig);
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

  it('should populate examples', async () => {
    const mockConfig = {
      views: [],
    };
    const setDashboardConfig = jest.spyOn(mockApi, 'setDashboardConfig').mockResolvedValue();
    jest.spyOn(mockApi, 'getDashboardConfig').mockResolvedValue(mockConfig);
    await templateManager.populateExamples('test-dashboard');
    expect(setDashboardConfig).toHaveBeenCalledWith('test-dashboard', {
      views: expect.any(Array),
    });
  });

  it('should render a nested template', () => {
    templateManager['templates'].set('template-a', {
      type: 'custom:linked-lovelace-template',
      ll_template: 'template-b',
      ll_context: { name: 'Nested' },
    });
    templateManager['templates'].set('template-b', {
      type: 'markdown',
      content: 'Hello, <%= context.name %>!',
    });
    const renderedCard = templateManager.renderTemplate('template-a', {});
    expect(renderedCard).toEqual({
      type: 'markdown',
      content: 'Hello, Nested!',
    });
  });

  it('should render a deeply nested template', () => {
    templateManager['templates'].set('template-a', {
      type: 'custom:linked-lovelace-template',
      ll_template: 'template-b',
    });
    templateManager['templates'].set('template-b', {
      type: 'custom:linked-lovelace-template',
      ll_template: 'template-c',
    });
    templateManager['templates'].set('template-c', {
      type: 'markdown',
      content: 'Deeply nested',
    });
    const renderedCard = templateManager.renderTemplate('template-a', {});
    expect(renderedCard).toEqual({
      type: 'markdown',
      content: 'Deeply nested',
    });
  });

  it('should detect an infinite loop', () => {
    templateManager['templates'].set('template-a', {
      type: 'custom:linked-lovelace-template',
      ll_template: 'template-b',
    });
    templateManager['templates'].set('template-b', {
      type: 'custom:linked-lovelace-template',
      ll_template: 'template-a',
    });
    const renderedCard = templateManager.renderTemplate('template-a', {});
    expect(renderedCard.type).toBe('error');
    expect(renderedCard.error).toContain('Circular reference detected');
  });
});
