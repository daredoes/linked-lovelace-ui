import type { DashboardView } from '../../types/DashboardView';
import { objectHasValidKey } from './objectHasValidKey';

describe('[function] objectHasValidKey', () => {

  let expectedResult = true;
  let key: string | number | symbol | boolean = 'test';
  let value = 'test';
  let obj: unknown = undefined;

  beforeEach(() => {
    if (typeof key === 'boolean') {
      return;
    }
    obj = { [key]: value };
  })

  test('returns true when obj exists with string key', () => {
    expect(objectHasValidKey(obj, key)).toStrictEqual(expectedResult);
  });

  test('returns true when obj exists with number key', () => {
    key = 1;
    obj = { [key]: value };
    expect(objectHasValidKey(obj, key)).toStrictEqual(expectedResult);
  });

  test('returns true when obj exists with symbol key', () => {
    key = Symbol('test');
    obj = { [key]: value };
    expect(objectHasValidKey(obj, key)).toStrictEqual(expectedResult);
  });

  test('returns false when using boolean key', () => {
    expectedResult = false;
    key = true;
    expect(objectHasValidKey(obj, key)).toStrictEqual(expectedResult);
  });

  test('returns false when obj does not exist', () => {
    expectedResult = false;
    obj = undefined;
    expect(objectHasValidKey(obj, key)).toStrictEqual(expectedResult);
  });

  test('returns false when key does not exist', () => {
    expectedResult = false;
    key = 'test2';
    expect(objectHasValidKey(obj, key)).toStrictEqual(expectedResult);
  });
});
