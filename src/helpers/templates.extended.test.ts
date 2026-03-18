/**
 * Extended tests for updateCardTemplate and related helpers.
 *
 * These tests focus on:
 *  - Consistent, deterministic output (regression suite)
 *  - All documented ll_* feature flags
 *  - Context inheritance through the parentContext parameter
 *  - Sections support (HA 2024.3+ layout)
 *  - Edge-cases that have caused real bugs (see PR #37, #41)
 */

import { DashboardCard, DashboardView } from '../types';
import { updateCardTemplate } from './templates';

// ---------------------------------------------------------------------------
// Context variable substitution
// ---------------------------------------------------------------------------
describe('[updateCardTemplate] context variable substitution', () => {
  const template: DashboardCard = {
    type: 'custom:button-card',
    name: '<%= context.label %>',
    icon: '<%= context.icon %>',
  };
  const templates = { 'my-button': template };

  test('renders a single string variable', () => {
    const card: DashboardCard = {
      type: 'custom:linked-lovelace-template',
      ll_template: 'my-button',
      ll_context: { label: 'Lights', icon: 'mdi:lightbulb' },
    };
    const result = updateCardTemplate(card, templates);
    expect(result.name).toBe('Lights');
    expect(result.icon).toBe('mdi:lightbulb');
  });

  test('renders numeric context values as strings in text fields', () => {
    const t: DashboardCard = {
      type: 'test',
      title: 'Count: <%= context.count %>',
    };
    const card: DashboardCard = {
      type: 'custom:linked-lovelace-template',
      ll_template: 'num-tpl',
      ll_context: { count: 42 },
    };
    const result = updateCardTemplate(card, { 'num-tpl': t });
    expect(result.title).toBe('Count: 42');
  });

  test('renders boolean context values as string "true"/"false"', () => {
    const t: DashboardCard = {
      type: 'test',
      active: '<%= context.on %>',
    };
    const card: DashboardCard = {
      type: 'custom:linked-lovelace-template',
      ll_template: 'bool-tpl',
      ll_context: { on: true },
    };
    const result = updateCardTemplate(card, { 'bool-tpl': t });
    expect(result.active).toBe('true');
  });

  test('missing context variable renders as the string "undefined"', () => {
    // Eta (with autoEscape=false) renders undefined values as "undefined"
    const t: DashboardCard = {
      type: 'test',
      name: '<%= context.missing %>',
    };
    const card: DashboardCard = {
      type: 'custom:linked-lovelace-template',
      ll_template: 'miss-tpl',
      ll_context: {},
    };
    const result = updateCardTemplate(card, { 'miss-tpl': t });
    expect(result.name).toBe('undefined');
  });

  test('conditional rendering with if/else', () => {
    const t: DashboardCard = {
      type: 'test',
      icon: '<% if (context.active) { %>mdi:power<% } else { %>mdi:power-off<% } %>',
    };
    const cardOn: DashboardCard = {
      type: 'custom:linked-lovelace-template',
      ll_template: 'cond-tpl',
      ll_context: { active: true },
    };
    const cardOff: DashboardCard = {
      type: 'custom:linked-lovelace-template',
      ll_template: 'cond-tpl',
      ll_context: { active: false },
    };
    expect(updateCardTemplate(cardOn, { 'cond-tpl': t }).icon).toBe('mdi:power');
    expect(updateCardTemplate(cardOff, { 'cond-tpl': t }).icon).toBe('mdi:power-off');
  });
});

// ---------------------------------------------------------------------------
// ll_template key is preserved in output
// ---------------------------------------------------------------------------
describe('[updateCardTemplate] ll_template is always preserved in output', () => {
  test('ll_template key stays after simple render', () => {
    const template: DashboardCard = { type: 'button' };
    const card: DashboardCard = { type: 'fake', ll_template: 'btn' };
    const result = updateCardTemplate(card, { btn: template });
    expect(result.ll_template).toBe('btn');
  });

  test('ll_template key stays after context render', () => {
    const template: DashboardCard = { type: 'button', name: '<%= context.n %>' };
    const card: DashboardCard = {
      type: 'fake',
      ll_template: 'btn',
      ll_context: { n: 'Hello' },
    };
    const result = updateCardTemplate(card, { btn: template });
    expect(result.ll_template).toBe('btn');
    expect(result.name).toBe('Hello');
  });
});

