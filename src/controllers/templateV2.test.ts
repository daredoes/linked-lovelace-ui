import { DashboardTemplatesCard } from '../types';
import EtaTemplateController from './templateV2';

describe('[class] TemplateController', () => {
  test('sets up as expected', () => {
    const controller = new EtaTemplateController();
    expect(controller).toBeDefined;
  });

  test('refreshes as expected', () => {
    const controller = new EtaTemplateController();
    controller.templates['test'] = {
      'key': 'test'
    }
    expect(Object.keys(controller.templates)).toHaveLength(1);
    controller.refresh()
    expect(Object.keys(controller.templates)).toHaveLength(0);
  });

  test('loads template as expected', () => {
    const controller = new EtaTemplateController();
    controller.templates['test'] = {
      'key': 'test',
      template: 'hello'
    }
    const res = controller.loadTemplates()
    expect(res).toHaveLength(1);
  });

  test('overrides templates with the same key as expected', () => {
    const controller = new EtaTemplateController();
    controller.templates['test'] = {
      'key': 'test',
      template: 'hello'
    }
    controller.engine.eta.loadTemplate('test', 'goodbye')
    controller.loadTemplates()
    const result = controller.engine.eta.renderString("<%~ include('test') %>", {})
    expect(result).toStrictEqual("hello")
  });

  test('loads template text from card', async () => {
    const controller = new EtaTemplateController();
    const card: DashboardTemplatesCard = {
      type: 'custom:linked-lovelace-templates',
      templates: [
        {
          key: 'test',
          template: 'hello'
        }
      ]
    }
    const res = await controller.addTemplatesFromCard(card)
    expect(res).toStrictEqual({
      'test': {
        key: 'test',
        template: 'hello'
      }
    });
  });

  test('loads template text from url for card', async () => {
    const controller = new EtaTemplateController();
    const card: DashboardTemplatesCard = {
      type: 'custom:linked-lovelace-templates',
      templates: [
        {
          key: 'test',
          url: 'https://pastebin.com/raw/tZ3JKsUv'
        }
      ]
    }
    const res = await controller.addTemplatesFromCard(card)
    expect(res).toStrictEqual({
      'test': {
        key: 'test',
        url: 'https://pastebin.com/raw/tZ3JKsUv',
        template: 'testtest'
      }
    });
  });
  
});
