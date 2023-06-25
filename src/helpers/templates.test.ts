import { DashboardCard, DashboardView } from '../types';
import { getTemplatesUsedInCard, getTemplatesUsedInView, extractTemplateData, updateCardTemplate } from './templates';

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
      template: 'true',
    };
    expect(getTemplatesUsedInCard(card)).toStrictEqual(['true']);
  });

  test('ignores child cards if card is a template', () => {
    const card: DashboardCard = {
      type: 'fake',
      template: 'true',
      cards: [
        {
          type: 'fake',
          template: 'true',
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
          template: 'true',
        },
        {
          type: 'fake',
          template: 'true',
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
        template: 'true',
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
          template: 'true',
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
          template: 'true',
          cards: [
            {
              type: 'test',
              template: 'true',
            },
          ],
        },
        {
          type: 'test',
          template: 'true',
        },
      ],
    };
    expect(getTemplatesUsedInView(view)).toStrictEqual(['true', 'true']);
  });
});

describe('[function] extractTemplateData', () => {
  test('returns an unmodified card if no template data', () => {
    const card: DashboardCard = {
      type: 'test',
    };
    expect(extractTemplateData(card)).toStrictEqual(card);
  });

  test('returns an a card with template data populated', () => {
    const card: DashboardCard = {
      type: '$test$',
    };
    expect(extractTemplateData(card)).toStrictEqual({
      type: '$test$',
      template_data: {
        test: '',
      },
    });
  });
  test('returns an a card with template data deleted if empty', () => {
    const card: DashboardCard = {
      type: 'test',
      template_data: {},
    };
    expect(extractTemplateData(card)).toStrictEqual({
      type: 'test',
    });
  });
});

