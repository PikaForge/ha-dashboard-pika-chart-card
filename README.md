# Pika Chart Card for Home Assistant

A flexible chart card for Home Assistant with swappable chart libraries (Chart.js and D3.js). This card provides an easy way to visualize your Home Assistant entity data with various chart types while maintaining the ability to switch between rendering libraries.

## Features

- **Multiple Chart Libraries**: Easily switch between Chart.js and D3.js
- **Chart Types**: Line, Area, Column/Bar, Pie, Donut, and Radial Bar charts
- **Real-time Updates**: Automatic refresh with configurable intervals
- **Home Assistant Integration**: Direct entity data fetching with history support
- **Customizable**: Extensive configuration options for appearance and behavior
- **Responsive**: Adapts to different card sizes and themes

## Installation

### HACS (Recommended)

1. Add this repository to HACS as a custom repository
2. Search for "Pika Chart Card" in HACS
3. Install the card
4. Add the resource to your Lovelace configuration

### Manual Installation

1. Download the `ha-dashboard-pika-chart-card.js` file from the latest release
2. Copy it to `/config/www/ha-dashboard-pika-chart-card.js`
3. Add the resource to your Lovelace configuration:

```yaml
resources:
  - url: /local/ha-dashboard-pika-chart-card.js
    type: module
```

## Configuration

### Basic Example

```yaml
type: custom:pika-chart-card
entities:
  - entity: sensor.temperature
    name: Temperature
    color: '#ff6384'
```

### Advanced Example

```yaml
type: custom:pika-chart-card
title: Home Sensors
chart_type: line
library: chartjs  # or 'd3'
hours_to_show: 48
refresh_interval: 30
height: 400
show_legend: true
show_grid: true
animate: true
entities:
  - entity: sensor.temperature
    name: Temperature
    color: '#ff6384'
    unit: '°C'
  - entity: sensor.humidity
    name: Humidity
    color: '#36a2eb'
    unit: '%'
    yaxis_id: 2
  - entity: sensor.pressure
    name: Pressure
    color: '#ffce56'
    type: area
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | string | **required** | Must be `custom:pika-chart-card` |
| `entities` | array | **required** | List of entities to display |
| `chart_type` | string | `line` | Chart type: `line`, `area`, `column`, `bar`, `pie`, `donut`, `radialBar` |
| `library` | string | `chartjs` | Chart library: `chartjs` or `d3` |
| `title` | string | - | Card title |
| `hours_to_show` | number | `24` | Hours of history to display |
| `refresh_interval` | number | `60` | Refresh interval in seconds |
| `height` | number | `300` | Chart height in pixels |
| `show_legend` | boolean | `true` | Show chart legend |
| `show_tooltip` | boolean | `true` | Show tooltips on hover |
| `show_grid` | boolean | `true` | Show grid lines |
| `animate` | boolean | `true` | Enable animations |
| `stacked` | boolean | `false` | Stack charts (for area/column) |
| `theme` | string | `auto` | Theme: `light`, `dark`, or `auto` |

### Entity Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `entity` | string | **required** | Entity ID |
| `name` | string | - | Display name |
| `attribute` | string | - | Use entity attribute instead of state |
| `color` | string | - | Line/bar color |
| `type` | string | - | Override chart type for this entity |
| `unit` | string | - | Unit of measurement |
| `yaxis_id` | number | - | Y-axis ID for multi-axis charts |
| `statistics` | object | - | Use long-term statistics instead of history |
| `show` | object | - | Visibility options |

### Statistics Configuration

When using Home Assistant's long-term statistics:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `statistics.stat_type` | string | `mean` | Statistics type: `min`, `max`, `mean`, `sum`, `state` |
| `statistics.period` | string | `hour` | Aggregation period: `5minute`, `hour`, `day`, `month` |

## Development

### Setup

```bash
npm install
npm run dev
```

### Build

```bash
npm run build
```

### Switching Chart Libraries

The card architecture allows easy switching between Chart.js and D3.js:

1. **Runtime switching**: Users can switch libraries using the dropdown in the card
2. **Programmatic switching**: Set the `library` option in the configuration
3. **Custom adapters**: Extend the `ChartLibraryAdapter` interface to add new libraries

## Architecture

The card uses an adapter pattern to abstract chart library implementations:

- `ChartManager`: Manages the lifecycle of charts and adapter switching
- `ChartLibraryAdapter`: Interface for chart library implementations
- `ChartJSAdapter`: Chart.js implementation
- `D3Adapter`: D3.js implementation

This design makes it easy to:
- Add new chart libraries
- Switch between libraries without data loss
- Maintain consistent API across different implementations

## License

MIT License

## Credits

Inspired by the [ApexCharts Card](https://github.com/RomRider/apexcharts-card) by RomRider.