import LinkedLovelaceController from './linkedLovelace';
import { GlobalLinkedLovelace } from '../instance';
import { KEY_CHIP_CARD_TYPE } from '../helpers/keyChip';
import { DashboardCard, DashboardConfig } from '../types';

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
  const plainDefinition = { type: 'markdown', content: 'hi', ll_key: 'room' };
  const chippedDefinition = { ...plainDefinition, show_key_chips: true };
  const instance = { type: 'markdown', content: 'hi', ll_template: 'room' };
  const plain = { type: 'markdown', content: 'plain' };

  const configWith = (definition: DashboardCard): DashboardConfig => ({
    views: [{ title: 'Test', cards: [definition, instance, plain] }],
  });

  const makeController = () => {
    const controller = new LinkedLovelaceController();
    controller.registerTemplates({ room: { ...plainDefinition } });
    return controller;
  };

  test('wraps only the definition that asked for a chip', async () => {
    mockDashboardConfig(configWith(chippedDefinition));
    const config = await makeController().getUpdatedDashboardConfig(null);
    const cards = config.views![0].cards!;
    expect(cards[0]).toStrictEqual({
      type: KEY_CHIP_CARD_TYPE,
      ll_key: 'room',
      show_key_chips: true,
      card: { type: 'markdown', content: 'hi' },
    });
    expect(cards[1].type).toBe('markdown');
    expect(cards[2]).toStrictEqual(plain);
  });

  test('leaves a definition alone when it does not ask for a chip', async () => {
    mockDashboardConfig(configWith(plainDefinition));
    const config = await makeController().getUpdatedDashboardConfig(null);
    expect(config.views![0].cards![0]).toStrictEqual(plainDefinition);
  });

  test('does not leak the flag into cards rendered from the definition', async () => {
    mockDashboardConfig(configWith(chippedDefinition));
    const controller = new LinkedLovelaceController();
    controller.registerTemplates({ room: { ...chippedDefinition } });
    const config = await controller.getUpdatedDashboardConfig(null);
    expect(config.views![0].cards![1].show_key_chips).toBeUndefined();
  });

  test('chips a definition living inside a section', async () => {
    mockDashboardConfig({
      views: [{ title: 'Test', sections: [{ type: 'grid', cards: [chippedDefinition] }] }],
    });
    const config = await makeController().getUpdatedDashboardConfig(null);
    expect(config.views![0].sections![0].cards![0].type).toBe(KEY_CHIP_CARD_TYPE);
  });

  test('is idempotent across repeated syncs', async () => {
    mockDashboardConfig(configWith(chippedDefinition));
    const controller = makeController();
    const first = await controller.getUpdatedDashboardConfig(null);
    mockDashboardConfig(first);
    const second = await controller.getUpdatedDashboardConfig(null);
    expect(second).toStrictEqual(first);
  });

  test('unwraps a wrapped definition once the flag is turned off', async () => {
    mockDashboardConfig(configWith(chippedDefinition));
    const wrappedConfig = await makeController().getUpdatedDashboardConfig(null);
    const wrapped = wrappedConfig.views![0].cards![0];
    wrapped.show_key_chips = false;
    mockDashboardConfig(wrappedConfig);
    const config = await makeController().getUpdatedDashboardConfig(null);
    expect(config.views![0].cards![0]).toStrictEqual({ ...plainDefinition, show_key_chips: false });
  });

  test('renders instances from a wrapped definition identically to an unwrapped one', async () => {
    mockDashboardConfig(configWith(plainDefinition));
    const expected = await makeController().getUpdatedDashboardConfig(null);

    mockDashboardConfig({
      views: [{
        title: 'Test',
        cards: [
          { type: KEY_CHIP_CARD_TYPE, ll_key: 'room', card: { type: 'markdown', content: 'hi' } },
          instance,
          plain,
        ],
      }],
    });
    const config = await makeController().getUpdatedDashboardConfig(null);
    expect(config.views![0].cards![1]).toStrictEqual(expected.views![0].cards![1]);
  });
});
