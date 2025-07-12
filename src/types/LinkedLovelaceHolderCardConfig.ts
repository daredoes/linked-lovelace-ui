import { LovelaceCardConfig } from 'custom-card-helpers';

export interface LinkedLovelaceHolderCardConfig extends LovelaceCardConfig {
  type: string;
  ll_key?: string;
  ll_context?: Record<string, unknown>
  ll_keys?: Record<string, unknown> | string[]
  cards?: Record<string, unknown>[]
  ll_priority?: number
  [x: string]:  unknown
}