// ---------------------------------------------------------------------------
// ll_context inheritance via the parentContext parameter
// Context flows to children when a NON-template card contains child cards.
// ---------------------------------------------------------------------------
describe('[updateCardTemplate] ll_context inheritance via parentContext', () => {
  test('parent context is passed down to child template cards', () => {
    const childTemplate: DashboardCard = {
      type: 'child',
      name: '<%= context.shared %>',
    };
    // Outer card is NOT a template – it goes through the else-branch which
    // iterates child cards with the accumulated parentContext.
    const outerCard: DashboardCard = {
      type: 'grid',
      ll_context: { shared: 'from-parent' },
      cards: [
        {
          type: 'fake',
          ll_template: 'child-tpl',
        },
      ],
    };
    const templates = { 'child-tpl': childTemplate };
    // parentContext starts empty; ll_context on the outer non-template card
    // becomes the parentContext for its children via the dataFromTemplate spread.
    // NOTE: ll_context on a non-template card merges into parentContext for children.
    const result = updateCardTemplate(outerCard, templates, { shared: 'from-parent' });
    expect(result.cards![0].name).toBe('from-parent');
  });

  test('child ll_context takes precedence over parent context for same key', () => {
    const childTemplate: DashboardCard = {
      type: 'child',
      name: '<%= context.val %>',
    };
    const card: DashboardCard = {
      type: 'grid',
      cards: [
        {
          type: 'fake',
          ll_template: 'child-tpl',
          ll_context: { val: 'child-wins' },
        },
      ],
    };
    const result = updateCardTemplate(card, { 'child-tpl': childTemplate }, { val: 'parent' });
    expect(result.cards![0].name).toBe('child-wins');
  });

  test('parentContext argument is used when card has no ll_context', () => {
    const template: DashboardCard = { type: 'tile', label: '<%= context.inherited %>' };
    const card: DashboardCard = {
      type: 'fake',
      ll_template: 'tile-tpl',
      // no ll_context
    };
    const result = updateCardTemplate(card, { 'tile-tpl': template }, { inherited: 'yes' });
    expect(result.label).toBe('yes');
  });
});

// ---------------------------------------------------------------------------
// ll_context is NOT leaked into the template definition (bug #41)
// ---------------------------------------------------------------------------
describe('[updateCardTemplate] ll_context is not leaked into template registry', () => {
  test('rendering a card does not mutate the stored template object', () => {
    const template: DashboardCard = {
      type: 'button',
      name: '<%= context.label %>',
    };
    const originalTemplate = JSON.parse(JSON.stringify(template));
    const templates = { btn: template };

    const card: DashboardCard = {
      type: 'fake',
      ll_template: 'btn',
      ll_context: { label: 'Test' },
    };
    updateCardTemplate(card, templates);

    // The object in the registry must remain unchanged
    expect(templates.btn).toStrictEqual(originalTemplate);
    expect(templates.btn.ll_context).toBeUndefined();
  });

  test('rendering the same template twice with different contexts gives independent results', () => {
    const template: DashboardCard = { type: 'label', text: '<%= context.msg %>' };
    const templates = { lbl: template };

    const r1 = updateCardTemplate(
      { type: 'fake', ll_template: 'lbl', ll_context: { msg: 'Hello' } },
      templates
    );
    const r2 = updateCardTemplate(
      { type: 'fake', ll_template: 'lbl', ll_context: { msg: 'World' } },
      templates
    );

    expect(r1.text).toBe('Hello');
    expect(r2.text).toBe('World');
  });
});

