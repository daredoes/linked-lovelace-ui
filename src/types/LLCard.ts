import { LovelaceCardConfig } from 'custom-card-helpers';

export interface LLCard extends LovelaceCardConfig {
  ll_template?: string
  sections?: LovelaceCardConfig[]
  ll_context?: Record<string, any>
  // A map from a key in the current level of the card to a key in the current context data
  ll_keys?: Record<string, string> | string[]
  [x: string]: any;
}