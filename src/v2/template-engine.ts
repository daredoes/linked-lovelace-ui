import { log } from "../helpers";
import { Debug } from "../debug";
import { Eta } from "eta";

export class TemplateEngine {
  static self?: TemplateEngine
  eta!: Eta

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
