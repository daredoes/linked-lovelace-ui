import type { DashboardCard } from '../../types/DashboardCard';
import type { LinkedLovelaceUpdatableConstants } from '../../constants';
import { OnTemplateObject } from './types';
import { didAddKeyFromTemplate } from './didAddKeyFromTemplate';

export const onTemplateObjectFactory = (linkedLovelaceUpdatableConstants: LinkedLovelaceUpdatableConstants, templateData: Record<string | number | symbol, any>) => {
  const onTemplateObject: OnTemplateObject = (obj, contextData) => {
    const newData =  didAddKeyFromTemplate({
      contextData,
      linkedLovelaceUpdatableConstants,
      originalCardData: obj,
      templateData,
      templateKey: (obj as DashboardCard)[linkedLovelaceUpdatableConstants.useTemplateKey],
      onTemplateObject,
    })
    if (newData) return newData
    return obj
  }
  return onTemplateObject
}