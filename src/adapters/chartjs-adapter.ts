import {
  Chart,
  ChartConfiguration,
  ChartType as ChartJSType,
  ChartDataset,
  Point,
  BubbleDataPoint,
  ScatterDataPoint,
  ChartOptions as ChartJSOptions,
  LinearScale,
  TimeScale,
  CategoryScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  LineController,
  BarController,
  PieController,
  DoughnutController,
  RadarController,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import 'chart.js/auto';
import 'chartjs-adapter-date-fns';
import { ChartLibraryAdapter, ChartOptions, ChartSeries, ChartUpdateOptions, ChartAxis, ChartDataPoint, ChartType } from '../types/chart-types';

Chart.register(
  LinearScale,
  TimeScale,
  CategoryScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  LineController,
  BarController,
  PieController,
  DoughnutController,
  RadarController,
  Tooltip,
  Legend,
  Filler
);

export class ChartJSAdapter implements ChartLibraryAdapter {
  name = 'Chart.js';
  version = '4.4.1';
  
  private chart: Chart | null = null;
  private container: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private currentChartType: ChartType = 'line';

  create(container: HTMLElement, options: ChartOptions): void {
    console.log('ChartJS adapter create called with options:', options);
    this.container = container;
    
    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    container.appendChild(this.canvas);
    console.log('Canvas created and appended');

    const chartType = this.mapChartType(options.type);
    this.currentChartType = options.type;
    const datasets = this.createDatasets(options.series, options.type);
    console.log('Datasets created:', datasets);
    
    const config: ChartConfiguration = {
      type: chartType,
      data: {
        datasets: datasets
      },
      options: this.createChartOptions(options)
    };
    console.log('Chart config:', config);

    try {
      this.chart = new Chart(this.canvas, config);
      console.log('Chart.js chart created successfully');
    } catch (error) {
      console.error('Error creating Chart.js chart:', error);
    }
  }

  update(series: ChartSeries[], options?: ChartUpdateOptions): void {
    console.log('ChartJS adapter update called with series:', series);
    if (!this.chart) {
      console.error('Chart not initialized');
      return;
    }

    const datasets = this.createDatasets(series, this.currentChartType || 'line');
    console.log('Updated datasets:', datasets);
    this.chart.data.datasets = datasets;
    
    // Don't set labels when using time scale - Chart.js will use the x values from the data
    
    this.chart.update(options?.animate ? 'active' : 'none');
    console.log('Chart updated');
  }

  destroy(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
      this.canvas = null;
    }
    this.container = null;
  }

  resize(width?: number, height?: number): void {
    if (!this.chart) return;
    
    if (this.canvas) {
      if (width) this.canvas.style.width = `${width}px`;
      if (height) this.canvas.style.height = `${height}px`;
    }
    
    this.chart.resize();
  }

  setAxes(axes: ChartAxis): void {
    if (!this.chart || !this.chart.options.scales) return;

    if (axes.x) {
      this.chart.options.scales.x = {
        ...this.chart.options.scales.x,
        display: axes.x.show !== false,
        title: {
          display: !!axes.x.label,
          text: axes.x.label
        },
        min: axes.x.min,
        max: axes.x.max
      };
    }

    if (axes.y) {
      this.chart.options.scales.y = {
        ...this.chart.options.scales.y,
        display: axes.y.show !== false,
        title: {
          display: !!axes.y.label,
          text: axes.y.label
        },
        min: axes.y.min,
        max: axes.y.max
      };
    }

    this.chart.update('none');
  }

  private mapChartType(type: string): ChartJSType {
    const typeMap: Record<string, ChartJSType> = {
      'line': 'line',
      'area': 'line',
      'column': 'bar',
      'bar': 'bar',
      'pie': 'pie',
      'donut': 'doughnut',
      'radialBar': 'doughnut'
    };
    return typeMap[type] || 'line';
  }

  private createDatasets(series: ChartSeries[], globalType: string): ChartDataset[] {
    return series.map((serie, index) => {
      const chartType = this.mapChartType(serie.type || globalType);
      const isArea = (serie.type || globalType) === 'area';
      
      const dataset: ChartDataset = {
        label: serie.name,
        data: serie.data.map(point => ({
          x: point.x,
          y: point.y
        })) as any,
        backgroundColor: serie.color || this.getDefaultColor(index),
        borderColor: serie.color || this.getDefaultColor(index),
        fill: isArea,
        yAxisID: serie.yAxisId || 'y',
        hidden: serie.show === false
      };

      if (chartType === 'line' || isArea) {
        dataset.tension = 0.4;
        dataset.pointRadius = 3;
        dataset.pointHoverRadius = 5;
      }

      if (serie.stack) {
        dataset.stack = serie.stack;
      }

      return dataset;
    });
  }

  private createChartOptions(options: ChartOptions): ChartJSOptions {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: options.animate !== false ? 750 : 0
      },
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: options.showLegend !== false,
          position: 'bottom'
        },
        tooltip: {
          enabled: options.showTooltip !== false,
          mode: 'index',
          intersect: false
        },
        title: {
          display: !!options.title,
          text: options.title
        }
      },
      scales: {
        x: {
          type: 'time',
          display: true,
          grid: {
            display: options.showGrid !== false
          },
          stacked: options.stacked,
          time: {
            tooltipFormat: 'MMM dd, HH:mm',
            displayFormats: {
              hour: 'HH:mm',
              day: 'MMM dd',
              week: 'MMM dd',
              month: 'MMM yyyy'
            }
          }
        },
        y: {
          display: true,
          grid: {
            display: options.showGrid !== false
          },
          stacked: options.stacked
        }
      }
    };
  }

  private getDefaultColor(index: number): string {
    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
      '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1'
    ];
    return colors[index % colors.length];
  }

  async exportImage(format: 'png' | 'svg'): Promise<Blob> {
    if (!this.chart || !this.canvas) {
      throw new Error('Chart not initialized');
    }

    return new Promise((resolve, reject) => {
      this.canvas!.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to export chart'));
        }
      }, `image/${format}`);
    });
  }

  getDataAtPoint(x: number, y: number): ChartDataPoint | null {
    if (!this.chart) return null;

    const canvasPosition = this.chart.canvas.getBoundingClientRect();
    const dataX = x - canvasPosition.left;
    const dataY = y - canvasPosition.top;

    const points = this.chart.getElementsAtEventForMode(
      { x: dataX, y: dataY } as any,
      'nearest',
      { intersect: true },
      false
    );

    if (points.length > 0) {
      const point = points[0];
      const datasetIndex = point.datasetIndex;
      const index = point.index;
      const dataset = this.chart.data.datasets[datasetIndex];
      const data = dataset.data[index] as any;
      
      return {
        x: data.x,
        y: data.y,
        label: dataset.label
      };
    }

    return null;
  }
}