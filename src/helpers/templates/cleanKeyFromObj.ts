export const cleanKeyFromObj = (obj: unknown, key: string) => {
  if (typeof obj === 'object' && obj) {
    if (obj.hasOwnProperty(key)) {
      if ((typeof obj[key] === 'undefined' || !obj[key]) || (typeof obj[key] === 'object' && !Object.keys(obj[key]).length)) {
        delete obj[key];
      }
    }
  }
  return obj
}
