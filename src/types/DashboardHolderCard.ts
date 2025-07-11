import { LovelaceCardConfig } from "custom-card-helpers";
import { LINKED_LOVELACE_TEMPLATE_KEY,
  LINKED_LOVELACE_TEMPLATE_REPLACEMENT_KEY,
  LINKED_LOVELACE_TEMPLATE_REPLACEMENT_KEYS_KEY,
  LINKED_LOVELACE_TEMPLATE_CONTEXT_KEY,
 } from "../constants";

export interface DashboardHolderCard extends LovelaceCardConfig {
  [LINKED_LOVELACE_TEMPLATE_KEY]?: string;
  [LINKED_LOVELACE_TEMPLATE_REPLACEMENT_KEY]?: string;
  [LINKED_LOVELACE_TEMPLATE_REPLACEMENT_KEYS_KEY]?: string[] | Record<string,string>;
  [LINKED_LOVELACE_TEMPLATE_CONTEXT_KEY]?: Record<string, any>;
  priority?: number
}