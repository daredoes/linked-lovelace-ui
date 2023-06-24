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

  renderAndAddTemplate(key: string, template: DashboardCard, v2 = false): boolean {
    const renderedTemplate = updateCardTemplate(template, this.templates, v2);
    return this.addTemplate(key, renderedTemplate, true);
  }

  renderCard(card: DashboardCard, v2 = false): DashboardCard {
    const renderedCard = updateCardTemplate(card, this.templates, v2);
    // If top-level of card is a template, pull the template data out of the card
    if (renderedCard.template) {
      return extractTemplateData(renderedCard);
    }
    return renderedCard;
  }
}

export default TemplateController;
