import type { DashboardCard } from '../types/DashboardCard';
import type { DashboardConfig } from '../types/DashboardConfig';
import type { DashboardView } from '../types/DashboardView';
import type { LinkedLovelacePartial } from '../types/LinkedLovelacePartial';
import TemplateController from '../controllers/template';
import {GlobalLinkedLovelace} from '../instance'
import EtaTemplateController from '../controllers/eta';
import { walkAndReplace } from '../helpers/templates/walkAndReplace';
import { defaultLinkedLovelaceUpdatableConstants } from '../constants';
import { updateCardTemplate } from '../helpers/templates/updateCardTemplate';

const sortTemplatesByPriority = (templates: Record<string, DashboardCard>) => {
  return Object.keys(templates).sort((kA, kB) => {
    const priorityA = templates[kA].ll_priority || 0
    const priorityB = templates[kB].ll_priority || 0
    return priorityA - priorityB
  })
}

class LinkedLovelaceController {
  templateController: TemplateController = new TemplateController();
  etaController: EtaTemplateController = new EtaTemplateController();

  registerTemplates = (templates: Record<string, DashboardCard>): void => {
    sortTemplatesByPriority(templates).forEach((key) => {
      const template = templates[key];
      console.log(key, template)
      this.templateController.renderAndAddTemplate(key, template);
    });
  };

  registerPartials = async (card: DashboardCard): Promise<Record<string, LinkedLovelacePartial>> => {
    return await this.etaController.addPartialsFromCard(card)
  };

  get eta() {
    return this.etaController.engine.eta
  }

  getUpdatedDashboardConfig = async (urlPath: string | null): Promise<DashboardConfig> => {
    const config = await GlobalLinkedLovelace.instance.api.getDashboardConfig(urlPath);
    if (!config.views) return config;
    const views = config.views;
    const templates = this.templateController.templates;
    Object.keys(views).forEach((viewKey: string) => {
      views[viewKey] = walkAndReplace(views[viewKey], defaultLinkedLovelaceUpdatableConstants.useTemplateKey, (item, skipUpdate) => {
        if (skipUpdate) {
          const templateKey = item[defaultLinkedLovelaceUpdatableConstants.useTemplateKey]
          const contextData = item[defaultLinkedLovelaceUpdatableConstants.contextKey]
          const contextKeys = item[defaultLinkedLovelaceUpdatableConstants.contextKeys]
          const result = {...(templates[templateKey] || {})}
          if (!result) return item;
          if (contextData) {
            result[defaultLinkedLovelaceUpdatableConstants.contextKey] = contextData
          }
          if (contextKeys) {
            result[defaultLinkedLovelaceUpdatableConstants.contextKeys] = contextKeys
          }
          delete result[defaultLinkedLovelaceUpdatableConstants.isTemplateKey]
          // now that we've swapped the template in, render any context and whatnot related to it
          return updateCardTemplate({[defaultLinkedLovelaceUpdatableConstants.useTemplateKey]: templateKey, ...result}, templates)
        }
        return updateCardTemplate(item, templates)
      })
    });
    config.views = views;
    return config;
  };

  getUpdatedDashboardConfigs = async (): Promise<Record<string, DashboardConfig>> => {
    const response: Record<string, DashboardConfig> = {};
    const dashboards = await GlobalLinkedLovelace.instance.api.getDashboards()
    await Promise.all(dashboards.map(async (dashboard) => {
      const config = await this.getUpdatedDashboardConfig(dashboard.url_path)
      response[dashboard.url_path || "null"] = config
    }))
    return response;
  };
}

export default LinkedLovelaceController;
