/**
 * @jest-environment jsdom
 */

import { getHass } from './hass';
import { HomeAssistant } from 'custom-card-helpers';

describe('getHass', () => {
  // Back up the original document body to restore after each test
  const originalBody = document.body.innerHTML;

  afterEach(() => {
    // Clean up the DOM to prevent tests from interfering with each other
    document.body.innerHTML = originalBody;
  });

  it('should return the hass object when the home-assistant element is present', () => {
    // Arrange: Create a mock home-assistant element with a hass property
    const mockHassObject = {
      user: { is_admin: true, name: 'Test User' },
      states: { 'light.test_light': { state: 'on' } },
    } as unknown as HomeAssistant;

    const mockHomeAssistantElement = document.createElement('home-assistant');
    (mockHomeAssistantElement as any).hass = mockHassObject;
    document.body.appendChild(mockHomeAssistantElement);

    // Act: Call the function to get the hass object
    const result = getHass();

    // Assert: The function should return the mock hass object
    expect(result).toBe(mockHassObject);
  });

  it('should throw an error if the home-assistant element is not found', () => {
    // Arrange: Ensure the document body is empty
    document.body.innerHTML = '';

    // Act & Assert: Calling getHass should throw an error because it cannot find the element
    expect(() => getHass()).toThrow("Cannot read properties of undefined (reading 'hass')");
  });

  it('should return the hass object from the first home-assistant element if multiple exist', () => {
    // Arrange: Create two mock home-assistant elements
    const firstHassObject = { user: { name: 'First' } } as any;
    const secondHassObject = { user: { name: 'Second' } } as any;

    const firstElement = document.createElement('home-assistant');
    (firstElement as any).hass = firstHassObject;
    document.body.appendChild(firstElement);

    const secondElement = document.createElement('home-assistant');
    (secondElement as any).hass = secondHassObject;
    document.body.appendChild(secondElement);

    // Act: Call the function
    const result = getHass();

    // Assert: The result should be the hass object from the first element
    expect(result).toBe(firstHassObject);
    expect(result).not.toBe(secondHassObject);
  });
});
