export interface HomeAssistant {
  states: { [entity_id: string]: HassEntity };
  services: { [domain: string]: { [service: string]: any } };
  user: HassUser;
  language: string;
  config: HassConfig;
  themes: any;
  selectedTheme: string | null;
  connection: any;
  callService(domain: string, service: string, data?: any): Promise<void>;
  callWS<T>(msg: any): Promise<T>;
}

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: { [key: string]: any };
  last_changed: string;
  last_updated: string;
  context: {
    id: string;
    user_id: string | null;
  };
}

export interface HassUser {
  id: string;
  is_admin: boolean;
  is_owner: boolean;
  name: string;
}

export interface HassConfig {
  latitude: number;
  longitude: number;
  elevation: number;
  unit_system: {
    length: string;
    mass: string;
    temperature: string;
    volume: string;
  };
  location_name: string;
  time_zone: string;
  components: string[];
  config_dir: string;
  whitelist_external_dirs: string[];
  version: string;
  config_source: string;
  recovery_mode: boolean;
  safe_mode: boolean;
}

export interface LovelaceCardConfig {
  type: string;
  [key: string]: any;
}

export interface PikaChartCardConfig extends LovelaceCardConfig {
  type: 'custom:pika-chart-card';
  chart_type?: 'line' | 'area' | 'column' | 'bar' | 'pie' | 'donut' | 'radialBar';
  library?: 'chartjs' | 'd3';
  entities: EntityConfig[];
  hours_to_show?: number;
  refresh_interval?: number;
  title?: string;
  height?: number;
  stacked?: boolean;
  show_legend?: boolean;
  show_tooltip?: boolean;
  show_grid?: boolean;
  animate?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  yaxis?: AxisConfig[];
  xaxis?: AxisConfig;
  apex_config?: any;
  experimental?: {
    color_threshold?: boolean;
  };
}

export interface EntityConfig {
  entity: string;
  name?: string;
  attribute?: string;
  unit?: string;
  color?: string;
  type?: 'line' | 'area' | 'column' | 'bar';
  yaxis_id?: string;
  group_by?: {
    func: 'min' | 'max' | 'mean' | 'sum' | 'last' | 'first' | 'count';
    duration: string;
  };
  statistics?: {
    stat_type: 'min' | 'max' | 'mean' | 'sum' | 'state';
    period?: '5minute' | 'hour' | 'day' | 'month';
  };
  offset?: string;
  transform?: string;
  show?: {
    in_header?: boolean;
    in_chart?: boolean;
    legend_value?: boolean;
  };
  data_generator?: string;
}

export interface AxisConfig {
  id?: string;
  show?: boolean;
  opposite?: boolean;
  min?: number | 'auto';
  max?: number | 'auto';
  decimals?: number;
  apex_config?: any;
}