describe('[function] updateCardTemplate', () => {
  test('does nothing when given no template data and an empty card', () => {
    const card: DashboardCard = {
      type: 'test',
    };
    expect(updateCardTemplate(card)).toStrictEqual(card);
  });

  test('does nothing when given no template data with a template type', () => {
    const card: DashboardCard = {
      type: 'test',
      template: 'true',
    };
    expect(updateCardTemplate(card)).toStrictEqual(card);
  });

  test('does nothing when given no template data with child cards', () => {
    const card: DashboardCard = {
      type: 'test',
      cards: [
        {
          type: 'test',
        },
      ],
    };
    expect(updateCardTemplate(card)).toStrictEqual(card);
  });

  test('replaces card with template', () => {
    const template: DashboardCard = {
      type: 'template',
    };
    const card: DashboardCard = {
      type: 'test',
      template: 'template',
    };
    expect(updateCardTemplate(card, { template })).toStrictEqual({ type: 'template', template: 'template', ll_v2: false });
  });

  test('replaces child cards with template', () => {
    const template: DashboardCard = {
      type: 'template',
    };
    const card: DashboardCard = {
      type: 'test',
      cards: [
        {
          type: 'test',
          template: 'template',
        },
      ],
    };
    expect(updateCardTemplate(card, { template })).toStrictEqual({
      type: 'test',
      cards: [
        {
          type: 'template',
          ll_v2: false,
          template: 'template',
        },
      ],
    });
  });

  test('replaces child card with template', () => {
    const template: DashboardCard = {
      type: 'template',
    };
    const card: DashboardCard = {
      type: 'test',
      card:
      {
        type: 'test',
        template: 'template',
      }
    };
    expect(updateCardTemplate(card, { template })).toStrictEqual({
      type: 'test',
      card: {
        type: 'template',
        ll_v2: false,
        template: 'template',
      },
    });
  });

  test('replaces card with template and updates data', () => {
    const template: DashboardCard = {
      type: 'template',
      name: '$cool$ man',
    };
    const card: DashboardCard = {
      type: 'test',
      template: 'template',
      template_data: {
        cool: 'yes',
      },
    };
    expect(updateCardTemplate(card, { template })).toStrictEqual({
      type: 'template',
      template: 'template',
      ll_v2: false,
      name: 'yes man',
      ll_data: {
        cool: 'yes',
      },
    });
  });

  test('does not replace child card with template if card is template', () => {
    const template: DashboardCard = {
      type: 'template',
      card: {
        type: 'swapped',
        template: 'template'
      }
    };
    const card: DashboardCard = {
      type: 'test',
      template: 'template',
      card:
      {
        type: 'test',
        template: 'template',
      }
    };
    expect(updateCardTemplate(card, { template })).toStrictEqual({
      type: 'template',
      template: 'template',
      ll_v2: false,
      card: {
        type: 'swapped',
        template: 'template',
      },
    });
  });

  test('does not replace child card with template if card is template', () => {
    const template: DashboardCard = {
      type: 'new',
      card: {
        type: 'swapped',
        template: 'template'
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
              template: 'template'
            }
          }
        }
      }
    };
    expect(updateCardTemplate(card, { template })).toStrictEqual({
      type: 'test',
      tap_action: {
        action: 'fire-dom-event',
        browser_mod: {
          service: 'browser_mod.popup',
          data: {
            title: '',
            content: {
              type: 'new',
              template: 'template',
              ll_v2: false,
              card: {
                type: 'swapped',
                template: 'template'
              }
            }
          }
        }
      }
    });
  });

  test('ignores invalid characters in varible names', () => {
    const template: DashboardCard = {
      type: 'template',
      name: '$cool {{}{$ $cool$ man',
    };
    const card: DashboardCard = {
      type: 'test',
      template: 'template',
      template_data: {
        cool: 'yes',
      },
    };
    expect(updateCardTemplate(card, { template })).toStrictEqual({
      type: 'template',
      template: 'template',
      ll_v2: false,
      name: '$cool {{}{$ yes man',
      ll_data: {
        cool: 'yes',
      },
    });
  });

  test('leaves numbers as numbers', () => {
    const template: DashboardCard = {
      type: 'template',
    };
    const card: DashboardCard = {
      type: 'test',
      template: 'template',
      ll_data: {
        number: 6
      },
      ll_keys: ['number']
    };
    expect(updateCardTemplate(card, { template })).toStrictEqual({
      type: 'template',
      template: 'template',
      number: 6,
      ll_v2: false,
      ll_keys: ['number'],
      ll_data: {
        number: 6
      },
    });
  });

  test('ll_keys changes row values', () => {
    const template: DashboardCard = {
      type: 'template',
      number: 3
    };
    const card: DashboardCard = {
      type: 'test',
      template: 'template',
      ll_data: {
        number: 6
      },
      ll_keys: ['number']
    };
    expect(updateCardTemplate(card, { template })).toStrictEqual({
      type: 'template',
      template: 'template',
      number: 6,
      ll_v2: false,
      ll_keys: ['number'],
      ll_data: {
        number: 6
      },
    });
  });

  test('ll_keys supports values to be templatized', () => {
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
      template: 'template',
      ll_data: {
        cards: [
          { template: 'nested' }
        ]
      },
      ll_keys: ['cards']
    };
    expect(updateCardTemplate(card, { template, nested })).toStrictEqual({
      type: 'template',
      template: 'template',
      ll_v2: false,
      cards: [
        {
          type: 'nested',
          template: 'nested',
          ll_v2: false,
          cards: []
        }
      ],
      ll_keys: ['cards'],
      ll_data: {
        cards: [
          { template: 'nested' }
        ]
      },
    });
  });

  test('ll_keys supports values to be templatized including arrays', () => {
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
      template: 'template',
      ll_data: {
        cards: [
          { template: 'nested' },
          { template: 'template' },
        ]
      },
      ll_keys: ['cards']
    };
    expect(updateCardTemplate(card, { template, nested })).toStrictEqual({
      type: 'template',
      template: 'template',
      ll_v2: false,
      cards: [
        {
          type: 'nested',
          template: 'nested',
          ll_v2: false,
          cards: []
        },
        {
          type: 'template',
          template: 'template',
          ll_v2: false,
          cards: []
        }
      ],
      ll_keys: ['cards'],
      ll_data: {
        cards: [
          { template: 'nested' },
          { template: 'template' }
        ]
      },
    });
  });

  test('ll_keys supports passing ll_data', () => {
    const template: DashboardCard = {
      type: 'template',
      cards: []
    };
    const nested: DashboardCard = {
      type: 'nested',
      name: '$name$',
      cards: []
    };
    const card: DashboardCard = {
      type: 'test',
      template: 'template',
      ll_data: {
        cards: [
          { template: 'nested', ll_data: { name: 'Cool' } },
          { template: 'template' },
        ]
      },
      ll_keys: ['cards']
    };
    expect(updateCardTemplate(card, { template, nested })).toStrictEqual({
      type: 'template',
      template: 'template',
      ll_v2: false,
      cards: [
        {
          type: 'nested',
          template: 'nested',
          ll_data: { name: 'Cool' },
          ll_v2: false,
          name: 'Cool',
          cards: []
        },
        {
          type: 'template',
          template: 'template',
          ll_v2: false,
          cards: []
        }
      ],
      ll_keys: ['cards'],
      ll_data: {
        cards: [
          { template: 'nested', ll_data: { name: 'Cool' } },
          { template: 'template' }
        ]
      },
    });
  });

  test('ll_keys supports passing ll_data and ll_keys', () => {
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
      template: 'template',
      ll_data: {
        cards: [
          { template: 'nested', ll_data: { name: 'Cool' }, ll_keys: ['name'], },
          { template: 'template' },
        ]
      },
      ll_keys: ['cards']
    };
    expect(updateCardTemplate(card, { template, nested })).toStrictEqual({
      type: 'template',
      template: 'template',
      cards: [
        {
          type: 'nested',
          template: 'nested',
          ll_v2: false,
          ll_data: { name: 'Cool' },
          ll_keys: ['name'],
          name: 'Cool',
          cards: []
        },
        {
          type: 'template',
          template: 'template',
          ll_v2: false,
          cards: []
        }
      ],
      ll_keys: ['cards'],
      ll_v2: false,
      ll_data: {
        cards: [
          { template: 'nested', ll_data: { name: 'Cool' }, ll_keys: ['name'], },
          { template: 'template' }
        ]
      },
    });
  });

  test('ll_keys supports overriding ll_data from parent', () => {
    const template: DashboardCard = {
      type: 'template',
      cards: []
    };
    const nested: DashboardCard = {
      type: 'nested',
      name: '$name$',
      cards: []
    };
    const card: DashboardCard = {
      type: 'test',
      template: 'template',
      ll_data: {
        name: 'Uncool',
        cards: [
          { template: 'nested', ll_data: { name: 'Cool' } },
          { template: 'template' },
        ]
      },
      ll_keys: ['cards']
    };
    expect(updateCardTemplate(card, { template, nested })).toStrictEqual({
      type: 'template',
      template: 'template',
      ll_v2: false,
      cards: [
        {
          type: 'nested',
          template: 'nested',
          ll_v2: false,
          ll_data: { name: 'Uncool' },
          name: 'Uncool',
          cards: []
        },
        {
          type: 'template',
          ll_data: { name: 'Uncool' },
          ll_v2: false,
          template: 'template',
          cards: []
        }
      ],
      ll_keys: ['cards'],
      ll_data: {
        name: 'Uncool',
        cards: [
          { template: 'nested', ll_data: { name: 'Cool' } },
          { template: 'template' }
        ]
      },
    });
  });

  test('ll_keys supports values to be templatized including nested arrays', () => {
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
        { template: 'info', type: 'test' },
        {
          template: 'modes', type: 'test', ll_data: {
            cards: [
              { template: 'info', type: 'test' },
              { template: 'info', type: 'test' },
            ]
          }, ll_keys: ['cards']
        },
        { template: 'chips', type: 'test' },
      ]
    };
    expect(updateCardTemplate(card, { modes, chips, info })).toStrictEqual({
      type: 'test',
      cards: [
        {
          type: 'custom:vertical-stack-in-card',
          template: 'info',
          ll_v2: false,
          cards: []
        },
        {
          type: 'custom:vertical-stack-in-card',
          card_mod: {
            style: {}
          },
          template: 'modes',
          ll_v2: false,
          ll_data: {
            cards: [
              { template: 'info', type: 'test' },
              { template: 'info', type: 'test' },
            ]
          },
          ll_keys: ['cards'],
          cards: [
            {
              type: 'custom:vertical-stack-in-card',
              template: 'info',
              ll_v2: false,
              cards: []
            },
            {
              type: 'custom:vertical-stack-in-card',
              template: 'info',
              ll_v2: false,
              cards: []
            }
          ]
        },
        {
          type: 'custom:mushroom-chips-card',
          template: 'chips',
          ll_v2: false,
          chips: []
        },
      ],
    });
  });

  test('ll_keys works with template data for now', () => {
    const template: DashboardCard = {
      type: 'template',
      number: 3
    };
    const card: DashboardCard = {
      type: 'test',
      template: 'template',
      template_data: {
        number: 6
      },
      ll_keys: ['number']
    };
    expect(updateCardTemplate(card, { template })).toStrictEqual({
      type: 'template',
      template: 'template',
      number: 6,
      ll_v2: false,
      ll_keys: ['number'],
      ll_data: {
        number: 6
      },
    });
  });

  test('ll_keys does nothing when key is missing from data', () => {
    const template: DashboardCard = {
      type: 'template',
      number: 3
    };
    const card: DashboardCard = {
      type: 'test',
      template: 'template',
      ll_data: {},
      ll_keys: ['number']
    };
    expect(updateCardTemplate(card, { template })).toStrictEqual({
      type: 'template',
      template: 'template',
      number: 3,
      ll_v2: false,
      ll_keys: ['number'],
      ll_data: {},
    });
  });

  test('allows for alphanumeric and underscores in varible names', () => {
    const template: DashboardCard = {
      type: 'template',
      name: '$cool_123$ man',
    };
    const card: DashboardCard = {
      type: 'test',
      template: 'template',
      template_data: {
        cool_123: 'yes',
      },
    };
    expect(updateCardTemplate(card, { template })).toStrictEqual({
      type: 'template',
      template: 'template',
      ll_v2: false,
      name: 'yes man',
      ll_data: {
        cool_123: 'yes',
      },
    });
  });
});

