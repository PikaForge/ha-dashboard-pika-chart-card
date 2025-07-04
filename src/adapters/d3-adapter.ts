import * as d3 from 'd3';
import { ChartLibraryAdapter, ChartOptions, ChartSeries, ChartUpdateOptions, ChartAxis, ChartDataPoint } from '../types/chart-types';

export class D3Adapter implements ChartLibraryAdapter {
  name = 'D3.js';
  version = '7.8.5';
  
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;
  private container: HTMLElement | null = null;
  private currentOptions: ChartOptions | null = null;
  private margin = { top: 20, right: 30, bottom: 40, left: 50 };
  private tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined> | null = null;

  create(container: HTMLElement, options: ChartOptions): void {
    this.container = container;
    this.currentOptions = options;
    
    const width = options.width || container.clientWidth;
    const height = options.height || container.clientHeight;

    this.svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    this.createTooltip();
    this.render(options.series, options);
  }

  update(series: ChartSeries[], options?: ChartUpdateOptions): void {
    if (!this.svg || !this.currentOptions) return;
    
    if (options?.animate !== false) {
      this.svg.selectAll('*').transition().duration(750).style('opacity', 0)
        .on('end', () => {
          this.svg!.selectAll('*').remove();
          this.render(series, this.currentOptions!);
        });
    } else {
      this.svg.selectAll('*').remove();
      this.render(series, this.currentOptions!);
    }
  }

