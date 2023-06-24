
import { Eta } from 'eta';

export const engine = new Eta({ varName: 'context', autoEscape: false, rmWhitespace: true });

export class TemplateEngine {
  static self?: TemplateEngine
  eta = engine;

  constructor() {
    this.eta = new Eta({ varName: 'context', autoEscape: false });
  }

  static get instance(): TemplateEngine {
    if (this.self) {
      return this.self;
    }
    this.self = new TemplateEngine();
    return this.self;
  }
}
