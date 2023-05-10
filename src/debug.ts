import { getHass, log } from "./helpers";

export class Debug {
  static self?: Debug

  debug = false;
  dryRun = false;

  log(msg: any, ...values: any[]): void {
    if (this.debug) {
      log(msg, ...values);
    }
  }

  static get instance(): Debug {
    if (this.self) {
      return this.self;
    }
    const hass = getHass();
    this.self = new Debug();
    return this.self;
  }

}