  destroy(): void {
    if (this.svg) {
      this.svg.remove();
      this.svg = null;
    }
    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }
    this.container = null;
    this.currentOptions = null;
  }

  resize(width?: number, height?: number): void {
    if (!this.svg || !this.container) return;
    
    const w = width || this.container.clientWidth;
    const h = height || this.container.clientHeight;
    
    this.svg
      .attr('width', w)
      .attr('height', h)
      .attr('viewBox', `0 0 ${w} ${h}`);
    
    if (this.currentOptions) {
      this.update(this.currentOptions.series, { animate: false });
    }
  }

  private render(series: ChartSeries[], options: ChartOptions): void {
    if (!this.svg) return;

    const width = +this.svg.attr('width');
    const height = +this.svg.attr('height');
    const innerWidth = width - this.margin.left - this.margin.right;
    const innerHeight = height - this.margin.top - this.margin.bottom;

    const g = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    // Check if we have mixed types
    const chartTypes = new Set(series.map(s => s.type || options.type));
    const isMixedChart = chartTypes.size > 1 && !['pie', 'donut'].some(t => chartTypes.has(t));

    if (isMixedChart) {
      this.renderMixedChart(g, series, innerWidth, innerHeight, options);
    } else {
      // Single chart type rendering
      const primaryType = series[0]?.type || options.type;
      switch (primaryType) {
        case 'line':
        case 'area':
          this.renderLineChart(g, series, innerWidth, innerHeight, options);
          break;
        case 'column':
        case 'bar':
          this.renderBarChart(g, series, innerWidth, innerHeight, options);
          break;
        case 'pie':
        case 'donut':
          this.renderPieChart(g, series, innerWidth, innerHeight, options);
          break;
        default:
          this.renderLineChart(g, series, innerWidth, innerHeight, options);
      }
    }

    if (options.showLegend !== false) {
      this.renderLegend(g, series, innerWidth, innerHeight);
    }
  }

  private renderMixedChart(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    series: ChartSeries[],
    width: number,
    height: number,
    options: ChartOptions
  ): void {
    const allData = series.flatMap(s => s.data);
    const xScale = this.createXScale(allData, width);
    const yScale = this.createYScale(allData, height);
    
    this.renderAxes(g, xScale, yScale, width, height, options);
    
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    
    // Group series by type
    const barSeries = series.filter(s => (s.type || options.type) === 'column' || (s.type || options.type) === 'bar');
    const lineSeries = series.filter(s => (s.type || options.type) === 'line');
    const areaSeries = series.filter(s => (s.type || options.type) === 'area');
    
    // Render bar series first (behind lines)
    if (barSeries.length > 0) {
      this.renderBarSeriesInMixed(g, barSeries, xScale, yScale, width, height, colorScale, options);
    }
    
    // Render area series
    areaSeries.forEach((serie, index) => {
      if (serie.show === false) return;
      this.renderAreaSeries(g, serie, xScale, yScale, serie.color || colorScale(index.toString()), index, options);
    });
    
    // Render line series
    [...lineSeries, ...areaSeries].forEach((serie, index) => {
      if (serie.show === false) return;
      this.renderLineSeries(g, serie, xScale, yScale, serie.color || colorScale(index.toString()), index, options);
    });
  }

  private renderBarSeriesInMixed(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    barSeries: ChartSeries[],
    xScale: any,
    yScale: any,
    width: number,
    height: number,
    colorScale: any,
    options: ChartOptions
  ): void {
    // Get unique x values across all series
    const allXValues = Array.from(new Set(barSeries.flatMap(s => s.data.map(d => String(d.x)))));
    
    const x0Scale = d3.scaleBand()
      .domain(allXValues)
      .range([0, width])
      .padding(0.1);
    
    const x1Scale = d3.scaleBand()
      .domain(barSeries.map((_, i) => i.toString()))
      .range([0, x0Scale.bandwidth()])
      .padding(0.05);
    
    allXValues.forEach(xValue => {
      const bars = g.append('g')
        .attr('transform', `translate(${x0Scale(xValue)},0)`);
      
      barSeries.forEach((serie, serieIndex) => {
        const dataPoint = serie.data.find(d => String(d.x) === xValue);
        if (!dataPoint) return;
        
        bars.append('rect')
          .attr('x', x1Scale(serieIndex.toString())!)
          .attr('y', height)
          .attr('width', x1Scale.bandwidth())
          .attr('height', 0)
          .attr('fill', serie.color || colorScale(serieIndex.toString()))
          .transition()
          .duration(options.animate !== false ? 750 : 0)
          .attr('y', yScale(dataPoint.y))
          .attr('height', height - yScale(dataPoint.y));
      });
    });
  }

  private renderLineSeries(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    serie: ChartSeries,
    xScale: any,
    yScale: any,
    color: string,
    index: number,
    options: ChartOptions
  ): void {
    const line = d3.line<ChartDataPoint>()
      .x(d => xScale(d.x)!)
      .y(d => yScale(d.y))
      .curve(d3.curveMonotoneX);

    const path = g.append('path')
      .datum(serie.data)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2)
      .attr('d', line)
      .attr('class', `line-${index}`);

    if (options.animate !== false) {
      const totalLength = path.node()!.getTotalLength();
      path
        .attr('stroke-dasharray', totalLength + ' ' + totalLength)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .duration(750)
        .ease(d3.easeLinear)
        .attr('stroke-dashoffset', 0);
    }

    this.renderDataPoints(g, serie, xScale, yScale, color, index);
  }

  private renderAreaSeries(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    serie: ChartSeries,
    xScale: any,
    yScale: any,
    color: string,
    index: number,
    options: ChartOptions
  ): void {
    const area = d3.area<ChartDataPoint>()
      .x(d => xScale(d.x)!)
      .y0(yScale(0))
      .y1(d => yScale(d.y))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(serie.data)
      .attr('fill', color)
      .attr('fill-opacity', 0.3)
      .attr('d', area)
      .attr('class', `area-${index}`);
  }

  private renderLineChart(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    series: ChartSeries[],
    width: number,
    height: number,
    options: ChartOptions
  ): void {
    const allData = series.flatMap(s => s.data);
    
    const xScale = this.createXScale(allData, width);
    const yScale = this.createYScale(allData, height);

    this.renderAxes(g, xScale, yScale, width, height, options);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    series.forEach((serie, index) => {
      if (serie.show === false) return;

      const color = serie.color || colorScale(index.toString());

      if (options.type === 'area') {
        this.renderAreaSeries(g, serie, xScale, yScale, color, index, options);
      }

      this.renderLineSeries(g, serie, xScale, yScale, color, index, options);
    });
  }

  private renderBarChart(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    series: ChartSeries[],
    width: number,
    height: number,
    options: ChartOptions
  ): void {
    const allData = series.flatMap(s => s.data);
    const categories = Array.from(new Set(allData.map(d => String(d.x))));
    
    const x0Scale = d3.scaleBand()
      .domain(categories)
      .range([0, width])
      .padding(0.1);

    const x1Scale = d3.scaleBand()
      .domain(series.map((_, i) => i.toString()))
      .range([0, x0Scale.bandwidth()])
      .padding(0.05);

    const yScale = this.createYScale(allData, height);
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    this.renderAxes(g, x0Scale, yScale, width, height, options);

    const categoryGroups = g.selectAll('.category-group')
      .data(categories)
      .enter().append('g')
      .attr('class', 'category-group')
      .attr('transform', d => `translate(${x0Scale(d)},0)`);

    categoryGroups.selectAll('rect')
      .data((category) => series.map((serie, index) => ({
        serie,
        index,
        value: serie.data.find(d => String(d.x) === category)?.y || 0
      })))
      .enter().append('rect')
      .attr('x', d => x1Scale(d.index.toString())!)
      .attr('y', height)
      .attr('width', x1Scale.bandwidth())
      .attr('height', 0)
      .attr('fill', d => d.serie.color || colorScale(d.index.toString()))
      .transition()
      .duration(options.animate !== false ? 750 : 0)
      .attr('y', d => yScale(d.value))
      .attr('height', d => height - yScale(d.value));
  }

  private renderPieChart(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    series: ChartSeries[],
    width: number,
    height: number,
    options: ChartOptions
  ): void {
    const radius = Math.min(width, height) / 2;
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    
    const pie = d3.pie<ChartDataPoint>()
      .value(d => d.y)
      .sort(null);

    const arc = d3.arc<d3.PieArcDatum<ChartDataPoint>>()
      .innerRadius(options.type === 'donut' ? radius * 0.6 : 0)
      .outerRadius(radius);

    const pieG = g.append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    series.forEach((serie, serieIndex) => {
      if (serie.show === false) return;

      const arcs = pieG.selectAll(`.arc-${serieIndex}`)
        .data(pie(serie.data))
        .enter().append('g')
        .attr('class', `arc arc-${serieIndex}`);

      arcs.append('path')
        .attr('d', arc)
        .attr('fill', (d, i) => serie.color || colorScale(i.toString()))
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .style('opacity', 0)
        .transition()
        .duration(options.animate !== false ? 750 : 0)
        .style('opacity', 1)
        .attrTween('d', function(d) {
          const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
          return function(t) {
            return arc(i(t))!;
          };
        });

      if (options.showTooltip !== false) {
        arcs.on('mouseover', (event, d) => {
          if (this.tooltip) {
            this.tooltip
              .style('opacity', 1)
              .html(`${serie.name}: ${d.data.y}`)
              .style('left', (event.pageX + 10) + 'px')
              .style('top', (event.pageY - 28) + 'px');
          }
        })
        .on('mouseout', () => {
          if (this.tooltip) {
            this.tooltip.style('opacity', 0);
          }
        });
      }
    });
  }

  private renderAxes(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    xScale: any,
    yScale: any,
    width: number,
    height: number,
    options: ChartOptions
  ): void {
    if (options.showGrid !== false) {
      g.append('g')
        .attr('class', 'grid')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickSize(-height).tickFormat(() => ''))
        .style('stroke-dasharray', '3,3')
        .style('opacity', 0.3);

      g.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(yScale).tickSize(-width).tickFormat(() => ''))
        .style('stroke-dasharray', '3,3')
        .style('opacity', 0.3);
    }

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale));
  }

  private renderDataPoints(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    serie: ChartSeries,
    xScale: any,
    yScale: any,
    color: string,
    index: number
  ): void {
    const points = g.selectAll(`.point-${index}`)
      .data(serie.data)
      .enter().append('circle')
      .attr('class', `point point-${index}`)
      .attr('cx', d => xScale(d.x)!)
      .attr('cy', d => yScale(d.y))
      .attr('r', 0)
      .attr('fill', color)
      .transition()
      .duration(750)
      .attr('r', 4);

    if (this.currentOptions?.showTooltip !== false && this.tooltip) {
      points.on('mouseover', (event, d) => {
        if (this.tooltip) {
          this.tooltip
            .style('opacity', 1)
            .html(`${serie.name}<br/>x: ${d.x}<br/>y: ${d.y}`)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px');
        }
      })
      .on('mouseout', () => {
        if (this.tooltip) {
          this.tooltip.style('opacity', 0);
        }
      });
    }
  }

  private renderLegend(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    series: ChartSeries[],
    width: number,
    height: number
  ): void {
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    const legendG = g.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(0, ${height + 30})`);

    const legendItems = legendG.selectAll('.legend-item')
      .data(series.filter(s => s.show !== false))
      .enter().append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(${i * 120}, 0)`);

    legendItems.append('rect')
      .attr('width', 10)
      .attr('height', 10)
      .attr('fill', (d, i) => d.color || colorScale(i.toString()));

    legendItems.append('text')
      .attr('x', 15)
      .attr('y', 9)
      .text(d => d.name)
      .style('font-size', '12px');
  }

  private createTooltip(): void {
    this.tooltip = d3.select('body').append('div')
      .attr('class', 'd3-tooltip')
      .style('position', 'absolute')
      .style('padding', '10px')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('border-radius', '4px')
      .style('pointer-events', 'none')
      .style('opacity', 0);
  }

  private createXScale(data: ChartDataPoint[], width: number): d3.ScaleLinear<number, number> | d3.ScaleTime<number, number> {
    const xValues = data.map(d => d.x);
    
    if (xValues.every(x => x instanceof Date)) {
      return d3.scaleTime()
        .domain(d3.extent(xValues) as [Date, Date])
        .range([0, width]);
    } else if (xValues.every(x => typeof x === 'number')) {
      return d3.scaleLinear()
        .domain(d3.extent(xValues) as [number, number])
        .range([0, width]);
    } else {
      const numericValues = xValues.map((x, i) => i);
      return d3.scaleLinear()
        .domain([0, numericValues.length - 1])
        .range([0, width]);
    }
  }

  private createYScale(data: ChartDataPoint[], height: number): d3.ScaleLinear<number, number> {
    const yExtent = d3.extent(data, d => d.y) as [number, number];
    return d3.scaleLinear()
      .domain([0, yExtent[1] * 1.1])
      .range([height, 0]);
  }
}