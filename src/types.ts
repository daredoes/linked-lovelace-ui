import { ActionConfig, LovelaceCard, LovelaceCardConfig, LovelaceCardEditor } from 'custom-card-helpers';

declare global {
  interface HTMLElementTagNameMap {
    'linked-lovelace-card-editor': LovelaceCardEditor;
    'hui-error-card': LovelaceCard;
  }
}

// TODO Add your configuration elements here for type-checking
export interface LinkedLovelaceCardConfig extends LovelaceCardConfig {
  type: string;
  name?: string;
  show_warning?: boolean;
  show_error?: boolean;
  test_gui?: boolean;
  entity?: string;
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
}


export interface Dashboard {
  id: string
  mode: string
  require_admin: boolean
  show_in_sidebar: boolean
  title: string
  url_path: string
}

export interface DashboardCard extends LovelaceCardConfig {
  cards?: DashboardCard[],
}

export interface DashboardView {
  title: string
  path?: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  badges?: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cards?: DashboardCard[],
  theme?: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [x: string]: any
}

export interface DashboardConfig {
  template?: boolean
  views: DashboardView[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [x: string]: any
}