import type { DashboardHolderCard } from '../../types/DashboardHolderCard';
import { objectHasValidKey } from './objectHasValidKey';
import { LINKED_LOVELACE_PARTIALS, defaultLinkedLovelaceUpdatableConstants } from '../../constants';
import { getPartialsFromCard } from '../eta';
import type {PartialsAndTemplates} from "./types"

// This function should be used to walk a view and extract all partials and templates from it.
// It will return an object containing all partials and templates found in the view.
export const walkViewForPartialsAndTemplates = async <T>(
  obj: T,
  partialsAndTemplates: PartialsAndTemplates
): Promise<PartialsAndTemplates> => {
  if (objectHasValidKey(obj, "type")) {
    if ((obj as DashboardHolderCard).type === `custom:${LINKED_LOVELACE_PARTIALS}`) {
      const partialsData = (await getPartialsFromCard(obj as DashboardHolderCard))
      return {partials: {...partialsAndTemplates.partials, ...partialsData}, templates: partialsAndTemplates.templates}
     }
  }

  if (objectHasValidKey(obj, defaultLinkedLovelaceUpdatableConstants.isTemplateKey)) {
    return {
      partials: partialsAndTemplates.partials,
      templates: {
        ...partialsAndTemplates.templates,
         [(obj as DashboardHolderCard)[defaultLinkedLovelaceUpdatableConstants.isTemplateKey]]: obj as DashboardHolderCard
        }
      }
  }
    

  if (Array.isArray(obj)) {
    // If it's an array, walk each item and flatten the results.
    const promises = obj.map((item) => walkViewForPartialsAndTemplates(item, partialsAndTemplates));
    const results = await Promise.all(promises);
    return results.reduce((acc, result) => ({ partials: {...acc.partials, ...result.partials}, templates: {...acc.templates, ...result.templates} }), partialsAndTemplates);
  }

  if (typeof obj === 'object' && obj !== null) {
    const promises = Object.values(obj).map((value) => walkViewForPartialsAndTemplates(value, partialsAndTemplates));
    const results = await Promise.all(promises);
    return results.reduce((acc, result) => ({ partials: {...acc.partials, ...result.partials}, templates: {...acc.templates, ...result.templates} }), partialsAndTemplates);
  }

  // If it's not a partial, an array, or an object, it can't contain partials.
  return partialsAndTemplates;
};
