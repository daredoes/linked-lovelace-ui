import { DashboardCard } from '../types';

export const KEY_CHIP_CARD_TYPE = 'custom:linked-lovelace-key-chip';

export const isKeyChipCard = (card?: DashboardCard): boolean => {
  return card?.type === KEY_CHIP_CARD_TYPE && !!card.card;
};

export const wrapKeyChipCard = (card: DashboardCard): DashboardCard => {
  if (isKeyChipCard(card) || !card?.ll_key) {
    return card;
  }
  const { ll_key, ll_priority, ...inner } = card;
  return {
    type: KEY_CHIP_CARD_TYPE,
    ll_key,
    ...(ll_priority !== undefined ? { ll_priority } : {}),
    card: inner as DashboardCard,
  };
};

export const unwrapKeyChipCard = (card: DashboardCard): DashboardCard => {
  if (!isKeyChipCard(card)) {
    return card;
  }
  const inner = card.card as DashboardCard;
  const ll_key = card.ll_key ?? inner.ll_key;
  const ll_priority = card.ll_priority ?? inner.ll_priority;
  // Listing ll_key first pins its position in the output; the assignments
  // after the spread make sure the chip-level values win over inner's.
  const result: DashboardCard = {
    ll_key,
    ...(ll_priority !== undefined ? { ll_priority } : {}),
    ...inner,
  };
  result.ll_key = ll_key;
  if (ll_priority !== undefined) {
    result.ll_priority = ll_priority;
  }
  return result;
};
