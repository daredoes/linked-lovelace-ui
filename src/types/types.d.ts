export interface LovelaceCardConfig {
    index?: number;
    view_index?: number;
    type: string;
    [key: string]: any;
    ll_template?: string;
    ll_context?: Record<string, any>;
    ll_key?: string;
}