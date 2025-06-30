import type { DashboardCard } from '../../types/DashboardCard';
import { getTemplatesUsedInCard } from './getTemplatesUsedInCard';

describe('[function] getTemplatesUsedInCard', () => {
  test('returns empty array when given an empty card', () => {
    expect(
      getTemplatesUsedInCard({
        type: 'fake',
      }),
    ).toStrictEqual([]);
  });

  test('returns an array with one item when given one card with no cards', () => {
    const card: DashboardCard = {
      type: 'fake',
      ll_template: 'true',
    };
    expect(getTemplatesUsedInCard(card)).toStrictEqual(['true']);
  });

  test('ignores child cards if card is a template', () => {
    const card: DashboardCard = {
      type: 'fake',
      ll_template: 'true',
      cards: [
        {
          type: 'fake',
          ll_template: 'true',
        },
      ],
    };
    expect(getTemplatesUsedInCard(card)).toStrictEqual(['true']);
  });

  test('includes child cards if card is not a template', () => {
    const card: DashboardCard = {
      type: 'fake',
      cards: [
        {
          type: 'fake',
          ll_template: 'true',
        },
        {
          type: 'fake',
          ll_template: 'true',
        },
      ],
    };
    expect(getTemplatesUsedInCard(card)).toStrictEqual(['true', 'true']);
  });

  test('works on single child card if card is not a template', () => {
    const card: DashboardCard = {
      type: 'fake',
      card:
      {
        type: 'fake',
        ll_template: 'true',
      },
    };
    expect(getTemplatesUsedInCard(card)).toStrictEqual(['true']);
  });
});
