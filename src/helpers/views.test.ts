import { DashboardView } from '../types';
import { cardsInView } from './views';

describe('[function] cardsInView', () => {
  test('returns an empty array for a view with no cards', () => {
    expect(cardsInView({ title: 'V' })).toStrictEqual([]);
  });

  test('returns cards placed directly in the view', () => {
    const view: DashboardView = { title: 'V', cards: [{ type: 'markdown' }] };
    expect(cardsInView(view)).toStrictEqual([{ type: 'markdown' }]);
  });

  test('includes cards inside sections', () => {
    const view: DashboardView = {
      title: 'V',
      type: 'sections',
      sections: [{ type: 'grid', cards: [{ type: 'markdown', ll_key: 'in_section' }] }],
    };
    expect(cardsInView(view)).toStrictEqual([{ type: 'markdown', ll_key: 'in_section' }]);
  });

  test('returns view cards before section cards, across every section', () => {
    const view: DashboardView = {
      title: 'V',
      cards: [{ type: 'a' }],
      sections: [
        { type: 'grid', cards: [{ type: 'b' }] },
        { type: 'grid' },
        { type: 'grid', cards: [{ type: 'c' }] },
      ],
    };
    expect(cardsInView(view).map((c) => c.type)).toStrictEqual(['a', 'b', 'c']);
  });
});
