import { LovelaceCardConfig } from "custom-card-helpers";
import { LINKED_LOVELACE_TEMPLATE_REPLACEMENT_KEY } from "../constants";

export interface DashboardHolderCard extends LovelaceCardConfig {
  [LINKED_LOVELACE_TEMPLATE_REPLACEMENT_KEY]: string;
}