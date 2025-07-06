import { objectHasValidKey } from './objectHasValidKey';
import type { DashboardCard } from '../../types/DashboardCard';

/**
 * Recursively walks through an object or array and replaces items that have a specific key.
 * This function modifies the object in place.
 *
 * @param obj The object or array to walk through.
 * @param key The key to look for to identify an object to be replaced.
 * @param replacer A function that takes the object to be replaced and returns its replacement.
 * @returns The modified object.
 */
export const walkAndReplace = <T>(
  obj: T,
  key: string,
  replacer: (item: DashboardCard, skipUpdate?: boolean) => DashboardCard,
  hasKeyParent = false
): T => {
  // If the current object is the one we're looking for, replace it and stop recursion.
  if (typeof obj === 'object' && obj !== null && !Array.isArray(obj) && objectHasValidKey(obj, key)) {
    return replacer(obj as unknown as DashboardCard, hasKeyParent) as T;
  }
  if (!hasKeyParent && objectHasValidKey(obj, "ll_key")) {
    hasKeyParent = true;
  }
  // If it's an array, recurse into each item.
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      obj[i] = walkAndReplace(obj[i], key, replacer, hasKeyParent);
    }
  }
  // If it's an object, recurse into each value.
  else if (typeof obj === 'object' && obj !== null) {
    for (const prop in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, prop)) {
        (obj as any)[prop] = walkAndReplace((obj as any)[prop], key, replacer, hasKeyParent);
      }
    }
  }

  return obj;
};
