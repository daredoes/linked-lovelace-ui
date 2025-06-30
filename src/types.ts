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
  [x: string]: any
}

export interface LinkedLovelaceStatusCardConfig extends LovelaceCardConfig {
  type: string;
}

export interface Dashboard {
  id: string;
  mode: string;
  require_admin: boolean;
  show_in_sidebar: boolean;
  title: string;
  url_path: string | null;
}

export interface LLCard extends LovelaceCardConfig {
  ll_template?: string
  sections?: LovelaceCardConfig[]
  ll_context?: Record<string, any>
  // A boolean to indicate if the default context values should be replicated in the ll_context of dashboard cards (defaults to true)
  ll_replicate_ctx?: boolean
  ll_template_engine?: 'eta' | 'jinja2'
  // A template string for the card configuration that may return a complex object in JSON, it will
  // be merged with the main card config
  ll_card_config?: string
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
  ll_template_engine?: 'eta' | 'jinja2'
  args?: string[] // For Jinja2 macros: argument list
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
  sections?: DashboardCard[];
  theme?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [x: string]: any;
}

export interface DashboardConfig {
  views?: DashboardView[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [x: string]: any;
}

interface LLDashboard extends Dashboard {
  config?: DashboardConfig
}

export const LINKED_LOVELACE_PARTIALS = 'linked-lovelace-partials'