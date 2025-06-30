import { HomeAssistant } from "custom-card-helpers";
import { getHass } from "./helpers";
import LinkedLovelaceApi from "./linked-lovelace-api";

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
