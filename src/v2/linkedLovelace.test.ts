import LinkedLovelaceController from './linkedLovelace';
import { GlobalLinkedLovelace } from '../instance';
import { KEY_CHIP_CARD_TYPE } from '../helpers/keyChip';
import { DashboardConfig } from '../types';

const mockDashboardConfig = (config: DashboardConfig) => {
  // The instance getter returns the stubbed self without needing a real hass connection
  (GlobalLinkedLovelace as any).self = {
    api: {
      getDashboardConfig: jest.fn().mockImplementation(async () => JSON.parse(JSON.stringify(config))),
    },
  };
};

describe('[class] LinkedLovelaceController', () => {
  test('sets up as expected', () => {
    const controller = new LinkedLovelaceController();
    expect(controller).toBeDefined();
  });

  test('gets something with something when given an ID', () => {
    const controller = new LinkedLovelaceController();
    controller.registerTemplates({'test': {
      type: 'test'
    }})
    expect(Object.keys(controller.templateController.templates)).toHaveLength(1)
  });
});

describe('[class] LinkedLovelaceController key chips', () => {
  const definition = { type: 'markdown', content: 'hi', ll_key: 'room' };
  const instance = { type: 'markdown', content: 'hi', ll_template: 'room' };
  const plain = { type: 'markdown', content: 'plain' };
  const baseConfig: DashboardConfig = {
    views: [{ title: 'Test', cards: [definition, instance, plain] }],
  };

  const makeController = (showKeyChips: boolean) => {
    const controller = new LinkedLovelaceController();
    controller.showKeyChips = showKeyChips;
    controller.registerTemplates({ room: { ...definition } });
    return controller;
  };

  test('wraps only definition cards when enabled', async () => {
    mockDashboardConfig(baseConfig);
    const controller = makeController(true);
    const config = await controller.getUpdatedDashboardConfig(null);
    const cards = config.views![0].cards!;
    expect(cards[0]).toStrictEqual({
      type: KEY_CHIP_CARD_TYPE,
      ll_key: 'room',
      card: { type: 'markdown', content: 'hi' },
    });
    expect(cards[1].type).toBe('markdown');
    expect(cards[2]).toStrictEqual(plain);
  });

  test('is idempotent across repeated syncs when enabled', async () => {
    mockDashboardConfig(baseConfig);
    const controller = makeController(true);
    const first = await controller.getUpdatedDashboardConfig(null);
    mockDashboardConfig(first);
    const second = await controller.getUpdatedDashboardConfig(null);
    expect(second).toStrictEqual(first);
  });

  test('unwraps previously wrapped definitions when disabled', async () => {
    mockDashboardConfig(baseConfig);
    const enabled = makeController(true);
    const wrappedConfig = await enabled.getUpdatedDashboardConfig(null);
    mockDashboardConfig(wrappedConfig);
    const disabled = makeController(false);
    const config = await disabled.getUpdatedDashboardConfig(null);
    expect(config.views![0].cards![0]).toStrictEqual(definition);
  });

  test('renders instances from a wrapped definition identically to an unwrapped one', async () => {
    mockDashboardConfig(baseConfig);
    const unwrappedRun = makeController(false);
    const expected = await unwrappedRun.getUpdatedDashboardConfig(null);

    const wrappedDefinitionConfig: DashboardConfig = {
      views: [{
        title: 'Test',
        cards: [
          { type: KEY_CHIP_CARD_TYPE, ll_key: 'room', card: { type: 'markdown', content: 'hi' } },
          instance,
          plain,
        ],
      }],
    };
    mockDashboardConfig(wrappedDefinitionConfig);
    const controller = makeController(false);
    const config = await controller.getUpdatedDashboardConfig(null);
    expect(config.views![0].cards![1]).toStrictEqual(expected.views![0].cards![1]);
  });
});
