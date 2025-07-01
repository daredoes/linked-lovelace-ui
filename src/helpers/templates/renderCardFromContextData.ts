import type { DashboardCard } from '../../types/DashboardCard';
import type { LinkedLovelaceUpdatableConstants } from '../../constants';
import {extractCardDataWithTemplateContext} from './extractCardDataWithTemplateContext'
import { parseTemplateCardData } from './parseTemplateCardData';
import { OnTemplateObject } from './types';
import { parseContextKeysIntoRenderedCards} from './parseContextKeysIntoRenderedCards'
import { cleanKeyFromObj } from './cleanKeyFromObj'

interface RenderCardFromContextData {
  linkedLovelaceUpdatableConstants: LinkedLovelaceUpdatableConstants,
  contextData?: Record<string | number | symbol, any>
  sourceCardData: DashboardCard,
  templateData?: Record<string | number | symbol, any>
  templateKey: string | number | symbol
  onTemplateObject: OnTemplateObject
}

export const renderCardFromContextData = ({
  contextData = {},
  linkedLovelaceUpdatableConstants,
  sourceCardData,
  templateData = {},
  templateKey,
  onTemplateObject,
}: RenderCardFromContextData) => {
  const { isTemplateKey, contextKey, contextKeys} = linkedLovelaceUpdatableConstants;
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
    onTemplateObject,
  })
  Object.keys(updatedData).forEach((k) => {
    data[k] = updatedData[k]
  })
  // Put template data back in card
  data = { ...{ [contextKey]: contextData, [contextKeys]: sourceCardData[contextKeys], ...data }, [contextKey]: contextData, [contextKeys]: sourceCardData[contextKeys] };
  data = cleanKeyFromObj(data, contextKeys)
  data = cleanKeyFromObj(data, isTemplateKey)
  data = cleanKeyFromObj(data, contextKeys)
  return data
}


