import { TemplateEngine } from '../v2/template-engine';
import { DashboardCard, DashboardView } from '../types';

export const getTemplatesUsedInCard = (card: DashboardCard): string[] => {
  if (card.template) {
    return [card.template];
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
  const dataFromTemplate = data.template_data || {};
  const template = JSON.stringify(data);
  template.replaceAll(replaceRegex, (substring, templateKey) => {
    if (dataFromTemplate[templateKey] === undefined) {
      dataFromTemplate[templateKey] = '';
    }
    return dataFromTemplate[templateKey] || substring;
  });
  data.template_data = { ...data.template_data, ...dataFromTemplate };
  if (Object.keys(data.template_data).length == 0) {
    delete data.template_data;
  }
  return data;
};

export const updateCardTemplate = (data: DashboardCard, templateData: Record<string, any> = {}, v2 = false): DashboardCard => {
  // Get key and data for template
  const templateKey = data.template;
  // TODO: Remove ternary operator when dropping support for template_data card arg
  const dataFromTemplate: Record<string, any> | undefined = data.ll_data ? data.ll_data : data.template_data;
  const originalCardData = Object.assign({}, data);
  if (templateKey && templateData[templateKey]) {
    if (dataFromTemplate) {
      // If data in template, find and replace each key
      let template = JSON.stringify(templateData[templateKey]);
      if (v2) {
        template = TemplateEngine.instance.eta.renderString(template, dataFromTemplate)
      } else {
        template = template.replaceAll(replaceRegex, (substring, templateKey) => {
          if (dataFromTemplate[templateKey] === undefined) {
            dataFromTemplate[templateKey] = '';
          }
          return dataFromTemplate[templateKey] || substring;
        });
      }
      try {
        // Convert rendered string back to JSON
        data = JSON.parse(template);
      } catch (e) {
        console.error(e);
        // Return original value if parse fails
        data = templateData[templateKey];
      }
      originalCardData.ll_keys?.forEach((ll_key) => {
        const linkedLovelaceKeyData = dataFromTemplate ? dataFromTemplate[ll_key] : undefined;
        if (linkedLovelaceKeyData) {
          data[ll_key] = linkedLovelaceKeyData
        }
      });
      const updatedData = {}
      originalCardData.ll_keys?.forEach((cardKey) => {
        const originalDataFromTemplate = Object.assign({}, dataFromTemplate)
        if (typeof originalDataFromTemplate[cardKey] === 'object') {
          if (originalDataFromTemplate[cardKey]['length']) {
            updatedData[cardKey] = [];
            for (let i = 0; i < originalDataFromTemplate[cardKey]['length']; i++) {

              const newLLData = { ...originalDataFromTemplate[cardKey][i].ll_data, ...originalDataFromTemplate };
              delete newLLData[cardKey]
              const oldData = { ...{ ll_data: newLLData, ll_v2: v2 }, ...{ ...originalDataFromTemplate[cardKey][i] }, ...{ ll_data: newLLData } };
              if (typeof oldData.ll_data !== undefined && Object.keys(oldData.ll_data).length == 0) {
                delete oldData.ll_data;
              }
              const result = updateCardTemplate(oldData, templateData, v2);
              updatedData[cardKey].push(result)
            }
          } else {
            try {
              const newLLData = { ...originalDataFromTemplate };
              delete newLLData[cardKey]
              const oldData = { ...originalDataFromTemplate[cardKey], ll_data: newLLData };
              updatedData[cardKey] = updateCardTemplate(oldData, templateData, v2)
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
      data = { ...{ ll_v2: v2, ll_data: dataFromTemplate, ll_keys: originalCardData.ll_keys, ...data }, ll_data: dataFromTemplate, ll_keys: originalCardData.ll_keys };
    } else {
      // Put template value as new value
      data = templateData[templateKey];
    }
    // Put template key back in card
    data = { ...{ ll_v2: v2, template: templateKey, ll_keys: originalCardData.ll_keys, ...data }, template: templateKey, ll_keys: originalCardData.ll_keys };
  } else {
    if (data.cards) {
      // Update any cards in the card
      const cards: DashboardCard[] = [];
      data.cards.forEach((card) => {
        if (dataFromTemplate) {
          // Pass template data down to children
          card.ll_data = { ...(card.ll_data || {}), ...dataFromTemplate };
        }
        cards.push(Object.assign({}, updateCardTemplate(card, templateData, v2)));
      });
      data.cards = cards;
    }
    if (data.card) {
      if (dataFromTemplate) {
        // Pass template data down to children
        data.card.ll_data = { ...(data.card.ll_data || {}), ...dataFromTemplate };
      }
      data.card = Object.assign({}, updateCardTemplate(data.card, templateData, v2));
    }
    // this handles all nested objects that may contain a template, like tap actions
    const cardKeys = Object.keys(data);
    const updatedData = {}
    cardKeys.forEach((cardKey) => {
      if (cardKey !== 'card' && typeof data[cardKey] === 'object') {
        try {
          updatedData[cardKey] = updateCardTemplate(data[cardKey], templateData, v2)
        } catch (e) {
          console.log(`Couldn't Update card key '${cardKey}. Provide the following object when submitting an issue to the developer.`, data, e)
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
