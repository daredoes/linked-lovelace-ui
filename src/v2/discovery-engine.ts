import { DashboardCard, LinkedLovelacePartial, DashboardConfig, Dashboard, DiscoveryView } from '../types';
import TemplateController from '../controllers/template';
import EtaTemplateController from '../controllers/eta';
import { GlobalLinkedLovelace } from '../instance';
import { getPartialsFromCard } from '../helpers/eta';

export interface DiscoveryResult {
  templates: Record<string, DashboardCard>;
  partials: Record<string, LinkedLovelacePartial>;
  dashboardsToViews: Record<string, Record<string, DiscoveryView>>;
}

export class DiscoveryEngine {
  templateController: TemplateController;
  etaController: EtaTemplateController;

  constructor(templateController: TemplateController, etaController: EtaTemplateController) {
    this.templateController = templateController;
    this.etaController = etaController;
  }

  async discoverAll(): Promise<DiscoveryResult> {
    const dashboards = await GlobalLinkedLovelace.instance.api.getDashboards();
    const allTemplates: Record<string, DashboardCard> = {};
    const allPartials: Record<string, LinkedLovelacePartial> = {};
    const dashboardsToViews: Record<string, Record<string, DiscoveryView>> = {};

    await Promise.all(
      dashboards.map(async (dashboard) => {
        try {
          const config = await GlobalLinkedLovelace.instance.api.getDashboardConfig(dashboard.url_path);
          const { templates, partials, dashboardsToViews: dtv } = await this.discoverFromConfig(config);
          const dashboardKey = dashboard.url_path || '';
          dashboardsToViews[dashboardKey] = dtv['']; // discoverFromConfig uses '' as default dashboard key
          
          // Merge templates with priority check
          Object.keys(templates).forEach((key) => {
            const template = templates[key];
            if (!allTemplates[key] || (allTemplates[key].ll_priority || 0) < (template.ll_priority || 0)) {
              allTemplates[key] = template;
            }
          });

          // Merge partials
          Object.assign(allPartials, partials);
        } catch (e) {
          console.error(`Failed to discover from dashboard ${dashboard.url_path}`, e);
        }
      })
    );

    return { templates: allTemplates, partials: allPartials, dashboardsToViews };
  }

  async discoverFromConfig(config: DashboardConfig): Promise<DiscoveryResult> {
    const templates: Record<string, DashboardCard> = {};
    const partials: Record<string, LinkedLovelacePartial> = {};
    const dashboardsToViews: Record<string, Record<string, DiscoveryView>> = { '': {} };

    if (!config.views) return { templates, partials, dashboardsToViews };

    const processCard = async (card: DashboardCard, currentView: DiscoveryView) => {
      if (card.ll_key) {
        if (!templates[card.ll_key] || (templates[card.ll_key].ll_priority || 0) < (card.ll_priority || 0)) {
          templates[card.ll_key] = card;
        }
        currentView.templates[card.ll_key] = card;
      }

      const cardPartials = await getPartialsFromCard(card);
      Object.assign(partials, cardPartials);
      Object.assign(currentView.partials, cardPartials);

      // Recurse into children to find more templates/partials
      if (card.cards && Array.isArray(card.cards)) {
        await Promise.all(card.cards.map((c) => processCard(c, currentView)));
      }
      if (card.card && typeof card.card === 'object') {
        await processCard(card.card, currentView);
      }
      // Support for sections
      if (card.sections && Array.isArray(card.sections)) {
        await Promise.all(card.sections.map(async (section) => {
            if (section.cards && Array.isArray(section.cards)) {
                await Promise.all(section.cards.map((c) => processCard(c, currentView)));
            }
        }));
      }
    };

    await Promise.all(config.views.map(async (view) => {
      const viewKey = view.path || view.title || '';
      const discoveryView: DiscoveryView = {
          id: viewKey,
          templates: {},
          partials: {}
      };
      dashboardsToViews[''][viewKey] = discoveryView;

      if (view.cards) {
        await Promise.all(view.cards.map((c) => processCard(c, discoveryView)));
      }
      if (view.sections && Array.isArray(view.sections)) {
          await Promise.all(view.sections.map(async (section) => {
              if (section.cards && Array.isArray(section.cards)) {
                  await Promise.all(section.cards.map((c) => processCard(c, discoveryView)));
              }
          }));
      }
    }));

    return { templates, partials, dashboardsToViews };
  }

  async registerAll(result: DiscoveryResult) {
      // Register partials first
      Object.assign(this.etaController.partials, result.partials);
      this.etaController.loadPartials();

      // Register templates
      const sortedKeys = Object.keys(result.templates).sort((kA, kB) => {
        const priorityA = result.templates[kA].ll_priority || 0;
        const priorityB = result.templates[kB].ll_priority || 0;
        return priorityA - priorityB;
      });

      sortedKeys.forEach((key) => {
        this.templateController.renderAndAddTemplate(key, result.templates[key]);
      });
  }
}
