import { parseTemplateCardData } from "./parseTemplateCardData";

// This file should contain tests that verify the handling of unique cases in the ETA templating system based around the context functionality
describe('[function] parseTemplateCardData', () => {
  test('returns empty object when the templateCardData is empty object', () => {
    expect(parseTemplateCardData({}, {})).toStrictEqual({});
  });

  describe('handles ETA Context', () => {
    test('returns undefined for value in card when no context data is provided', () => {
      expect(parseTemplateCardData({ type: '<%= context.type %>' }, {})).toStrictEqual({ type: 'undefined' });
    })

    test('returns card with context data when context data is provided', () => {
      expect(parseTemplateCardData({ type: '<%= context.type %>' }, { type: 'fake' })).toStrictEqual({ type: 'fake' });
    })

    test('returns undefined when template has error', () => {
        expect(parseTemplateCardData({ type: '<%= contet.type %>' }, {})).toBeUndefined()
      })
  })
})
