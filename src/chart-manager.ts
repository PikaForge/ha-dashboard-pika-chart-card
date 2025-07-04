import { ChartLibraryAdapter, ChartOptions, ChartSeries, ChartUpdateOptions } from './types/chart-types';

export class ChartManager {
  private adapter: ChartLibraryAdapter | null = null;
  private container: HTMLElement | null = null;
  private currentOptions: ChartOptions | null = null;

  constructor(private adapterFactory: () => ChartLibraryAdapter) {}

  initialize(container: HTMLElement, options: ChartOptions): void {
    if (this.adapter) {
      this.destroy();
    }

    this.container = container;
    this.currentOptions = options;
    this.adapter = this.adapterFactory();
    
    this.adapter.create(container, options);
  }

  update(series: ChartSeries[], options?: ChartUpdateOptions): void {
    if (!this.adapter) {
      throw new Error('Chart not initialized');
    }

    this.adapter.update(series, options);
  }

  destroy(): void {
    if (this.adapter) {
      this.adapter.destroy();
      this.adapter = null;
    }
    this.container = null;
    this.currentOptions = null;
  }

  resize(width?: number, height?: number): void {
    if (!this.adapter) {
      throw new Error('Chart not initialized');
    }

    this.adapter.resize(width, height);
  }

  switchAdapter(newAdapterFactory: () => ChartLibraryAdapter): void {
    if (!this.container || !this.currentOptions) {
      throw new Error('Chart not initialized');
    }

    const currentSeries = this.currentOptions.series;
    this.destroy();
    this.adapterFactory = newAdapterFactory;
    this.initialize(this.container, this.currentOptions);
    
    if (currentSeries) {
      this.update(currentSeries);
    }
  }

  getAdapter(): ChartLibraryAdapter | null {
    return this.adapter;
  }
}