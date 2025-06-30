import type { DashboardCard } from '../../types/DashboardCard';

// This is a recursive function
export const getTemplatesUsedInCard = (card: DashboardCard): string[] => {
  if (card.ll_template) {
    return [card.ll_template];
  }
  if (card.cards) {
    return card.cards.flatMap((c) => {
      return getTemplatesUsedInCard(c);
    });
  }
  if (card.card) {
    return getTemplatesUsedInCard(card.card)
  }
  return [];
};
