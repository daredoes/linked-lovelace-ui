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
  template: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  template_data: Record<string, any>
}

export interface Dashboard {
  id: string;
  mode: string;
  require_admin: boolean;
  show_in_sidebar: boolean;
  title: string;
  url_path: string;
}

export interface DashboardCard extends LovelaceCardConfig {
  cards?: DashboardCard[];
  card?: DashboardCard;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  template?: string;
  template_data?: Record<string, any>;
  ll_data?: Record<string, any>;
  ll_keys?: string[];
  ll_v2?: boolean;
}

export interface LinkedLovelaceTemplate {
  key?: string
  url?: string
  template?: string
  render?: boolean
  priority?: number
}

export interface DashboardTemplatesCard extends LovelaceCardConfig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  templates?: LinkedLovelaceTemplate[];
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
  template?: boolean;
  views: DashboardView[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [x: string]: any;
}
