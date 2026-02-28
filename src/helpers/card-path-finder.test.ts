import { DashboardCard, DashboardView } from '../types';
import { extractCardPaths, extractCardsFromView, CardPath } from './card-path-finder';

describe('[helper] extractCardPaths', () => {
  const createCard = (type: string, ll_template?: string, nested?: DashboardCard): DashboardCard => ({
    type,
    ...(ll_template ? { ll_template, ll_context: { source: type } } : {}),
    ...(nested ? { cards: [nested] } : {}),
    ...(nested && !Array.isArray(nested) ? { card: nested } : {}),
  });

  test('should find template in simple card', () => {
    const card = createCard('my-card', 'template-key');
    const paths = extractCardPaths(card);
    
    expect(paths).toHaveLength(1);
    expect(paths[0].card.ll_template).toBe('template-key');
  });

  test('should find template in nested card array', () => {
    const card = createCard('parent', 'template-1');
    const child = createCard('child', 'template-2');
    card.cards = [child, card];
    
    const paths = extractCardPaths(card);
    
    expect(paths).toHaveLength(2);
    expect(paths.map(p => p.ll_template)).toContain('template-1');
    expect(paths.map(p => p.ll_template)).toContain('template-2');
  });

  test('should find template in nested card object', () => {
    const card = createCard('parent', 'template-1');
    const child = createCard('child', 'template-2');
    card.card = child;
    
    const paths = extractCardPaths(card);
    
    expect(paths).toHaveLength(2);
    expect(paths.map(p => p.ll_template)).toContain('template-1');
    expect(paths.map(p => p.ll_template)).toContain('template-2');
  });

  test('should return path even for card without template', () => {
    const card: DashboardCard = { type: 'simple-card' };
    const paths = extractCardPaths(card);
    
    expect(paths).toHaveLength(1);
    expect(paths[0].card.type).toBe('simple-card');
  });

  test('should handle deeply nested templates', () => {
    const level1 = createCard('level1', 'template-1');
    const level2 = createCard('level2', 'template-2');
    const level3 = createCard('level3', 'template-3');
    const level4 = createCard('level4');
    
    level3.card = level4;
    level2.card = level3;
    level1.card = level2;
    
    const paths = extractCardPaths(level1);
    
    expect(paths).toHaveLength(4);
    expect(paths.map(p => p.ll_template)).toContain('template-1');
    expect(paths.map(p => p.ll_template)).toContain('template-2');
    expect(paths.map(p => p.ll_template)).toContain('template-3');
  });

  test('should handle sections format', () => {
    const card = createCard('test', 'template');
    const section = {
      cards: [card],
      ll_template: 'section-template'
    } as any;
    card.sections = [section];
    
    const paths = extractCardPaths(card);
    
    expect(paths.length).toBeGreaterThanOrEqual(1);
  });
});

describe('[helper] extractCardsFromView', () => {
  const createView = (cards: DashboardCard[], sections?: any[]): DashboardView => ({
    title: 'Test View',
    cards,
    ...(sections ? { sections } : {}),
  });

  test('should extract paths from card array', () => {
    const card1 = { type: 'card1', ll_template: 'tmpl1' };
    const card2 = { type: 'card2', ll_template: 'tmpl2' };
    const view = createView([card1 as DashboardCard, card2 as DashboardCard, { type: 'card3' }]);
    
    const paths = extractCardPaths(card1 as DashboardCard);
    
    expect(paths).toHaveLength(1);
    expect(paths[0].card.ll_template).toBe('tmpl1');
  });

  test('should handle view with sections', () => {
    const section1 = { cards: [{ type: 'card', ll_template: 'tmpl1' }] };
    const section2 = { cards: [{ type: 'card', ll_template: 'tmpl2' }] };
    const view = createView(
      [{ type: 'card', ll_template: 'tmpl3' }],
      [section1, section2]
    );
    
    const paths = extractCardPaths((view.cards as DashboardCard[])[0]);
    
    expect(paths).toHaveLength(1);
    expect(paths[0].card.ll_template).toBe('tmpl3');
  });

  test('should return empty array for view with no cards', () => {
    const view: DashboardView = {
      title: 'Empty View',
      cards: []
    };
    
    const paths = extractCardsFromView(view);
    expect(paths).toHaveLength(0);
  });
});
