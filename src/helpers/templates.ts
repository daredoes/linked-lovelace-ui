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
  targetCard: DashboardCard,
  templateCards: Record<string, any> = {},
  parentContext: Record<string, any> = {},
): Promise<DashboardCard> => {

  let templateContext: Record<string, any> = { ...parentContext, ...(targetCard.ll_context || {}) };

  // If the targetCard has no template, it might still have nested cards that need to be processed.
  if (!targetCard.ll_template || templateCards[targetCard.ll_template] === undefined) {
    return handleNestedCards(targetCard, templateCards, templateContext);
  }

  const llKeys = targetCard.ll_keys;
  const llContext = targetCard.ll_context;
  const llTemplate = targetCard.ll_template;
  const templateCard = templateCards[llTemplate];

  let engineType: TemplateEngineType = 'eta';
  if (templateCard.ll_template_engine === 'jinja2') engineType = 'jinja2';

  // destination card context should override template context
  templateContext = { ...(templateCard?.ll_context || {}), ...templateContext };

  try {
    // Render the template with the context
    let template = await TemplateEngine.instance.render(JSON.stringify(templateCard), templateContext, engineType);

    // Assign the parsed template to targetCard
    targetCard = JSON.parse(template);

    if (targetCard.ll_card_config) {
      try {
        // Parse the ll_card_config JSON string into an object
        const cardConfig = JSON.parse(targetCard.ll_card_config);
        // Merge the parsed config into the main card config (shallow merge, overwrites existing keys)
        targetCard = { ...targetCard, ...cardConfig };
      } catch (e) {
        throw new Error(`Failed to parse ll_card_config for template '${llTemplate}': ${e}`);
      }
    }
  } catch (e) {
    console.error(e);
    targetCard.ll_error = `Error rendering template '${llTemplate}': ${e}`;
  }

  // Set a deterministic key order to avoid noisy diffs
  targetCard = {
    ll_error: targetCard.ll_error,
    ll_template: llTemplate,
    ll_context: llContext,
    ll_keys: llKeys,
    ...targetCard
  };

  // Clean up empty, unused or undefined properties
  delete targetCard.ll_key;

  if (!targetCard.ll_keys) {
    delete targetCard.ll_keys;
  }

  if (!targetCard.ll_context) {
    delete targetCard.ll_context;
  }

  if (!targetCard.ll_error) {
    delete targetCard.ll_error;
  }


  targetCard = await handleLLKeys(targetCard, templateCards, templateContext);

  return targetCard
};

const handleLLKeys = async (targetCard: DashboardCard,
  templateCards: Record<string, any> = {},
  templateContext: Record<string, any> = {}): Promise<DashboardCard> => {

  if (targetCard.ll_keys === undefined || Object.keys(targetCard.ll_keys).length === 0) {
    return targetCard;
  }

  const llKeys = targetCard.ll_keys;

  // Handle ll_keys
  Object.keys(llKeys).forEach((ll_key) => {
    const key = llKeys[ll_key]
    if (key) {
      const linkedLovelaceKeyData = templateContext ? templateContext[key] : undefined;
      if (linkedLovelaceKeyData) {
        targetCard[key] = linkedLovelaceKeyData
      }
    }
  });

  const updatedData = {};
  for (const cardKey of Object.keys(llKeys)) {
    const originalDataFromTemplate = Object.assign({}, templateContext);
    if (typeof originalDataFromTemplate[cardKey] === 'object') {
      if (Array.isArray(originalDataFromTemplate[cardKey]) && typeof originalDataFromTemplate[cardKey][0] === 'object') {
        updatedData[cardKey] = [];
        for (let i = 0; i < originalDataFromTemplate[cardKey]['length']; i++) {
          const newLLData = { ...originalDataFromTemplate[cardKey][i].ll_context, ...originalDataFromTemplate };
          delete newLLData[cardKey];
          const oldData = { ...{ ...originalDataFromTemplate[cardKey][i] } };
          const result = await updateCardTemplate(oldData, templateCards, newLLData);
          updatedData[cardKey].push(result);
        }
      } else {
        try {
          const newLLData = { ...originalDataFromTemplate };
          delete newLLData[cardKey];
          const oldData = { ...originalDataFromTemplate[cardKey] };
          updatedData[cardKey] = await updateCardTemplate(oldData, templateCards, newLLData);
        } catch (e) {
          console.log(`Couldn't Update card key '${cardKey}. Provide the following object when submitting an issue to the developer.`, targetCard, e);
        }
      }
    }
  }
  Object.keys(updatedData).forEach((k) => {
    targetCard[k] = updatedData[k];
  });

  return targetCard;
}

const handleNestedCards = async (
  targetCard: DashboardCard,
  templateCards: Record<string, any> = {},
  templateContext: Record<string, any> = {},
): Promise<DashboardCard> => {
  // Support for new sections dashboards.
  if (targetCard.sections && Array.isArray(targetCard.sections)) {
    for (let i = 0; i < targetCard.sections.length; i++) {
      if (targetCard.sections[i].cards && Array.isArray(targetCard.sections[i].cards)) {
        for (let j = 0; j < (targetCard.sections[i].cards as DashboardCard[]).length; j++) {
          const card = targetCard.sections[i].cards[j] as DashboardCard;
          targetCard.sections[i].cards[j] = await updateCardTemplate(card, templateCards, templateContext);
        }
      }
    }
  }
  if (Array.isArray(targetCard.cards)) {
    // Update any cards in the card
    const cards: DashboardCard[] = [];
    for (const card of targetCard.cards) {
      cards.push(Object.assign({}, await updateCardTemplate(card, templateCards, templateContext)));
    }
    targetCard.cards = cards;
  }

  if (targetCard.card && !Array.isArray(targetCard.card)) {
    targetCard.card = Object.assign({}, await updateCardTemplate(targetCard.card, templateCards, templateContext));
  }

  // this handles all nested objects that may contain a template, like tap actions
  const cardKeys = Object.keys(targetCard);
  const updatedData = {};
  for (const cardKey of cardKeys) {
    if (cardKey !== 'card' && targetCard[cardKey] !== null && typeof targetCard[cardKey] === 'object') {
      try {
        updatedData[cardKey] = await updateCardTemplate(targetCard[cardKey], templateCards, templateContext);
      } catch (e) {
        console.log(`Couldn't Update card key '${cardKey}'. Provide the following object when submitting an issue to the developer.`, targetCard, e);
      }
    }
  }
  Object.keys(updatedData).forEach((k) => {
    targetCard[k] = updatedData[k];
  });

  return targetCard;
}