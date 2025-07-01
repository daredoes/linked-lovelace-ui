import { getUpdatedCardFromContextData } from "./getUpdatedCardFromContextData";

describe('[function] getUpdatedCardFromContextData', () => {
  test('returns undefined when the onTemplateObject throws any error', () => {
    expect(getUpdatedCardFromContextData({
      cardToUpdate: {type: "a"},
      contextData: {},
      key: 'test',
      onTemplateObject: (_cardToUpdate, _contextData) => {
        throw new Error('test')
      },
    })).toBeUndefined();
  });

  test('returns the result of the onTemplateObject when it does not throw any error', () => {
    expect(getUpdatedCardFromContextData({
      cardToUpdate: {type: "a"},
      contextData: {},
      key: 'test',
      onTemplateObject: (_cardToUpdate, _contextData) => {
        return {type: "b"}
      },
    })).toStrictEqual({type: "b"});
  });
  
  test('removes the key from the card when it exists', () => {
    expect(getUpdatedCardFromContextData({
      cardToUpdate: {type: "a"},
      contextData: {test: "b"},
      key: 'test',
      onTemplateObject: (cardToUpdate, contextData) => {
        return {...cardToUpdate, ...contextData}
      },
    })).toStrictEqual({type: "a"});
  });
})