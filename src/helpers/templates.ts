import { TemplateEngine } from '../v2/template-engine';
import { DashboardCard, DashboardView, LLCard } from '../types';
import { LovelaceCard } from 'custom-card-helpers';

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

export const getTemplatesUsedInView = (view: DashboardView): string[] => {
  return (
    view.cards?.flatMap((c) => {
      return getTemplatesUsedInCard(c);
    }) || []
  );
};

const replaceRegex = /(?<!\\)\$([a-z|A-Z|0-9|\_]+)(?!\\)\$/gm;

export const extractTemplateData = (data: DashboardCard): DashboardCard => {
  const dataFromTemplate = data.ll_context || {};
  const template = JSON.stringify(data);
  template.replaceAll(replaceRegex, (substring, templateKey) => {
    if (dataFromTemplate[templateKey] === undefined) {
      dataFromTemplate[templateKey] = '';
    }
    return dataFromTemplate[templateKey] || substring;
  });
  data.ll_context = { ...data.ll_context, ...dataFromTemplate };
  if (Object.keys(data.ll_context || {}).length == 0) {
    delete data.ll_context;
  }
  return data;
};

export const updateCardTemplate = (data: DashboardCard, templateData: Record<string, any> = {}): DashboardCard => {
  // Get key and data for template
  const templateKey = data.ll_template;
  // TODO: Remove ternary operator when dropping support for template_data card arg
  const dataFromTemplate: Record<string, any> | undefined = data.ll_context;
  const originalCardData = Object.assign({}, data);
  if (templateKey && templateData[templateKey]) {
    if (dataFromTemplate) {
      const templateCardData = {...templateData[templateKey]};
      delete templateCardData['ll_key']
      // If data in template, find and replace each key
      let template = JSON.stringify(templateCardData);
      template = TemplateEngine.instance.eta.renderString(template, dataFromTemplate)
      try {
        // Convert rendered string back to JSON
        data = JSON.parse(template);
      } catch (e) {
        console.error(e);
        // Return original value if parse fails
        data = templateData[templateKey];
      }
      Object.keys(originalCardData.ll_keys || {}).forEach((ll_key) => {
        const key = (originalCardData.ll_keys || {})[ll_key]
        if (key) {
          const linkedLovelaceKeyData = dataFromTemplate ? dataFromTemplate[key] : undefined;
          if (linkedLovelaceKeyData) {
            data[key] = linkedLovelaceKeyData
          }
        }
      });
      const updatedData = {}
      Object.keys(originalCardData.ll_keys || {}).forEach((cardKey) => {
        const originalDataFromTemplate = Object.assign({}, dataFromTemplate)
        if (typeof originalDataFromTemplate[cardKey] === 'object') {
          if (Array.isArray(originalDataFromTemplate[cardKey]) && typeof originalDataFromTemplate[cardKey][0] === 'object') {
            updatedData[cardKey] = [];
            for (let i = 0; i < originalDataFromTemplate[cardKey]['length']; i++) {
              const newLLData = { ...originalDataFromTemplate[cardKey][i].ll_context, ...originalDataFromTemplate };
              delete newLLData[cardKey]
              const oldData = { ...{ ll_context: newLLData }, ...{ ...originalDataFromTemplate[cardKey][i] }, ...{ ll_data: newLLData } };
              if (typeof oldData.ll_context !== undefined && Object.keys(oldData.ll_context).length == 0) {
                delete oldData.ll_context;
              }
              const result = updateCardTemplate(oldData, templateData);
              updatedData[cardKey].push(result)
            }
          } else {
            try {
              const newLLData = { ...originalDataFromTemplate };
              delete newLLData[cardKey]
              const oldData = { ...originalDataFromTemplate[cardKey], ll_context: newLLData };
              updatedData[cardKey] = updateCardTemplate(oldData, templateData)
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
      data = { ...{ ll_context: dataFromTemplate, ll_keys: originalCardData.ll_keys, ...data }, ll_context: dataFromTemplate, ll_keys: originalCardData.ll_keys };
    } else {
      // Put template value as new value
      data = templateData[templateKey];
    }
    // Put template key back in card
    data = { ...{ ll_template: templateKey, ll_keys: originalCardData.ll_keys, ...data }, ll_template: templateKey, ll_keys: originalCardData.ll_keys };
  } else {
    // Support for new sections dashboards.
    if (data.sections && Array.isArray(data.sections)) {
      for (let i = 0; i < data.sections.length; i++) {
        if (data.sections[i].cards && Array.isArray(data.sections[i].cards)) {
          for (let j = 0; j < (data.sections[i].cards as DashboardCard[]).length; j++ ) {
            const card = data.sections[i].cards[j] as DashboardCard
            if (dataFromTemplate) {
              // Pass template data down to children
              card.ll_context = { ...(card.ll_context || {}), ...dataFromTemplate };
            }
            data.sections[i].cards[j] = updateCardTemplate(card, templateData)
          }
        }
      }
    }
    if (Array.isArray(data.cards)) {
      // Update any cards in the card
      const cards: DashboardCard[] = [];
      data.cards.forEach((card) => {
        if (dataFromTemplate) {
          // Pass template data down to children
          card.ll_context = { ...(card.ll_context || {}), ...dataFromTemplate };
        }
        cards.push(Object.assign({}, updateCardTemplate(card, templateData)));
      });
      data.cards = cards;
    }
    
    if (data.card && !Array.isArray(data.card)) {
      if (dataFromTemplate) {
        // Pass template data down to children
        data.card.ll_context = { ...(data.card.ll_context || {}), ...dataFromTemplate };
      }
      data.card = Object.assign({}, updateCardTemplate(data.card, templateData));
    }
    // this handles all nested objects that may contain a template, like tap actions
    const cardKeys = Object.keys(data);
    const updatedData = {}
    cardKeys.forEach((cardKey) => {
      if (cardKey !== 'card' && data[cardKey] !== null &&  typeof data[cardKey] === 'object') {
        try {
          updatedData[cardKey] = updateCardTemplate(data[cardKey], templateData)
        } catch (e) {
          console.log(`Couldn't Update card key '${cardKey}'. Provide the following object when submitting an issue to the developer.`, data, e)
        }
      }
    })
    Object.keys(updatedData).forEach((k) => {
      data[k] = updatedData[k]
    })
  }
  if (data.hasOwnProperty('ll_keys') && typeof data.ll_keys === 'undefined') {
    delete data.ll_keys;
  }
  return data;
};
