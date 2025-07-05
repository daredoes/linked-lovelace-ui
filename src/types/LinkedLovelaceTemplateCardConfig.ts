import { LovelaceCardConfig } from 'custom-card-helpers';

export interface LinkedLovelaceTemplateCardConfig extends LovelaceCardConfig {
  type: string;
  ll_template?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ll_context?: Record<string, any>
    [x: string]: any
}
