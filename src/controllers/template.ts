import { updateCardTemplate } from '../helpers';
import { extractTemplateData } from '../helpers/templates';
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
    const data = {...template}
    delete data.ll_key
    delete data.ll_priority
    const renderedTemplate = updateCardTemplate(data, this.templates);
    return this.addTemplate(key, renderedTemplate, true);
  }

  renderCard(card: DashboardCard): DashboardCard {
    const renderedCard = updateCardTemplate(card, this.templates);
    // If top-level of card is a template, pull the template data out of the card
    if (renderedCard.template) {
      return extractTemplateData(renderedCard);
    }
    return renderedCard;
  }
}

export default TemplateController;
