import { Eta } from 'eta';
import { LinkedLovelacePartial } from '../types';
import { getHass, log, toConsole } from "../util";
import { Debug } from '../debug';

export type TemplateEngineType = 'eta' | 'jinja2';

export class Jinja2Engine {
  macros: string[] = [];
  hass: any;

  constructor() {
    try {
      this.hass = getHass();
    } catch (e) {
      if (Debug.instance.debug) {
        toConsole("warn", "Failed to get Home Assistant instance for Jinja2 engine:", e);
      }
      this.hass = null; // Fallback if hass is not available
    }
  }

  loadMacro(key: string, template: string, args: string[] = []) {
    const argsStr = args.length > 0 ? `(${args.join(', ')})` : '';
    this.macros.push(`{% macro ${key}${argsStr} -%}${template}{% endmacro -%}`);
  }

  getMacros(): string {
    return this.macros.join('\n');
  }

  buildVars(context: Record<string, any> = {}): string {
    return Object.entries(context)
      .map(([key, value]) => {
        if (typeof value === 'string') {
          return `${key}="${value.replace(/"/g, '\\"')}"`;
        } else if (typeof value === 'number' || typeof value === 'boolean') {
          return `${key}=${value}`;
        } else if (Array.isArray(value)) {
          return `${key}=[${value.map(v => `\"${v}\"`).join(', ')}]`;
        } else {
          return `${key}=${JSON.stringify(value)}`;
        }
      }).map(s => `{% set ${s} -%}`).join('\n');
  }

  async renderString(template: string, prepend: string): Promise<string> {
    if (!template.includes('{{') && !template.includes('{%')) {
      // If the template does not contain Jinja2 syntax, return it as is
      return template;
    }

    const payload = `${prepend}\n${template}`;
    if (Debug.instance.debug) {
      log("Jinja2 Template Payload", payload);
    }
    try {
      const resp = await this.hass.callApi("POST", "template", { template: payload });
      if (Debug.instance.debug) {
        log("Jinja2 Template Response", resp);
      }
      return resp;
    } catch (e) {
      toConsole("warn", "Home Assistant instance is not available for Jinja2 rendering.");
      return template; // Return the template as is if hass is not available
    }
  }

  async renderObject<T>(obj: T | string, prepend: string): Promise<T | string> {
    if (typeof obj === 'string') {
      // If the object is a string, render it using the Jinja2 engine
      return await this.renderString(obj, prepend);
    } else if (Array.isArray(obj)) {
      // If the object is an array, render each item in the array and return as array
      return await Promise.all(obj.map(async (item) => await this.renderObject(item, prepend))) as unknown as T;
    } else if (typeof obj === 'object' && obj !== null) {
      // If the object is a plain object, render keys and values
      const renderedObj: any = {};
      for (let [key, value] of Object.entries(obj)) {
        const renderedKey = await this.renderString(key, prepend);
        renderedObj[renderedKey] = await this.renderObject(value, prepend);
      }
      return renderedObj;
    }
    // If the object is not a string, array, or object, return it as is
    return obj;
  }

  async render(template: string, context: Record<string, any> = {}): Promise<string> {
    const vars = this.buildVars(context);
    const macros = this.getMacros();
    const prepend = `${vars}\n${macros}`;

    try {
      const tplObject = JSON.parse(template);
      const result = await this.renderObject(tplObject, prepend);
      return JSON.stringify(result);
    } catch (e) {
      return this.renderString(template, prepend);
    }
  }
}

export class TemplateEngine {
  static self?: TemplateEngine
  eta!: Eta;
  jinja2!: Jinja2Engine;

  constructor() {
    this.refresh()
  }

  static get instance(): TemplateEngine {
    if (this.self) {
      return this.self;
    }
    this.self = new TemplateEngine();
    return this.self;
  }

  refresh() {
    this.eta = new Eta({ varName: 'context', autoEscape: false, rmWhitespace: true });
    this.jinja2 = new Jinja2Engine();
  }

  loadPartial(key: string, partial: LinkedLovelacePartial) {
    if (!partial.template) {
      return;
    }
    if (partial.ll_template_engine === 'jinja2') {
      this.jinja2.loadMacro(key, partial.template, partial.args);
    } else {
      try {
        this.eta.loadTemplate(key, partial.template);
      } catch (e) {
        toConsole("warn", e);
      }
    }
  }

  /**
   * Render a template string using the specified engine.
   * @param template The template string
   * @param context The context object
   * @param engineType 'eta' (default) or 'jinja2'
   * @param hass Optional Home Assistant object (required for jinja2)
   */
  async render(template: string, context: Record<string, any> = {}, engineType: TemplateEngineType = 'eta'): Promise<string> {
    if (engineType === 'jinja2') {
      return await this.jinja2.render(template, context);
    } else {
      // EtaJS (default or explicit)
      return this.eta.renderString(template, context);
    }
  }
}


