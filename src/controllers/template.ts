import { updateCardTemplate } from '../helpers';
import { DashboardCard } from '../types';

class TemplateController {
  templates: Record<string, DashboardCard> = {};

  addTemplate(key: string, template: DashboardCard, overwrite = true): boolean {
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
    const renderedTemplate = updateCardTemplate(template, this.templates);
    return this.addTemplate(key, renderedTemplate, true);
  }
}

export default TemplateController;
