import { updateCardTemplate, detectCircularDependencies } from '../helpers';
import { DashboardCard } from '../types';

class TemplateController {
  templates: Record<string, DashboardCard> = {};

  addTemplate(key: string, template: DashboardCard, overwrite = true): boolean {
    // Check for circular dependencies before adding
    const testTemplates = { ...this.templates, [key]: template };
    if (detectCircularDependencies(key, testTemplates)) {
      console.error(`Failed to add template "${key}": Circular dependency detected`);
      throw new Error(`Circular dependency detected for template "${key}"`);
    }

    if (overwrite) {
      this.templates[key] = template;
      return true;
    } else {
      if (!this.templates[key]) {
        this.templates[key] = template;
        return true;
      }
    }
    return false;
  }

  renderAndAddTemplate(key: string, template: DashboardCard): boolean {
    const data = {...template}
    delete data.ll_key
    delete data.ll_priority
    const renderedTemplate = updateCardTemplate(data, this.templates);
    return this.addTemplate(key, renderedTemplate, true);
  }

  renderCard(card: DashboardCard): DashboardCard {
    const renderedCard = updateCardTemplate(card, this.templates);
    return renderedCard;
  }
}

export default TemplateController;
