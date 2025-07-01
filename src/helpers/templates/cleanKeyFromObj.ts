// Removes a key from an object if the value is undefined, null, empty string, empty object, empty array, but not zero
export const cleanKeyFromObj = (obj: unknown, key: string) => {
  if (typeof obj === 'object' && obj) {
    if (obj.hasOwnProperty(key)) {
      if ((typeof obj[key] === 'undefined' || (!obj[key] && obj[key] !== 0)) || (typeof obj[key] === 'object' && !Object.keys(obj[key]).length)) {
        delete obj[key];
      }
    }
  }
  return obj
}
