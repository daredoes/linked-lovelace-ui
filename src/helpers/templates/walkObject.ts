import type { DashboardCard } from '../../types/DashboardCard';
import { objectHasValidKey } from './objectHasValidKey';
import { defaultLinkedLovelaceUpdatableConstants } from '../../constants';
import type { LinkedLovelaceUpdatableConstants } from '../../constants';
import { cleanKeyFromObj } from './cleanKeyFromObj';

export const walkObject = <T>(obj: T, contextData: Record<string | number | symbol, any>, onTemplateObject: (obj: DashboardCard, contextData: Record<string | number | symbol, any>) => DashboardCard, linkedLovelaceUpdatableConstants: LinkedLovelaceUpdatableConstants = defaultLinkedLovelaceUpdatableConstants): T | DashboardCard | unknown[] => {
  // if has template key, do template work to replace obj and return
  const { useTemplateKey, contextKey, isTemplateKey, contextKeys } = linkedLovelaceUpdatableConstants
  contextData = {...contextData, ...(obj[contextKey] || {})};
  if (objectHasValidKey(obj, useTemplateKey)) {
    return onTemplateObject(obj as DashboardCard, contextData)
  }
  // if obj is an array, loop over it and replace each item
  if (Array.isArray(obj)) {
    const newData: unknown[] = []
    obj.forEach((item) => {
      newData.push(walkObject(item, contextData, onTemplateObject, linkedLovelaceUpdatableConstants))
    })
    if (newData) return newData
  }
  if (typeof obj === 'object' && obj) {
    Object.entries(obj).forEach(([k, v]) => {
      if (k === useTemplateKey) return;
      const newObject = walkObject(v, contextData, onTemplateObject, linkedLovelaceUpdatableConstants)
      if (newObject) obj[k] = newObject
    })
    obj = cleanKeyFromObj(obj, contextKeys) as T
    obj = cleanKeyFromObj(obj, isTemplateKey) as T
    obj = cleanKeyFromObj(obj, contextKeys) as T
  }
  return obj
}
