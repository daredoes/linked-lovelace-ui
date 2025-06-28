import { LovelaceCardConfig } from 'custom-card-helpers';

export interface LLTemplateCard extends LovelaceCardConfig {
  ll_key?: string
  ll_priority?: number
  [x: string]: any;
}