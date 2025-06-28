import type { DashboardCard } from 'src/types/DashboardCard'
import type { LinkedLovelacePartial } from 'src/types/LinkedLovelacePartial'
import { getPartialsFromCard} from '../helpers/eta';
import { TemplateEngine } from '../v2/template-engine';

const sortPartialsByPriorityFunc = ([_, partialA]: [string, LinkedLovelacePartial], [__, partialB]: [string, LinkedLovelacePartial]) => {
    const priorityA = partialA.priority || 0
    const priorityB = partialB.priority || 0
    return priorityA - priorityB
}

const sortPartialsByPriority = (partials: Record<string, LinkedLovelacePartial>) => {
  return Object.entries(partials).sort(sortPartialsByPriorityFunc)
}

// This controls the custom templating engine (EtaJS)
// EtaJS is added directly to the repository to cut out some node-dependent code
// Templates have keys, which link to a template of data.
// This template supports partials, which are reusable chunks that can be used between templates
class EtaTemplateController {
  partials!: Record<string, LinkedLovelacePartial>;
  engine!: TemplateEngine;
  
  constructor() {
    this.refresh()
  }

  // This clears the engine of any loaded templates, and resets the loaded partial data
  refresh() {
    this.engine = new TemplateEngine();
    this.partials = {};
  }

  // Loads the template into the engine, or catches the error if one occurs parsing the template
  // Only returns the key after successfully loading the template
  loadTemplate = (key: string, template: string) => {
    try {
      this.engine.eta.loadTemplate(key, template)
      return key
    } catch (e) {
      console.error(e)
    }
    return undefined
  }

  // Takes any partials added to the class, and loads them into the engine as accessible templates
  loadPartials = () => {
    const loaded: string[] = [];
    // Priority sort so that a user can ensure a partial is available before being used in another partial
    sortPartialsByPriority(this.partials).forEach(([key, partial]) => {
      if (partial.template) {
        const loadedKey = this.loadTemplate(key, partial.template)
        if (loadedKey) {
          loaded.push(key)
        }
      }
    })
    return loaded;
  }

  // Takes a Lovelace Dashboard Card and extracts the data to use as a partial in the engine
  addPartialsFromCard = async (card: DashboardCard): Promise<Record<string, LinkedLovelacePartial>> => {
    const templates = await getPartialsFromCard(card);
    this.partials = { ...this.partials, ...templates};
    return templates;
  }

}

export default EtaTemplateController;
