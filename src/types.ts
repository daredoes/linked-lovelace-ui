import { LovelaceCard, LovelaceCardConfig, LovelaceCardEditor } from 'custom-card-helpers';

declare global {
  interface HTMLElementTagNameMap {
    'linked-lovelace-template-editor': LovelaceCardEditor;
    'hui-error-card': LovelaceCard;
  }
}

// TODO Add your configuration elements here for type-checking
export interface LinkedLovelaceCardConfig extends LovelaceCardConfig {
  type: string;
  name?: string;
  debugText?: string;
  dryRun: boolean;
  debug: boolean;
}

export interface LinkedLovelaceTemplateCardConfig extends LovelaceCardConfig {
  type: string;
  ll_template?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ll_context?: Record<string, any>
}

export interface Dashboard {
  id: string;
  mode: string;
  require_admin: boolean;
  show_in_sidebar: boolean;
  title: string;
  url_path: string;
}

export interface LLCard extends LovelaceCardConfig {
  ll_template?: string
  ll_context?: Record<string, any>
  // A map from a key in the current level of the card to a key in the current context data
  ll_keys?: Record<string, string>
  [x: string]: any;
}

export interface LLTemplateCard extends LovelaceCardConfig {
  ll_key?: string
  ll_priority?: number
  [x: string]: any;
}

export interface DashboardCard extends LLCard, LLTemplateCard {
  cards?: DashboardCard[];
  card?: DashboardCard;
}

export interface LinkedLovelacePartial {
  key?: string
  url?: string
  template?: string
  priority?: number
}

export interface DashboardPartialsCard extends LovelaceCardConfig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  partials?: LinkedLovelacePartial[];
}

export interface DashboardView {
  title: string;
  path?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  badges?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cards?: DashboardCard[];
  theme?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [x: string]: any;
}

export interface DashboardConfig {
  views: DashboardView[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [x: string]: any;
}

interface LLDashboard extends Dashboard {
  config?: DashboardConfig
}

export const LINKED_LOVELACE_PARTIALS = 'linked-lovelace-partials'