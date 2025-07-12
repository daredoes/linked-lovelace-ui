import { TemplateEngine } from './template-engine';
import type { DashboardCard } from '../types/DashboardCard';
import { defaultLinkedLovelaceUpdatableConstants, LINKED_LOVELACE_PARTIALS } from '../constants';
import type { LinkedLovelacePartial } from '../types/LinkedLovelacePartial';
import type { DashboardPartialsCard } from '../types/DashboardPartialsCard'
import type { DashboardView } from '../types/DashboardView'
import { DashboardHolderCard } from '../types/DashboardHolderCard';

const defaultTemplateCard: DashboardCard = {
    type: "card",
    [defaultLinkedLovelaceUpdatableConstants.isTemplateKey]: 'test',
    content: 'Hello, <%= name %>!',
}

const defaultPartial: LinkedLovelacePartial = {
    template: 'My Partial',
    key: "my_partial",
}

const defaultPartialCard: DashboardPartialsCard = {
    type: `custom:${LINKED_LOVELACE_PARTIALS}`,
    partials: [defaultPartial]
}

const view: DashboardView = {
    type: "view",
    cards: [defaultPartialCard, defaultTemplateCard],
    title: 'Test View'
}

describe('TemplateEngine', () => {
  let engine: TemplateEngine;

  beforeEach(() => {
    // Reset the singleton instance before each test
    TemplateEngine.self = undefined;
    engine = TemplateEngine.instance;
  });

  it('should be a singleton', () => {
    const instance1 = TemplateEngine.instance;
    const instance2 = TemplateEngine.instance;
    expect(instance1).toBe(instance2);
  });

  it('should reset the engine', () => {
    engine.templates['test'] = defaultTemplateCard
    engine.partials['test'] = { template: 'test' };
    engine.reset();
    expect(engine.templates).toEqual({});
    expect(engine.partials).toEqual({});
  });

  describe('Templates', () => {
    it('should register and return a defined value', () => {
      const render = engine.registerTemplate(defaultTemplateCard)
      expect(render).toBeDefined();
    });

    it('should register and return a template as expected', () => {
        const render = engine.registerTemplate(defaultTemplateCard)
        expect(render).toStrictEqual(defaultTemplateCard);
      });

      it('should respect priority', () => {
        const template1 = {...defaultTemplateCard, ll_priority: 2};
        const template2 = {...defaultTemplateCard, ll_priority: 1};
        const loadedKeys = engine.loadTemplates({ template1, template2 });
        expect(loadedKeys).toHaveLength(2);
        expect(loadedKeys[0]).toBe('template2');
        expect(loadedKeys[1]).toBe('template1');
      });
  });

  describe('Partials', () => {
    it('should register a partial and return a defined value', () => {
      const render = engine.registerPartial('my_partial', defaultPartial);
      expect(render).toBeDefined();
    });


    it('should respect priority', () => {
        const partial1 = { template: 'Partial 1', ll_priority: 2 };
        const partial2 = { template: 'Partial 2', ll_priority: 1 };
        const loadedKeys = engine.loadPartials({ partial1, partial2 });
        expect(loadedKeys).toHaveLength(2);
        expect(loadedKeys[0]).toBe('partial2');
        expect(loadedKeys[1]).toBe('partial1');
      });
  });

  describe('Templates and Partials', () => {
    it('should register a template using a partial without rendering it and return a defined value', () => {
      const render = engine.registerPartial('my_partial', defaultPartial);
      expect(render).toBeDefined();
      const partialTemplateCard: DashboardCard = {
        type: "card",
        [defaultLinkedLovelaceUpdatableConstants.isTemplateKey]: 'test',
        content: "<%~ include('@my_partial') %>",
    }
      const template = engine.registerTemplate(partialTemplateCard);
      expect(template).toBeDefined();
      expect(template?.content).toStrictEqual("<%~ include('@my_partial') %>");
    });

    it('should not throw an error when using single quotes on an includes', () => {
        const render = engine.registerPartial('my_partial', defaultPartial);
        expect(render).toBeDefined();
        const partialTemplateCard: DashboardCard = {
          type: "card",
          [defaultLinkedLovelaceUpdatableConstants.isTemplateKey]: 'test',
          content: "<%~ include('@my_partial') %>",
      }
        engine.registerTemplate(partialTemplateCard);
        const rendered = engine.renderTemplate('test', {});
        delete partialTemplateCard[defaultLinkedLovelaceUpdatableConstants.isTemplateKey];
        partialTemplateCard[defaultLinkedLovelaceUpdatableConstants.useTemplateKey] = 'test';
        expect(rendered).toStrictEqual({...partialTemplateCard, content: "My Partial"})
      });

      it('should throw an error when using double quotes on an includes', () => {
        const render = engine.registerPartial('my_partial', defaultPartial);
        expect(render).toBeDefined();
        const partialTemplateCard: DashboardCard = {
          type: "card",
          [defaultLinkedLovelaceUpdatableConstants.isTemplateKey]: 'test',
          content: "<%~ include(\"@my_partial\") %>",
      }
        engine.registerTemplate(partialTemplateCard);
        const rendered = engine.renderTemplate('test', {});
        expect(rendered).toBeUndefined()
      });

      it('should load partials and templates from a view', async () => {
        const loaded = await engine.addPartialsAndTemplatesFromView(view);
        expect(loaded.templates).toStrictEqual({test: defaultTemplateCard});
        expect(loaded.partials).toStrictEqual({my_partial: defaultPartial});
      });
  });
  
  describe('Complex', () => {
    // the following scenario represents a complex nested card setup used for creating a mini menu dynamically
    const modeButtonKey = "mode_button"
    const modeRowKey = "mode_row"
    const modeRowContextKey = "mode_row_context"

    const modeButtonCard: DashboardHolderCard = {
      type: "custom",
      ll_key: modeButtonKey,
      button: "<%= context.name %>"
    }

    const modeButtonA: DashboardHolderCard = {
      type: "custom",
      ll_template: modeButtonKey,
      ll_context: {
        name: "Mode Button A"
      },
      button: "Mode Button A"
    }

    const modeButtonB: DashboardHolderCard = {
      type: "custom",
      ll_template: modeButtonKey,
      ll_context: {
        name: "Mode Button B"
      },
      button: "Mode Button B"
    }

    const modeRowTemplate: DashboardHolderCard = {
      type: "row",
      ll_key: modeRowKey,
      cards: [modeButtonA, modeButtonB]
    }

    const modeRowContextTemplate: DashboardHolderCard = {
      type: "row_context",
      ll_key: modeRowContextKey,
      cards: [
        {
          type: "custom",
          ll_template: modeButtonKey,
          ll_context: {
            name: "<%= context.name_a %>"
          },
        },
        {
          type: "custom",
          ll_template: modeButtonKey,
          ll_context: {
            name: "<%= context.name_b %>"
          },
        }
      ]
    }

    const modeRowContextCard: DashboardHolderCard = {
      type: "row_context",
      ll_template: modeRowContextKey,
      ll_context: {
        name_a: "Mode Button A",
        name_b: "Mode Button B"
      },
      cards: [
        {
          type: "custom",
          ll_template: modeButtonKey,
          ll_context: {
            name: "Mode Button A",
            name_a: "Mode Button A",
            name_b: "Mode Button B"
          },
          button: "Mode Button A"
        },
        {
          type: "custom",
          ll_template: modeButtonKey,
          ll_context: {
            name: "Mode Button B",
            name_a: "Mode Button A",
            name_b: "Mode Button B"
          },
          button: "Mode Button B"
        }
      ]
    }



    const modeRowCard: DashboardHolderCard = {
      type: "row",
      ll_template: modeRowKey,
      cards: [modeButtonA, modeButtonB]
    }

    const modeView: DashboardView = {
      type: "view",
      cards: [modeButtonCard, modeRowTemplate, modeRowContextTemplate],
      title: 'Test View'
    }


    it('should render a complex view', async () => {
      const loaded = await engine.addPartialsAndTemplatesFromView(modeView);
      expect(loaded.templates).toStrictEqual({[modeRowKey]: modeRowTemplate, [modeButtonKey]: modeButtonCard, [modeRowContextKey]: modeRowContextTemplate});
      expect(loaded.partials).toStrictEqual({});

      const renderedTemplate = engine.renderTemplate(modeRowKey, {});
      expect(renderedTemplate).toStrictEqual(modeRowCard);

      const renderedContextTemplate = engine.renderTemplate(modeRowContextKey, {
        name_a: "Mode Button A",
        name_b: "Mode Button B"
      });
      expect(renderedContextTemplate).toStrictEqual(modeRowContextCard);
    });
  });
});
