import { TemplateEngine } from '../v2/template-engine';
import { DashboardCard, DashboardView } from '../types';

export const getTemplatesUsedInCard = (card: DashboardCard): string[] => {
  const templates: string[] = [];
  const stack: any[] = [card];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current !== 'object') continue;
    if (current.ll_template) {
      templates.push(current.ll_template);
      continue;
    }
    if (current.sections && Array.isArray(current.sections)) {
      for (let i = current.sections.length - 1; i >= 0; i--) {
        if (current.sections[i].cards && Array.isArray(current.sections[i].cards)) {
          for (let j = current.sections[i].cards.length - 1; j >= 0; j--) {
            stack.push(current.sections[i].cards[j]);
          }
        }
      }
    }
    if (current.cards && Array.isArray(current.cards)) {
      for (let i = current.cards.length - 1; i >= 0; i--) {
        stack.push(current.cards[i]);
      }
    }
    if (current.card) {
      stack.push(current.card);
    }
  }
  return templates;
};

export const getTemplatesUsedInView = (view: DashboardView): string[] => {
  const templates: string[] = [];
  if (view.cards) {
    for (const card of view.cards) {
      templates.push(...getTemplatesUsedInCard(card));
    }
  }
  if (view.sections && Array.isArray(view.sections)) {
    for (const section of view.sections) {
      if (section.cards && Array.isArray(section.cards)) {
        for (const card of section.cards) {
          templates.push(...getTemplatesUsedInCard(card));
        }
      }
    }
  }
  return templates;
};

