import type { DashboardCard } from '../../types/DashboardCard';
import type { LinkedLovelaceUpdatableConstants } from '../../constants';
import { OnTemplateObject } from './types';
import {getUpdatedCardFromContextData} from './getUpdatedCardFromContextData'
interface ParseContextKeysIntoRenderedCards {
  originalCardData: DashboardCard,
  linkedLovelaceUpdatableConstants: LinkedLovelaceUpdatableConstants,
  contextData?: Record<string | number | symbol, any>
  onTemplateObject: OnTemplateObject
}

export const parseContextKeysIntoRenderedCards = ({
  contextData = {},
   linkedLovelaceUpdatableConstants,
   originalCardData,
   onTemplateObject
  }: ParseContextKeysIntoRenderedCards) => {
  const { contextKeys, contextKey } = linkedLovelaceUpdatableConstants
  // Update any child cards in the template requested to be updated
  const updatedData = {}
  Object.keys(originalCardData[contextKeys] || {}).forEach((cardKey) => {
    const localContextData = Object.assign({}, contextData)
    // If the card key is an object, update it, otherwise it was handled earlier
    if (typeof localContextData[cardKey] === 'object') {
      // If the card key is an array of cards, update each one
      if (Array.isArray(localContextData[cardKey]) && typeof localContextData[cardKey][0] === 'object') {
        // Set the key for the updated data for what cards we are going to add
        updatedData[cardKey] = [];
        // Loop over each card we want to render and add
        for (let i = 0; i < localContextData[cardKey]['length']; i++) {
          const localCardData = localContextData[cardKey][i]
          // copy the context data for the card
          const cardContextData = { ...localCardData[contextKey], ...localContextData };
          const updatedCard = getUpdatedCardFromContextData({
            cardToUpdate: localCardData,
            contextData: cardContextData,
            key: cardKey,
            onTemplateObject,
          })
          if (updatedCard) {
            updatedData[cardKey].push(updatedCard)
          }
        }
      } else { // This is just a single card, so let's render and add it.
        const updatedCard = getUpdatedCardFromContextData({
          cardToUpdate: localContextData[cardKey],
          contextData: localContextData,
          key: cardKey,
          onTemplateObject,
        })
        if (updatedCard) {
          updatedData[cardKey] = updatedCard
        }
      }
    }
  })
  return updatedData
}