import { DashboardCard, DashboardView } from '../types';
import { getTemplatesUsedInCard, getTemplatesUsedInView, extractTemplateData, updateCardTemplate } from './templates';

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
      template: 'true',
    };
    expect(getTemplatesUsedInCard(card)).toStrictEqual(['true']);
  });

  test('ignores child cards if card is a template', () => {
    const card: DashboardCard = {
      type: 'fake',
      template: 'true',
      cards: [
        {
          type: 'fake',
          template: 'true',
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
          template: 'true',
        },
        {
          type: 'fake',
          template: 'true',
        },
      ],
    };
    expect(getTemplatesUsedInCard(card)).toStrictEqual(['true', 'true']);
  });
});

describe('[function] getTemplatesUsedInView', () => {
  test('returns an empty array for an empty view', () => {
    const view: DashboardView = {
      title: 'test',
    };
    expect(getTemplatesUsedInView(view)).toStrictEqual([]);
  });

  test('returns an empty array for a view with no template cards', () => {
    const view: DashboardView = {
      title: 'test',
      cards: [
        {
          type: 'test',
        },
      ],
    };
    expect(getTemplatesUsedInView(view)).toStrictEqual([]);
  });
  test('returns an array for a view with some template cards', () => {
    const view: DashboardView = {
      title: 'test',
      cards: [
        {
          type: 'test',
          template: 'true',
        },
      ],
    };
    expect(getTemplatesUsedInView(view)).toStrictEqual(['true']);
  });
  test('returns a flat array for a view with nested template cards', () => {
    const view: DashboardView = {
      title: 'test',
      cards: [
        {
          type: 'test',
          template: 'true',
          cards: [
            {
              type: 'test',
              template: 'true',
            },
          ],
        },
        {
          type: 'test',
          template: 'true',
        },
      ],
    };
    expect(getTemplatesUsedInView(view)).toStrictEqual(['true', 'true']);
  });
});

describe('[function] extractTemplateData', () => {
  test('returns an unmodified card if no template data', () => {
    const card: DashboardCard = {
      type: 'test',
    };
    expect(extractTemplateData(card)).toStrictEqual(card);
  });

  test('returns an a card with template data populated', () => {
    const card: DashboardCard = {
      type: '$test$',
    };
    expect(extractTemplateData(card)).toStrictEqual({
      type: '$test$',
      template_data: {
        test: '',
      },
    });
  });
  test('returns an a card with template data deleted if empty', () => {
    const card: DashboardCard = {
      type: 'test',
      template_data: {},
    };
    expect(extractTemplateData(card)).toStrictEqual({
      type: 'test',
    });
  });
});

describe('[function] updateCardTemplate', () => {
  test('does nothing when given no template data and an empty card', () => {
    const card: DashboardCard = {
      type: 'test',
    };
    expect(updateCardTemplate(card)).toStrictEqual(card);
  });

  test('does nothing when given no template data with a template type', () => {
    const card: DashboardCard = {
      type: 'test',
      template: 'true',
    };
    expect(updateCardTemplate(card)).toStrictEqual(card);
  });

  test('does nothing when given no template data with child cards', () => {
    const card: DashboardCard = {
      type: 'test',
      cards: [
        {
          type: 'test',
        },
      ],
    };
    expect(updateCardTemplate(card)).toStrictEqual(card);
  });

  test('replaces card with template', () => {
    const template: DashboardCard = {
      type: 'template',
    };
    const card: DashboardCard = {
      type: 'test',
      template: 'template',
    };
    expect(updateCardTemplate(card, { template })).toStrictEqual({ type: 'template', template: 'template' });
  });

  test('replaces child cards with template', () => {
    const template: DashboardCard = {
      type: 'template',
    };
    const card: DashboardCard = {
      type: 'test',
      cards: [
        {
          type: 'test',
          template: 'template',
        },
      ],
    };
    expect(updateCardTemplate(card, { template })).toStrictEqual({
      type: 'test',
      cards: [
        {
          type: 'template',
          template: 'template',
        },
      ],
    });
  });
  test('replaces card with template and updates data', () => {
    const template: DashboardCard = {
      type: 'template',
      name: '$cool$ man',
    };
    const card: DashboardCard = {
      type: 'test',
      template: 'template',
      template_data: {
        cool: 'yes',
      },
    };
    expect(updateCardTemplate(card, { template })).toStrictEqual({
      type: 'template',
      template: 'template',
      name: 'yes man',
      template_data: {
        cool: 'yes',
      },
    });
  });
});