export const updateCardTemplate = (
  initialData: DashboardCard,
  templateData: Record<string, any> = {},
  initialContext: Record<string, any> = {},
  maxDepth: number = 100
): DashboardCard => {
  const root = { result: Array.isArray(initialData) ? [...initialData] : { ...initialData } };
  const stack: {
    node: any;
    context: any;
    parent: any;
    key: string | number;
    depth: number;
    visitedTemplates: Set<string>;
  }[] = [
    {
      node: root.result,
      context: initialContext,
      parent: root,
      key: "result",
      depth: 0,
      visitedTemplates: new Set(),
    },
  ];

  while (stack.length > 0) {
    const { node, context, parent, key, depth, visitedTemplates } = stack.pop()!;

    if (depth > maxDepth) {
      console.warn(`Max depth reached at key ${key}`);
      continue;
    }

    if (typeof node !== "object" || node === null) {
      continue;
    }

    let currentData = node;
    const templateKey = currentData.ll_template;
    let contextFromCard = currentData.ll_context || {};
    if (typeof contextFromCard === 'string') {
      try {
        contextFromCard = JSON.parse(contextFromCard);
      } catch (e) {
        // ignore
      }
    }
    let dataFromTemplate = { ...context, ...contextFromCard };

    if (templateKey && templateData[templateKey]) {
      if (visitedTemplates.has(templateKey)) {
        console.error(`Circular template reference detected: ${templateKey}`);
        continue;
      }
      const newVisited = new Set(visitedTemplates);
      newVisited.add(templateKey);

      const templateCardData = Array.isArray(templateData[templateKey]) ? [...templateData[templateKey]] : { ...templateData[templateKey] };
      delete templateCardData["ll_key"];
      dataFromTemplate = {
        ...dataFromTemplate,
        ...(templateCardData?.ll_context || {}),
      };

      let templateStr = JSON.stringify(templateCardData);
      try {
        templateStr = TemplateEngine.instance.eta.renderString(templateStr, dataFromTemplate);
        const renderedData = JSON.parse(templateStr);
        // Merge rendered data into currentData, preserving ll_template and other internal keys
        Object.keys(currentData).forEach(k => {
          if (k !== 'll_template' && k !== 'll_context' && k !== 'll_keys') {
            delete currentData[k];
          }
        });
        Object.assign(currentData, renderedData);
      } catch (e) {
        console.error(e);
        Object.assign(currentData, templateData[templateKey]);
      }

      const originalLlKeys = currentData.ll_keys;
      if (originalLlKeys) {
        if (Array.isArray(originalLlKeys)) {
          originalLlKeys.forEach((key) => {
            if (key && dataFromTemplate[key] !== undefined) {
              currentData[key] = Array.isArray(dataFromTemplate[key]) ? [...dataFromTemplate[key]] : (typeof dataFromTemplate[key] === 'object' && dataFromTemplate[key] !== null ? { ...dataFromTemplate[key] } : dataFromTemplate[key]);
            }
          });
        } else {
          Object.keys(originalLlKeys).forEach((cardKey) => {
            const contextKey = originalLlKeys[cardKey];
            if (contextKey && dataFromTemplate[contextKey] !== undefined) {
              // console.log(`Mapping ${contextKey} to ${cardKey}: ${dataFromTemplate[contextKey]}`);
              currentData[cardKey] = Array.isArray(dataFromTemplate[contextKey]) ? [...dataFromTemplate[contextKey]] : (typeof dataFromTemplate[contextKey] === 'object' && dataFromTemplate[contextKey] !== null ? { ...dataFromTemplate[contextKey] } : dataFromTemplate[contextKey]);
            }
          });
        }

        Object.keys(originalLlKeys).forEach((cardKey) => {
          const contextKey = Array.isArray(originalLlKeys) ? originalLlKeys[cardKey as any] : originalLlKeys[cardKey];
          const val = dataFromTemplate[contextKey];
          if (typeof val === 'object' && val !== null) {
            if (Array.isArray(val)) {
              currentData[cardKey] = [...val];
              for (let i = val.length - 1; i >= 0; i--) {
                if (typeof val[i] === 'object' && val[i] !== null) {
                  currentData[cardKey][i] = Array.isArray(val[i]) ? [...val[i]] : { ...val[i] };
                  const newLLData = { ...val[i].ll_context, ...dataFromTemplate };
                  delete newLLData[cardKey];
                  stack.push({
                    node: currentData[cardKey][i],
                    context: newLLData,
                    parent: currentData[cardKey],
                    key: i,
                    depth: depth + 1,
                    visitedTemplates: new Set(visitedTemplates)
                  });
                }
              }
            } else {
              currentData[cardKey] = { ...val };
              const newLLData = { ...dataFromTemplate };
              delete newLLData[cardKey];
              stack.push({
                    node: currentData[cardKey],
                    context: newLLData,
                    parent: currentData,
                    key: cardKey,
                    depth: depth + 1,
                    visitedTemplates: new Set(visitedTemplates)
                });
            }
          }
        });
      }

      currentData.ll_template = templateKey;
      currentData.ll_context = dataFromTemplate;
      if (originalLlKeys) {
        currentData.ll_keys = originalLlKeys;
      }
      if (currentData.ll_context && Object.keys(currentData.ll_context).length === 0) {
        delete currentData.ll_context;
      }

    } else {
      // Process children
      if (currentData.sections && Array.isArray(currentData.sections)) {
        currentData.sections = [...currentData.sections];
        for (let i = currentData.sections.length - 1; i >= 0; i--) {
          if (currentData.sections[i].cards && Array.isArray(currentData.sections[i].cards)) {
            currentData.sections[i] = { ...currentData.sections[i] };
            currentData.sections[i].cards = [...currentData.sections[i].cards];
            for (let j = currentData.sections[i].cards.length - 1; j >= 0; j--) {
              if (typeof currentData.sections[i].cards[j] === 'object' && currentData.sections[i].cards[j] !== null) {
                currentData.sections[i].cards[j] = Array.isArray(currentData.sections[i].cards[j]) ? [...currentData.sections[i].cards[j]] : { ...currentData.sections[i].cards[j] };
                stack.push({
                  node: currentData.sections[i].cards[j],
                  context: dataFromTemplate,
                  parent: currentData.sections[i].cards,
                  key: j,
                  depth: depth + 1,
                  visitedTemplates: new Set(visitedTemplates)
                });
              }
            }
          }
        }
      }

      if (Array.isArray(currentData.cards)) {
        currentData.cards = [...currentData.cards];
        for (let i = currentData.cards.length - 1; i >= 0; i--) {
          if (typeof currentData.cards[i] === 'object' && currentData.cards[i] !== null) {
            currentData.cards[i] = Array.isArray(currentData.cards[i]) ? [...currentData.cards[i]] : { ...currentData.cards[i] };
            stack.push({
              node: currentData.cards[i],
              context: dataFromTemplate,
              parent: currentData.cards,
              key: i,
              depth: depth + 1,
              visitedTemplates: new Set(visitedTemplates)
            });
          }
        }
      }

      if (currentData.card && !Array.isArray(currentData.card)) {
        currentData.card = { ...currentData.card };
        stack.push({
          node: currentData.card,
          context: dataFromTemplate,
          parent: currentData,
          key: 'card',
          depth: depth + 1,
          visitedTemplates: new Set(visitedTemplates)
        });
      }

      Object.keys(currentData).forEach(cardKey => {
        if (cardKey !== 'card' && cardKey !== 'cards' && cardKey !== 'sections' &&
          cardKey !== 'll_context' && cardKey !== 'll_keys' &&
          currentData[cardKey] !== null && typeof currentData[cardKey] === 'object') {
          currentData[cardKey] = Array.isArray(currentData[cardKey]) ? [...currentData[cardKey]] : { ...currentData[cardKey] };
          stack.push({
            node: currentData[cardKey],
            context: dataFromTemplate,
            parent: currentData,
            key: cardKey,
            depth: depth + 1,
            visitedTemplates: new Set(visitedTemplates)
          });
        }
      });
    }
  }

  return root.result as any;
};
