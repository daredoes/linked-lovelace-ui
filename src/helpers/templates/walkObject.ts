import type { DashboardCard } from '../../types/DashboardCard';
import { objectHasValidKey } from './objectHasValidKey';
import { defaultLinkedLovelaceUpdatableConstants } from '../../constants';
import type { LinkedLovelaceUpdatableConstants } from '../../constants';
import type { OnTemplateObject } from './types';

export const walkObject = <T>(
  obj: T,
  contextData: Record<string | number | symbol, any>,
  onTemplateObject: OnTemplateObject,
  linkedLovelaceUpdatableConstants: LinkedLovelaceUpdatableConstants = defaultLinkedLovelaceUpdatableConstants,
  skipUpdate?: boolean
): T | DashboardCard | unknown[] => {
  contextData = {...contextData, ...(obj[linkedLovelaceUpdatableConstants.contextKey] || {})};
  // if has template key, do template work to replace obj and return
  if (objectHasValidKey(obj, linkedLovelaceUpdatableConstants.useTemplateKey)) {
    return onTemplateObject(obj as DashboardCard, contextData, skipUpdate)
  } else if ( !skipUpdate && objectHasValidKey(obj, linkedLovelaceUpdatableConstants.isTemplateKey)) {
    skipUpdate = true;
    if (obj[linkedLovelaceUpdatableConstants.isTemplateKey] == "mode-selector") {
      console.log("skipping update", obj)
    }
  }
  // if obj is an array, loop over it and replace each item
  if (Array.isArray(obj)) {
    const newData: unknown[] = []
    obj.forEach((item) => {
      newData.push(walkObject(item, contextData, onTemplateObject, linkedLovelaceUpdatableConstants, skipUpdate))
    })
    if (newData) return newData
  }
  if (Boolean(typeof obj === 'object' && obj)) {
    Object.entries(obj as object).forEach(([k, v]) => {
      if (k === linkedLovelaceUpdatableConstants.useTemplateKey) return;
      const typeOfV  =typeof v
      if (typeOfV === "string" || typeOfV === "number" || typeOfV === "boolean") return; // types we don't need to walk
      const newObject = walkObject(v, contextData, onTemplateObject, linkedLovelaceUpdatableConstants, skipUpdate)
      if (newObject) obj[k] = newObject
    })
  }
  return obj
}
