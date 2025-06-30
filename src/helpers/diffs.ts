import { stringify } from './stringify';
import Diff from './diff';

export const createDiff = (obj1 = {}, obj2 = {}) => {
  try {

    const differ = new Diff()
    const di = differ.main(stringify(obj1), stringify(obj2), false, 0) 
    return di;
  } catch (e) {
    console.error(e)
    return []
  }
}

export const hasDiff = (obj1 = {}, obj2 = {}) => {
  const di = createDiff(obj1, obj2)
  return di.length > 1;
}

export const makeDiffHtml = (obj1 = {}, obj2 = {}) => {
  try {
    const differ = new Diff()
    const diff = createDiff(obj1, obj2)
    const result = differ.prettyHtml(diff)
    return result;
  } catch (e) {
    console.error(e)
    return `Could not create diff. Check browser logs for details.`
  }
}