describe('[function] updateCardTemplate v2', () => {
  test('does nothing when given no template data and an empty card', () => {
    const card: DashboardCard = {
      type: 'test',
    };
    expect(updateCardTemplate(card, undefined, true)).toStrictEqual(card);
  });

  test('does nothing when given no template data with a template type', () => {
    const card: DashboardCard = {
      type: 'test',
      template: 'true',
    };
    expect(updateCardTemplate(card, undefined, true)).toStrictEqual(card);
  });

  test('does nothing when given no template data with child cards', () => {
    const card: DashboardCard = {
      type: 'test',
      cards: [
        {
          type: 'test',
        },
      ],
    };
    expect(updateCardTemplate(card, undefined, true)).toStrictEqual(card);
  });

  test('replaces card with template', () => {
    const template: DashboardCard = {
      type: 'template',
    };
    const card: DashboardCard = {
      type: 'test',
      template: 'template',
    };
    expect(updateCardTemplate(card, { template }, true)).toStrictEqual({ ll_v2: true, type: 'template', template: 'template' });
  });

  test('replaces child cards with template', () => {
    const template: DashboardCard = {
      type: 'template',
    };
    const card: DashboardCard = {
      type: 'test',
      cards: [
        {
          type: 'test',
          template: 'template',
        },
      ],
    };
    expect(updateCardTemplate(card, { template }, true)).toStrictEqual({
      type: 'test',
      cards: [
        {
          type: 'template',
          ll_v2: true,
          template: 'template',
        },
      ],
    });
  });

  test('replaces child card with template', () => {
    const template: DashboardCard = {
      type: 'template',
    };
    const card: DashboardCard = {
      type: 'test',
      card:
      {
        type: 'test',
        template: 'template',
      }
    };
    expect(updateCardTemplate(card, { template }, true)).toStrictEqual({
      type: 'test',
      card: {
        type: 'template',
        ll_v2: true,
        template: 'template',
      },
    });
  });

  test('replaces card with template and updates data', () => {
    const template: DashboardCard = {
      type: 'template',
      name: '<%= context.cool %> man',
    };
    const card: DashboardCard = {
      type: 'test',
      template: 'template',
      template_data: {
        cool: 'yes',
      },
    };
    expect(updateCardTemplate(card, { template }, true)).toStrictEqual({
      type: 'template',
      template: 'template',
      name: 'yes man',
      ll_v2: true,
      ll_data: {
        cool: 'yes',
      },
    });
  });

  test('does not replace child card with template if card is template', () => {
    const template: DashboardCard = {
      type: 'template',
      card: {
        type: 'swapped',
        template: 'template'
      }
    };
    const card: DashboardCard = {
      type: 'test',
      template: 'template',
      card:
      {
        type: 'test',
        template: 'template',
      }
    };
    expect(updateCardTemplate(card, { template }, true)).toStrictEqual({
      type: 'template',
      template: 'template',
      ll_v2: true,
      card: {
        type: 'swapped',
        template: 'template',
      },
    });
  });

  test('does not replace child card with template if card is template', () => {
    const template: DashboardCard = {
      type: 'new',
      card: {
        type: 'swapped',
        template: 'template'
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
              template: 'template'
            }
          }
        }
      }
    };
    expect(updateCardTemplate(card, { template }, true)).toStrictEqual({
      type: 'test',
      tap_action: {
        action: 'fire-dom-event',
        browser_mod: {
          service: 'browser_mod.popup',
          data: {
            title: '',
            content: {
              type: 'new',
              template: 'template',
              ll_v2: true,
              card: {
                type: 'swapped',
                template: 'template'
              }
            }
          }
        }
      }
    });
  });

  test('leaves numbers as numbers', () => {
    const template: DashboardCard = {
      type: 'template',
    };
    const card: DashboardCard = {
      type: 'test',
      template: 'template',
      ll_data: {
        number: 6
      },
      ll_keys: ['number']
    };
    expect(updateCardTemplate(card, { template }, true)).toStrictEqual({
      type: 'template',
      template: 'template',
      number: 6,
      ll_v2: true,
      ll_keys: ['number'],
      ll_data: {
        number: 6
      },
    });
  });

  test('ll_keys changes row values', () => {
    const template: DashboardCard = {
      type: 'template',
      number: 3
    };
    const card: DashboardCard = {
      type: 'test',
      template: 'template',
      ll_data: {
        number: 6
      },
      ll_keys: ['number']
    };
    expect(updateCardTemplate(card, { template }, true)).toStrictEqual({
      type: 'template',
      template: 'template',
      number: 6,
      ll_v2: true,
      ll_keys: ['number'],
      ll_data: {
        number: 6
      },
    });
  });

  test('ll_keys supports values to be templatized', () => {
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
      template: 'template',
      ll_data: {
        cards: [
          { template: 'nested' }
        ]
      },
      ll_keys: ['cards']
    };
    expect(updateCardTemplate(card, { template, nested }, true)).toStrictEqual({
      type: 'template',
      template: 'template',
      ll_v2: true,
      cards: [
        {
          type: 'nested',
          template: 'nested',
          ll_v2: true,
          cards: []
        }
      ],
      ll_keys: ['cards'],
      ll_data: {
        cards: [
          { template: 'nested' }
        ]
      },
    });
  });

  test('ll_keys supports values to be templatized including arrays', () => {
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
      template: 'template',
      ll_data: {
        cards: [
          { template: 'nested' },
          { template: 'template' },
        ]
      },
      ll_keys: ['cards']
    };
    expect(updateCardTemplate(card, { template, nested }, true)).toStrictEqual({
      type: 'template',
      template: 'template',
      ll_v2: true,
      cards: [
        {
          type: 'nested',
          template: 'nested',
          ll_v2: true,
          cards: []
        },
        {
          type: 'template',
          template: 'template',
          ll_v2: true,
          cards: []
        }
      ],
      ll_keys: ['cards'],
      ll_data: {
        cards: [
          { template: 'nested' },
          { template: 'template' }
        ]
      },
    });
  });

  test('ll_keys supports passing ll_data', () => {
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
      template: 'template',
      ll_data: {
        cards: [
          { template: 'nested', ll_data: { name: 'Cool' } },
          { template: 'template' },
        ]
      },
      ll_keys: ['cards']
    };
    expect(updateCardTemplate(card, { template, nested }, true)).toStrictEqual({
      type: 'template',
      template: 'template',
      ll_v2: true,
      cards: [
        {
          type: 'nested',
          template: 'nested',
          ll_v2: true,
          ll_data: { name: 'Cool' },
          name: 'Cool',
          cards: []
        },
        {
          type: 'template',
          template: 'template',
          ll_v2: true,
          cards: []
        }
      ],
      ll_keys: ['cards'],
      ll_data: {
        cards: [
          { template: 'nested', ll_data: { name: 'Cool' } },
          { template: 'template' }
        ]
      },
    });
  });

  test('ll_keys supports passing ll_data and ll_keys', () => {
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
      template: 'template',
      ll_data: {
        cards: [
          { template: 'nested', ll_data: { name: 'Cool' }, ll_keys: ['name'], },
          { template: 'template' },
        ]
      },
      ll_keys: ['cards']
    };
    expect(updateCardTemplate(card, { template, nested }, true)).toStrictEqual({
      type: 'template',
      template: 'template',
      cards: [
        {
          type: 'nested',
          template: 'nested',
          ll_v2: true,
          ll_data: { name: 'Cool' },
          ll_keys: ['name'],
          name: 'Cool',
          cards: []
        },
        {
          type: 'template',
          ll_v2: true,
          template: 'template',
          cards: []
        }
      ],
      ll_keys: ['cards'],
      ll_v2: true,
      ll_data: {
        cards: [
          { template: 'nested', ll_data: { name: 'Cool' }, ll_keys: ['name'], },
          { template: 'template' }
        ]
      },
    });
  });

  test('ll_keys supports overriding ll_data from parent', () => {
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
      template: 'template',
      ll_data: {
        name: 'Uncool',
        cards: [
          { template: 'nested', ll_data: { name: 'Cool' } },
          { template: 'template' },
        ]
      },
      ll_keys: ['cards']
    };
    expect(updateCardTemplate(card, { template, nested }, true)).toStrictEqual({
      type: 'template',
      template: 'template',
      cards: [
        {
          type: 'nested',
          template: 'nested',
          ll_v2: true,
          ll_data: { name: 'Uncool' },
          name: 'Uncool',
          cards: []
        },
        {
          type: 'template',
          ll_data: { name: 'Uncool' },
          template: 'template',
          ll_v2: true,
          cards: []
        }
      ],
      ll_keys: ['cards'],
      ll_v2: true,
      ll_data: {
        name: 'Uncool',
        cards: [
          { template: 'nested', ll_data: { name: 'Cool' } },
          { template: 'template' }
        ]
      },
    });
  });

  test('ll_keys supports values to be templatized including nested arrays', () => {
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
        { template: 'info', type: 'test' },
        {
          template: 'modes', type: 'test', ll_data: {
            cards: [
              { template: 'info', type: 'test' },
              { template: 'info', type: 'test' },
            ]
          }, ll_keys: ['cards']
        },
        { template: 'chips', type: 'test' },
      ]
    };
    expect(updateCardTemplate(card, { modes, chips, info }, true)).toStrictEqual({
      type: 'test',
      cards: [
        {
          type: 'custom:vertical-stack-in-card',
          template: 'info',
          ll_v2: true,
          cards: []
        },
        {
          type: 'custom:vertical-stack-in-card',
          card_mod: {
            style: {}
          },
          ll_v2: true,
          template: 'modes',
          ll_data: {
            cards: [
              { template: 'info', type: 'test' },
              { template: 'info', type: 'test' },
            ]
          },
          ll_keys: ['cards'],
          cards: [
            {
              type: 'custom:vertical-stack-in-card',
              ll_v2: true,
              template: 'info',
              cards: []
            },
            {
              type: 'custom:vertical-stack-in-card',
              ll_v2: true,
              template: 'info',
              cards: []
            }
          ]
        },
        {
          type: 'custom:mushroom-chips-card',
          ll_v2: true,
          template: 'chips',
          chips: []
        },
      ],
    });
  });

  test('ll_keys works with template data for now', () => {
    const template: DashboardCard = {
      type: 'template',
      number: 3
    };
    const card: DashboardCard = {
      type: 'test',
      template: 'template',
      template_data: {
        number: 6
      },
      ll_keys: ['number']
    };
    expect(updateCardTemplate(card, { template }, true)).toStrictEqual({
      type: 'template',
      template: 'template',
      ll_v2: true,
      number: 6,
      ll_keys: ['number'],
      ll_data: {
        number: 6
      },
    });
  });

  test('ll_keys does nothing when key is missing from data', () => {
    const template: DashboardCard = {
      type: 'template',
      number: 3
    };
    const card: DashboardCard = {
      type: 'test',
      template: 'template',
      ll_data: {},
      ll_keys: ['number']
    };
    expect(updateCardTemplate(card, { template }, true)).toStrictEqual({
      type: 'template',
      template: 'template',
      ll_v2: true,
      number: 3,
      ll_keys: ['number'],
      ll_data: {},
    });
  });

  test('allows for alphanumeric and underscores in varible names', () => {
    const template: DashboardCard = {
      type: 'template',
      name: '<%= context.cool_123 %> man',
    };
    const card: DashboardCard = {
      type: 'test',
      template: 'template',
      template_data: {
        cool_123: 'yes',
      },
    };
    expect(updateCardTemplate(card, { template }, true)).toStrictEqual({
      type: 'template',
      template: 'template',
      name: 'yes man',
      ll_v2: true,
      ll_data: {
        cool_123: 'yes',
      },
    });
  });
});