import { TemplateEngine } from '../../v2/template-engine';
import type { DashboardCard } from '../../types/DashboardCard';
import { objectHasValidKey } from './objectHasValidKey';
import { defaultLinkedLovelaceUpdatableConstants } from '../../constants';
import type { LinkedLovelaceUpdatableConstants } from '../../constants';

const extractCardDataWithTemplateContext = (originalCardData: DashboardCard, cardContext: Record<string, any> = {}, contextKeys: string = defaultLinkedLovelaceUpdatableConstants.contextKeys): Record<string, any> => {
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

const parseTemplateCardData = (templateCardData: Record<string, any>, dataFromTemplate: Record<string, any>): DashboardCard | undefined => {
  // If data in template, find and replace each key
  let template = JSON.stringify(templateCardData);
  template = TemplateEngine.instance.eta.renderString(template, dataFromTemplate)
  try {
    // Convert rendered string back to JSON
    return JSON.parse(template) as DashboardCard;
  } catch (e) {
    console.error(e);
    return undefined
  }
}

interface GetUpdatedCardFromContextData {
  key: string | number | symbol
  cardToUpdate: DashboardCard,
  contextData?: Record<string | number | symbol, any>
  templateData?: Record<string | number | symbol, any>
  linkedLovelaceUpdatableConstants?: LinkedLovelaceUpdatableConstants
}

const getUpdatedCardFromContextData = ({
  cardToUpdate,
  contextData = {},
  key, 
  linkedLovelaceUpdatableConstants = defaultLinkedLovelaceUpdatableConstants,
  templateData = {}, 
}: GetUpdatedCardFromContextData) => {
  try {
    const cardContextData = { ...contextData };
    delete cardContextData[key]
    return updateCardTemplate(cardToUpdate, templateData, cardContextData, linkedLovelaceUpdatableConstants)
  } catch (e) {
    console.error(`Couldn't Update card key '${String(key)}. Provide the following object when submitting an issue to the developer.`, e, contextData, templateData, linkedLovelaceUpdatableConstants)
    return undefined
  }
}

interface ParseContextKeysIntoRenderedCards {
  originalCardData: DashboardCard,
  linkedLovelaceUpdatableConstants: LinkedLovelaceUpdatableConstants,
  contextData?: Record<string | number | symbol, any>
  templateData?: Record<string | number | symbol, any>
}

const parseContextKeysIntoRenderedCards = ({
  contextData = {},
   linkedLovelaceUpdatableConstants,
   originalCardData,
   templateData = {}
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
            linkedLovelaceUpdatableConstants,
            templateData,
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
          linkedLovelaceUpdatableConstants,
          templateData,
        })
        if (updatedCard) {
          updatedData[cardKey] = updatedCard
        }
      }
    }
  })
  return updatedData
}

interface RenderCardFromContextData {
  linkedLovelaceUpdatableConstants: LinkedLovelaceUpdatableConstants,
  contextData?: Record<string | number | symbol, any>
  sourceCardData: DashboardCard,
  templateData?: Record<string | number | symbol, any>
  templateKey: string | number | symbol
}

const renderCardFromContextData = ({
  contextData = {},
  linkedLovelaceUpdatableConstants,
  sourceCardData,
  templateData = {},
  templateKey,
}: RenderCardFromContextData) => {
  const { isTemplateKey, contextKey, contextKeys , useTemplateKey} = linkedLovelaceUpdatableConstants;
  const templateCardData = {...templateData[templateKey]};
      
  // Remove key that is used to locate and load templates.
  delete templateCardData[isTemplateKey]
  
  // Overwrite context data with template context data
  contextData = {...contextData, ...(templateCardData[contextKey] || {})}
  
  // Run the template card data through the renderer and return the resulting JSON
  let data = parseTemplateCardData(templateCardData, contextData) || templateData[templateKey]

  // Extract any data from the template that should be added to or overwritten on the card
  data = {...data, ...extractCardDataWithTemplateContext(sourceCardData, contextData)}

  // Update any child cards in the template requested to be updated
  const updatedData = parseContextKeysIntoRenderedCards({
    contextData,
    linkedLovelaceUpdatableConstants,
    originalCardData: sourceCardData,
    templateData,
  })
  Object.keys(updatedData).forEach((k) => {
    data[k] = updatedData[k]
  })
  // Put template data back in card
  data = { ...{ [contextKey]: contextData, [contextKeys]: sourceCardData[contextKeys], ...data }, [contextKey]: contextData, [contextKeys]: sourceCardData[contextKeys] };
  if (typeof data[contextKey] !== "undefined" && Object.keys(data[contextKey] || {}).length === 0) {
    delete data[contextKey]
  }
  return data
}

