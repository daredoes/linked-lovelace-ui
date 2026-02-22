import { DiscoveryEngine } from './discovery-engine';
import { DashboardCard, DashboardConfig } from '../types';
import TemplateController from '../controllers/template';
import EtaTemplateController from '../controllers/eta';

describe('DiscoveryEngine', () => {
  let templateController: TemplateController;
  let etaController: EtaTemplateController;
  let discoveryEngine: DiscoveryEngine;

  beforeEach(() => {
    templateController = new TemplateController();
    etaController = new EtaTemplateController();
    discoveryEngine = new DiscoveryEngine(templateController, etaController);
  });

  test('discoverFromConfig should find templates with ll_key', async () => {
    const config: DashboardConfig = {
      views: [
        {
          title: 'Main',
          cards: [
            {
              type: 'test',
              ll_key: 'template1',
              name: 'Template 1'
            },
            {
              type: 'test',
              cards: [
                  {
                      type: 'test',
                      ll_key: 'template2'
                  }
              ]
            }
          ]
        }
      ]
    };

    const result = await discoveryEngine.discoverFromConfig(config);
    expect(result.templates['template1']).toBeDefined();
    expect(result.templates['template2']).toBeDefined();
    expect(result.dashboardsToViews['']['Main'].templates['template1']).toBeDefined();
    expect(result.dashboardsToViews['']['Main'].templates['template2']).toBeDefined();
  });

  test('discoverFromConfig should find partials in linked-lovelace-partials card', async () => {
    const config: DashboardConfig = {
      views: [
        {
          title: 'Main',
          cards: [
            {
              type: 'custom:linked-lovelace-partials',
              partials: [
                {
                  key: 'partial1',
                  template: 'Some template'
                }
              ]
            }
          ]
        }
      ]
    };

    const result = await discoveryEngine.discoverFromConfig(config);
    expect(result.partials['partial1']).toBeDefined();
    expect(result.dashboardsToViews['']['Main'].partials['partial1']).toBeDefined();
  });

  test('registerAll should populate controllers', async () => {
    const result = {
      templates: {
        t1: { type: 'test', ll_key: 't1', name: 'T1' } as DashboardCard
      },
      partials: {
        p1: { key: 'p1', template: 'P1' }
      },
      dashboardsToViews: {}
    };

    await discoveryEngine.registerAll(result);
    expect(templateController.templates['t1']).toBeDefined();
    expect(etaController.partials['p1']).toBeDefined();
  });
});
