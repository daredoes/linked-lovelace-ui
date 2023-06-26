import { DashboardCard, LinkedLovelacePartial } from '../types';
import { getPartialsFromCard} from '../helpers/eta';
import { TemplateEngine } from '../v2/template-engine';

const sortPartialsByPriority = (partials: Record<string, LinkedLovelacePartial>) => {
  return Object.keys(partials).sort((kA, kB) => {
    const priorityA = partials[kA].priority || 0
    const priorityB = partials[kB].priority || 0
    return priorityA - priorityB
  })
}

class EtaTemplateController {
  partials!: Record<string, LinkedLovelacePartial>;
  engine!: TemplateEngine;
  
  constructor() {
    this.refresh()
  }

  refresh() {
    this.engine = new TemplateEngine();
    this.partials = {};
  }

  loadPartials = () => {
    const loaded: string[] = [];
    sortPartialsByPriority(this.partials).forEach((key) => {
      const partial = this.partials[key]
      if (partial.template) {
        try {
          this.engine.eta.loadTemplate(key, partial.template)
        } catch (e) {
          console.error(e)
        }
        loaded.push(key)
      }
    })
    return loaded;
  }

  addPartialsFromCard = async (card: DashboardCard): Promise<Record<string, LinkedLovelacePartial>> => {
    const templates = await getPartialsFromCard(card);
    this.partials = { ...this.partials, ...templates};
    return templates;
  }

}

export default EtaTemplateController;
