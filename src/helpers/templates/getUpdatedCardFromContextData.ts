import type { DashboardCard } from '../../types/DashboardCard';
import { OnTemplateObject } from './types';
interface GetUpdatedCardFromContextData {
  key: string | number | symbol
  cardToUpdate: DashboardCard,
  contextData?: Record<string | number | symbol, any>
  onTemplateObject: OnTemplateObject
}

export const getUpdatedCardFromContextData = ({
  cardToUpdate,
  contextData = {},
  key,
  onTemplateObject,
}: GetUpdatedCardFromContextData) => {
  try {
    const cardContextData = { ...contextData };
    delete cardContextData[key]
    return onTemplateObject(cardToUpdate, cardContextData)
  } catch (e) {
    console.error(`Couldn't Update card key '${String(key)}. Provide the following object when submitting an issue to the developer.`, e, contextData)
    return undefined
  }
}
