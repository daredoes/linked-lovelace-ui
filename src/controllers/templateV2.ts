import { DashboardCard, DashboardTemplatesCard, LinkedLovelaceTemplate } from '../types';
import axios from 'axios';
import { TemplateEngine } from '../v2/template-engine';

class EtaTemplateController {
  templates!: Record<string, LinkedLovelaceTemplate>;
  engine!: TemplateEngine;
  
  constructor() {
    this.refresh()
  }

  refresh() {
    this.engine = new TemplateEngine();
    this.templates = {};
  }

  loadTemplates = () => {
    const loaded: string[] = [];
    Object.keys(this.templates).sort((keyA, keyB) => {
      const templateA = this.templates[keyA].priority || 0
      const templateB = this.templates[keyB].priority || 0;
      return templateA - templateB;
    }).forEach((key) => {
      const template = this.templates[key]
      if (template.template) {
        try {
          this.engine.eta.loadTemplate(key, template.template)
        } catch (e) {
          console.error(e)
        }
        loaded.push(key)
      }
    })
    return loaded;
  }

  addTemplatesFromCard = async (card: DashboardCard): Promise<Record<string, LinkedLovelaceTemplate>> => {
    const templates:  Record<string, LinkedLovelaceTemplate> = {};
    if (card.type === 'custom:linked-lovelace-templates') {
      const parentCard: DashboardTemplatesCard = card as DashboardTemplatesCard;
      const parsing = parentCard.templates?.map(async (possibleTemplate) => {
        if (possibleTemplate.key) {
          if (possibleTemplate.url) {
            const response = await axios.get(possibleTemplate.url, { responseType: 'text'})
            if (typeof response.data === 'string') {
              templates[possibleTemplate.key] = { ...possibleTemplate, template: response.data}
            }
          } else if (possibleTemplate.template) {
            templates[possibleTemplate.key] = possibleTemplate
          }
        }
      })
      if (parsing) {
        await Promise.all(parsing);
      }
    }
    this.templates = { ...this.templates, ...templates};
    return templates;
  }

}

export default EtaTemplateController;
