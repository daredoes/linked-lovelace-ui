import { defaultLinkedLovelaceUpdatableConstants } from '../../constants';
import type { DashboardCard } from '../../types/DashboardCard';
import { renderCardFromContextData } from './renderCardFromContextData';

describe('renderCardFromContextData', () => {
  const onTemplateObject = jest.fn();

  beforeEach(() => {
    onTemplateObject.mockClear();
  });

  it('should render a card from context data', () => {
    const sourceCardData: DashboardCard = {
      type: 'custom:button-card',
      ll_template: 'my_template',
    };
    const templateData = {
      my_template: {
        type: 'custom:button-card',
        name: '<%= context.button_name %>',
      },
    };
    const contextData = {
      button_name: 'My Button',
    };
    const result = renderCardFromContextData({
      sourceCardData,
      templateData,
      contextData,
      templateKey: 'my_template',
      linkedLovelaceUpdatableConstants: defaultLinkedLovelaceUpdatableConstants,
      onTemplateObject,
    });
    expect(result).toEqual({
      type: 'custom:button-card',
      name: 'My Button',
      ll_context: {
        button_name: 'My Button',
      },
    });
  });

  it('should merge template context data', () => {
    const sourceCardData: DashboardCard = {
      type: 'custom:button-card',
      ll_template: 'my_template',
    };
    const templateData = {
      my_template: {
        type: 'custom:button-card',
        name: '<%= context.button_name %>',
        ll_context: {
          button_name: 'Default Button Name',
          button_entity: 'light.default',
        },
      },
    };
    const contextData = {
      button_name: 'My Button',
    };
    const result = renderCardFromContextData({
      sourceCardData,
      templateData,
      contextData,
      templateKey: 'my_template',
      linkedLovelaceUpdatableConstants: defaultLinkedLovelaceUpdatableConstants,
      onTemplateObject,
    });
    expect(result).toEqual({
      type: 'custom:button-card',
      name: 'My Button',
      ll_context: {
        button_name: 'My Button',
        button_entity: 'light.default',
      },
    });
  });

  it('should extract data from the card context based on ll_keys', () => {
    const sourceCardData: DashboardCard = {
      type: 'custom:button-card',
      ll_template: 'my_template',
      ll_keys: ['button_name'],
    };
    const templateData = {
      my_template: {
        type: 'custom:button-card',
        name: 'Default Name',
      },
    };
    const contextData = {
      button_name: 'My Button',
    };
    const result = renderCardFromContextData({
      sourceCardData,
      templateData,
      contextData,
      templateKey: 'my_template',
      linkedLovelaceUpdatableConstants: defaultLinkedLovelaceUpdatableConstants,
      onTemplateObject,
    });
    expect(result).toEqual({
      type: 'custom:button-card',
      name: 'Default Name',
      button_name: 'My Button',
      ll_context: {
        button_name: 'My Button',
      },
      ll_keys: ['button_name'],
    });
  });

  it('should prioritize card context data over template context data', () => {
    const sourceCardData: DashboardCard = {
      type: 'custom:button-card',
      ll_template: 'my_template',
      ll_context: {
        button_name: 'Card Name',
      },
    };
    const templateData = {
      my_template: {
        type: 'custom:button-card',
        name: '<%= context.button_name %>',
        ll_context: {
          button_name: 'Template Name',
          button_entity: 'light.default',
        },
      },
    };
    const contextData = {
      button_name: 'Card Name',
    };
    const result = renderCardFromContextData({
      sourceCardData,
      templateData,
      contextData,
      templateKey: 'my_template',
      linkedLovelaceUpdatableConstants: defaultLinkedLovelaceUpdatableConstants,
      onTemplateObject,
    });
    expect(result).toEqual({
      type: 'custom:button-card',
      name: 'Card Name',
      ll_context: {
        button_name: 'Card Name',
        button_entity: 'light.default',
      },
    });
  });
});
