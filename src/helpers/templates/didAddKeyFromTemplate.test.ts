import { defaultLinkedLovelaceUpdatableConstants } from '../../constants';
import { didAddKeyFromTemplate } from './didAddKeyFromTemplate';

describe('didAddKeyFromTemplate', () => {
  const onTemplateObject = jest.fn();

  beforeEach(() => {
    onTemplateObject.mockClear();
  });

  it('should return undefined if the template key is not found in the template data', () => {
    const result = didAddKeyFromTemplate({
      originalCardData: { type: 'custom:button-card' },
      templateData: {},
      templateKey: 'my_template',
      contextData: {},
      linkedLovelaceUpdatableConstants: defaultLinkedLovelaceUpdatableConstants,
      onTemplateObject,
    });
    expect(result).toBeUndefined();
  });

  it('should return the template data when no context is provided', () => {
    const templateData = {
      my_template: {
        type: 'custom:button-card',
        name: 'My Button',
      },
    };
    const result = didAddKeyFromTemplate({
      originalCardData: { type: 'custom:button-card', [defaultLinkedLovelaceUpdatableConstants.useTemplateKey]: 'my_template' },
      templateData,
      templateKey: 'my_template',
      contextData: {},
      linkedLovelaceUpdatableConstants: defaultLinkedLovelaceUpdatableConstants,
      onTemplateObject,
    });
    expect(result).toEqual({
      type: 'custom:button-card',
      name: 'My Button',
      [defaultLinkedLovelaceUpdatableConstants.useTemplateKey]: 'my_template',
    });
  });

  it('should return the rendered card data when context is provided', () => {
    const templateData = {
      my_template: {
        type: 'custom:button-card',
        name: '<%= context.button_name %>',
      },
    };
    const result = didAddKeyFromTemplate({
      originalCardData: { type: 'custom:button-card', [defaultLinkedLovelaceUpdatableConstants.useTemplateKey]: 'my_template' },
      templateData,
      templateKey: 'my_template',
      contextData: { button_name: 'My Button' },
      linkedLovelaceUpdatableConstants: defaultLinkedLovelaceUpdatableConstants,
      onTemplateObject,
    });
    expect(result).toEqual({
      type: 'custom:button-card',
      name: 'My Button',
      [defaultLinkedLovelaceUpdatableConstants.useTemplateKey]: 'my_template',
      [defaultLinkedLovelaceUpdatableConstants.contextKey]: {
        button_name: 'My Button',
      },
    });
  });
});
