
import { Eta } from 'eta';
import type { DashboardCard } from '../types/DashboardCard';
import type { DashboardHolderCard } from '../types/DashboardHolderCard';
import { sortPriorityCardsByPriority } from '../helpers/eta/sortPriorityCardsByPriority';
import type { LinkedLovelacePartial } from '../types/LinkedLovelacePartial';
import { walkViewForPartialsAndTemplates } from '../helpers/templates/walkViewForPartials';
import type { PartialsAndTemplates } from '../helpers/templates/types';
import { defaultLinkedLovelaceUpdatableConstants } from '../constants';
import type { DashboardView } from '../types/DashboardView';
import { walkAndReplace } from '../helpers/templates/walkAndReplace';

const freshEngine = () => new Eta({ varName: "context",
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
    const templateKey = templateCardData[defaultLinkedLovelaceUpdatableConstants.isTemplateKey]
    this.templates[templateKey] = walkAndReplace(templateCardData, defaultLinkedLovelaceUpdatableConstants.useTemplateKey, (item) => {
      const newKey = item[defaultLinkedLovelaceUpdatableConstants.useTemplateKey]
      const newItem = JSON.parse(JSON.stringify(this.templates[newKey]));
      if (newItem) {
        newItem[defaultLinkedLovelaceUpdatableConstants.useTemplateKey] = newKey;
        delete newItem[defaultLinkedLovelaceUpdatableConstants.isTemplateKey];

        if (item[defaultLinkedLovelaceUpdatableConstants.contextKey]) {
          newItem[defaultLinkedLovelaceUpdatableConstants.contextKey] = item[defaultLinkedLovelaceUpdatableConstants.contextKey]
        }
        if (item[defaultLinkedLovelaceUpdatableConstants.contextKeys]) {
          newItem[defaultLinkedLovelaceUpdatableConstants.contextKeys] = item[defaultLinkedLovelaceUpdatableConstants.contextKeys]
        }
        if (item[defaultLinkedLovelaceUpdatableConstants.priorityKey]) {
          newItem[defaultLinkedLovelaceUpdatableConstants.priorityKey] = item[defaultLinkedLovelaceUpdatableConstants.priorityKey]
        }
        return newItem;
      }
      return item;
    })
    return this.templates[templateKey];
  }

  renderTemplate = (templateKey: string, contextData: Record<string | number | symbol, any>) => {
    // If data in template, find and replace each key
    const templateCardData = JSON.parse(JSON.stringify(this.templates[templateKey]));
    if (!templateCardData) return undefined;
    if (typeof contextData === "object" && Object.keys(contextData).length) {
      templateCardData[defaultLinkedLovelaceUpdatableConstants.contextKey] = contextData;
    }
    let renderedTemplate = {}
    try {
    renderedTemplate = JSON.parse(this.eta.renderString(JSON.stringify(templateCardData), contextData))
      delete renderedTemplate[defaultLinkedLovelaceUpdatableConstants.useTemplateKey];
    delete renderedTemplate[defaultLinkedLovelaceUpdatableConstants.isTemplateKey];
    } catch (e) {
      console.error(e);
      return undefined;
    }
    const finalTemplate = walkAndReplace(renderedTemplate, defaultLinkedLovelaceUpdatableConstants.useTemplateKey, (item) => {
      const priorContextData = {...JSON.parse(JSON.stringify(item[defaultLinkedLovelaceUpdatableConstants.contextKey] || {}))}
      const newItem = this.renderTemplate(item[defaultLinkedLovelaceUpdatableConstants.useTemplateKey], {
        ...contextData,
        ...JSON.parse(
            this.eta.renderString(
                JSON.stringify(
                    item[defaultLinkedLovelaceUpdatableConstants.contextKey] || {}
                ), contextData
            )
        )});
      if (newItem) {
        if (priorContextData) {
          const curr = newItem[defaultLinkedLovelaceUpdatableConstants.contextKey]
          newItem[defaultLinkedLovelaceUpdatableConstants.contextKey] = typeof curr === 'undefined' ? {...priorContextData} : {...curr, ...priorContextData}
        }
        if (item[defaultLinkedLovelaceUpdatableConstants.contextKeys]) {
          const curr = newItem[defaultLinkedLovelaceUpdatableConstants.contextKeys]
          newItem[defaultLinkedLovelaceUpdatableConstants.contextKeys] = typeof curr === 'undefined' ? item[defaultLinkedLovelaceUpdatableConstants.contextKeys] : Array.isArray(curr) ? [...curr, ...item[defaultLinkedLovelaceUpdatableConstants.contextKeys]] : {...curr, ...item[defaultLinkedLovelaceUpdatableConstants.contextKeys]}
        }
        if (item[defaultLinkedLovelaceUpdatableConstants.priorityKey]) {
          newItem[defaultLinkedLovelaceUpdatableConstants.priorityKey] = item[defaultLinkedLovelaceUpdatableConstants.priorityKey]
        }
        return newItem;
      }
      return item;
    });
    finalTemplate[defaultLinkedLovelaceUpdatableConstants.useTemplateKey] = templateKey;
    // if (typeof contextData === "object" && Object.keys(contextData).length) {
    //   finalTemplate[defaultLinkedLovelaceUpdatableConstants.contextKey] = contextData;
    // }
    return finalTemplate;
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
