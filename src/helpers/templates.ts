import { TemplateEngine, TemplateEngineType } from '../v2/template-engine';
import { DashboardCard, DashboardView } from '../types';

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

export const updateCardTemplate = async (
  data: DashboardCard,
  templateData: Record<string, any> = {},
  parentContext: Record<string, any> = {},
): Promise<DashboardCard> => {
  const templateKey = data.ll_template;
  let dataFromTemplate: Record<string, any> = { ...parentContext, ...(data.ll_context || {}) };
  const originalCardData = Object.assign({}, data);
  // Determine engine type
  let engineType: TemplateEngineType = 'eta';
  if (data.ll_template_engine === 'jinja2') engineType = 'jinja2'
  else if (data.ll_template_engine === undefined || data.ll_template_engine === 'eta') engineType = 'eta'
  else throw new Error(`Unknown template engine type: ${data.ll_template_engine}`);
  if (templateKey && templateData[templateKey]) {
    if (dataFromTemplate) {
      const templateCardData = { ...templateData[templateKey] };
      delete templateCardData['ll_key'];
      dataFromTemplate = { ...dataFromTemplate, ...(templateCardData?.ll_context || {}) };
      // If data in template, find and replace each key
      let template = JSON.stringify(templateCardData);
      template = await TemplateEngine.instance.render(template, dataFromTemplate, engineType);
      try {
        // Convert rendered string back to JSON
        data = JSON.parse(template);

        // If ll_card_config is present, parse and shallow-merge it into the main card config.
        // This allows templates to inject complex objects into the card configuration.
        if (data.ll_card_config) {
          try {
            // Parse the ll_card_config JSON string into an object
            const cardConfig = JSON.parse(data.ll_card_config);
            // Merge the parsed config into the main card config (shallow merge, overwrites existing keys)
            data = { ...data, ...cardConfig };
            // Remove ll_card_config after merging to avoid leaking template internals
            delete data.ll_card_config;
          } catch (e) {
            // If parsing fails, log an error and leave ll_card_config as-is for debugging
            console.error(`Failed to parse ll_card_config for template '${templateKey}':`, e);
          }
        }
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
      const updatedData = {};
      for (const cardKey of Object.keys(originalCardData.ll_keys || {})) {
        const originalDataFromTemplate = Object.assign({}, dataFromTemplate);
        if (typeof originalDataFromTemplate[cardKey] === 'object') {
          if (Array.isArray(originalDataFromTemplate[cardKey]) && typeof originalDataFromTemplate[cardKey][0] === 'object') {
            updatedData[cardKey] = [];
            for (let i = 0; i < originalDataFromTemplate[cardKey]['length']; i++) {
              const newLLData = { ...originalDataFromTemplate[cardKey][i].ll_context, ...originalDataFromTemplate };
              delete newLLData[cardKey];
              const oldData = { ...{ ...originalDataFromTemplate[cardKey][i] } };
              const result = await updateCardTemplate(oldData, templateData, newLLData);
              updatedData[cardKey].push(result);
            }
          } else {
            try {
              const newLLData = { ...originalDataFromTemplate };
              delete newLLData[cardKey];
              const oldData = { ...originalDataFromTemplate[cardKey] };
              updatedData[cardKey] = await updateCardTemplate(oldData, templateData, newLLData);
            } catch (e) {
              console.log(`Couldn't Update card key '${cardKey}. Provide the following object when submitting an issue to the developer.`, data, e);
            }
          }
        }
      }
      Object.keys(updatedData).forEach((k) => {
        data[k] = updatedData[k];
      });
      // Put template data back in card
      data = { ...{ ll_context: dataFromTemplate, ll_keys: originalCardData.ll_keys, ...data }, ll_context: dataFromTemplate, ll_keys: originalCardData.ll_keys };
      if (typeof data.ll_context !== 'undefined' && Object.keys(data.ll_context || {}).length === 0) {
        delete data.ll_context;
      }
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
          for (let j = 0; j < (data.sections[i].cards as DashboardCard[]).length; j++) {
            const card = data.sections[i].cards[j] as DashboardCard;
            data.sections[i].cards[j] = await updateCardTemplate(card, templateData, dataFromTemplate);
          }
        }
      }
    }
    if (Array.isArray(data.cards)) {
      // Update any cards in the card
      const cards: DashboardCard[] = [];
      for (const card of data.cards) {
        cards.push(Object.assign({}, await updateCardTemplate(card, templateData, dataFromTemplate)));
      }
      data.cards = cards;
    }

    if (data.card && !Array.isArray(data.card)) {
      data.card = Object.assign({}, await updateCardTemplate(data.card, templateData, dataFromTemplate));
    }
    // this handles all nested objects that may contain a template, like tap actions
    const cardKeys = Object.keys(data);
    const updatedData = {};
    for (const cardKey of cardKeys) {
      if (cardKey !== 'card' && data[cardKey] !== null && typeof data[cardKey] === 'object') {
        try {
          updatedData[cardKey] = await updateCardTemplate(data[cardKey], templateData, dataFromTemplate);
        } catch (e) {
          console.log(`Couldn't Update card key '${cardKey}'. Provide the following object when submitting an issue to the developer.`, data, e);
        }
      }
    }
    Object.keys(updatedData).forEach((k) => {
      data[k] = updatedData[k];
    });
  }
  if (data.hasOwnProperty('ll_keys') && typeof data.ll_keys === 'undefined') {
    delete data.ll_keys;
  }
  return data;
};
