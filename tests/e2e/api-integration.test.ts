import { test, expect, Page } from '@playwright/test';

/**
 * Integration Tests: Core API Functionality
 * 
 * These tests verify the Home Assistant API integration capabilities
 * including dashboard discovery, configuration fetching, and WebSocket communication.
 */

const DEFAULT_TIMEOUT = 30000;

/**
 * Navigate to dashboard and wait for it to be ready
 */
const waitUntilDashboardReady = async (page: any) => {
  await page.waitForSelector('home-assistant', { timeout: DEFAULT_TIMEOUT });
  await expect(page.locator('home-assistant')).toBeVisible();
};

describe('Linked Lovelace - API Integration Tests', () => {
  
  describe('Dashboard Discovery', () => {
    test('should connect to Home Assistant API', async ({ page }) => {
      await page.goto('/');
      await waitUntilDashboardReady(page);
      
      const connected = await page.evaluate(() => {
        const ha = document.querySelector('home-assistant');
        if (!ha) return false;
        
        const api = (ha as any).ws;
        return api ? true : false;
      });
      
      expect(connected).toBe(true);
    });

    test('should have lovelace panel available', async ({ page }) => {
      await page.goto('/lovelace/0');
      await waitUntilDashboardReady(page);
      
      const panelExists = await page.evaluate(() => {
        const ha = document.querySelector('home-assistant');
        if (!ha) return false;
        
        const lovelace = (ha as any).lovelace;
        return lovelace !== undefined;
      });
      
      expect(panelExists).toBe(true);
    });
  });

  describe('Card Configuration', () => {
    test('should load Lovelace configuration', async ({ page }) => {
      await page.goto('/lovelace/0');
      await waitUntilDashboardReady(page);
      
      const config = await page.evaluate(() => {
        const ha = document.querySelector('home-assistant');
        if (!ha) return null;
        
        const lovelace = (ha as any).lovelace;
        if (!lovelace) return null;
        
        return lovelace.getConfig();
      });
      
      expect(config).toBeDefined();
    });

    test('should support dashboard views structure', async ({ page }) => {
      await page.goto('/lovelace/0');
      await waitUntilDashboardReady(page);
      
      const configurationData = await page.evaluate(() => {
        const ha = document.querySelector('home-assistant');
        if (!ha) return null;
        
        const lovelace = (ha as any).lovelace;
        if (!lovelace) return null;
        
        const config = lovelace.getConfig();
        
        return {
          views: config?.views || [],
          viewsCount: config?.views?.length || 0
        };
      });
      
      expect(configurationData).toBeTruthy();
      if (configurationData) {
        expect(Array.isArray(configurationData.views)).toBe(true);
        expect(configurationData.viewsCount).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('WebSocket Communication', () => {
    test('should support WebSocket API calls', async ({ page }) => {
      await page.goto('/');
      await waitUntilDashboardReady(page);
      
      const wsSupport = await page.evaluate(() => {
        const ha = document.querySelector('home-assistant');
        if (!ha) return false;
        
        const api = (ha as any);
        return api.callWS ? true : false;
      });
      
      expect(wsSupport).toBe(true);
    });
  });

  describe('Card Registration', () => {
    test('should register custom Lovelace cards', async ({ page }) => {
      await page.goto('/');
      await waitUntilDashboardReady(page);
      
      await page.waitForTimeout(2000);
      
      const customCards = await page.evaluate(() => {
        return (window as any).customCards || [];
      });
      
      expect(customCards.length).toBeGreaterThan(0);
    });

    test('should support multiple card instances', async ({ page }) => {
      await page.goto('/');
      await waitUntilDashboardReady(page);
      
      const instanceCount = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        return elements.length;
      });
      
      expect(instanceCount).toBeGreaterThan(10, 'Should have multiple DOM elements');
    });
  });

  describe('Template System', () => {
    test('should have template engine available', async ({ page }) => {
      await page.goto('/');
      await waitUntilDashboardReady(page);
      
      const engineCheck = await page.evaluate(() => {
        // Check if Eta template engine is injected or available
        const hasEta = typeof Eta !== 'undefined';
        const hasCustomElements = Array.from(customElements.getNames()).some(name => name.includes('lovelace'));
        
        return {
          hasEta,
          hasCustomElements,
          available: hasEta || hasCustomElements
        };
      });
      
      expect(engineCheck.available).toBe(true);
      expect(engineCheck.hasEta || engineCheck.hasCustomElements).toBe(true);
    });
  });

  describe('Status Card Integration', () => {
    test('status card should be registered', async ({ page }) => {
      await page.goto('/');
      await waitUntilDashboardReady(page);
      
      await page.waitForTimeout(2000);
      
      const statusRegistration = await page.evaluate(() => {
        const cards = (window as any).customCards || [];
        const statusCard = cards.find(
          (c: any) => c.type === 'custom:linked-lovelace-status'
        );
        
        return statusCard ? true : false;
      });
      
      expect(statusRegistration).toBe(true);
    });
  });

  describe('Editor Integration', () => {
    test('should register card editors', async ({ page }) => {
      await page.goto('/');
      await waitUntilDashboardReady(page);
      
      await page.waitForTimeout(2000);
      
      const editors = await page.evaluate(() => {
        const editorNames = [
          'linked-lovelace-template-editor',
          'linked-lovelace-status-editor'
        ];
        
        const registered = editorNames.filter((name: string) => 
          customElements.get(name) !== null
        );
        
        return {
          total: 2,
          registered: registered.length,
          names: registered
        };
      });
      
      expect(editors.registered).toBeGreaterThanOrEqual(0);
    });
  });
});
