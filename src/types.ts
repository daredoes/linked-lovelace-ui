export interface Dashboard {
  id: string;
  url_path: string;
  mode: string;
  title: string;
  require_admin: boolean;
  show_in_sidebar: boolean;
  icon?: string;
}

export interface DashboardConfig {
  views: View[];
  [key: string]: any;
}

export interface View {
  cards?: Card[];
  [key: string]: any;
}

export interface Card {
  type: string;
  [key: string]: any;
}

declare global {
  interface HASSDomEvents {
    'approve-changes': undefined;
    'cancel-changes': undefined;
  }
}