interface DidAddKeyFromTemplate {
  contextData: Record<string | number | symbol, any>,
  linkedLovelaceUpdatableConstants: LinkedLovelaceUpdatableConstants,
  originalCardData: DashboardCard,
  templateData: Record<string | number | symbol, any>,
  templateKey: string | number | symbol,
}

const didAddKeyFromTemplate = ({
  contextData,
  linkedLovelaceUpdatableConstants,
  originalCardData,
  templateData,
  templateKey,
}: DidAddKeyFromTemplate): DashboardCard | undefined => {
  const { useTemplateKey, contextKeys } = linkedLovelaceUpdatableConstants
  let data = Object.assign({}, originalCardData);
  if (objectHasValidKey(templateData, templateKey)) {
    if (contextData) {
      data = renderCardFromContextData({
        contextData,
        linkedLovelaceUpdatableConstants,
        sourceCardData: originalCardData,
        templateData,
        templateKey,
      })
    } else {
      // Put template value as new value
      data = templateData[templateKey];
    }
    // Put template key back in card
    data = { ...{ [useTemplateKey]: templateKey, [contextKeys]: originalCardData[contextKeys], ...data }, [useTemplateKey]: templateKey, [contextKeys]: originalCardData[contextKeys] };
    return data;
  }
  return undefined
}

export const updateCardTemplate = (data: DashboardCard, templateData: Record<string | symbol | number, any> = {}, parentContext: Record<string | symbol | number, any> = {}, linkedLovelaceUpdatableConstants: LinkedLovelaceUpdatableConstants = defaultLinkedLovelaceUpdatableConstants): DashboardCard => {
  const { 
    contextKey,
    contextKeys,
    useTemplateKey,
  } = linkedLovelaceUpdatableConstants
  // Get key and data for template
  const templateKey = data[useTemplateKey];
  // TODO: Remove ternary operator when dropping support for template_data card arg
  let contextData: Record<string | symbol | number, any> = {...parentContext, ...(data[contextKey] || {})};
  const cardFromKey = didAddKeyFromTemplate({
    contextData,
    linkedLovelaceUpdatableConstants,
    originalCardData: data,
    templateData,
    templateKey,
  })
  if (cardFromKey) {
    data = cardFromKey
  } else {
    // Support for new sections dashboards.
    if (data.sections && Array.isArray(data.sections)) {
      for (let i = 0; i < data.sections.length; i++) {
        if (data.sections[i].cards && Array.isArray(data.sections[i].cards)) {
          for (let j = 0; j < (data.sections[i].cards as DashboardCard[]).length; j++ ) {
            const card = data.sections[i].cards[j] as DashboardCard
            data.sections[i].cards[j] = updateCardTemplate(card, templateData, contextData, linkedLovelaceUpdatableConstants)
          }
        }
      }
    }
    if (Array.isArray(data.cards)) {
      // Update any cards in the card
      const cards: DashboardCard[] = [];
      data.cards.forEach((card) => {
        cards.push(Object.assign({}, updateCardTemplate(card, templateData, contextData, linkedLovelaceUpdatableConstants)));
      });
      data.cards = cards;
    }
    
    if (data.card && !Array.isArray(data.card)) {
      data.card = Object.assign({}, updateCardTemplate(data.card, templateData, contextData, linkedLovelaceUpdatableConstants));
    }
    // this handles all nested objects that may contain a template, like tap actions
    const cardKeys = Object.keys(data);
    const updatedData = {}
    cardKeys.forEach((cardKey) => {
      if (cardKey !== 'card' && data[cardKey] !== null &&  typeof data[cardKey] === 'object') {
        try {
          updatedData[cardKey] = updateCardTemplate(data[cardKey], templateData, contextData, linkedLovelaceUpdatableConstants)
        } catch (e) {
          console.log(`Couldn't Update card key '${cardKey}'. Provide the following object when submitting an issue to the developer.`, data, e)
        }
      }
    })
    Object.entries(updatedData).forEach(([k, v]) => {
      data[k] = v
    })
  }
  if (data.hasOwnProperty(contextKeys) && typeof data[contextKeys] === 'undefined') {
    delete data[contextKeys];
  }
  return data;
};
