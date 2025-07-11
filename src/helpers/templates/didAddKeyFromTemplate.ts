import type { DashboardCard } from '../../types/DashboardCard';
import { objectHasValidKey } from './objectHasValidKey';
import type { LinkedLovelaceUpdatableConstants } from '../../constants';
import { cleanKeyFromObj } from './cleanKeyFromObj';
import { OnTemplateObject } from './types';
import { renderCardFromContextData } from './renderCardFromContextData'

interface DidAddKeyFromTemplate {
  contextData: Record<string | number | symbol, any>,
  linkedLovelaceUpdatableConstants: LinkedLovelaceUpdatableConstants,
  originalCardData: DashboardCard,
  templateData: Record<string | number | symbol, any>,
  templateKey: string | number | symbol,
  onTemplateObject: OnTemplateObject,
  skipUpdate?: boolean,
}

export const didAddKeyFromTemplate = ({
  contextData,
  linkedLovelaceUpdatableConstants,
  originalCardData,
  templateData,
  templateKey,
  onTemplateObject,
  skipUpdate,
}: DidAddKeyFromTemplate): DashboardCard | undefined => {
  const { useTemplateKey, contextKeys, contextKey, isTemplateKey } = linkedLovelaceUpdatableConstants
  if (objectHasValidKey(templateData, templateKey) || objectHasValidKey(originalCardData, isTemplateKey)) {
    let data = Object.assign({}, originalCardData);
    console.log(templateKey, data, skipUpdate, contextData)
    if (contextData && !skipUpdate) {
      data = renderCardFromContextData({
        contextData,
        linkedLovelaceUpdatableConstants,
        sourceCardData: originalCardData,
        templateData,
        templateKey,
        onTemplateObject,
      })
    } else {
      // Put template value as new value
      data = {[useTemplateKey]: templateKey, ...templateData[templateKey]};
      delete data[isTemplateKey]
    }
    // Put template key back in card
    data = { ...{ [useTemplateKey]: templateKey, [contextKeys]: originalCardData[contextKeys], ...data }, [useTemplateKey]: templateKey, [contextKeys]: originalCardData[contextKeys] };
    data = cleanKeyFromObj(data, contextKeys) as DashboardCard
    data = cleanKeyFromObj(data, contextKey) as DashboardCard
    return data;
  }
  return undefined
}
