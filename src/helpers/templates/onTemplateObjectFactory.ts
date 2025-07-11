import type { DashboardCard } from '../../types/DashboardCard';
import type { LinkedLovelaceUpdatableConstants } from '../../constants';
import { OnTemplateObject } from './types';
import { didAddKeyFromTemplate } from './didAddKeyFromTemplate';

export const onTemplateObjectFactory = (linkedLovelaceUpdatableConstants: LinkedLovelaceUpdatableConstants, templateData: Record<string | number | symbol, any>) => {
  const onTemplateObject: OnTemplateObject = (obj, contextData, skipUpdate) => {
    if ((obj as DashboardCard)[linkedLovelaceUpdatableConstants.useTemplateKey] == "mode-selector") {
      console.log("skipping update obj", obj)
    }
    const newData =  didAddKeyFromTemplate({
      contextData,
      linkedLovelaceUpdatableConstants,
      originalCardData: obj,
      templateData,
      templateKey: (obj as DashboardCard)[linkedLovelaceUpdatableConstants.useTemplateKey],
      onTemplateObject,
      skipUpdate
    })
    if (newData) return newData
    return obj
  }
  return onTemplateObject
}