// ---------------------------------------------------------------------------
// Sections support (Home Assistant 2024.3+ dashboard layout)
// ---------------------------------------------------------------------------
describe('[updateCardTemplate] sections support', () => {
  test('renders templates inside a sections array', () => {
    const template: DashboardCard = { type: 'tile', entity: '<%= context.entity %>' };
    const card: DashboardCard = {
      type: 'grid',
      sections: [
        {
          type: 'section',
          cards: [
            {
              type: 'fake',
              ll_template: 'tile-tpl',
              ll_context: { entity: 'light.kitchen' },
            },
          ],
        },
      ],
    };
    const result = updateCardTemplate(card, { 'tile-tpl': template });
    expect(result.sections![0].cards![0].entity).toBe('light.kitchen');
    expect(result.sections![0].cards![0].type).toBe('tile');
  });

  test('multiple cards in multiple sections are all rendered', () => {
    const t: DashboardCard = { type: 'tile', entity: '<%= context.entity %>' };
    const card: DashboardCard = {
      type: 'grid',
      sections: [
        {
          type: 'section',
          cards: [
            { type: 'fake', ll_template: 'tile-tpl', ll_context: { entity: 'light.a' } },
            { type: 'fake', ll_template: 'tile-tpl', ll_context: { entity: 'light.b' } },
          ],
        },
        {
          type: 'section',
          cards: [
            { type: 'fake', ll_template: 'tile-tpl', ll_context: { entity: 'sensor.c' } },
          ],
        },
      ],
    };
    const result = updateCardTemplate(card, { 'tile-tpl': t });
    expect(result.sections![0].cards![0].entity).toBe('light.a');
    expect(result.sections![0].cards![1].entity).toBe('light.b');
    expect(result.sections![1].cards![0].entity).toBe('sensor.c');
  });

  test('sections without cards are left unchanged', () => {
    const card: DashboardCard = {
      type: 'grid',
      sections: [{ type: 'section' }],
    };
    const result = updateCardTemplate(card, {});
    expect(result.sections).toStrictEqual([{ type: 'section' }]);
  });
});

// ---------------------------------------------------------------------------
// ll_keys – inject context values (including rendered template arrays) into
// template properties. KEY = template property to override, VALUE = context
// property to read (and render if it contains template cards).
// ---------------------------------------------------------------------------
describe('[updateCardTemplate] ll_keys', () => {
  test('ll_keys where key equals value overrides a scalar property', () => {
    // When ll_keys: { number: 'number' }, sets data.number = context.number
    const template: DashboardCard = { type: 'entity', number: 3 };
    const card: DashboardCard = {
      type: 'fake',
      ll_template: 'ent-tpl',
      ll_context: { number: 99 },
      ll_keys: { number: 'number' },
    };
    const result = updateCardTemplate(card, { 'ent-tpl': template });
    expect(result.number).toBe(99);
  });

  test('ll_keys is preserved in the output', () => {
    const template: DashboardCard = { type: 'entity' };
    const card: DashboardCard = {
      type: 'fake',
      ll_template: 'ent-tpl',
      ll_context: {},
      ll_keys: { foo: 'foo' },
    };
    const result = updateCardTemplate(card, { 'ent-tpl': template });
    expect(result.ll_keys).toStrictEqual({ foo: 'foo' });
  });

  test('ll_keys with array of template cards renders each card in the array', () => {
    const childTemplate: DashboardCard = { type: 'child', name: '<%= context.n %>' };
    const parentTemplate: DashboardCard = { type: 'parent', cards: [] };
    const card: DashboardCard = {
      type: 'fake',
      ll_template: 'parent-tpl',
      ll_context: {
        cards: [{ ll_template: 'child-tpl', ll_context: { n: 'Alpha' } }],
      },
      ll_keys: { cards: 'cards' },
    };
    const result = updateCardTemplate(card, {
      'parent-tpl': parentTemplate,
      'child-tpl': childTemplate,
    });
    expect(result.cards).toHaveLength(1);
    expect(result.cards![0].type).toBe('child');
    expect(result.cards![0].name).toBe('Alpha');
  });

  test('ll_keys with multiple array items each render independently', () => {
    const itemTemplate: DashboardCard = { type: 'item', label: '<%= context.label %>' };
    const parentTemplate: DashboardCard = { type: 'list', cards: [] };
    const card: DashboardCard = {
      type: 'fake',
      ll_template: 'list-tpl',
      ll_context: {
        cards: [
          { ll_template: 'item-tpl', ll_context: { label: 'First' } },
          { ll_template: 'item-tpl', ll_context: { label: 'Second' } },
          { ll_template: 'item-tpl', ll_context: { label: 'Third' } },
        ],
      },
      ll_keys: { cards: 'cards' },
    };
    const result = updateCardTemplate(card, {
      'list-tpl': parentTemplate,
      'item-tpl': itemTemplate,
    });
    expect(result.cards).toHaveLength(3);
    expect(result.cards![0].label).toBe('First');
    expect(result.cards![1].label).toBe('Second');
    expect(result.cards![2].label).toBe('Third');
  });
});

