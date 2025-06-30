import { TemplateEngine } from '../../v2/template-engine';
import type { DashboardCard } from '../../types/DashboardCard';
import { objectHasValidKey } from './objectHasValidKey';
import { LINKED_LOVELACE_TEMPLATE_REPLACEMENT_KEYS_KEY, LINKED_LOVELACE_TEMPLATE_KEY, LINKED_LOVELACE_TEMPLATE_CONTEXT_KEY, LINKED_LOVELACE_TEMPLATE_REPLACEMENT_KEY } from '../../constants';

const extractCardDataWithTemplateContext = (originalCardData: DashboardCard, cardContext: Record<string, any> = {}, replacementKey: string = LINKED_LOVELACE_TEMPLATE_REPLACEMENT_KEYS_KEY): Record<string, any> => {
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

export const updateCardTemplate = (data: DashboardCard, templateData: Record<string, any> = {}, parentContext: Record<string, any> = {}): DashboardCard => {
  // Get key and data for template
  const templateKey = data[LINKED_LOVELACE_TEMPLATE_KEY];
  // TODO: Remove ternary operator when dropping support for template_data card arg
  let dataFromTemplate: Record<string, any> = {...parentContext, ...(data[LINKED_LOVELACE_TEMPLATE_CONTEXT_KEY] || {})};
  const originalCardData = Object.assign({}, data);
  if (objectHasValidKey(templateData, templateKey)) {
    if (dataFromTemplate) {
      const templateCardData = {...templateData[templateKey]};
      delete templateCardData[LINKED_LOVELACE_TEMPLATE_REPLACEMENT_KEY]
      dataFromTemplate = {...dataFromTemplate, ...(templateCardData[LINKED_LOVELACE_TEMPLATE_CONTEXT_KEY] || {})}
      data = parseTemplateCardData(templateCardData, dataFromTemplate) || templateData[templateKey]
      data = {...data, ...extractCardDataWithTemplateContext(originalCardData, dataFromTemplate)}
      const updatedData = {}
      Object.keys(originalCardData[LINKED_LOVELACE_TEMPLATE_REPLACEMENT_KEYS_KEY] || {}).forEach((cardKey) => {
        const originalDataFromTemplate = Object.assign({}, dataFromTemplate)
        if (typeof originalDataFromTemplate[cardKey] === 'object') {
          if (Array.isArray(originalDataFromTemplate[cardKey]) && typeof originalDataFromTemplate[cardKey][0] === 'object') {
            updatedData[cardKey] = [];
            for (let i = 0; i < originalDataFromTemplate[cardKey]['length']; i++) {
              const newLLData = { ...originalDataFromTemplate[cardKey][i][LINKED_LOVELACE_TEMPLATE_CONTEXT_KEY], ...originalDataFromTemplate };
              delete newLLData[cardKey]
              const oldData = {...{ ...originalDataFromTemplate[cardKey][i] }};
              const result = updateCardTemplate(oldData, templateData, newLLData);
              updatedData[cardKey].push(result)
            }
          } else {
            try {
              const newLLData = { ...originalDataFromTemplate };
              delete newLLData[cardKey]
              const oldData = { ...originalDataFromTemplate[cardKey]};
              updatedData[cardKey] = updateCardTemplate(oldData, templateData, newLLData)
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
      data = { ...{ [LINKED_LOVELACE_TEMPLATE_CONTEXT_KEY]: dataFromTemplate, [LINKED_LOVELACE_TEMPLATE_REPLACEMENT_KEYS_KEY]: originalCardData[LINKED_LOVELACE_TEMPLATE_REPLACEMENT_KEYS_KEY], ...data }, [LINKED_LOVELACE_TEMPLATE_CONTEXT_KEY]: dataFromTemplate, [LINKED_LOVELACE_TEMPLATE_REPLACEMENT_KEYS_KEY]: originalCardData[LINKED_LOVELACE_TEMPLATE_REPLACEMENT_KEYS_KEY] };
      if (typeof data[LINKED_LOVELACE_TEMPLATE_CONTEXT_KEY] !== "undefined" && Object.keys(data[LINKED_LOVELACE_TEMPLATE_CONTEXT_KEY] || {}).length === 0) {
        delete data[LINKED_LOVELACE_TEMPLATE_CONTEXT_KEY]
      }
    } else {
      // Put template value as new value
      data = templateData[templateKey];
    }
    // Put template key back in card
    data = { ...{ [LINKED_LOVELACE_TEMPLATE_KEY]: templateKey, [LINKED_LOVELACE_TEMPLATE_REPLACEMENT_KEYS_KEY]: originalCardData[LINKED_LOVELACE_TEMPLATE_REPLACEMENT_KEYS_KEY], ...data }, [LINKED_LOVELACE_TEMPLATE_KEY]: templateKey, [LINKED_LOVELACE_TEMPLATE_REPLACEMENT_KEYS_KEY]: originalCardData[LINKED_LOVELACE_TEMPLATE_REPLACEMENT_KEYS_KEY] };
  } else {
    // Support for new sections dashboards.
    if (data.sections && Array.isArray(data.sections)) {
      for (let i = 0; i < data.sections.length; i++) {
        if (data.sections[i].cards && Array.isArray(data.sections[i].cards)) {
          for (let j = 0; j < (data.sections[i].cards as DashboardCard[]).length; j++ ) {
            const card = data.sections[i].cards[j] as DashboardCard
            data.sections[i].cards[j] = updateCardTemplate(card, templateData, dataFromTemplate)
          }
        }
      }
    }
    if (Array.isArray(data.cards)) {
      // Update any cards in the card
      const cards: DashboardCard[] = [];
      data.cards.forEach((card) => {
        cards.push(Object.assign({}, updateCardTemplate(card, templateData, dataFromTemplate)));
      });
      data.cards = cards;
    }
    
    if (data.card && !Array.isArray(data.card)) {
      data.card = Object.assign({}, updateCardTemplate(data.card, templateData, dataFromTemplate));
    }
    // this handles all nested objects that may contain a template, like tap actions
    const cardKeys = Object.keys(data);
    const updatedData = {}
    cardKeys.forEach((cardKey) => {
      if (cardKey !== 'card' && data[cardKey] !== null &&  typeof data[cardKey] === 'object') {
        try {
          updatedData[cardKey] = updateCardTemplate(data[cardKey], templateData, dataFromTemplate)
        } catch (e) {
          console.log(`Couldn't Update card key '${cardKey}'. Provide the following object when submitting an issue to the developer.`, data, e)
        }
      }
    })
    Object.keys(updatedData).forEach((k) => {
      data[k] = updatedData[k]
    })
  }
  if (data.hasOwnProperty(LINKED_LOVELACE_TEMPLATE_REPLACEMENT_KEYS_KEY) && typeof data[LINKED_LOVELACE_TEMPLATE_REPLACEMENT_KEYS_KEY] === 'undefined') {
    delete data[LINKED_LOVELACE_TEMPLATE_REPLACEMENT_KEYS_KEY];
  }
  return data;
};
