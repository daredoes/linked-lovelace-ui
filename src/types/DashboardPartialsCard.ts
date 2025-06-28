import { LovelaceCardConfig } from "custom-card-helpers";
import { LinkedLovelacePartial } from "./LinkedLovelacePartial";

export interface DashboardPartialsCard extends LovelaceCardConfig {
  partials?: LinkedLovelacePartial[];
}