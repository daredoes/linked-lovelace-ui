import type { DashboardView } from '../../types/DashboardView';
import { getTemplatesUsedInCard } from './getTemplatesUsedInCard';

export const getTemplatesUsedInView = (view: DashboardView): string[] => {
  return (
    view.cards?.flatMap((c) => {
      return getTemplatesUsedInCard(c);
    }) || []
  );
};