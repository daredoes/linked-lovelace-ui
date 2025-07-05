import { updateCardTemplate } from '../helpers/templates/updateCardTemplate';
import type { DashboardCard } from '../types/DashboardCard';

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
    const data = {...template}
    delete data.ll_key
    delete data.ll_priority
    const renderedTemplate = updateCardTemplate(data, this.templates);
    return this.addTemplate(key, renderedTemplate, true);
  }

  renderCard(card: DashboardCard): DashboardCard {
    console.log("render", this, this)
    const renderedCard = updateCardTemplate(card, this.templates);
    return renderedCard;
  }
}

export default TemplateController;
