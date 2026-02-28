import { DashboardCard } from '../types';
import { TemplateEngine } from '../v2/template-engine';
import { CardTemplateApplicator } from './card-template-applicator';

describe('[class] CardTemplateApplicator', () => {
  const createTemplate = (key: string, type: string): DashboardCard => ({
    type,
    ll_key: key,
    ll_priority: 0,
  });

  const createCard = (ll_template: string, context?: any): DashboardCard => ({
    type: 'test-card',
    ll_template,
    ...(context && { ll_context: context }),
  });

  const createApplicator = (templates: Record<string, DashboardCard>) => {
    return new CardTemplateApplicator(templates as Record<string, any>);
  };

  test('should apply template to card with matching ll_template', () => {
    const template = createTemplate('my-template', 'replaced-type');
    const card = createCard('my-template', { source: 'original' });
    
    const applicator = createApplicator({ 'my-template': template });
    const result = applicator.apply(card);
    
    expect(result.type).toBe('replaced-type');
  });

  test('should pass context to template', () => {
    const template = createTemplate('context-test', '<%= context.name %>');
    const card = createCard('context-test', { name: 'John' });
    
    const applicator = createApplicator({ 'context-test': template });
    const result = applicator.apply(card);
    
    expect(result.type).toBe('John');
  });

  test('should use fallback template data if parse fails', () => {
    const invalidTemplate = createTemplate('invalid', { invalid: { json: true } });
    const card = createCard('invalid');
    
    let errorHandlerCallCount = 0;
    const errorCallback = () => {
      errorHandlerCallCount++;
      return card;
    };
    
    const applicator = new CardTemplateApplicator(
      { 'invalid': invalidTemplate } as Record<string, any>,
      errorCallback
    );
    
    const result = applicator.apply(card);
    
    expect(errorHandlerCallCount).toBe(1);
    expect(result).toStrictEqual(card);
  });

  test('should handle missing template gracefully', () => {
    const card = createCard('nonexistent-template');
    const applicator = createApplicator({});
    const result = applicator.apply(card);
    
    expect(result.type).toBe('test-card');
    expect(result.ll_template).toBe('nonexistent-template');
  });

  test('should apply ll_keys context mapping', () => {
    const template = createTemplate('key-mapping', {
      field1: 'template-default'
    });
    
    const card = createCard('key-mapping', {
      source: 'override',
      field1: 'source-value'
    });
    card.ll_keys = { field1: 'source' };
    
    const applicator = createApplicator({ 'key-mapping': template });
    const result = applicator.apply(card);
    
    // The ll_keys mapping should override template default with source value
    expect(result.field1).toBe('source-value');
  });

  test('should clean ll_key from template before rendering', () => {
    const template = createTemplate('test', 'cleaned-type');
    const card = createCard('test');
    
    const applicator = createApplicator({ 'test': template });
    const result = applicator.apply(card);
    
    // Should not have ll_key in result
    expect((result as any).ll_key).toBeUndefined();
  });

  test('should handle complex context with nested objects', () => {
    const template = createTemplate('nested', {
      valueA: '<%= context.complex.value %>',
      valueB: '<%= context.other %>'
    });
    
    const card = createCard('nested', {
      complex: { value: 'computed' },
      other: 'test'
    });
    
    const applicator = createApplicator({ 'nested': template });
    const result = applicator.apply(card);
    
    expect(result.valueA).toBe('computed');
    expect(result.valueB).toBe('test');
  });

  test('should use default error handler if no custom one provided', () => {
    const invalidTemplate = createTemplate('invalid', { invalid: { json: true } });
    const card = createCard('invalid');
    
    const applicator = new CardTemplateApplicator(
      { 'invalid': invalidTemplate } as Record<string, any>
    );
    
    let errorLogCalled = false;
    const originalError = console.error;
    console.error = () => { errorLogCalled = true; };
    
    const result = applicator.apply(card);
    
    console.error = originalError;
    expect(errorLogCalled).toBe(true);
    expect(result).toStrictEqual(card);
  });
});
