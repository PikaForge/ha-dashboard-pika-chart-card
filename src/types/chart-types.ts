export type ChartType = 'line' | 'area' | 'column' | 'bar' | 'pie' | 'donut' | 'radialBar';

export interface ChartDataPoint {
  x: number | Date | string;
  y: number;
  label?: string;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  type?: ChartType;
  color?: string;
  yAxisId?: string;
  unit?: string;
  show?: boolean;
  stack?: string;
}

export interface ChartOptions {
  type: ChartType;
  series: ChartSeries[];
  title?: string;
  height?: number;
  width?: number;
  stacked?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  showGrid?: boolean;
  animate?: boolean;
  theme?: 'light' | 'dark';
}

export interface AxisOptions {
  show?: boolean;
  label?: string;
  min?: number;
  max?: number;
  tickFormat?: (value: any) => string;
  type?: 'numeric' | 'datetime' | 'category';
}

export interface ChartAxis {
  x?: AxisOptions;
  y?: AxisOptions;
  y2?: AxisOptions;
}

export interface ChartUpdateOptions {
  animate?: boolean;
  preserveState?: boolean;
}

export interface ChartLibraryAdapter {
  name: string;
  version: string;
  
  create(container: HTMLElement, options: ChartOptions): void;
  update(data: ChartSeries[], options?: ChartUpdateOptions): void;
  destroy(): void;
  resize(width?: number, height?: number): void;
  
  setAxes?(axes: ChartAxis): void;
  exportImage?(format: 'png' | 'svg'): Promise<Blob>;
  getDataAtPoint?(x: number, y: number): ChartDataPoint | null;
}

export interface HomeAssistantEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
  last_changed: string;
  last_updated: string;
}

export interface EntityConfig {
  entity: string;
  name?: string;
  attribute?: string;
  unit?: string;
  color?: string;
  type?: ChartType;
  yaxis_id?: number;
  group_by?: {
    func: 'min' | 'max' | 'mean' | 'sum' | 'last' | 'first' | 'count';
    duration: string;
  };
  offset?: string;
  transform?: string;
  show?: {
    in_header?: boolean;
    in_chart?: boolean;
    legend_value?: boolean;
  };
}