// ---------------------------------------------------------------------------
// Non-ll cards – passthrough and recursive traversal
// ---------------------------------------------------------------------------
describe('[updateCardTemplate] non-ll card passthrough and recursive traversal', () => {
  test('plain card without ll_ keys is returned unchanged', () => {
    const card: DashboardCard = {
      type: 'button',
      name: 'Hello',
      tap_action: { action: 'toggle' },
    };
    expect(updateCardTemplate(card, {})).toStrictEqual(card);
  });

  test('nested objects are traversed recursively when no ll_template present', () => {
    const template: DashboardCard = { type: 'tile', entity: 'sensor.x' };
    const card: DashboardCard = {
      type: 'container',
      custom_config: {
        content: {
          type: 'fake',
          ll_template: 'tile-tpl',
        },
      },
    };
    const result = updateCardTemplate(card, { 'tile-tpl': template });
    expect(result.custom_config.content.type).toBe('tile');
    expect(result.custom_config.content.entity).toBe('sensor.x');
  });

  test('deeply nested tap_action with ll_template is resolved', () => {
    const popup: DashboardCard = { type: 'popup-content', title: '<%= context.ttl %>' };
    const card: DashboardCard = {
      type: 'button',
      tap_action: {
        action: 'fire-dom-event',
        browser_mod: {
          service: 'browser_mod.popup',
          data: {
            content: {
              type: 'fake',
              ll_template: 'popup-tpl',
              ll_context: { ttl: 'My Popup' },
            },
          },
        },
      },
    };
    const result = updateCardTemplate(card, { 'popup-tpl': popup });
    const content = result.tap_action.browser_mod.data.content;
    expect(content.type).toBe('popup-content');
    expect(content.title).toBe('My Popup');
  });

  test('card with ll_template that does not exist is returned unchanged', () => {
    const card: DashboardCard = {
      type: 'test',
      ll_template: 'does-not-exist',
    };
    expect(updateCardTemplate(card, {})).toStrictEqual(card);
  });

  test('array values that are not objects are not mutated', () => {
    const card: DashboardCard = {
      type: 'custom:layout-card',
      gridcols: [1, 2, 3],
    };
    const result = updateCardTemplate(card, {});
    expect(result.gridcols).toStrictEqual([1, 2, 3]);
  });
});

// ---------------------------------------------------------------------------
// Priority ordering in LinkedLovelaceController
// ---------------------------------------------------------------------------
describe('[LinkedLovelaceController] template priority ordering', () => {
  test('lower ll_priority templates are registered before higher ones', async () => {
    const LinkedLovelaceController = (await import('../v2/linkedLovelace')).default;
    const controller = new LinkedLovelaceController();
    // Register in arbitrary order; 'high' should be processed last
    // so it sees 'low' already in the registry.
    controller.registerTemplates({
      high: {
        type: 'high',
        ll_priority: 10,
        cards: [{ type: 'fake', ll_template: 'low' }],
      },
      low: {
        type: 'low',
        ll_priority: 0,
      },
    });
    // 'high' template's child card should have been rendered as 'low'
    const highTemplate = controller.templateController.templates['high'];
    expect(highTemplate.cards![0].type).toBe('low');
  });

  test('templates with equal priority preserve registration order', async () => {
    const LinkedLovelaceController = (await import('../v2/linkedLovelace')).default;
    const controller = new LinkedLovelaceController();
    controller.registerTemplates({
      a: { type: 'a', ll_priority: 5 },
      b: { type: 'b', ll_priority: 5 },
    });
    expect(controller.templateController.templates['a'].type).toBe('a');
    expect(controller.templateController.templates['b'].type).toBe('b');
  });
});

