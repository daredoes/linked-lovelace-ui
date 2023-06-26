import { HomeAssistant } from "custom-card-helpers";
import Controller from './linkedLovelace'

export class LinkedLovelaceSingleton {
  static self?: LinkedLovelaceSingleton
  controller = new Controller()

  constructor() {
    
  }

  static get instance(): LinkedLovelaceSingleton {
    if (this.self) {
      return this.self;
    }
    this.self = new LinkedLovelaceSingleton();
    return this.self;
  }

}
