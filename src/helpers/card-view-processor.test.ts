import { DashboardCard, DashboardView } from '../types';
import { CardViewProcessor, ViewProcessorConfig } from './card-view-processor';
import { CardTemplateApplicator } from './card-template-applicator';

describe('[class] CardViewProcessor', () => {
  const createView = (cards: DashboardCard[]): DashboardView => ({
    title: 'Test View',
    cards,
  });

  const createApplicator = (templates: Record<string, any>) => {
    return new CardTemplateApplicator(templates as never);
  };

  test('should process view with applicator', () => {
    const applicator = createApplicator({});
    
    const config: ViewProcessorConfig = {
      applicator,
      context: {}
    };
    
    const view = createView([
      { type: 'original' },
      { type: 'another' }
    ]);
    
    const processor = new CardViewProcessor(config);
    const result = processor.processView(view);
    
    expect(result.cards).toHaveLength(2);
    expect(result.title).toBe('Test View');
  });

  test('should handle view with sections', () => {
    const applicator = createApplicator({});
    
    const config: ViewProcessorConfig = {
      applicator,
      context: {}
    };
    
    const sections = [
      { cards: [{ type: 'section-card' }] as DashboardCard[] },
      { cards: [{ type: 'section-card-2' }] as DashboardCard[] }
    ];
    
    const view: DashboardView = {
      title: 'Test',
      sections
    };
    
    const processor = new CardViewProcessor(config);
    const result = processor.processView(view);
    
    expect(result.sections).toBeDefined();
    expect((result as any).sections.length).toBe(2);
  });

  test('should process cards recursively', () => {
    const mockApplicator = {
      apply: jest.fn((card: DashboardCard) => ({ ...card, processed: true }))
    };
    
    const config: ViewProcessorConfig = {
      applicator: mockApplicator as any,
      context: {}
    };
    
    const nestedCard = { type: 'nested', cards: [
      { type: 'child' }
    ]} as DashboardCard;
    
    const view = createView([nestedCard]);
    const processor = new CardViewProcessor(config);
    processor.processView(view);
    
    expect(mockApplicator.apply).toHaveBeenCalledTimes(2); // parent + child
  });

  test('should preserve view title', () => {
    const applicator = createApplicator({});
    
    const config: ViewProcessorConfig = {
      applicator,
      context: {}
    };
    
    const view: DashboardView = {
      title: 'Custom Title',
      cards: []
    };
    
    const processor = new CardViewProcessor(config);
    const result = processor.processView(view);
    
    expect(result.title).toBe('Custom Title');
  });
});
