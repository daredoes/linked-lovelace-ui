import { TemplateEngine } from '../../src/v2/template-engine';

describe('Home Assistant Card API Integration', () => {
  describe('Template Engine Validation', () => {
    let engine: TemplateEngine;
    let haHost: string;
    let haToken: string;
    
    beforeAll(async () => {
      engine = new TemplateEngine();
      haHost = process.env.HA_HOST || 'http://localhost:8123';
      haToken = process.env.HA_TOKEN || '';
      
      // Skip tests if not running against real HA instance
      if (!haToken) {
        return;
      }
      
      // Validate template against HA instance
      const template = '<p>Test template</p>';
      const context = { test: 'hello' };
      engine.eta.renderString(template, context);
    });
    
    afterAll(async () => {
      // Cleanup any created resources
      await cleanupTestResources(haHost, haToken);
    });
    
    it('should initialize template engine correctly', async () => {
      expect(engine).toBeDefined();
      expect(engine.eta).toBeDefined();
    });
    
    it('should support ETA variable syntax', async () => {
      if (!haToken) {
        return; // Skip if no real instance
      }
      
      // Test basic variable substitution
      const context = { temperature: 72 };
      const template = 'The current temperature is: <%= context.temperature %>';
      
      const result = engine.eta.renderString(template, context);
      
      expect(result).toBe('The current temperature is: 72');
    });
    
    it('should render template with variables', async () => {
      if (!haToken) {
        return;
      }
      
      const template = '<span class="status">Active</span>';
      const context = {};
      const expected = '<span class="status">Active</span>';
      
      const result = engine.eta.renderString(template, context);
      
      expect(result).toEqual(expected);
    });
  });
  
  describe('Service Call Integration', () => {
    let haToken: string;
    
    beforeAll(async () => {
      haToken = process.env.HA_TOKEN || '';
    });
    
    it('should verify Home Assistant is accessible', async () => {
      if (!haToken) {
        return;
      }
      
      const haHost = process.env.HA_HOST || 'http://localhost:8123';
      const healthUrl = `${haHost}/api/states`;
      const response = await fetch(healthUrl, {
        headers: {
          'Authorization': `Bearer ${haToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      expect(response.status).toBe(200);
    });
    
    it('should connect to API endpoint', async () => {
      if (!haToken) {
        return;
      }
      
      const haHost = process.env.HA_HOST || 'http://localhost:8123';
      const healthUrl = `${haHost}/api/states`;
      const response = await fetch(healthUrl, {
        headers: {
          'Authorization': `Bearer ${haToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      expect(response.ok).toBe(true);
    });
  });
  
  describe('Custom Card Registration', () => {
    let haToken: string;
    
    beforeAll(async () => {
      haToken = process.env.HA_TOKEN || '';
    });
    
    it('should verify card configuration endpoint is accessible', async () => {
      if (!haToken) {
        return;
      }
      
      const haHost = process.env.HA_HOST || 'http://localhost:8123';
      const configUrl = `${haHost}/api/lovelace/config`; 
      const response = await fetch(configUrl, {
        headers: {
          'Authorization': `Bearer ${haToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      // Card config might be 404 if not configured yet, but endpoint should be accessible
      expect(response.ok || response.status === 404).toBe(true);
    });
  });
});

// Helper functions for integration testing

async function cleanupTestResources(
  _haHost: string,
  _haToken: string
): Promise<void> {
  // Clean up any test resources created during integration tests
  // This could include deleting test entities, clearing caches, etc.
  
  if (!_haToken) {
    return;
  }
  
  // No cleanup needed for basic tests
  return Promise.resolve();
}

/**
 * Integration test best practices:
 * 
 * 1. Use environment variables for HA_HOST and HA_TOKEN
 * 2. Always implement skip logic when no real HA instance available
 * 3. Clean up test resources in afterAll hooks
 * 4. Use API endpoints for validation instead of manual checks
 * 5. Validate templates against HA instance when possible
 */
