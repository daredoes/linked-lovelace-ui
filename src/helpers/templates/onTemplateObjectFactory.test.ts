import { onTemplateObjectFactory } from './onTemplateObjectFactory';
import { didAddKeyFromTemplate } from './didAddKeyFromTemplate';
import { defaultLinkedLovelaceUpdatableConstants } from '../../constants';
import type { DashboardCard } from '../../types/DashboardCard';

// Mock the didAddKeyFromTemplate module
jest.mock('./didAddKeyFromTemplate');

const mockedDidAddKeyFromTemplate = didAddKeyFromTemplate as jest.Mock;

describe('onTemplateObjectFactory', () => {
  const templateData = {
    my_template: {
      type: 'custom:button-card',
      name: 'Templated Button',
    },
  };

  beforeEach(() => {
    mockedDidAddKeyFromTemplate.mockClear();
  });

  it('should return a function', () => {
    const onTemplateObject = onTemplateObjectFactory(defaultLinkedLovelaceUpdatableConstants, templateData);
    expect(typeof onTemplateObject).toBe('function');
  });

  it('should return the original object if didAddKeyFromTemplate returns undefined', () => {
    mockedDidAddKeyFromTemplate.mockReturnValue(undefined);
    const onTemplateObject = onTemplateObjectFactory(defaultLinkedLovelaceUpdatableConstants, templateData);
    const originalCard: DashboardCard = {
      type: 'custom:button-card',
      ll_template: 'my_template',
    };
    const result = onTemplateObject(originalCard, {});
    expect(result).toBe(originalCard);
  });

  it('should return the new data if didAddKeyFromTemplate returns a new card', () => {
    const newCard: DashboardCard = {
      type: 'custom:button-card',
      name: 'Templated Button',
      ll_template: 'my_template',
    };
    mockedDidAddKeyFromTemplate.mockReturnValue(newCard);
    const onTemplateObject = onTemplateObjectFactory(defaultLinkedLovelaceUpdatableConstants, templateData);
    const originalCard: DashboardCard = {
      type: 'custom:button-card',
      ll_template: 'my_template',
    };
    const result = onTemplateObject(originalCard, {});
    expect(result).toBe(newCard);
  });

  it('should call didAddKeyFromTemplate with the correct arguments', () => {
    const onTemplateObject = onTemplateObjectFactory(defaultLinkedLovelaceUpdatableConstants, templateData);
    const originalCard: DashboardCard = {
      type: 'custom:button-card',
      ll_template: 'my_template',
    };
    const contextData = { some: 'context' };
    onTemplateObject(originalCard, contextData);

    expect(mockedDidAddKeyFromTemplate).toHaveBeenCalledTimes(1);
    expect(mockedDidAddKeyFromTemplate).toHaveBeenCalledWith({
      contextData,
      linkedLovelaceUpdatableConstants: defaultLinkedLovelaceUpdatableConstants,
      originalCardData: originalCard,
      templateData,
      templateKey: 'my_template',
      onTemplateObject,
    });
  });
});
