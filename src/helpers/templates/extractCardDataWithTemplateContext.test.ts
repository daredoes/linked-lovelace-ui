import type { DashboardCard } from '../../types/DashboardCard';
import { extractCardDataWithTemplateContext } from './extractCardDataWithTemplateContext';
import { defaultLinkedLovelaceUpdatableConstants } from '../../constants';

describe('extractCardDataWithTemplateContext', () => {
  it('should extract data from the card context based on the key value pairs specified in the original card data', () => {
    const originalCardData: DashboardCard = {
      type: 'custom:button-card',
      [defaultLinkedLovelaceUpdatableConstants.contextKeys]: {
        a: 'button_name',
        b: 'button_entity',
        c: 'button_action',
      },
    };
    const cardContext = {
      button_name: 'My Button',
      button_entity: 'light.living_room',
      button_color: 'red',
      button_action: {
        tap: 'button_action',
      }
    };
    const result = extractCardDataWithTemplateContext(originalCardData, cardContext);
    expect(result).toEqual({
      button_name: 'My Button',
      button_entity: 'light.living_room',
      button_action: {
        tap: 'button_action',
      }
    });
  });

  it('should extract data from the card context based on a list of keys specified in the original card data', () => {
    const originalCardData: DashboardCard = {
      type: 'custom:button-card',
      [defaultLinkedLovelaceUpdatableConstants.contextKeys]: ['button_name', 'button_entity', 'button_action'],
    };
    const cardContext = {
      button_name: 'My Button',
      button_entity: 'light.living_room',
      button_color: 'red',
      button_action: {
        tap: 'button_action',
      }
    };
    const result = extractCardDataWithTemplateContext(originalCardData, cardContext);
    expect(result).toEqual({
      button_name: 'My Button',
      button_entity: 'light.living_room',
      button_action: {
        tap: 'button_action',
      }
    });
  });

  it('should return an empty object when the card context is empty', () => {
    const originalCardData: DashboardCard = {
      type: 'custom:button-card',
      [defaultLinkedLovelaceUpdatableConstants.contextKeys]: {
        name: 'button_name',
        entity: 'button_entity',
      },
    };
    const cardContext = {};
    const result = extractCardDataWithTemplateContext(originalCardData, cardContext);
    expect(result).toEqual({});
  });

  it('should return an empty object when the original card data has no context keys', () => {
    const originalCardData: DashboardCard = {
      type: 'custom:button-card',
    };
    const cardContext = {
      button_name: 'My Button',
      button_entity: 'light.living_room',
    };
    const result = extractCardDataWithTemplateContext(originalCardData, cardContext);
    expect(result).toEqual({});
  });

  it('should use the default context keys when none are provided', () => {
    const originalCardData: DashboardCard = {
      type: 'custom:button-card',
      [defaultLinkedLovelaceUpdatableConstants.contextKeys]: {
        name: 'button_name',
      },
    };
    const cardContext = {
      button_name: 'My Button',
    };
    const result = extractCardDataWithTemplateContext(originalCardData, cardContext, defaultLinkedLovelaceUpdatableConstants.contextKeys);
    expect(result).toEqual({
      button_name: 'My Button',
    });
  });
});
