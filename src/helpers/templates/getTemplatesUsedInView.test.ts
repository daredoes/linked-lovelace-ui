import type { DashboardView } from '../../types/DashboardView';
import { getTemplatesUsedInView } from './getTemplatesUsedInView';

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
          ll_template: 'true',
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
          ll_template: 'true',
          cards: [
            {
              type: 'test',
              ll_template: 'true',
            },
          ],
        },
        {
          type: 'test',
          ll_template: 'true',
        },
      ],
    };
    expect(getTemplatesUsedInView(view)).toStrictEqual(['true', 'true']);
  });
});
