import { log } from './helpers';

export class Debug {
  private static self?: Debug;
  public debug = false;

  public static get instance(): Debug {
    if (!this.self) {
      this.self = new Debug();
    }
    return this.self;
  }

  public log(message: any, ...optionalParams: any[]) {
    if (this.debug) {
      log(message, ...optionalParams);
    }
  }
}
