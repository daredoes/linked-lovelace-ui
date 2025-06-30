import { DashboardCard, DashboardView } from '../types';
import { getTemplatesUsedInCard, getTemplatesUsedInView, updateCardTemplate } from './templates';

describe('[function] getTemplatesUsedInCard', () => {
  test('returns empty array when given an empty card', () => {
    expect(
      getTemplatesUsedInCard({
        type: 'fake',
      }),
    ).toStrictEqual([]);
  });

  test('returns an array with one item when given one card with no cards', () => {
    const card: DashboardCard = {
      type: 'fake',
      ll_template: 'true',
    };
    expect(getTemplatesUsedInCard(card)).toStrictEqual(['true']);
  });

  test('ignores child cards if card is a template', () => {
    const card: DashboardCard = {
      type: 'fake',
      ll_template: 'true',
      cards: [
        {
          type: 'fake',
          ll_template: 'true',
        },
      ],
    };
    expect(getTemplatesUsedInCard(card)).toStrictEqual(['true']);
  });

  test('includes child cards if card is not a template', () => {
    const card: DashboardCard = {
      type: 'fake',
      cards: [
        {
          type: 'fake',
          ll_template: 'true',
        },
        {
          type: 'fake',
          ll_template: 'true',
        },
      ],
    };
    expect(getTemplatesUsedInCard(card)).toStrictEqual(['true', 'true']);
  });

  test('works on single child card if card is not a template', () => {
    const card: DashboardCard = {
      type: 'fake',
      card:
      {
        type: 'fake',
        ll_template: 'true',
      },
    };
    expect(getTemplatesUsedInCard(card)).toStrictEqual(['true']);
  });
});

describe('[function] getTemplatesUsedInView', () => {
  test('returns an empty array for an empty view', () => {
    const view: DashboardView = {
      title: 'test',
    };
    expect(getTemplatesUsedInView(view)).toStrictEqual([]);
  });

  test('returns an empty array for a view with no template cards', () => {
    const view: DashboardView = {
      title: 'test',
      cards: [
        {
          type: 'test',
        },
      ],
    };
    expect(getTemplatesUsedInView(view)).toStrictEqual([]);
  });
  test('returns an array for a view with some template cards', () => {
    const view: DashboardView = {
      title: 'test',
      cards: [
        {
          type: 'test',
          ll_template: 'true',
        },
      ],
    };
    expect(getTemplatesUsedInView(view)).toStrictEqual(['true']);
  });
  test('returns a flat array for a view with nested template cards', () => {
    const view: DashboardView = {
      title: 'test',
      cards: [
        {
          type: 'test',
          ll_template: 'true',
          cards: [
            {
              type: 'test',
              ll_template: 'true',
            },
          ],
        },
        {
          type: 'test',
          ll_template: 'true',
        },
      ],
    };
    expect(getTemplatesUsedInView(view)).toStrictEqual(['true', 'true']);
  });
});

