
import { Eta } from 'eta';
import type { DashboardCard } from '../types/DashboardCard';
import type { DashboardHolderCard } from '../types/DashboardHolderCard';
import { sortPriorityCardsByPriority } from '../helpers/eta/sortPriorityCardsByPriority';
import type { LinkedLovelacePartial } from '../types/LinkedLovelacePartial';
import { walkViewForPartialsAndTemplates } from '../helpers/templates/walkViewForPartials';
import type { PartialsAndTemplates } from '../helpers/templates/types';
import { defaultLinkedLovelaceUpdatableConstants } from '../constants';
import type { DashboardView } from '../types/DashboardView';

const freshEngine = () => new Eta({ useWith: true,
  autoEscape: false,
   rmWhitespace: true,
  autoFilter: true,
  filterFunction: (val) => {
    if (typeof val === "string") {
      return val
    } else if (typeof val === 'undefined') {
      return ''
    }
    return val as string
  }
 });

export class TemplateEngine {
  static self?: TemplateEngine
  eta = freshEngine();
  templates: Record<string, DashboardHolderCard> = {};
  partials: Record<string, LinkedLovelacePartial> = {};

  static get instance(): TemplateEngine {
    if (this.self) {
      return this.self;
    }
    this.self = new TemplateEngine();
    return this.self;
  }

  reset() {
    this.eta = freshEngine();
    this.templates = {};
    this.partials = {};
  }

  registerTemplate = (templateCardData: DashboardHolderCard) => {
    this.templates[templateCardData[defaultLinkedLovelaceUpdatableConstants.isTemplateKey]] = templateCardData;
    return templateCardData;
  }

  renderTemplate = (templateKey: string, contextData: Record<string | number | symbol, any>) => {
    // If data in template, find and replace each key
    const templateCardData = this.templates[templateKey];
    let template = JSON.stringify(templateCardData);
    try {
      template = this.eta.renderString(template, contextData)
      // Convert rendered string back to JSON
      return JSON.parse(template) as DashboardCard;
    } catch (e) {
      console.error(e);
      return undefined
    }
  }

  // Loads the template into the engine, or catches the error if one occurs parsing the template
  // Only returns the key after successfully loading the template
  registerPartial = (key: string, partial: LinkedLovelacePartial) => {
    try {
      this.eta.loadTemplate(`@${key}`, partial.template as string)
      this.partials[key] = partial
      return key
    } catch (e) {
      console.error(e)
    }
    return undefined
  }

  // Takes any partials added to the class, and loads them into the engine as accessible templates
  loadPartials = (partials: Record<string, LinkedLovelacePartial>) => {
    const loaded: string[] = [];
    // Priority sort so that a user can ensure a partial is available before being used in another partial
    sortPriorityCardsByPriority(partials).forEach(([key, partial]) => {
      if (typeof partial.template === "string") {
        const loadedKey = this.registerPartial(key, partial)
        if (loadedKey) {
          loaded.push(key)
        }
      } else {
        console.error("Partial template is not a string", partial, typeof partial.template)
      }
    })
    return loaded;
  }

  // Takes any partials added to the class, and loads them into the engine as accessible templates
  loadTemplates = (templates: Record<string, DashboardHolderCard>) => {
    const loaded: string[] = [];
    // Priority sort so that a user can ensure a partial is available before being used in another partial
    sortPriorityCardsByPriority(templates).forEach(([key, template]) => {
      const updatedTemplate = this.registerTemplate(template as DashboardHolderCard)
      if (updatedTemplate) {
        loaded.push(key)
      }
    })
    return loaded;
  }

    addPartialsAndTemplatesFromView = async (view: DashboardView): Promise<PartialsAndTemplates> => {
      const partialsAndTemplates = await walkViewForPartialsAndTemplates(view, {partials: this.partials, templates: this.templates});
      this.loadPartials(partialsAndTemplates.partials);
      this.loadTemplates(partialsAndTemplates.templates);
      return partialsAndTemplates;
    }
  
}
