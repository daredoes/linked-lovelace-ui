import type { DashboardCard } from '../../types/DashboardCard';
import { defaultLinkedLovelaceUpdatableConstants } from '../../constants';

export const extractCardDataWithTemplateContext = (originalCardData: DashboardCard, cardContext: Record<string, any> = {}, contextKeys: string = defaultLinkedLovelaceUpdatableConstants.contextKeys): Record<string, any> => {
  const listOfContextKeys = originalCardData[contextKeys] || {}
  const keys = Object.keys(listOfContextKeys)
  const cardUpdateData = {}
  // ll_keys represent keys that are used to find and replace values in the template
  keys.forEach((contextKey) => {
    const key = listOfContextKeys[contextKey]
    if (key) {
      const linkedLovelaceKeyData = cardContext ? cardContext[key] : undefined;
      if (linkedLovelaceKeyData) {
        // replace the value of the key in the new card with the data from our template context passed down from parent cards
        cardUpdateData[key] = linkedLovelaceKeyData
      }
    }
  });
  return cardUpdateData
}