describe('[function] updateCardTemplate', () => {
  test('does nothing when given no template data and an empty card', async () => {
    const card: DashboardCard = {
      type: 'test',
    };
    expect(await updateCardTemplate(card)).toStrictEqual(card);
  });

  test('does nothing when given no template data with a template type', async () => {
    const card: DashboardCard = {
      type: 'test',
      ll_template: 'true',
    };
    expect(await updateCardTemplate(card)).toStrictEqual(card);
  });

  test('does nothing when given no template data with child cards', async () => {
    const card: DashboardCard = {
      type: 'test',
      cards: [
        {
          type: 'test',
        },
      ],
    };
    expect(await updateCardTemplate(card)).toStrictEqual(card);
  });

  test('replaces card with template', async () => {
    const template: DashboardCard = {
      type: 'template',
    };
    const card: DashboardCard = {
      type: 'test',
      ll_template: 'template',
    };
    expect(await updateCardTemplate(card, { template })).toStrictEqual({ type: 'template', ll_template: 'template' });
  });

  test('replaces child cards with template', async () => {
    const template: DashboardCard = {
      type: 'template',
    };
    const card: DashboardCard = {
      type: 'test',
      cards: [
        {
          type: 'test',
          ll_template: 'template',
        },
      ],
    };
    expect(await updateCardTemplate(card, { template })).toStrictEqual({
      type: 'test',
      cards: [
        {
          type: 'template',
          ll_template: 'template',
        },
      ],
    });
  });

  test('replaces child chips with template', async () => {
    const template: DashboardCard = {
      type: "light",
      ll_key: "my-room-chip-light",
      entity: "<%= context.entity %>",
      content_info: null,
      use_light_color: true,
      tap_action: {
        action: "toggle"
      },
      double_tap_action:
        { action: "none" },
      hold_action:
        { action: "none" }
    };
    const card: DashboardCard = {
      type: 'test',
      chips: [
        {
          type: 'test',
          ll_template: 'my-room-chip-light',
          ll_context: {
            entity: "test"
          }
        },
      ],
    };
    expect(await updateCardTemplate(card, { [template.ll_key!]: template })).toStrictEqual({
      type: 'test',
      chips: [
        {
          type: "light",
          ll_template: 'my-room-chip-light',
          ll_context: {
            entity: "test"
          },
          entity: "test",
          content_info: null,
          use_light_color: true,
          tap_action: {
            action: "toggle"
          },
          double_tap_action:
            { action: "none" },
          hold_action:
            { action: "none" }
        },
      ],
    });
  });

  test('replaces child card with template', async () => {
    const template: DashboardCard = {
      type: 'template',
    };
    const card: DashboardCard = {
      type: 'test',
      card:
      {
        type: 'test',
        ll_template: 'template',
      }
    };
    expect(await updateCardTemplate(card, { template })).toStrictEqual({
      type: 'test',
      card: {
        type: 'template',
        ll_template: 'template',
      },
    });
  });

  test('replaces card with template and updates data', async () => {
    const template: DashboardCard = {
      type: 'template',
      name: '<%= context.cool %> man',
    };
    const card: DashboardCard = {
      type: 'test',
      ll_template: 'template',
      ll_context: {
        cool: 'yes',
      },
    };
    expect(await updateCardTemplate(card, { template })).toStrictEqual({
      type: 'template',
      ll_template: 'template',
      name: 'yes man',
      ll_context: {
        cool: 'yes',
      },
    });
  });

  test('does not replace child card with template if card is template', async () => {
    const template: DashboardCard = {
      type: 'template',
      card: {
        type: 'swapped',
        ll_template: 'template'
      }
    };
    const card: DashboardCard = {
      type: 'test',
      ll_template: 'template',
      card:
      {
        type: 'test',
        ll_template: 'template',
      }
    };
    expect(await updateCardTemplate(card, { template })).toStrictEqual({
      type: 'template',
      ll_template: 'template',
      card: {
        type: 'swapped',
        ll_template: 'template',
      },
    });
  });

  test('does not replace child card with template if card is template', async () => {
    const template: DashboardCard = {
      type: 'new',
      card: {
        type: 'swapped',
        ll_template: 'template'
      }
    };
    const card: DashboardCard = {
      type: 'test',
      tap_action: {
        action: 'fire-dom-event',
        browser_mod: {
          service: 'browser_mod.popup',
          data: {
            title: '',
            content: {
              type: 'old',
              ll_template: 'template'
            }
          }
        }
      }
    };
    expect(await updateCardTemplate(card, { template })).toStrictEqual({
      type: 'test',
      tap_action: {
        action: 'fire-dom-event',
        browser_mod: {
          service: 'browser_mod.popup',
          data: {
            title: '',
            content: {
              type: 'new',
              ll_template: 'template',
              card: {
                type: 'swapped',
                ll_template: 'template'
              }
            }
          }
        }
      }
    });
  });

  test('leaves numbers as numbers', async () => {
    const template: DashboardCard = {
      type: 'template',
    };
    const card: DashboardCard = {
      type: 'test',
      ll_template: 'template',
      ll_context: {
        number: 6
      },
      ll_keys: {
        'number': 'number'
      }
    };
    expect(await updateCardTemplate(card, { template })).toStrictEqual({
      type: 'template',
      ll_template: 'template',
      number: 6,
      ll_keys: {
        'number': 'number'
      },
      ll_context: {
        number: 6
      },
    });
  });

  test('ll_keys changes row values', async () => {
    const template: DashboardCard = {
      type: 'template',
      number: 3
    };
    const card: DashboardCard = {
      type: 'test',
      ll_template: 'template',
      ll_context: {
        number: 6
      },
      ll_keys: {
        'number': 'number'
      }
    };
    expect(await updateCardTemplate(card, { template })).toStrictEqual({
      type: 'template',
      ll_template: 'template',
      number: 6,
      ll_keys: {
        'number': 'number'
      },
      ll_context: {
        number: 6
      },
    });
  });

  test('ll_keys supports values to be templatized', async () => {
    const template: DashboardCard = {
      type: 'template',
      cards: []
    };
    const nested: DashboardCard = {
      type: 'nested',
      cards: []
    };
    const card: DashboardCard = {
      type: 'test',
      ll_template: 'template',
      ll_context: {
        cards: [
          { ll_template: 'nested' }
        ]
      },
      ll_keys: {
        'cards': 'cards'
      }
    };
    expect(await updateCardTemplate(card, { template, nested })).toStrictEqual({
      type: 'template',
      ll_template: 'template',
      cards: [
        {
          type: 'nested',
          ll_template: 'nested',
          cards: []
        }
      ],
      ll_keys: {
        'cards': 'cards'
      },
      ll_context: {
        cards: [
          { ll_template: 'nested' }
        ]
      },
    });
  });

  test('ll_keys supports values to be templatized including arrays', async () => {
    const template: DashboardCard = {
      type: 'template',
      cards: []
    };
    const nested: DashboardCard = {
      type: 'nested',
      cards: []
    };
    const card: DashboardCard = {
      type: 'test',
      ll_template: 'template',
      ll_context: {
        cards: [
          { ll_template: 'nested' },
          { ll_template: 'template' },
        ]
      },
      ll_keys: {
        'cards': 'cards'
      }
    };
    expect(await updateCardTemplate(card, { template, nested })).toStrictEqual({
      type: 'template',
      ll_template: 'template',
      cards: [
        {
          type: 'nested',
          ll_template: 'nested',
          cards: []
        },
        {
          type: 'template',
          ll_template: 'template',
          cards: []
        }
      ],
      ll_keys: {
        'cards': 'cards'
      },
      ll_context: {
        cards: [
          { ll_template: 'nested' },
          { ll_template: 'template' }
        ]
      },
    });
  });

  test('ll_keys supports passing ll_context', async () => {
    const template: DashboardCard = {
      type: 'template',
      cards: []
    };
    const nested: DashboardCard = {
      type: 'nested',
      name: '<%= context.name %>',
      cards: []
    };
    const card: DashboardCard = {
      type: 'test',
      ll_template: 'template',
      ll_context: {
        cards: [
          { ll_template: 'nested', ll_context: { name: 'Cool' } },
          { ll_template: 'template' },
        ]
      },
      ll_keys: {
        'cards': 'cards'
      }
    };
    expect(await updateCardTemplate(card, { template, nested })).toStrictEqual({
      type: 'template',
      ll_template: 'template',
      cards: [
        {
          type: 'nested',
          ll_template: 'nested',
          ll_context: { name: 'Cool' },
          name: 'Cool',
          cards: []
        },
        {
          type: 'template',
          ll_template: 'template',
          cards: []
        }
      ],
      ll_keys: {
        'cards': 'cards'
      },
      ll_context: {
        cards: [
          { ll_template: 'nested', ll_context: { name: 'Cool' } },
          { ll_template: 'template' }
        ]
      },
    });
  });

  test('ll_keys supports passing ll_context and ll_keys', async () => {
    const template: DashboardCard = {
      type: 'template',
      cards: []
    };
    const nested: DashboardCard = {
      type: 'nested',
      name: 'originalName',
      cards: []
    };
    const card: DashboardCard = {
      type: 'test',
      ll_template: 'template',
      ll_context: {
        cards: [
          { ll_template: 'nested', ll_context: { name: 'Cool' }, ll_keys: { 'name': 'name' }, },
          { ll_template: 'template' },
        ]
      },
      ll_keys: {
        'cards': 'cards'
      }
    };
    expect(await updateCardTemplate(card, { template, nested })).toStrictEqual({
      type: 'template',
      ll_template: 'template',
      cards: [
        {
          type: 'nested',
          ll_template: 'nested',
          ll_context: { name: 'Cool' },
          ll_keys: { 'name': 'name' },
          name: 'Cool',
          cards: []
        },
        {
          type: 'template',
          ll_template: 'template',
          cards: []
        }
      ],
      ll_keys: {
        'cards': 'cards'
      },
      ll_context: {
        cards: [
          { ll_template: 'nested', ll_context: { name: 'Cool' }, ll_keys: { 'name': 'name' }, },
          { ll_template: 'template' }
        ]
      },
    });
  });

  // test('ll_keys supports overriding ll_context from parent', () => {
  //   const template: DashboardCard = {
  //     type: 'template',
  //     cards: []
  //   };
  //   const nested: DashboardCard = {
  //     type: 'nested',
  //     name: '<%= context.name %>',
  //     cards: []
  //   };
  //   const card: DashboardCard = {
  //     type: 'test',
  //     ll_template: 'template',
  //     ll_context: {
  //       name: 'Uncool',
  //       cards: [
  //         { ll_template: 'nested', ll_context: { name: 'Cool' } },
  //         { ll_template: 'template' },
  //       ]
  //     },
  //     ll_keys: {
  //       'cards': 'cards'
  //     }
  //   };
  //   expect(updateCardTemplate(card, { template, nested })).toStrictEqual({
  //     type: 'template',
  //     ll_template: 'template',
  //     cards: [
  //       {
  //         type: 'nested',
  //         ll_template: 'nested',
  //         ll_context: { name: 'Uncool' },
  //         name: 'Uncool',
  //         cards: []
  //       },
  //       {
  //         type: 'template',
  //         ll_context: { name: 'Uncool' },
  //         ll_template: 'template',
  //         cards: []
  //       }
  //     ],
  //     ll_keys: {
  //       'cards': 'cards'
  //     },
  //     ll_context: {
  //       name: 'Uncool',
  //       cards: [
  //         { ll_template: 'nested', ll_context: { name: 'Cool' } },
  //         { ll_template: 'template' }
  //       ]
  //     },
  //   });
  // });

  test('ll_keys supports values to be templatized including nested arrays', async () => {
    const modes: DashboardCard = {
      type: 'custom:vertical-stack-in-card',
      card_mod: {
        style: {}
      },
      cards: []
    };

    const info: DashboardCard = {
      type: 'custom:vertical-stack-in-card',
      cards: []
    };
    const chips: DashboardCard = {
      type: 'custom:mushroom-chips-card',
      chips: []
    };
    const card: DashboardCard = {
      type: 'test',
      cards: [
        { ll_template: 'info', type: 'test' },
        {
          ll_template: 'modes', type: 'test', ll_context: {
            cards: [
              { ll_template: 'info', type: 'test' },
              { ll_template: 'info', type: 'test' },
            ]
          }, ll_keys: {
            'cards': "cards"
          }
        },
        { ll_template: 'chips', type: 'test' },
      ]
    };
    expect(await updateCardTemplate(card, { modes, chips, info })).toStrictEqual({
      type: 'test',
      cards: [
        {
          type: 'custom:vertical-stack-in-card',
          ll_template: 'info',
          cards: []
        },
        {
          type: 'custom:vertical-stack-in-card',
          card_mod: {
            style: {}
          },
          ll_template: 'modes',
          ll_context: {
            cards: [
              { ll_template: 'info', type: 'test' },
              { ll_template: 'info', type: 'test' },
            ]
          },
          ll_keys: {
            'cards': "cards"
          },
          cards: [
            {
              type: 'custom:vertical-stack-in-card',
              ll_template: 'info',
              cards: []
            },
            {
              type: 'custom:vertical-stack-in-card',
              ll_template: 'info',
              cards: []
            }
          ]
        },
        {
          type: 'custom:mushroom-chips-card',
          ll_template: 'chips',
          chips: []
        },
      ],
    });
  });

  test('ll_keys works with template data for now', async () => {
    const template: DashboardCard = {
      type: 'template',
      number: 3
    };
    const card: DashboardCard = {
      type: 'test',
      ll_template: 'template',
      ll_context: {
        number: 6
      },
      ll_keys: { 'number': 'number' }
    };
    expect(await updateCardTemplate(card, { template })).toStrictEqual({
      type: 'template',
      ll_template: 'template',
      number: 6,
      ll_keys: { 'number': 'number' },
      ll_context: {
        number: 6
      },
    });
  });

  test('ll_keys does nothing when key is missing from data', async () => {
    const template: DashboardCard = {
      type: 'template',
      number: 3
    };
    const card: DashboardCard = {
      type: 'test',
      ll_template: 'template',
      ll_context: {},
      ll_keys: { 'number': 'number' }
    };
    expect(await updateCardTemplate(card, { template })).toStrictEqual({
      type: 'template',
      ll_template: 'template',
      number: 3,
      ll_keys: { 'number': 'number' },
    });
  });

  test('allows for alphanumeric and underscores in varible names', async () => {
    const template: DashboardCard = {
      type: 'template',
      name: '<%= context.cool_123 %> man',
    };
    const card: DashboardCard = {
      type: 'test',
      ll_template: 'template',
      ll_context: {
        cool_123: 'yes',
      },
    };
    expect(await updateCardTemplate(card, { template })).toStrictEqual({
      type: 'template',
      ll_template: 'template',
      name: 'yes man',
      ll_context: {
        cool_123: 'yes',
      },
    });
  });
});
describe('[function] updateCardTemplate v2', () => {
  test('does nothing when given no template data and an empty card', async () => {
    const card: DashboardCard = {
      type: 'test',
    };
    expect(await updateCardTemplate(card, undefined)).toStrictEqual(card);
  });

  test('does nothing when given no template data with a template type', async () => {
    const card: DashboardCard = {
      type: 'test',
      ll_template: 'true',
    };
    expect(await updateCardTemplate(card, undefined)).toStrictEqual(card);
  });

  test('does nothing when given no template data with child cards', async () => {
    const card: DashboardCard = {
      type: 'test',
      cards: [
        {
          type: 'test',
        },
      ],
    };
    expect(await updateCardTemplate(card, undefined)).toStrictEqual(card);
  });

  test('preserves arrays named card', async () => {
    const card: DashboardCard = {
      type: 'test',
      options: { card: [1, 2] },
    };
    expect(await updateCardTemplate(card, undefined)).toStrictEqual(card);
    const updatedCard = await updateCardTemplate(card, undefined)
    expect(updatedCard.options.card).toBeInstanceOf(Array);
  });

  test('replaces card with template', async () => {
    const template: DashboardCard = {
      type: 'template',
    };
    const card: DashboardCard = {
      type: 'test',
      ll_template: 'template',
    };
    expect(await updateCardTemplate(card, { template })).toStrictEqual({ type: 'template', ll_template: 'template' });
  });

  test('replaces child cards with template', async () => {
    const template: DashboardCard = {
      type: 'template',
    };
    const card: DashboardCard = {
      type: 'test',
      cards: [
        {
          type: 'test',
          ll_template: 'template',
        },
      ],
    };
    expect(await updateCardTemplate(card, { template })).toStrictEqual({
      type: 'test',
      cards: [
        {
          type: 'template',
          ll_template: 'template',
        },
      ],
    });
  });

  test('replaces child card with template', async () => {
    const template: DashboardCard = {
      type: 'template',
    };
    const card: DashboardCard = {
      type: 'test',
      card:
      {
        type: 'test',
        ll_template: 'template',
      }
    };
    expect(await updateCardTemplate(card, { template })).toStrictEqual({
      type: 'test',
      card: {
        type: 'template',
        ll_template: 'template',
      },
    });
  });

  test('replaces card with template and updates data', async () => {
    const template: DashboardCard = {
      type: 'template',
      name: '<%= context.cool %> man',
    };
    const card: DashboardCard = {
      type: 'test',
      ll_template: 'template',
      ll_context: {
        cool: 'yes',
      },
    };
    expect(await updateCardTemplate(card, { template })).toStrictEqual({
      type: 'template',
      ll_template: 'template',
      name: 'yes man',
      ll_context: {
        cool: 'yes',
      },
    });
  });

  test('does not replace child card with template if card is template', async () => {
    const template: DashboardCard = {
      type: 'template',
      card: {
        type: 'swapped',
        ll_template: 'template'
      }
    };
    const card: DashboardCard = {
      type: 'test',
      ll_template: 'template',
      card:
      {
        type: 'test',
        ll_template: 'template',
      }
    };
    expect(await updateCardTemplate(card, { template })).toStrictEqual({
      type: 'template',
      ll_template: 'template',
      card: {
        type: 'swapped',
        ll_template: 'template',
      },
    });
  });

  test('does not replace child card with template if card is template', async () => {
    const template: DashboardCard = {
      type: 'new',
      card: {
        type: 'swapped',
        ll_template: 'template'
      }
    };
    const card: DashboardCard = {
      type: 'test',
      tap_action: {
        action: 'fire-dom-event',
        browser_mod: {
          service: 'browser_mod.popup',
          data: {
            title: '',
            content: {
              type: 'old',
              ll_template: 'template'
            }
          }
        }
      }
    };
    expect(await updateCardTemplate(card, { template })).toStrictEqual({
      type: 'test',
      tap_action: {
        action: 'fire-dom-event',
        browser_mod: {
          service: 'browser_mod.popup',
          data: {
            title: '',
            content: {
              type: 'new',
              ll_template: 'template',
              card: {
                type: 'swapped',
                ll_template: 'template'
              }
            }
          }
        }
      }
    });
  });

  test('leaves numbers as numbers', async () => {
    const template: DashboardCard = {
      type: 'template',
    };
    const card: DashboardCard = {
      type: 'test',
      ll_template: 'template',
      ll_context: {
        number: 6
      },
      ll_keys: { 'number': 'number' }
    };
    expect(await updateCardTemplate(card, { template })).toStrictEqual({
      type: 'template',
      ll_template: 'template',
      number: 6,
      ll_keys: { 'number': 'number' },
      ll_context: {
        number: 6
      },
    });
  });

  test('ll_keys changes row values', async () => {
    const template: DashboardCard = {
      type: 'template',
      number: 3
    };
    const card: DashboardCard = {
      type: 'test',
      ll_template: 'template',
      ll_context: {
        number: 6
      },
      ll_keys: { 'number': 'number' }
    };
    expect(await updateCardTemplate(card, { template })).toStrictEqual({
      type: 'template',
      ll_template: 'template',
      number: 6,
      ll_keys: { 'number': 'number' },
      ll_context: {
        number: 6
      },
    });
  });

  test('ll_keys supports values to be templatized', async () => {
    const template: DashboardCard = {
      type: 'template',
      cards: []
    };
    const nested: DashboardCard = {
      type: 'nested',
      cards: []
    };
    const card: DashboardCard = {
      type: 'test',
      ll_template: 'template',
      ll_context: {
        cards: [
          { ll_template: 'nested' }
        ]
      },
      ll_keys: { 'cards': 'cards' }
    };
    expect(await updateCardTemplate(card, { template, nested })).toStrictEqual({
      type: 'template',
      ll_template: 'template',
      cards: [
        {
          type: 'nested',
          ll_template: 'nested',
          cards: []
        }
      ],
      ll_keys: { 'cards': 'cards' },
      ll_context: {
        cards: [
          { ll_template: 'nested' }
        ]
      },
    });
  });

  test('ll_keys supports values to be templatized including arrays', async () => {
    const template: DashboardCard = {
      type: 'template',
      cards: []
    };
    const nested: DashboardCard = {
      type: 'nested',
      cards: []
    };
    const card: DashboardCard = {
      type: 'test',
      ll_template: 'template',
      ll_context: {
        cards: [
          { ll_template: 'nested' },
          { ll_template: 'template' },
        ]
      },
      ll_keys: { 'cards': 'cards' }
    };
    expect(await updateCardTemplate(card, { template, nested })).toStrictEqual({
      type: 'template',
      ll_template: 'template',
      cards: [
        {
          type: 'nested',
          ll_template: 'nested',
          cards: []
        },
        {
          type: 'template',
          ll_template: 'template',
          cards: []
        }
      ],
      ll_keys: { 'cards': 'cards' },
      ll_context: {
        cards: [
          { ll_template: 'nested' },
          { ll_template: 'template' }
        ]
      },
    });
  });

  test('ll_keys supports passing ll_context', async () => {
    const template: DashboardCard = {
      type: 'template',
      cards: []
    };
    const nested: DashboardCard = {
      type: 'nested',
      name: '<%= context.name %>',
      cards: []
    };
    const card: DashboardCard = {
      type: 'test',
      ll_template: 'template',
      ll_context: {
        cards: [
          { ll_template: 'nested', ll_context: { name: 'Cool' } },
          { ll_template: 'template' },
        ]
      },
      ll_keys: { 'cards': 'cards' }
    };
    expect(await updateCardTemplate(card, { template, nested })).toStrictEqual({
      type: 'template',
      ll_template: 'template',
      cards: [
        {
          type: 'nested',
          ll_template: 'nested',
          ll_context: { name: 'Cool' },
          name: 'Cool',
          cards: []
        },
        {
          type: 'template',
          ll_template: 'template',
          cards: []
        }
      ],
      ll_keys: { 'cards': 'cards' },
      ll_context: {
        cards: [
          { ll_template: 'nested', ll_context: { name: 'Cool' } },
          { ll_template: 'template' }
        ]
      },
    });
  });

  test('ll_keys supports passing ll_context and ll_keys', async () => {
    const template: DashboardCard = {
      type: 'template',
      cards: []
    };
    const nested: DashboardCard = {
      type: 'nested',
      name: 'originalName',
      cards: []
    };
    const card: DashboardCard = {
      type: 'test',
      ll_template: 'template',
      ll_context: {
        cards: [
          { ll_template: 'nested', ll_context: { name: 'Cool' }, ll_keys: ['name'], },
          { ll_template: 'template' },
        ]
      },
      ll_keys: { 'cards': 'cards' }
    };
    expect(await updateCardTemplate(card, { template, nested })).toStrictEqual({
      type: 'template',
      ll_template: 'template',
      cards: [
        {
          type: 'nested',
          ll_template: 'nested',
          ll_context: { name: 'Cool' },
          ll_keys: ['name'],
          name: 'Cool',
          cards: []
        },
        {
          type: 'template',
          ll_template: 'template',
          cards: []
        }
      ],
      ll_keys: { 'cards': 'cards' },
      ll_context: {
        cards: [
          { ll_template: 'nested', ll_context: { name: 'Cool' }, ll_keys: ['name'], },
          { ll_template: 'template' }
        ]
      },
    });
  });

  // test('ll_keys supports overriding ll_context from parent', () => {
  //   const template: DashboardCard = {
  //     type: 'template',
  //     cards: []
  //   };
  //   const nested: DashboardCard = {
  //     type: 'nested',
  //     name: '<%= context.name %>',
  //     cards: []
  //   };
  //   const card: DashboardCard = {
  //     type: 'test',
  //     ll_template: 'template',
  //     ll_context: {
  //       name: 'Uncool',
  //       cards: [
  //         { ll_template: 'nested', ll_context: { name: 'Cool' } },
  //         { ll_template: 'template' },
  //       ]
  //     },
  //     ll_keys: {'cards': 'cards'}
  //   };
  //   expect(updateCardTemplate(card, { template, nested })).toStrictEqual({
  //     type: 'template',
  //     ll_template: 'template',
  //     cards: [
  //       {
  //         type: 'nested',
  //         ll_template: 'nested',
  //         ll_context: { name: 'Uncool' },
  //         name: 'Uncool',
  //         cards: []
  //       },
  //       {
  //         type: 'template',
  //         ll_context: { name: 'Uncool' },
  //         ll_template: 'template',
  //         cards: []
  //       }
  //     ],
  //     ll_keys: {'cards': 'cards'},
  //     ll_context: {
  //       name: 'Uncool',
  //       cards: [
  //         { ll_template: 'nested', ll_context: { name: 'Cool' } },
  //         { ll_template: 'template' }
  //       ]
  //     },
  //   });
  // });

  test('ll_keys supports values to be templatized including nested arrays', async () => {
    const modes: DashboardCard = {
      type: 'custom:vertical-stack-in-card',
      card_mod: {
        style: {}
      },
      cards: []
    };

    const info: DashboardCard = {
      type: 'custom:vertical-stack-in-card',
      cards: []
    };
    const chips: DashboardCard = {
      type: 'custom:mushroom-chips-card',
      chips: []
    };
    const card: DashboardCard = {
      type: 'test',
      cards: [
        { ll_template: 'info', type: 'test' },
        {
          ll_template: 'modes', type: 'test', ll_context: {
            cards: [
              { ll_template: 'info', type: 'test' },
              { ll_template: 'info', type: 'test' },
            ]
          }, ll_keys: {
            'cards': "cards"
          }
        },
        { ll_template: 'chips', type: 'test' },
      ]
    };
    expect(await updateCardTemplate(card, { modes, chips, info })).toStrictEqual({
      type: 'test',
      cards: [
        {
          type: 'custom:vertical-stack-in-card',
          ll_template: 'info',
          cards: []
        },
        {
          type: 'custom:vertical-stack-in-card',
          card_mod: {
            style: {}
          },
          ll_template: 'modes',
          ll_context: {
            cards: [
              { ll_template: 'info', type: 'test' },
              { ll_template: 'info', type: 'test' },
            ]
          },
          ll_keys: {
            'cards': "cards"
          },
          cards: [
            {
              type: 'custom:vertical-stack-in-card',
              ll_template: 'info',
              cards: []
            },
            {
              type: 'custom:vertical-stack-in-card',
              ll_template: 'info',
              cards: []
            }
          ]
        },
        {
          type: 'custom:mushroom-chips-card',
          ll_template: 'chips',
          chips: []
        },
      ],
    });
  });

  test('ll_keys works with template data for now', async () => {
    const template: DashboardCard = {
      type: 'template',
      number: 3
    };
    const card: DashboardCard = {
      type: 'test',
      ll_template: 'template',
      ll_context: {
        number: 6
      },
      ll_keys: { 'number': 'number' }
    };
    expect(await updateCardTemplate(card, { template })).toStrictEqual({
      type: 'template',
      ll_template: 'template',
      number: 6,
      ll_keys: { 'number': 'number' },
      ll_context: {
        number: 6
      },
    });
  });

  test('ll_keys does nothing when key is missing from data', async () => {
    const template: DashboardCard = {
      type: 'template',
      number: 3
    };
    const card: DashboardCard = {
      type: 'test',
      ll_template: 'template',
      ll_context: {},
      ll_keys: { 'number': 'number' }
    };
    expect(await updateCardTemplate(card, { template })).toStrictEqual({
      type: 'template',
      ll_template: 'template',
      number: 3,
      ll_keys: { 'number': 'number' },
    });
  });

  test('allows for alphanumeric and underscores in varible names', async () => {
    const template: DashboardCard = {
      type: 'template',
      name: '<%= context.cool_123 %> man',
    };
    const card: DashboardCard = {
      type: 'test',
      ll_template: 'template',
      ll_context: {
        cool_123: 'yes',
      },
    };
    expect(await updateCardTemplate(card, { template })).toStrictEqual({
      type: 'template',
      ll_template: 'template',
      name: 'yes man',
      ll_context: {
        cool_123: 'yes',
      },
    });
  });

  test('Github Issue #40 Replicating LL_Context', async () => {
    const template: DashboardCard = {
      type: "custom_collapsable-cards",
      ll_key: "test_card",
      ll_context: {
        group: "sensor.tempratures_koelkasten",
        name: "Temperatuur"
      },
      title_card: {
        type: "tile",
        name: "<%= context.name %>",
        entity: "<%= context.group %>"
      },
    };
    const card: DashboardCard = {
      type: "text",
      ll_template: "test_card"
    };
    const oldTemplate = JSON.parse(JSON.stringify(template))
    expect(await updateCardTemplate(card, { [template.ll_key!]: template })).toStrictEqual({
      type: "custom_collapsable-cards",
      ll_template: "test_card",
      ll_context: {
        group: "sensor.tempratures_koelkasten",
        name: "Temperatuur"
      },
      title_card: {
        type: "tile",
        name: "Temperatuur",
        entity: "sensor.tempratures_koelkasten"
      },
    });
    expect(oldTemplate).toStrictEqual(template)
  });

  test('Not Overriding linked LL_Context when ll_replicate_ctx is true', async () => {
    const template: DashboardCard = {
      type: "custom_collapsable-cards",
      ll_key: "test_card",
      ll_context: {
        group: "sensor.tempratures_koelkasten",
        name: "Temperatuur"
      },
      title_card: {
        type: "tile",
        name: "<%= context.name %>",
        entity: "<%= context.group %>"
      },
    };
    const card: DashboardCard = {
      type: "text",
      ll_template: "test_card",
      ll_context: {
        group: "sensor.tempratures_another",
      }
    };
    const oldTemplate = JSON.parse(JSON.stringify(template))
    expect(await updateCardTemplate(card, { [template.ll_key!]: template })).toStrictEqual({
      type: "custom_collapsable-cards",
      ll_template: "test_card",
      ll_context: {
        group: "sensor.tempratures_another",
        name: "Temperatuur"
      },
      title_card: {
        type: "tile",
        name: "Temperatuur",
        entity: "sensor.tempratures_another"
      },
    });
    expect(oldTemplate).toStrictEqual(template)
  });


  test('Not Replicating LL_Context when ll_replicate_ctx is false', async () => {
    const template: DashboardCard = {
      type: "custom_collapsable-cards",
      ll_replicate_ctx: false,
      ll_key: "test_card",
      ll_context: {
        group: "sensor.tempratures_koelkasten",
        name: "Temperatuur"
      },
      title_card: {
        type: "tile",
        name: "<%= context.name %>",
        entity: "<%= context.group %>"
      },
    };
    const card: DashboardCard = {
      type: "text",
      ll_template: "test_card"
    };
    const oldTemplate = JSON.parse(JSON.stringify(template))
    expect(await updateCardTemplate(card, { [template.ll_key!]: template })).toStrictEqual({
      type: "custom_collapsable-cards",
      ll_template: "test_card",
      title_card: {
        type: "tile",
        name: "Temperatuur",
        entity: "sensor.tempratures_koelkasten"
      },
    });
    expect(oldTemplate).toStrictEqual(template)
  });

  test('Not Overriding linked LL_Context when ll_replicate_ctx is false', async () => {
    const template: DashboardCard = {
      type: "custom_collapsable-cards",
      ll_replicate_ctx: false,
      ll_key: "test_card",
      ll_context: {
        group: "sensor.tempratures_koelkasten",
        name: "Temperatuur"
      },
      title_card: {
        type: "tile",
        name: "<%= context.name %>",
        entity: "<%= context.group %>"
      },
    };
    const card: DashboardCard = {
      type: "text",
      ll_template: "test_card",
      ll_context: {
        group: "sensor.tempratures_another",
      },
    };
    const oldTemplate = JSON.parse(JSON.stringify(template))
    expect(await updateCardTemplate(card, { [template.ll_key!]: template })).toStrictEqual({
      type: "custom_collapsable-cards",
      ll_template: "test_card",
      ll_context: {
        group: "sensor.tempratures_another",
      },
      title_card: {
        type: "tile",
        name: "Temperatuur",
        entity: "sensor.tempratures_another"
      },
    });
    expect(oldTemplate).toStrictEqual(template)
  });

  test('merges ll_card_config complex object into main card config', async () => {
    const template: DashboardCard = {
      type: 'custom:complex-card',
      ll_key: 'complex_card',
      ll_card_config: JSON.stringify({
        extra: { foo: 'bar', arr: [1, 2, 3] },
        enabled: true,
        nested: { a: 1, b: { c: 2 } }
      })
    };
    const card: DashboardCard = {
      type: 'test',
      ll_template: 'complex_card',
    };
    const result = await updateCardTemplate(card, { complex_card: template });
    expect(result).toMatchObject({
      type: 'custom:complex-card',
      ll_template: 'complex_card',
      extra: { foo: 'bar', arr: [1, 2, 3] },
      enabled: true,
      nested: { a: 1, b: { c: 2 } }
    });
  });

  test('ll_card_config merge does not overwrite existing card keys unless specified', async () => {
    const template: DashboardCard = {
      type: 'custom:complex-card',
      ll_key: 'complex_card',
      name: 'should-stay',
      ll_card_config: JSON.stringify({
        extra: { foo: 'bar' },
        name: 'should-overwrite',
        enabled: true
      })
    };
    const card: DashboardCard = {
      type: 'test',
      ll_template: 'complex_card',
      name: 'should-stay'
    };
    const result = await updateCardTemplate(card, { complex_card: template });
    expect(result).toMatchObject({
      type: 'custom:complex-card',
      ll_template: 'complex_card',
      name: 'should-overwrite', // merged value overwrites
      extra: { foo: 'bar' },
      enabled: true
    });
  });

  test('invalid ll_card_config does not break card and logs error', async () => {
    const template: DashboardCard = {
      type: 'custom:complex-card',
      ll_key: 'complex_card',
      ll_card_config: '{invalid json}',
      foo: 'bar'
    };
    const card: DashboardCard = {
      type: 'custom:complex-card',
      ll_template: 'complex_card',
      foo: 'biz',
      zoo: 'baz',
    };
    const spy = jest.spyOn(console, 'error').mockImplementation(() => { });
    const result = await updateCardTemplate(card, { complex_card: template });
    expect(result).toStrictEqual({
      type: 'custom:complex-card',
      ll_template: 'complex_card',
      foo: 'biz',
      zoo: 'baz',
      ll_error: "Error rendering template 'complex_card': Error: Failed to parse ll_card_config for template 'complex_card': SyntaxError: Expected property name or '}' in JSON at position 1 (line 1 column 2)",
      ll_template_card: {
        foo: "bar",
        ll_card_config: "{invalid json}",
        ll_key: "complex_card",
        ll_replicate_ctx: true,
        type: "custom:complex-card",
      }
    });
    expect(result.ll_template_card.ll_card_config).toBe('{invalid json}');
    expect(spy).toHaveBeenCalledWith(
      new Error("Failed to parse ll_card_config for template 'complex_card': SyntaxError: Expected property name or '}' in JSON at position 1 (line 1 column 2)"),
    );
    spy.mockRestore();
  });


  test('linked card error information is removed when error is resolved', async () => {
    const template: DashboardCard = {
      type: 'custom:complex-card',
      ll_key: 'complex_card',
      ll_card_config: '{"foo": "barbaz"}',
      foo: 'bar'
    };
    const card: DashboardCard = {
      type: 'custom:complex-card',
      ll_template: 'complex_card',
      foo: 'biz',
      zoo: 'baz',
      ll_error: "some error from previous state",
      ll_template_card: {
        foo: "bar",
        ll_card_config: "{invalid json}",
        ll_key: "complex_card",
        ll_replicate_ctx: true,
        type: "custom:complex-card",
      }
    };
    const result = await updateCardTemplate(card, { complex_card: template });
    expect(result).toStrictEqual({
      type: 'custom:complex-card',
      ll_template: 'complex_card',
      foo: 'barbaz',
    });
  });
});
