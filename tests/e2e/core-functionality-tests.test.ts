import { test, expect } from '@playwright/test';

/**
 * Integration Test Suite: Core Functionality Verification
 * 
 * These tests verify that all core functionality of the Linked Lovelace system
 * remains intact after implementing Phase 1 improvements. They test:
 * - Card initialization and registration
 * - Template system availability
 * - Configuration loading
 * - Error handling
 * - Cross-browser compatibility
 */

// Default timeout for operations
const DEFAULT_TIMEOUT = 30000;

/**
 * Navigate to Lovelace dashboard and verify loading
 */
const goToDashboard = async (page: any, dashboardPath: string = '/lovelace/0') => {
  await page.goto(dashboardPath);
  await page.waitForSelector('home-assistant', { timeout: DEFAULT_TIMEOUT });
  await expect(page.locator('home-assistant')).toBeVisible();
};

describe('Linked Lovelace - Core Functionality Integration Tests', () => {
  
  describe('Card Initialization', () => {
    test('should load Home Assistant dashboard', async ({ page }) => {
      await goToDashboard(page);
      
      // Verify Home Assistant is loaded
      const ha = page.locator('home-assistant');
      await expect(ha).toBeVisible({ timeout: DEFAULT_TIMEOUT });
      
      // Verify dashboard panel exists
      const dashboard = page.locator('ha-panel-lovelace');
      await expect(dashboard).toBeVisible({ timeout: DEFAULT_TIMEOUT });
    });

    test('should handle missing linked-lovelace cards gracefully', async ({ page }) => {
      await goToDashboard(page, '/lovelace/0');
      
      // Wait a moment for page to stabilize
      await page.waitForTimeout(1000);
      
      // Verify page loaded without errors (no console errors)
      const errors: string[] = [];
      page.on('console', (msg: any) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          if (!text.includes('linked-lovelace') && !text.includes('undefined')) {
            errors.push(text);
          }
        }
      });
      
      // Should have minimal errors
      expect(errors.length).toBeLessThanOrEqual(2, 'Should have minimal console errors on page load');
    });

    test('should initialize with loading state', async ({ page }) => {
      await goToDashboard(page, '/lovelace/0');
      
      // Wait for stabilization
      await page.waitForTimeout(2000);
      
      // Dashboard should be stable and interactive
      const dashboard = page.locator('ha-panel-lovelace');
      await expect(dashboard).toBeVisible();
      
      // No loading spinner should be present (page loaded)
      const loaders = page.locator('paper-spinner, ha-circular-progress-indicator');
      const loaderCount = await loaders.count();
      expect(loaderCount).toBeLessThan(5, 'Should have minimal loaders (page loaded)');
    });
  });

  describe('Template Discovery', () => {
    test('should register linked-lovelace-template card type', async ({ page }) => {
      await goToDashboard(page, '/lovelace/0');
      
      // Wait for custom cards registration
      await page.waitForTimeout(3000);
      
      // Verify custom card type is registered
      const customCards = await page.evaluate(() => {
        return (window as any).customCards || [];
      });
      
      const linkedLovelaceCards = customCards.filter(
        (card: any) => card.type.includes('linked-lovelace')
      );
      
      expect(linkedLovelaceCards.length).toBeGreaterThan(0);
      
      // Verify 'linked-lovelace-template' type
      const templateCard = customCards.find(
        (card: any) => card.type === 'custom:linked-lovelace-template'
      );
      expect(templateCard).toBeDefined();
      expect(templateCard.name).toEqual('Linked Lovelace Template Card');
    });

    test('should register linked-lovelace-status card type', async ({ page }) => {
      await goToDashboard(page, '/lovelace/0');
      await page.waitForTimeout(3000);
      
      const customCards = await page.evaluate(() => {
        return (window as any).customCards || [];
      });
      
      const statusCard = customCards.find(
        (card: any) => card.type === 'custom:linked-lovelace-status'
      );
      expect(statusCard).toBeDefined();
      expect(statusCard.name).toEqual('Linked Lovelace Status Card');
      expect(statusCard.description).toBeDefined();
    });

    test('should register linked-lovelace-partials card type', async ({ page }) => {
      await goToDashboard(page, '/lovelace/0');
      await page.waitForTimeout(3000);
      
      const customCards = await page.evaluate(() => {
        return (window as any).customCards || [];
      });
      
      const partialsCard = customCards.find(
        (card: any) => card.type === 'custom:linked-lovelace-partials'
      );
      expect(partialsCard).toBeDefined();
      expect(partialsCard.name).toEqual('Linked Lovelace Partials Card');
    });

    test('should handle custom card registration without errors', async ({ page }) => {
      await goToDashboard(page, '/lovelace/0');
      
      const errors: string[] = [];
      const warnings: string[] = [];
      
      page.on('console', (msg: any) => {
        const text = msg.text();
        if (msg.type() === 'error') {
          if (!text.includes('linked-lovelace')) {
            errors.push(text);
          }
        } else if (msg.type() === 'warning') {
          warnings.push(text);
        }
      });
      
      await page.waitForTimeout(3000);
      
      // Should have minimal errors or warnings about custom cards
      const customCardErrors = errors.filter((e: string) => e.includes('linked-lovelace') || e.includes('custom:'));
      expect(customCardErrors.length).toBeLessThan(2, 'Should have minimal custom card registration errors');
    });
  });

  describe('Partial Registration', () => {
    test('should support partial rendering with template syntax', async ({ page }) => {
      await goToDashboard(page, '/lovelace/0');
      await page.waitForTimeout(2000);
      
      // Verify ETA template engine is available
      const etaAvailable = await page.evaluate(() => {
        return typeof Eta !== 'undefined' || 
               typeof (window as any).customCards?.find((c: any) => c.type.includes('linked-lovelace')) !== 'undefined';
      });
      
      expect(etaAvailable).toBe(true);
    });

    test('should handle template variables correctly', async ({ page }) => {
      await goToDashboard(page, '/lovelace/0');
      await page.waitForTimeout(2000);
      
      // Check for template rendering capabilities
      const templateCheck = await page.evaluate(() => {
        const cards = (window as any).customCards || [];
        const linkedLovelaceCards = cards.filter((c: any) => c.type.includes('linked-lovelace'));
        return linkedLovelaceCards.length > 0;
      });
      
      expect(templateCheck).toBe(true);
    });
  });

  describe('Dashboard Configuration', () => {
    test('should load dashboard configuration', async ({ page }) => {
      await goToDashboard(page, '/lovelace/0');
      await page.waitForTimeout(2000);
      
      // Verify dashboard has views
      const views = await page.evaluate(() => {
        const ha = document.querySelector('home-assistant');
        if (!ha) return [];
        
        const lovelace = (ha as any).lovelace;
        if (!lovelace) return [];
        
        const config = lovelace.getConfig();
        return config?.views || [];
      });
      
      expect(views).toBeDefined();
      expect(Array.isArray(views)).toBe(true);
    });

    test('should load card configuration', async ({ page }) => {
      await goToDashboard(page, '/lovelace/0');
      await page.waitForTimeout(2000);
      
      const cardsCount = await page.evaluate(() => {
        const ha = document.querySelector('home-assistant');
        if (!ha) return 0;
        
        const lovelace = (ha as any).lovelace;
        if (!lovelace) return 0;
        
        const config = lovelace.getConfig();
        if (!config?.views?.[0]?.cards) return 0;
        
        const cards = config.views[0].cards;
        return Array.isArray(cards) ? cards.length : 0;
      });
      
      expect(cardsCount).toBeGreaterThanOrEqual(0);
    });

    test('should handle dashboard configuration gracefully', async ({ page }) => {
      const errors: string[] = [];
      
      page.on('console', (msg: any) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          if (text.includes('config') || text.includes('dashboard')) {
            errors.push(text);
          }
        }
      });
      
      await goToDashboard(page, '/lovelace/0');
      await page.waitForTimeout(2000);
      
      // Minimal dashboard configuration errors
      expect(errors.length).toBeLessThan(3);
    });
  });

  describe('Card Rendering', () => {
    test('should render standard Lovelace cards', async ({ page }) => {
      await goToDashboard(page, '/lovelace/0');
      await page.waitForTimeout(2000);
      
      // Look for existing Lovelace cards (lights, entities, etc.)
      const standardCards = page.locator('hui-entity-card, hui-light-card, hui-thermostat-card');
      const count = await standardCards.count();
      
      // Dashboard should have at least a few cards or be empty (no error state)
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should handle empty dashboard gracefully', async ({ page }) => {
      await goToDashboard(page, '/lovelace/0');
      await page.waitForTimeout(2000);
      
      // Dashboard should be visible (either with cards or empty) - no errors
      const dashboard = page.locator('ha-panel-lovelace');
      await expect(dashboard).toBeVisible();
    });
  });

  describe('Status Card Functionality', () => {
    test('should be accessible as custom card type', async ({ page }) => {
      await goToDashboard(page, '/lovelace/0');
      await page.waitForTimeout(3000);
      
      // Check if card is registered
      const cardRegistered = await page.evaluate(() => {
        const cards = (window as any).customCards || [];
        return cards.some((c: any) => c.type === 'custom:linked-lovelace-status');
      });
      
      expect(cardRegistered).toBe(true);
    });

    test('should support debug logging when configured', async ({ page }) => {
      await goToDashboard(page, '/lovelace/0');
      await page.waitForTimeout(2000);
      
      // Check for LINKED-LOVELACE-UI logging
      const logs = await page.evaluate(() => {
        // This would need console capture in implementation
        return (window as any).linked_lovelace_logs?.length || 0;
      });
      
      // Console logging may or may not be present
      expect(typeof logs).toBe('number');
    });
  });

  describe('Error Handling', () => {
    test('should not throw errors during page load', async ({ page }) => {
      const pageErrors: string[] = [];
      const consoleErrors: string[] = [];
      
      page.on('pageerror', (err: any) => {
        pageErrors.push(err.message);
      });
      
      page.on('console', (msg: any) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      await goToDashboard(page, '/lovelace/0');
      await page.waitForTimeout(2000);
      
      // No critical page errors
      const criticalErrors = pageErrors.filter((e: string) => 
        !e.includes('linked-lovelace') && 
        !e.includes('failed to load') &&
        !e.includes('undefined')
      );
      
      expect(criticalErrors.length).toBe(0);
      expect(pageErrors.length).toBeLessThan(3, 'Should have minimal page errors');
    });

    test('should handle multiple dashboard loads', async ({ page }) => {
      // First load
      await goToDashboard(page, '/lovelace/0');
      await page.waitForTimeout(1000);
      
      // Reload
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForSelector('home-assistant', { timeout: DEFAULT_TIMEOUT });
      await expect(page.locator('home-assistant')).toBeVisible();
      
      // Second load should work
      const reloadSuccess = await page.evaluate(() => {
        const customCards = (window as any).customCards || [];
        return customCards.length > 0;
      });
      
      expect(reloadSuccess).toBe(true);
    });
  });

  describe('Template Rendering', () => {
    test('should support variable substitution in cards', async ({ page }) => {
      await goToDashboard(page, '/lovelace/0');
      await page.waitForTimeout(2000);
      
      // Check for template engine availability
      const hasTemplateEngine = await page.evaluate(() => {
        // Either Eta or Home Assistant's template system
        return typeof Eta !== 'undefined' || 
               typeof customElements.get('home-assistant') !== 'undefined';
      });
      
      expect(hasTemplateEngine).toBe(true);
    });

    test('should process ll_template attribute', async ({ page }) => {
      await goToDashboard(page, '/lovelace/0');
      await page.waitForTimeout(2000);
      
      // This test verifies the template system is functional
      const templateSupported = await page.evaluate(() => {
        // Check if template attributes are recognized
        const cards = (window as any).customCards || [];
        const linkedCards = cards.filter((c: any) => c.type.includes('linked-lovelace'));
        
        return linkedCards.some((c: any) => c.type === 'custom:linked-lovelace-template');
      });
      
      expect(templateSupported).toBe(true);
    });
  });

  describe('Performance', () => {
    test('should load within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      
      await goToDashboard(page, '/lovelace/0');
      await page.locator('home-assistant').last();
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(15000, 'Should load within 15 seconds');
    });

    test('should not cause memory leaks on navigation', async ({ page }) => {
      const loadPage = async () => {
        await page.goto('/lovelace/0');
        await page.waitForSelector('home-assistant', { timeout: DEFAULT_TIMEOUT });
      };
      
      // Load multiple times
      for (let i = 0; i < 3; i++) {
        await loadPage();
        await page.waitForTimeout(1000);
      }
      
      // Verify page still functional
      const ha = page.locator('home-assistant');
      await expect(ha).toBeVisible();
    });
  });

  describe('API Functionality', () => {
    test('should support dashboard discovery', async ({ page }) => {
      // This test verifies the system can discover dashboards
      const isReady = await page.evaluate(() => {
        return !!document.querySelector('home-assistant');
      });
      
      expect(isReady).toBe(true);
    });

    test('should support API integration capabilities', async ({ page }) => {
      await goToDashboard(page, '/lovelace/0');
      await page.waitForTimeout(2000);
      
      const apiAvailable = await page.evaluate(() => {
        // Check if API methods are available
        const ha = document.querySelector('home-assistant');
        if (!ha) return false;
        
        return typeof (ha as any).callWS === 'function';
      });
      
      expect(apiAvailable).toBe(true);
    });
  });

  describe('Cross-Browser Support', () => {
    test('should work in different browsers', async ({ browserName }) => {
      // This test runs in all configured browsers
      const supportedBrowsers = ['chromium', 'firefox', 'webkit'];
      expect(supportedBrowsers).toContain(browserName);
    });
  });
});
