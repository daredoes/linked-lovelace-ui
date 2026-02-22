import { updateCardTemplate } from '../src/helpers/templates';
import * as yaml from 'yaml';
import * as fs from 'fs';
import { DashboardCard } from '../src/types';

describe('Integration: Test Cards', () => {
  const templates = {
    my_simple_template: {
      type: 'button',
      name: '<%= context.name %>',
      color: '<%= context.color %>',
    } as DashboardCard,
    parent_template: {
      type: 'vertical-stack',
      cards: [
        {
          type: 'custom:linked-lovelace',
          ll_template: "<%= context.child_template %>",
          ll_context: "<%~ JSON.stringify(context.child_context) %>",
        } as any,
      ],
    } as any,
    child_template: {
      type: 'button',
      name: "<%= context.child_name %>",
    } as DashboardCard,
    mapped_button: {
        type: 'button',
        name: 'Original',
        icon: 'mdi:original'
    } as DashboardCard,
    template_with_partial: {
        type: 'markdown',
        content: "Hello, <%~ include('partial_greeting', {name: context.name}) %>!"
    } as DashboardCard
  };

  test('basic-template should render correctly', () => {
    const cardContent = fs.readFileSync('tests/test-cards/basic-template.yml', 'utf8');
    const card = yaml.parse(cardContent);
    const result = updateCardTemplate(card, templates);
    expect(result.name).toBe('World');
    expect(result.color).toBe('red');
  });

  test('nested-template should render correctly', () => {
    const cardContent = fs.readFileSync('tests/test-cards/nested-template.yml', 'utf8');
    const card = yaml.parse(cardContent);
    const result: any = updateCardTemplate(card, templates);
    
    expect(result.type).toBe('vertical-stack');
    expect(result.cards[0].name).toBe('Child');
  });

  test('ll-keys should map context to top-level properties', () => {
    const cardContent = fs.readFileSync('tests/test-cards/ll-keys.yml', 'utf8');
    const card = yaml.parse(cardContent);
    const result: any = updateCardTemplate(card, templates);
    
    expect(result.name).toBe('Mapped Button');
    expect(result.icon).toBe('mdi:check');
  });

  test('eta-partial should include partial content', async () => {
    const cardContent = fs.readFileSync('tests/test-cards/eta-partial.yml', 'utf8');
    const card = yaml.parse(cardContent);
    
    // Mock the partial in the engine
    const { TemplateEngine } = await import('../src/v2/template-engine');
    TemplateEngine.instance.eta.loadTemplate('partial_greeting', 'Partial Content for <%= it.name %>');

    const result: any = updateCardTemplate(card, templates);
    expect(result.content).toBe('Hello, Partial Content for World!');
  });
});
