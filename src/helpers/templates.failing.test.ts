/**
 * FAILING TESTS – desired behaviour vs current implementation
 *
 * Each test describes what a user would reasonably expect given the project
 * goals and documentation, then asserts that expectation.  All tests in this
 * file currently FAIL.  They are grouped by the root cause so that fixing one
 * issue fixes the whole group.
 *
 * Root causes are referenced by location in src/helpers/templates.ts unless
 * noted otherwise.
 */

import { DashboardCard, DashboardView } from '../types';
import { getTemplatesUsedInCard, getTemplatesUsedInView, updateCardTemplate } from './templates';
import LinkedLovelaceController from '../v2/linkedLovelace';

// ─────────────────────────────────────────────────────────────────────────────
// BUG 1 – Template-source default context silently overrides consumer context
//
// Location: templates.ts line 37
//   dataFromTemplate = {...dataFromTemplate, ...(templateCardData?.ll_context || {})}
//
// The spread order is wrong: the template's own ll_context (defaults) is
// spread AFTER the consumer's ll_context, so it overwrites any value the
// consumer explicitly provided.  The consumer should always win; defaults on
// the source card should only fill in keys the consumer did not supply.
//
// Fix would be:
//   dataFromTemplate = {...(templateCardData?.ll_context || {}), ...dataFromTemplate}
// ─────────────────────────────────────────────────────────────────────────────
describe('[BUG 1] consumer ll_context should take precedence over template-source defaults', () => {
  const template: DashboardCard = {
    type: 'custom:button-card',
    ll_context: { color: 'red', size: 'large' }, // source-card defaults
    name: '<%= context.color %>',
    style: '<%= context.size %>',
  };
  const templates = { btn: template };

  test('consumer value overrides a key that also exists in template defaults', () => {
    const card: DashboardCard = {
      type: 'fake',
      ll_template: 'btn',
      ll_context: { color: 'blue' }, // consumer explicitly provides 'blue'
    };
    const result = updateCardTemplate(card, templates);
    // Expected: consumer wins → 'blue'
    // Actual:   template default wins → 'red'
    expect(result.name).toBe('blue');
  });

  test('consumer overrides one key while template default fills in another — both must be correct simultaneously', () => {
    // This is the real-world use case: consumer supplies some keys, falls back
    // to template defaults for the rest.  BOTH should be satisfied at once.
    const card: DashboardCard = {
      type: 'fake',
      ll_template: 'btn',
      ll_context: { color: 'green' }, // overrides 'color'; 'size' falls back to default
    };
    const result = updateCardTemplate(card, templates);
    // Consumer wins on 'color':
    expect(result.name).toBe('green');   // FAILS today (gets 'red' – template default wins)
    // Template default fills in 'size' because consumer didn't supply it:
    expect(result.style).toBe('large');  // passes today (defaults correctly applied)
  });

  test('consumer overrides all defaults when it provides every key', () => {
    const card: DashboardCard = {
      type: 'fake',
      ll_template: 'btn',
      ll_context: { color: 'purple', size: 'small' },
    };
    const result = updateCardTemplate(card, templates);
    expect(result.name).toBe('purple');
    expect(result.style).toBe('small');
  });

  test('parentContext is also overridden by consumer ll_context, and consumer overrides template default', () => {
    // All three layers in priority order: parentContext < template default < consumer
    const card: DashboardCard = {
      type: 'fake',
      ll_template: 'btn',
      ll_context: { color: 'teal' },
    };
    // parentContext says 'from-parent'; template default says 'red'; consumer says 'teal'
    const result = updateCardTemplate(card, templates, { color: 'from-parent' });
    expect(result.name).toBe('teal'); // consumer wins
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BUG 2 – ll_keys writes to the wrong property (VALUE instead of KEY)
//
// Location: templates.ts line 54
//   data[key] = linkedLovelaceKeyData
//   where `key` is the VALUE of the ll_keys entry, not the KEY (ll_key)
//
// The documented intent (types.ts comment): "A map from a key in the current
// level of the card to a key in the current context data."
// i.e. ll_keys: { templateProperty: 'contextProperty' }
// should set data[templateProperty] = context[contextProperty].
//
// Current behaviour: sets data[contextProperty] = context[contextProperty]
// (the template property is left unchanged; an extra key named after the
// context property is set instead).
//
// Fix would be line 54: data[ll_key] = linkedLovelaceKeyData
// ─────────────────────────────────────────────────────────────────────────────
describe('[BUG 2] ll_keys should map context[VALUE] → data[KEY] when KEY ≠ VALUE', () => {
  test('scalar: ll_keys maps a differently-named context property onto a template property', () => {
    const template: DashboardCard = {
      type: 'custom:mushroom-entity-card',
      entity: 'sensor.placeholder',
      icon: 'mdi:default',
    };
    const card: DashboardCard = {
      type: 'fake',
      ll_template: 'chip',
      ll_context: { myEntity: 'light.kitchen', myIcon: 'mdi:lightbulb' },
      ll_keys: {
        entity: 'myEntity', // KEY='entity'  VALUE='myEntity'
        icon: 'myIcon',     // KEY='icon'    VALUE='myIcon'
      },
    };
    const result = updateCardTemplate(card, { chip: template });

    // Expected: the template properties are overridden from the context aliases
    // Actual:   template.entity and template.icon are unchanged;
    //           result.myEntity and result.myIcon get set (useless extra keys)
    expect(result.entity).toBe('light.kitchen');
    expect(result.icon).toBe('mdi:lightbulb');
    // The aliased keys should NOT appear as extra top-level properties
    expect(result.myEntity).toBeUndefined();
    expect(result.myIcon).toBeUndefined();
  });

  test('scalar: a context property name that is different from the template property it feeds', () => {
    const template: DashboardCard = {
      type: 'tile',
      color: 'grey',
    };
    const card: DashboardCard = {
      type: 'fake',
      ll_template: 'tile-tpl',
      ll_context: { stateColor: 'green' },
      ll_keys: { color: 'stateColor' }, // inject context.stateColor → data.color
    };
    const result = updateCardTemplate(card, { 'tile-tpl': template });
    expect(result.color).toBe('green');
    expect(result.stateColor).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BUG 3 – ll_keys second loop reads context by KEY instead of VALUE
//
// Location: templates.ts line 61
//   if (typeof originalDataFromTemplate[cardKey] === 'object') {
//   where `cardKey` is the KEY of the ll_keys entry.
//
// When KEY ≠ VALUE the second loop checks context[KEY] (which is undefined or
// unrelated) instead of context[VALUE] (where the actual cards array lives).
// This means:
//   ll_keys: { cards: 'myCards' }
// … never renders the objects in ll_context.myCards because the loop looks
// for originalDataFromTemplate['cards'] (undefined) instead of
// originalDataFromTemplate['myCards'].
//
// Fix would be: use the VALUE from ll_keys when looking up the context data,
// e.g. const contextKey = (originalCardData.ll_keys || {})[cardKey]; then
// look up originalDataFromTemplate[contextKey].
// ─────────────────────────────────────────────────────────────────────────────
describe('[BUG 3] ll_keys second loop should read context[VALUE] not context[KEY]', () => {
  test('array of cards in context[VALUE] is rendered when KEY ≠ VALUE', () => {
    const itemTemplate: DashboardCard = {
      type: 'custom:button-card',
      name: '<%= context.label %>',
    };
    const parentTemplate: DashboardCard = {
      type: 'horizontal-stack',
      cards: [], // placeholder – should be replaced by ll_keys injection
    };
    const card: DashboardCard = {
      type: 'fake',
      ll_template: 'row',
      ll_context: {
        // The array lives under 'myCards', NOT under 'cards'
        myCards: [
          { ll_template: 'item', ll_context: { label: 'Alpha' } },
          { ll_template: 'item', ll_context: { label: 'Beta' } },
        ],
      },
      ll_keys: { cards: 'myCards' }, // inject context.myCards → template.cards
    };

    const result = updateCardTemplate(card, { row: parentTemplate, item: itemTemplate });

    // Expected: cards array is populated and each item is rendered
    // Actual:   cards stays empty ([]) because the loop looks at context['cards']
    //           which is undefined
    expect(result.cards).toHaveLength(2);
    expect(result.cards![0].name).toBe('Alpha');
    expect(result.cards![1].name).toBe('Beta');
    // The extra 'myCards' key should not remain on the result
    expect(result.myCards).toBeUndefined();
  });

  test('single object in context[VALUE] is processed when KEY ≠ VALUE', () => {
    // Same issue but for a plain object rather than an array
    const actionTemplate: DashboardCard = {
      type: 'fake',
      action: 'toggle',
      entity: '<%= context.entity %>',
    };
    const parentTemplate: DashboardCard = {
      type: 'button',
      tap_action: { action: 'none' }, // placeholder
    };
    const card: DashboardCard = {
      type: 'fake',
      ll_template: 'btn',
      ll_context: {
        myAction: { ll_template: 'action', ll_context: { entity: 'light.kitchen' } },
      },
      ll_keys: { tap_action: 'myAction' }, // inject context.myAction → template.tap_action
    };

    const result = updateCardTemplate(card, { btn: parentTemplate, action: actionTemplate });

    // Expected: tap_action is replaced by the rendered action template
    // Actual:   tap_action stays { action: 'none' } (context.myAction is never processed)
    expect(result.tap_action.action).toBe('toggle');
    expect(result.tap_action.entity).toBe('light.kitchen');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BUG 4 – getTemplatesUsedInView ignores sections
//
// Location: helpers/templates.ts getTemplatesUsedInView (line 19–25)
//
// The function only iterates view.cards. Since HA 2024.3 dashboards can use
// view.sections[].cards instead. updateCardTemplate already handles sections,
// but getTemplatesUsedInView will return an empty list for views that use the
// sections layout, making dependency analysis wrong.
// ─────────────────────────────────────────────────────────────────────────────
describe('[BUG 4] getTemplatesUsedInView should scan sections', () => {
  test('finds ll_template references inside view.sections[].cards', () => {
    const view: DashboardView = {
      title: 'Home',
      sections: [
        {
          type: 'grid',
          cards: [
            { type: 'fake', ll_template: 'temp-a' },
            { type: 'fake', ll_template: 'temp-b' },
          ],
        },
        {
          type: 'grid',
          cards: [{ type: 'fake', ll_template: 'temp-c' }],
        },
      ],
    };
    const result = getTemplatesUsedInView(view);

    // Expected: all three template keys found
    // Actual:   [] (the function never looks at sections)
    expect(result).toContain('temp-a');
    expect(result).toContain('temp-b');
    expect(result).toContain('temp-c');
  });

  test('works when a view has both cards and sections', () => {
    const view: DashboardView = {
      title: 'Mixed',
      cards: [{ type: 'fake', ll_template: 'from-cards' }],
      sections: [
        { type: 'grid', cards: [{ type: 'fake', ll_template: 'from-sections' }] },
      ],
    };
    const result = getTemplatesUsedInView(view);

    expect(result).toContain('from-cards');
    expect(result).toContain('from-sections'); // currently missed
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BUG 5 – getTemplatesUsedInCard ignores sections and other nested structures
//
// Location: helpers/templates.ts getTemplatesUsedInCard (line 4–17)
//
// The function only recurses into card.cards and card.card.  But
// updateCardTemplate recurses into card.sections, and into ALL object-valued
// properties (chips, tap_action, browser_mod, etc.).  Any ll_template
// reference in those structures is invisible to getTemplatesUsedInCard, making
// dependency tracking incomplete.
// ─────────────────────────────────────────────────────────────────────────────
describe('[BUG 5] getTemplatesUsedInCard should scan all nested structures', () => {
  test('finds ll_template inside card.sections', () => {
    const card: DashboardCard = {
      type: 'grid',
      sections: [
        { type: 'section', cards: [{ type: 'fake', ll_template: 'section-item' }] },
      ],
    };
    const result = getTemplatesUsedInCard(card);

    // Expected: ['section-item']
    // Actual:   []
    expect(result).toContain('section-item');
  });

  test('finds ll_template inside card.chips (Mushroom chips card)', () => {
    const card: DashboardCard = {
      type: 'custom:mushroom-chips-card',
      chips: [
        { type: 'fake', ll_template: 'my-chip' },
        { type: 'custom:mushroom-template-card' }, // plain chip, no template
      ],
    };
    const result = getTemplatesUsedInCard(card);

    // Expected: ['my-chip']
    // Actual:   []
    expect(result).toContain('my-chip');
  });

  test('finds ll_template nested in tap_action (e.g. browser_mod popup content)', () => {
    const card: DashboardCard = {
      type: 'button',
      tap_action: {
        action: 'fire-dom-event',
        browser_mod: {
          service: 'browser_mod.popup',
          data: {
            content: { type: 'fake', ll_template: 'popup-card' },
          },
        },
      },
    };
    const result = getTemplatesUsedInCard(card);

    // Expected: ['popup-card']
    // Actual:   []
    expect(result).toContain('popup-card');
  });

  test('finds ll_template in a deeply-nested custom property', () => {
    const card: DashboardCard = {
      type: 'custom:layout-card',
      layout_options: {
        grid_columns: 4,
      },
      custom_config: {
        inner: { type: 'fake', ll_template: 'deep-template' },
      },
    };
    const result = getTemplatesUsedInCard(card);

    // Expected: ['deep-template']
    // Actual:   []
    expect(result).toContain('deep-template');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BUG 6 – Consumer context does not cascade to nested ll_template cards
//          inside a template body unless explicit Eta pass-through is used
//
// This is the most user-visible limitation and arguably the most important.
//
// When template A's body contains:
//   cards:
//     - ll_template: B          # no ll_context pass-through
//
// Template B is rendered at *registration time* with empty context (whatever
// priority ordering gives). Any Eta variables that depend on the consumer's
// runtime context are evaluated as "undefined" and baked into the stored
// template. When a consumer later calls template A with ll_context, those
// baked-in values are never updated.
//
// Project goal (stated in providing-template-context.md): "Variables cascade
// down through nested templates."  A user reasonably expects that passing
// ll_context to the outer template propagates down to inner templates without
// having to manually wire each variable through every level via Eta syntax in
// every nested ll_context.
// ─────────────────────────────────────────────────────────────────────────────
describe('[BUG 6] consumer context should cascade to nested ll_template cards in a template body', () => {
  function buildController() {
    const c = new LinkedLovelaceController();
    return c;
  }

  test('inner template receives outer consumer context when no explicit pass-through is set', () => {
    const controller = buildController();

    // Inner template: just renders the label from context
    // Outer template: contains the inner one but provides no ll_context wiring
    controller.registerTemplates({
      'inner-btn': {
        type: 'custom:button-card',
        ll_key: 'inner-btn',
        ll_priority: 0,
        name: '<%= context.label %>',
        entity: '<%= context.entity %>',
      },
      'outer-row': {
        type: 'horizontal-stack',
        ll_key: 'outer-row',
        ll_priority: 10,
        cards: [
          {
            type: 'fake',
            ll_template: 'inner-btn',
            // No ll_context – user relies on "cascade" from the outer consumer
          },
        ],
      },
    });

    const consumerCard: DashboardCard = {
      type: 'fake',
      ll_template: 'outer-row',
      ll_context: { label: 'Kitchen Lights', entity: 'light.kitchen' },
    };

    const result = updateCardTemplate(consumerCard, controller.templateController.templates);

    // Expected: inner card inherits consumer context at render-time
    // Actual:   inner card has name:'undefined' entity:'undefined'
    //           because it was baked at registration time with no context
    expect(result.cards![0].name).toBe('Kitchen Lights');
    expect(result.cards![0].entity).toBe('light.kitchen');
  });

  test('three-level cascade: grandparent consumer context reaches grandchild template', () => {
    const controller = buildController();

    controller.registerTemplates({
      leaf: {
        type: 'tile',
        ll_key: 'leaf',
        ll_priority: 0,
        entity: '<%= context.entity %>',
      },
      middle: {
        type: 'vertical-stack',
        ll_key: 'middle',
        ll_priority: 5,
        cards: [{ type: 'fake', ll_template: 'leaf' }],
      },
      root: {
        type: 'grid',
        ll_key: 'root',
        ll_priority: 10,
        cards: [{ type: 'fake', ll_template: 'middle' }],
      },
    });

    const consumer: DashboardCard = {
      type: 'fake',
      ll_template: 'root',
      ll_context: { entity: 'sensor.living_room' },
    };

    const result = updateCardTemplate(consumer, controller.templateController.templates);

    // Navigate: root.cards[0] = middle → middle.cards[0] = leaf
    const middleCard = result.cards![0];
    const leafCard = middleCard.cards![0];

    // Expected: leaf card has entity: 'sensor.living_room'
    // Actual:   entity: 'undefined' (baked at registration time with no context)
    expect(leafCard.entity).toBe('sensor.living_room');
  });

  test('sibling inner templates each receive the same consumer context', () => {
    const controller = buildController();

    controller.registerTemplates({
      chip: {
        type: 'custom:mushroom-chips-card',
        ll_key: 'chip',
        ll_priority: 0,
        entity: '<%= context.entity %>',
      },
      row: {
        type: 'horizontal-stack',
        ll_key: 'row',
        ll_priority: 10,
        cards: [
          { type: 'fake', ll_template: 'chip' },
          { type: 'fake', ll_template: 'chip' },
        ],
      },
    });

    const consumer: DashboardCard = {
      type: 'fake',
      ll_template: 'row',
      ll_context: { entity: 'light.bedroom' },
    };

    const result = updateCardTemplate(consumer, controller.templateController.templates);

    // Expected: both chips have entity: 'light.bedroom'
    // Actual:   both have entity: 'undefined'
    expect(result.cards![0].entity).toBe('light.bedroom');
    expect(result.cards![1].entity).toBe('light.bedroom');
  });

  test('inner template variables baked as "undefined" at registration time remain wrong after render', () => {
    // This test explicitly documents the symptom for developers.
    const controller = buildController();

    controller.registerTemplates({
      'status-chip': {
        type: 'tile',
        ll_key: 'status-chip',
        ll_priority: 0,
        entity: '<%= context.entity %>',
        color: '<%= context.color %>',
      },
      wrapper: {
        type: 'grid',
        ll_key: 'wrapper',
        ll_priority: 10,
        cards: [{ type: 'fake', ll_template: 'status-chip' }],
      },
    });

    // Check what wrapper looks like after registration – the inner card should
    // NOT have "undefined" baked in; it should still have the Eta syntax.
    const registeredWrapper = controller.templateController.templates['wrapper'];

    // Expected: inner card retains Eta syntax so runtime context can fill it in
    // Actual:   inner card has entity:'undefined', color:'undefined' baked in
    expect(registeredWrapper.cards![0].entity).toBe('<%= context.entity %>');
    expect(registeredWrapper.cards![0].color).toBe('<%= context.color %>');
  });
});
