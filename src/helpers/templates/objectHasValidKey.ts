export const objectHasValidKey = (obj?: unknown, key?: string | number | symbol | boolean ): key is string | number | symbol => {
    if (typeof key === 'boolean') {
        return false;
    }
    return Boolean(key && obj && typeof obj === 'object' && typeof obj[key] !== 'undefined');
}
