import type { DashboardCard } from '../../types/DashboardCard';
import { objectHasValidKey } from './objectHasValidKey';

export const walkViewForTemplates = <T>(
  obj: T,
  onTemplateObject: (obj: DashboardCard, contextData: Record<string | number | symbol, any>) => DashboardCard,
  key: string
): DashboardCard[] => {
  if (objectHasValidKey(obj, key)) {
    // This object is a template card itself. Process it and return.
    // We don't recurse further into it, as template cards define a boundary.
    return [onTemplateObject(obj as DashboardCard, {})];
  }

  if (Array.isArray(obj)) {
    // If it's an array, walk each item and flatten the results.
    return obj.flatMap(item => walkViewForTemplates(item, onTemplateObject, key));
  }

  if (typeof obj === 'object' && obj !== null) {
    // If it's an object, walk each of its values and flatten the results.
    return Object.values(obj).flatMap(value => walkViewForTemplates(value, onTemplateObject, key));
  }

  // If it's not a template, an array, or an object, it can't contain templates.
  return [];
};