// ---------------------------------------------------------------------------
// Deterministic / snapshot-style output – regression suite
// These lock in exact expected output so regressions surface immediately.
// ---------------------------------------------------------------------------
describe('[updateCardTemplate] deterministic output – regression suite', () => {
  const BUTTON_TEMPLATE: DashboardCard = {
    type: 'custom:button-card',
    entity: '<%= context.entity %>',
    name: '<%= context.name %>',
    icon: '<%= context.icon %>',
    tap_action: { action: 'toggle' },
  };

  test('button template renders deterministically', () => {
    const card: DashboardCard = {
      type: 'fake',
      ll_template: 'btn',
      ll_context: {
        entity: 'light.living_room',
        name: 'Living Room',
        icon: 'mdi:sofa',
      },
    };
    const result = updateCardTemplate(card, { btn: BUTTON_TEMPLATE });
    expect(result).toStrictEqual({
      type: 'custom:button-card',
      ll_template: 'btn',
      ll_context: { entity: 'light.living_room', name: 'Living Room', icon: 'mdi:sofa' },
      entity: 'light.living_room',
      name: 'Living Room',
      icon: 'mdi:sofa',
      tap_action: { action: 'toggle' },
    });
  });

  test('two renders with identical input produce identical output', () => {
    const card: DashboardCard = {
      type: 'fake',
      ll_template: 'btn',
      ll_context: { entity: 'sensor.temp', name: 'Temp', icon: 'mdi:thermometer' },
    };
    const r1 = updateCardTemplate(card, { btn: BUTTON_TEMPLATE });
    const r2 = updateCardTemplate(card, { btn: BUTTON_TEMPLATE });
    expect(r1).toStrictEqual(r2);
  });

  test('different contexts produce different outputs', () => {
    const card1: DashboardCard = {
      type: 'fake',
      ll_template: 'btn',
      ll_context: { entity: 'light.a', name: 'A', icon: 'mdi:a' },
    };
    const card2: DashboardCard = {
      type: 'fake',
      ll_template: 'btn',
      ll_context: { entity: 'light.b', name: 'B', icon: 'mdi:b' },
    };
    const r1 = updateCardTemplate(card1, { btn: BUTTON_TEMPLATE });
    const r2 = updateCardTemplate(card2, { btn: BUTTON_TEMPLATE });
    expect(r1.name).toBe('A');
    expect(r2.name).toBe('B');
    expect(r1).not.toStrictEqual(r2);
  });

  test('template with no context variables renders without substitution', () => {
    const staticTemplate: DashboardCard = {
      type: 'weather-forecast',
      entity: 'weather.home',
      forecast_type: 'daily',
    };
    const card: DashboardCard = {
      type: 'fake',
      ll_template: 'weather',
    };
    const result = updateCardTemplate(card, { weather: staticTemplate });
    expect(result.type).toBe('weather-forecast');
    expect(result.entity).toBe('weather.home');
    expect(result.forecast_type).toBe('daily');
    expect(result.ll_template).toBe('weather');
  });

  test('view with mix of template and plain cards renders correctly', () => {
    const btnTemplate: DashboardCard = { type: 'button', name: '<%= context.n %>' };
    const view: DashboardView = {
      title: 'Living Room',
      cards: [
        { type: 'markdown', content: '# Hello' },
        { type: 'fake', ll_template: 'btn', ll_context: { n: 'Toggle' } },
        { type: 'weather-forecast', entity: 'weather.home' },
      ],
    };
    // Simulate rendering a view by updating each card
    const rendered = view.cards!.map((c) =>
      updateCardTemplate(c, { btn: btnTemplate })
    );
    expect(rendered[0].type).toBe('markdown');
    expect(rendered[1].type).toBe('button');
    expect(rendered[1].name).toBe('Toggle');
    expect(rendered[2].type).toBe('weather-forecast');
  });
});

// ---------------------------------------------------------------------------
// TemplateEngine singleton consistency
// ---------------------------------------------------------------------------
describe('[TemplateEngine] singleton', () => {
  test('TemplateEngine.instance always returns the same object', async () => {
    const { TemplateEngine } = await import('../v2/template-engine');
    const a = TemplateEngine.instance;
    const b = TemplateEngine.instance;
    expect(a).toBe(b);
  });

  test('refresh() replaces the eta engine with a fresh instance', async () => {
    const { TemplateEngine } = await import('../v2/template-engine');
    const engine = new TemplateEngine();
    const originalEta = engine.eta;
    engine.refresh();
    expect(engine.eta).not.toBe(originalEta);
  });
});
