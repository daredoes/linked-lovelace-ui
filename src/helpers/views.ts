import { DashboardCard, DashboardView } from '../types';

// Definitions live either directly in a view (masonry) or inside a section
// (the 2024.3+ sections layout). Rendering walks both, so discovery must too.
export const cardsInView = (view: DashboardView): DashboardCard[] => {
  const cards: DashboardCard[] = [...(view.cards || [])];
  (view.sections || []).forEach((section) => {
    cards.push(...((section?.cards as DashboardCard[] | undefined) || []));
  });
  return cards;
};
