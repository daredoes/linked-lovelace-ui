import { HomeAssistant } from "custom-card-helpers";
import { getHass, log } from "./util";
import LinkedLovelaceApi from "./linked-lovelace-api";
import { Debug } from "./debug";

export class GlobalLinkedLovelace {
  static self?: GlobalLinkedLovelace
  hass: HomeAssistant
  api: LinkedLovelaceApi

  constructor(hass: HomeAssistant) {
    this.hass = hass
    this.api = new LinkedLovelaceApi(hass)
  }

  static get instance(): GlobalLinkedLovelace {
    if (this.self) {
      return this.self;
    }
    const hass = getHass();
    this.self = new GlobalLinkedLovelace(hass);
    return this.self;
  }

}

export const initialize = (onFinish?: () => void) => {
  (async () => {
    // Wait for scoped customElements registry to be set up
    // otherwise the customElements registry card-mod is defined in
    // may get overwritten by the polyfill if card-mod is loaded as a module
    while (customElements.get('home-assistant') === undefined)
      await new Promise((resolve) => window.setTimeout(resolve, 100));

    Debug.instance.log('initalized')
    if (onFinish) {
      onFinish()
    }
  })();
}
