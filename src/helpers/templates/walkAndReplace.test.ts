/**
 * @jest-environment jsdom
 */
import { walkAndReplace } from './walkAndReplace';

describe('walkAndReplace', () => {
  const replaceKey = 'll_replace_me';

  const replacer = (item) => {
    return { ...item, replaced: true };
  };

  it('should replace a simple object with the specified key', () => {
    const original = { [replaceKey]: true, data: 'original' };
    const result = walkAndReplace(original, replaceKey, replacer);
    expect(result).toEqual({ [replaceKey]: true, data: 'original', replaced: true });
  });

  it('should replace a nested object', () => {
    const original = {
      level1: {
        [replaceKey]: true,
        data: 'nested',
      },
    };
    const expected = {
      level1: {
        [replaceKey]: true,
        data: 'nested',
        replaced: true,
      },
    };
    const result = walkAndReplace(original, replaceKey, replacer);
    expect(result).toEqual(expected);
  });

  it('should replace an object within an array', () => {
    const original = [
      { data: 'no-replace' },
      { [replaceKey]: true, data: 'replace-me' },
    ];
    const expected = [
      { data: 'no-replace' },
      { [replaceKey]: true, data: 'replace-me', replaced: true },
    ];
    const result = walkAndReplace(original, replaceKey, replacer);
    expect(result).toEqual(expected);
  });

  it('should handle deeply nested objects and arrays', () => {
    const original = {
      title: 'Home',
      sections: [
        {
          type: 'grid',
          cards: [
            { type: 'heading' },
            { [replaceKey]: true, data: 'card1' },
            {
              type: 'stack',
              cards: [{ [replaceKey]: true, data: 'card2' }],
            },
          ],
        },
      ],
    };
    const expected = {
      title: 'Home',
      sections: [
        {
          type: 'grid',
          cards: [
            { type: 'heading' },
            { [replaceKey]: true, data: 'card1', replaced: true },
            {
              type: 'stack',
              cards: [{ [replaceKey]: true, data: 'card2', replaced: true }],
            },
          ],
        },
      ],
    };
    const result = walkAndReplace(original, replaceKey, replacer);
    expect(result).toEqual(expected);
  });

  it('should return the object unchanged if the key is not found', () => {
    const original = {
      level1: { data: 'no-key' },
      level2: [{ data: 'no-key-in-array' }],
    };
    // Use JSON stringify to create a deep clone for comparison
    const originalClone = JSON.parse(JSON.stringify(original));
    const result = walkAndReplace(original, replaceKey, replacer);
    expect(result).toEqual(originalClone);
  });
});
