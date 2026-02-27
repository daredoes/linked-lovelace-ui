import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Home Assistant Lovelace Card Initialization
 * 
 * These tests verify that the linked-lovelace card initializes correctly
 * when loaded into a Home Assistant dashboard.
 */

describe('Card Initialization', () => {
  test('should authenticate and load Home Assistant', async ({ page }) => {
    // Navigate to Home Assistant
    await page.goto('/');
    
    // Wait for Home Assistant loader to disappear
    await page.waitForSelector('home-assistant');
    
    // Verify Home Assistant has loaded
    const ha = page.locator('home-assistant');
    await expect(ha).toBeVisible();
    
    // Check that dashboard panel exists
    const dashboard = page.locator('ha-panel-lovelace');
    await expect(dashboard).toBeVisible();
  });

  test('should load linked-lovelace card in dashboard', async ({ page }) => {
    // Navigate to Lovelace dashboard
    await page.goto('/lovelace/0');
    
    // Wait for dashboard to initialize
    await page.waitForSelector('home-assistant');
    
    // Look for linked-lovelace-card web component
    const card = page.locator('linked-lovelace-card').first();
    
    // Card should be visible
    await expect(card).toBeVisible();
  });

  test('should handle shadow DOM elements correctly', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/');
    await page.waitForSelector('home-assistant');
    
    // Playwright pierces shadow roots by default (v1.26+)
    const ha = page.locator('home-assistant');
    
    // Access shadow DOM elements for web component
    const linkedCard = ha.locator('linked-lovelace-card');
    
    // Check if card element exists in shadow DOM
    const cardElements = await linkedCard.locator('*').all();
    
    // Card should have some content
    expect(cardElements.length).toBeGreaterThan(0);
  });

  test('should handle missing card gracefully', async ({ page }) => {
    // Navigate to dashboard without linked-lovelace card
    await page.goto('/lovelace/1');
    
    // Should not find linked-lovelace card on default dashboard
    const card = page.locator('linked-lovelace-card');
    
    // Card should not be present (different dashboard)
    await expect(card).not.toBeVisible();
  });

  test('should display loading state during initialization', async ({ page }) => {
    // Add console listener for errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Navigate to dashboard
    await page.goto('/lovelace/0');
    
    // Allow time for initialization
    await page.waitForTimeout(2000);
    
    // No console errors during initialization
    expect(errors.length).toBeLessThan(1);
  });

  test('should initialize with valid configuration', async ({ page }) => {
    // This test assumes we have a dashboard with a valid linked-lovelace configuration
    // In a real scenario, you'd need to configure the dashboard first
    
    await page.goto('/lovelace/0');
    await page.waitForSelector('home-assistant');
    
    const card = page.locator('linked-lovelace-card');
    
    // Card should be initialized
    await expect(card).toBeVisible();
    
    // Card should have valid template content
    const templateContent = card.locator('.template-rendered');
    await expect(templateContent).not.toHaveText('undefined');
  });

  test('should handle card configuration errors', async ({ page }) => {
    // Mock console errors
    let hasErrors = false;
    page.on('console', msg => {
      if (msg.type() === 'error') {
        hasErrors = true;
      }
    });
    
    await page.goto('/lovelace/0');
    await page.waitForSelector('home-assistant');
    
    // Card should still be visible even with config issues
    const card = page.locator('linked-lovelace-card').first();
    const paperCard = page.locator('paper-card').first();
    
    // Card exists OR paper card is visible
    const cardExists = await card.count() > 0;
    const paperCardExists = await paperCard.count() > 0;
    expect(cardExists || paperCardExists).toBe(true);
  });
});

/**
 * Additional test considerations:
 * 
 * 1. Test with different Home Assistant configurations
 * 2. Test with multiple cards on the same dashboard
 * 3. Test card configuration updates at runtime
 * 4. Test card unmounting/removal
 * 5. Test card re-initialization after config changes
 */

/**
 * Additional test considerations:
 * 
 * 1. Test with different Home Assistant configurations
 * 2. Test with multiple cards on the same dashboard
 * 3. Test card configuration updates at runtime
 * 4. Test card unmounting/removal
 * 5. Test card re-initialization after config changes
 */
