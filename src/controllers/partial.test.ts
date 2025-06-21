import { DashboardPartialsCard, LINKED_LOVELACE_PARTIALS } from '../types';
import EtaTemplateController from './partial';

describe('[class] TemplateController', () => {
  test('sets up as expected', () => {
    const controller = new EtaTemplateController();
    expect(controller).toBeDefined;
  });

  test('refreshes as expected', () => {
    const controller = new EtaTemplateController();
    controller.partials['test'] = {
      'key': 'test'
    }
    expect(Object.keys(controller.partials)).toHaveLength(1);
    controller.refresh()
    expect(Object.keys(controller.partials)).toHaveLength(0);
  });

  test('loads template as expected', () => {
    const controller = new EtaTemplateController();
    controller.partials['test'] = {
      'key': 'test',
      template: 'hello'
    }
    const res = controller.loadPartials()
    expect(res).toHaveLength(1);
  });

  test('overrides templates with the same key as expected', () => {
    const controller = new EtaTemplateController();
    controller.partials['test'] = {
      'key': 'test',
      template: 'hello'
    }
    controller.engine.eta.loadTemplate('test', 'goodbye')
    controller.loadPartials()
    const result = controller.engine.eta.renderString("<%~ include('test') %>", {})
    expect(result).toStrictEqual("hello")
  });

  test('loads template text from card', async () => {
    const controller = new EtaTemplateController();
    const card: DashboardPartialsCard = {
      type: `custom:${LINKED_LOVELACE_PARTIALS}`,
      partials: [
        {
          key: 'test',
          template: 'hello'
        }
      ]
    }
    const res = await controller.addPartialsFromCard(card)
    expect(res).toStrictEqual({
      'test': {
        key: 'test',
        template: 'hello'
      }
    });
  });

  test('loads template text from url for card', async () => {
    const controller = new EtaTemplateController();
    const card: DashboardPartialsCard = {
      type: `custom:${LINKED_LOVELACE_PARTIALS}`,
      partials: [
        {
          key: 'test',
          url: 'https://pastebin.com/raw/tZ3JKsUv'
        }
      ]
    }
    const res = await controller.addPartialsFromCard(card)
    expect(res).toStrictEqual({
      'test': {
        key: 'test',
        url: 'https://pastebin.com/raw/tZ3JKsUv',
        template: 'testtest'
      }
    });
  });

});

describe('[class] TemplatePartialController (jinja2)', () => {
  test('loads Jinja2 macro with custom args', async () => {
    const controller = new (require('./partial').default)();
    const res = await controller.addPartialsFromCard({
      type: 'custom:linked-lovelace-partials',
      partials: [
        { key: 'greet', args: ['name'], template: 'Hello {{ name }}!', ll_template_engine: 'jinja2' }
      ]
    });
    expect(res).toStrictEqual({
      'greet': {
        key: 'greet',
        args: ['name'],
        template: 'Hello {{ name }}!',
        ll_template_engine: 'jinja2'
      }
    });
  });

  test('loads a Jinja2 macro with no args', async () => {
    const controller = new (require('./partial').default)();
    const res = await controller.addPartialsFromCard({
      type: 'custom:linked-lovelace-partials',
      partials: [
        { key: 'noArgs', template: 'No args here', ll_template_engine: 'jinja2' }
      ]
    });
    expect(res).toStrictEqual({
      'noArgs': {
        key: 'noArgs',
        template: 'No args here',
        ll_template_engine: 'jinja2'
      }
    });
  });

  test('loads a macro for a table row and can be used in a loop', async () => {
    const controller = new (require('./partial').default)();
    const res = await controller.addPartialsFromCard({
      type: 'custom:linked-lovelace-partials',
      partials: [
        { key: 'entityRow', args: ['entity_id'], template: '<tr><td>{{ entity_id }}</td></tr>', ll_template_engine: 'jinja2' }
      ]
    });
    expect(res).toStrictEqual({
      'entityRow': {
        key: 'entityRow',
        args: ['entity_id'],
        template: '<tr><td>{{ entity_id }}</td></tr>',
        ll_template_engine: 'jinja2'
      }
    });
  });
});
