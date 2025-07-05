
import { Eta } from 'eta';

const freshEngine = () => new Eta({ varName: 'context', autoEscape: false, rmWhitespace: true });

export class TemplateEngine {
  static self?: TemplateEngine
  eta = freshEngine();

  static get instance(): TemplateEngine {
    if (this.self) {
      return this.self;
    }
    this.self = new TemplateEngine();
    return this.self;
  }

  refresh() {
    this.eta = freshEngine();
  }
}
