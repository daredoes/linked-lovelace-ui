import { TemplateEngine } from '../../v2/template-engine';
import type { DashboardCard } from '../../types/DashboardCard';
import { objectHasValidKey } from './objectHasValidKey';
import { defaultLinkedLovelaceUpdatableConstants } from '../../constants';
import type { LinkedLovelaceUpdatableConstants } from '../../constants';

const extractCardDataWithTemplateContext = (originalCardData: DashboardCard, cardContext: Record<string, any> = {}, replacementKey: string = defaultLinkedLovelaceUpdatableConstants.context_keys): Record<string, any> => {
  const data = originalCardData[replacementKey] || {}
  const keys = Object.keys(data)
  const cardUpdateData = {}
  // ll_keys represent keys that are used to find and replace values in the template
  keys.forEach((ll_key) => {
    const key = data[ll_key]
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

export const updateCardTemplate = (data: DashboardCard, templateData: Record<string | symbol | number, any> = {}, parentContext: Record<string | symbol | number, any> = {}, linkedLovelaceUpdatableConstants: LinkedLovelaceUpdatableConstants = defaultLinkedLovelaceUpdatableConstants): DashboardCard => {
  const { 
    context_key,
    context_keys,
    root_card_key,
    template_key,
  } = linkedLovelaceUpdatableConstants
  // Get key and data for template
  const templateKey = data[template_key];
  // TODO: Remove ternary operator when dropping support for template_data card arg
  let dataFromTemplate: Record<string | symbol | number, any> = {...parentContext, ...(data[context_key] || {})};
  const originalCardData = Object.assign({}, data);
  if (objectHasValidKey(templateData, templateKey)) {
    if (dataFromTemplate) {
      const templateCardData = {...templateData[templateKey]};
      delete templateCardData[root_card_key]
      dataFromTemplate = {...dataFromTemplate, ...(templateCardData[context_key] || {})}
      data = parseTemplateCardData(templateCardData, dataFromTemplate) || templateData[templateKey]
      data = {...data, ...extractCardDataWithTemplateContext(originalCardData, dataFromTemplate)}
      const updatedData = {}
      Object.keys(originalCardData[context_keys] || {}).forEach((cardKey) => {
        const originalDataFromTemplate = Object.assign({}, dataFromTemplate)
        if (typeof originalDataFromTemplate[cardKey] === 'object') {
          if (Array.isArray(originalDataFromTemplate[cardKey]) && typeof originalDataFromTemplate[cardKey][0] === 'object') {
            updatedData[cardKey] = [];
            for (let i = 0; i < originalDataFromTemplate[cardKey]['length']; i++) {
              const newLLData = { ...originalDataFromTemplate[cardKey][i][context_key], ...originalDataFromTemplate };
              delete newLLData[cardKey]
              const oldData = {...{ ...originalDataFromTemplate[cardKey][i] }};
              const result = updateCardTemplate(oldData, templateData, newLLData, linkedLovelaceUpdatableConstants);
              updatedData[cardKey].push(result)
            }
          } else {
            try {
              const newLLData = { ...originalDataFromTemplate };
              delete newLLData[cardKey]
              const oldData = { ...originalDataFromTemplate[cardKey]};
              updatedData[cardKey] = updateCardTemplate(oldData, templateData, newLLData, linkedLovelaceUpdatableConstants)
            } catch (e) {
              console.log(`Couldn't Update card key '${cardKey}. Provide the following object when submitting an issue to the developer.`, data, e)
            }
          }
        }
      })
      Object.keys(updatedData).forEach((k) => {
        data[k] = updatedData[k]
      })
      // Put template data back in card
      data = { ...{ [context_key]: dataFromTemplate, [context_keys]: originalCardData[context_keys], ...data }, [context_key]: dataFromTemplate, [context_keys]: originalCardData[context_keys] };
      if (typeof data[context_key] !== "undefined" && Object.keys(data[context_key] || {}).length === 0) {
        delete data[context_key]
      }
    } else {
      // Put template value as new value
      data = templateData[templateKey];
    }
    // Put template key back in card
    data = { ...{ [template_key]: templateKey, [context_keys]: originalCardData[context_keys], ...data }, [template_key]: templateKey, [context_keys]: originalCardData[context_keys] };
  } else {
    // Support for new sections dashboards.
    if (data.sections && Array.isArray(data.sections)) {
      for (let i = 0; i < data.sections.length; i++) {
        if (data.sections[i].cards && Array.isArray(data.sections[i].cards)) {
          for (let j = 0; j < (data.sections[i].cards as DashboardCard[]).length; j++ ) {
            const card = data.sections[i].cards[j] as DashboardCard
            data.sections[i].cards[j] = updateCardTemplate(card, templateData, dataFromTemplate, linkedLovelaceUpdatableConstants)
          }
        }
      }
    }
    if (Array.isArray(data.cards)) {
      // Update any cards in the card
      const cards: DashboardCard[] = [];
      data.cards.forEach((card) => {
        cards.push(Object.assign({}, updateCardTemplate(card, templateData, dataFromTemplate, linkedLovelaceUpdatableConstants)));
      });
      data.cards = cards;
    }
    
    if (data.card && !Array.isArray(data.card)) {
      data.card = Object.assign({}, updateCardTemplate(data.card, templateData, dataFromTemplate, linkedLovelaceUpdatableConstants));
    }
    // this handles all nested objects that may contain a template, like tap actions
    const cardKeys = Object.keys(data);
    const updatedData = {}
    cardKeys.forEach((cardKey) => {
      if (cardKey !== 'card' && data[cardKey] !== null &&  typeof data[cardKey] === 'object') {
        try {
          updatedData[cardKey] = updateCardTemplate(data[cardKey], templateData, dataFromTemplate, linkedLovelaceUpdatableConstants)
        } catch (e) {
          console.log(`Couldn't Update card key '${cardKey}'. Provide the following object when submitting an issue to the developer.`, data, e)
        }
      }
    })
    Object.keys(updatedData).forEach((k) => {
      data[k] = updatedData[k]
    })
  }
  if (data.hasOwnProperty(context_keys) && typeof data[context_keys] === 'undefined') {
    delete data[context_keys];
  }
  return data;
};
