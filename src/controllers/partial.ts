import { DashboardCard, LinkedLovelacePartial } from '../types';
import { getPartialsFromCard } from '../helpers/eta';
import { TemplateEngine } from '../v2/template-engine';

const sortPartialsByPriority = (partials: Record<string, LinkedLovelacePartial>) => {
  return Object.keys(partials).sort((kA, kB) => {
    const priorityA = partials[kA].priority || 0
    const priorityB = partials[kB].priority || 0
    return priorityA - priorityB
  })
}


class TemplatePartialController {
  partials!: Record<string, LinkedLovelacePartial>;
  engine!: TemplateEngine;

  constructor() {
    this.refresh();
  }

  refresh() {
    this.engine = new TemplateEngine();
    this.partials = {};
  }

  loadPartials = () => {
    return sortPartialsByPriority(this.partials).filter((key) => {
      try {
        this.engine.loadPartial(key, this.partials[key]);
      } catch (e) {
        console.error(`Failed to load partial ${key}:`, e);
        return false; // Skip this key if loading fails
      }
      return true;
    });
  };

  addPartialsFromCard = async (card: DashboardCard): Promise<Record<string, LinkedLovelacePartial>> => {
    const templates = await getPartialsFromCard(card);
    this.partials = { ...this.partials, ...templates };
    return templates;
  };

}

export default TemplatePartialController;
