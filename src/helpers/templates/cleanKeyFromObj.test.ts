import { cleanKeyFromObj } from "./cleanKeyFromObj";

describe('[function] cleanKeyFromObj', () => {
    let key = "a"
    let value: unknown = undefined;
    let obj = {};

  test('returns the same object when the value is present', () => {
    value = "a"
    obj = { [key]: value };
    const result = {...obj}
    expect(cleanKeyFromObj(obj, key)).toStrictEqual(result);
  });

  test('returns the same object when the value is zero', () => {
    value = 0
    obj = { [key]: value };
    const result = {...obj}
    expect(cleanKeyFromObj(obj, key)).toStrictEqual(result);
  })

  test('removes the key from the object when the value is an empty string', () => {
    value = ""
    obj = { [key]: value };
    expect(cleanKeyFromObj(obj, key)).toEqual({});
  });

  test('removes the key from the object when the value is undefined', () => {
    value = undefined
    obj = { [key]: value };
    expect(cleanKeyFromObj(obj, key)).toEqual({});
  });

  test('removes the key from the object when the value is null', () => {
    value = null
    obj = { [key]: value };
    expect(cleanKeyFromObj(obj, key)).toEqual({});
  });

  test('removes the key from the object when the value is an empty object', () => {
    value = {}
    obj = { [key]: value };
    expect(cleanKeyFromObj(obj, key)).toEqual({});
  });

  test('removes the key from the object when the value is an empty array', () => {
    value = []
    obj = { [key]: value };
    expect(cleanKeyFromObj(obj, key)).toEqual({});
  });
});
