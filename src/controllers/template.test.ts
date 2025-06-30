import { DashboardCard } from '../types';
import TemplateController from './template';

describe('[class] TemplateController', () => {
  test('sets up as expected', () => {
    const controller = new TemplateController();
    expect(controller).toBeDefined;
  });

  test('adds a new template as expected', () => {
    const controller = new TemplateController();
    const card: DashboardCard = {
      type: 'test',
    };
    expect(controller.addTemplate('test', card)).toBe(true);
  });

  test('adds a new template without overwrite as expected', () => {
    const controller = new TemplateController();
    const card: DashboardCard = {
      type: 'test',
    };
    expect(controller.addTemplate('test', card, false)).toBe(true);
  });

  test('ovewrites a new template as expected', () => {
    const controller = new TemplateController();
    const card: DashboardCard = {
      type: 'test',
    };
    controller.addTemplate('test', card);
    expect(controller.addTemplate('test', { type: 'new' })).toBe(true);
  });

  test('does not ovewrite a new template as expected', () => {
    const controller = new TemplateController();
    const card: DashboardCard = {
      type: 'test',
    };
    controller.addTemplate('test', card);
    expect(controller.addTemplate('test', { type: 'new' }, false)).toBe(false);
  });

  test('renders a template card as expected', async () => {
    const controller = new TemplateController();
    const card: DashboardCard = {
      type: '<%= context.test %>',
    };
    controller.addTemplate('test', card);
    expect(
      await controller.renderAndAddTemplate('new', { type: 'old', ll_template: 'test', ll_context: { test: 'new' } }),
    ).toBe(true);
    expect(controller.templates['new'].type).toEqual('new');
  });

  test('renders a card as expected', async () => {
    const controller = new TemplateController();
    const card: DashboardCard = {
      type: '<%= context.test %>',
    };
    controller.addTemplate('test', card);
    expect((await controller.renderCard({ type: 'old', ll_template: 'test', ll_context: { test: 'new' } })).type).toEqual(
      'new',
    );
  });

  test('renders a card as expected', async () => {
    const controller = new TemplateController();
    const card: DashboardCard = {
      type: '<%= context.test %>',
    };
    controller.addTemplate('test', card);
    expect((await controller.renderCard({ type: 'old' })).type).toEqual('old');
  });

  test('renders a card as expected when lacking templates', async () => {
    const controller = new TemplateController();
    const card: DashboardCard = { type: 'old', ll_template: 'test', ll_context: { test: 'new' } };
    expect(await controller.renderCard(card)).toStrictEqual(card);
  });
});
