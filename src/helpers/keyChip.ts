import { DashboardCard } from '../types';

export const KEY_CHIP_CARD_TYPE = 'custom:linked-lovelace-key-chip';

// The keys that describe a template definition rather than the card itself.
// They ride on the wrapper so that a chipped definition still reads as one
// block of Linked Lovelace config instead of hiding keys inside `card:`.
const DEFINITION_KEYS = ['ll_key', 'll_priority', 'show_key_chips'] as const;

export const isKeyChipCard = (card?: DashboardCard): boolean => {
  return card?.type === KEY_CHIP_CARD_TYPE && !!card.card;
};

export const wrapKeyChipCard = (card: DashboardCard): DashboardCard => {
  if (isKeyChipCard(card) || !card?.ll_key) {
    return card;
  }
  const { ll_key, ll_priority, show_key_chips, ...inner } = card;
  return {
    type: KEY_CHIP_CARD_TYPE,
    ll_key,
    ...(ll_priority !== undefined ? { ll_priority } : {}),
    ...(show_key_chips !== undefined ? { show_key_chips } : {}),
    card: inner as DashboardCard,
  };
};

export const unwrapKeyChipCard = (card: DashboardCard): DashboardCard => {
  if (!isKeyChipCard(card)) {
    return card;
  }
  const inner = card.card as DashboardCard;
  // Listing the definition keys first pins their position in the output; the
  // assignments after the spread make sure the chip-level values win over
  // inner's.
  const lifted: Record<string, unknown> = {};
  for (const key of DEFINITION_KEYS) {
    const value = card[key] ?? inner[key];
    if (value !== undefined) {
      lifted[key] = value;
    }
  }
  const result: DashboardCard = { ...lifted, ...inner };
  Object.assign(result, lifted);
  return result;
};
