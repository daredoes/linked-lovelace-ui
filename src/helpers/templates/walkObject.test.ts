import { walkObject } from './walkObject';

describe('walkObject', () => {
  const onTemplateObject = jest.fn((card) => {
    return { ...card, templated: true };
  });

  beforeEach(() => {
    onTemplateObject.mockClear();
  });

  it('should walk through a nested object and apply the onTemplateObject function', () => {
    const obj = {
      type: 'parent',
      card: {
        type: 'child',
        ll_template: 'my_template',
      },
    };
    const result = walkObject(obj, {}, onTemplateObject);
    expect(onTemplateObject).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      type: 'parent',
      card: {
        type: 'child',
        ll_template: 'my_template',
        templated: true,
      },
    });
  });

  it('should walk through an array and apply the onTemplateObject function', () => {
    const obj = [
      { type: 'card1' },
      { type: 'card2', ll_template: 'my_template' },
    ];
    const result = walkObject(obj, {}, onTemplateObject);
    expect(onTemplateObject).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      { type: 'card1' },
      { type: 'card2', ll_template: 'my_template', templated: true },
    ]);
  });

  it('should merge context data as it walks through the object', () => {
    const obj = {
      type: 'parent',
      ll_context: { parent_context: 'data' },
      card: {
        type: 'child',
        ll_template: 'my_template',
        ll_context: { child_context: 'data' },
      },
    };
    walkObject(obj, {}, onTemplateObject);
    expect(onTemplateObject).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        parent_context: 'data',
        child_context: 'data',
      })
    );
  });

  it('should return the object unmodified if no templates are found', () => {
    const obj = {
      type: 'parent',
      card: {
        type: 'child',
      },
    };
    const result = walkObject(obj, {}, onTemplateObject);
    expect(onTemplateObject).not.toHaveBeenCalled();
    expect(result).toEqual(obj);
  });
});
