import type { DashboardCard } from '../../types/DashboardCard';
import { objectHasValidKey } from './objectHasValidKey';
import { defaultLinkedLovelaceUpdatableConstants } from '../../constants';
import type { LinkedLovelaceUpdatableConstants } from '../../constants';

export const walkViewForTemplates = <T>(
  obj: T,
  onTemplateObject: (obj: DashboardCard, contextData: Record<string | number | symbol, any>) => DashboardCard,
  linkedLovelaceUpdatableConstants: LinkedLovelaceUpdatableConstants = defaultLinkedLovelaceUpdatableConstants
): DashboardCard[] => {
  if (objectHasValidKey(obj, linkedLovelaceUpdatableConstants.isTemplateKey)) {
    // This object is a template card itself. Process it and return.
    // We don't recurse further into it, as template cards define a boundary.
    return [onTemplateObject(obj as DashboardCard, {})];
  }

  if (Array.isArray(obj)) {
    // If it's an array, walk each item and flatten the results.
    return obj.flatMap(item => walkViewForTemplates(item, onTemplateObject, linkedLovelaceUpdatableConstants));
  }

  if (typeof obj === 'object' && obj !== null) {
    // If it's an object, walk each of its values and flatten the results.
    return Object.values(obj).flatMap(value => walkViewForTemplates(value, onTemplateObject, linkedLovelaceUpdatableConstants));
  }

  // If it's not a template, an array, or an object, it can't contain templates.
  return [];
};
