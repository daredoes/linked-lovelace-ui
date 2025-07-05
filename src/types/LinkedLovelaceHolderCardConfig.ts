import { LovelaceCardConfig } from 'custom-card-helpers';

export interface LinkedLovelaceHolderCardConfig extends LovelaceCardConfig {
  type: string;
  ll_key?: string;
  ll_context?: Record<string, unknown>
  cards?: Record<string, unknown>[]
  [x: string]:  unknown
}
