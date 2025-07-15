# WebGL Dashboard Application Structure

## Project Overview

A Vue.js application featuring a customizable grid dashboard with WebGL-powered plot widgets using webgl-plot library and AG-Grid for layout management.

## Technology Stack

- **Frontend Framework**: Vue 3 with Composition API
- **Grid System**: ag-grid-vue3 for resizable/movable grid layout
- **Plotting**: webgl-plot for high-performance WebGL rendering
- **Styling**: CSS3 with CSS Grid and Flexbox
- **State Management**: Vue 3 reactive state

## Application Architecture

### Core Components Structure

```
src/
├── main.js                     # Vue app entry point
├── App.vue                     # Root application component
├── components/
│   ├── Dashboard.vue           # Main dashboard container
│   ├── PlotWidget.vue          # Individual plot widget component
│   ├── PlotConfiguration.vue   # Plot settings/config panel
│   ├── DataSelector.vue        # Data source selection component
│   ├── LegendEditor.vue        # Legend configuration component
│   └── GridLayout.vue          # AG-Grid wrapper component
├── composables/
│   ├── usePlotData.js          # Data management composable
│   ├── usePlotConfig.js        # Plot configuration composable
│   └── useGridLayout.js        # Grid layout management composable
├── utils/
│   ├── plotUtils.js            # WebGL plot utilities
│   ├── dataUtils.js            # Data processing utilities
│   └── gridUtils.js            # Grid helper functions
├── stores/
│   ├── dashboardStore.js       # Dashboard state management
│   └── plotStore.js            # Plot data and configuration store
├── assets/
│   ├── styles/
│   │   ├── main.css            # Global styles
│   │   ├── dashboard.css       # Dashboard-specific styles
│   │   ├── plot-widget.css     # Plot widget styles
│   │   └── grid-layout.css     # Grid layout styles
│   └── sample-data/
│       └── sampleData.js       # Sample datasets for testing
└── types/
    └── plotTypes.js            # Type definitions and interfaces
```

### Key Features Implementation

#### 1. Grid Dashboard (Dashboard.vue)

- AG-Grid integration for resizable/movable widgets
- Dynamic widget creation and removal
- Persistent layout configuration
- Toolbar for adding new widgets

#### 2. Plot Widget (PlotWidget.vue)

- WebGL-plot integration
- Real-time data rendering
- Configuration panel toggle
- Resize handling
- Multi-dataset support

#### 3. Plot Configuration (PlotConfiguration.vue)

- Data source selection
- Display options (colors, line styles, markers)
- Axis configuration (linear/log scale)
- Scale factors and offsets
- Legend settings
- Title customization

#### 4. Data Management

- Sample data generators
- CSV/JSON data import
- Real-time data simulation
- Data transformation utilities

## File Implementation Order

### Phase 1: Core Infrastructure

1. **package.json** - Project dependencies and scripts
2. **main.js** - Vue application setup
3. **App.vue** - Root component structure

### Phase 2: Utilities and Stores

4. **types/plotTypes.js** - Type definitions
5. **utils/dataUtils.js** - Data processing utilities
6. **utils/plotUtils.js** - WebGL plot utilities
7. **stores/dashboardStore.js** - State management
8. **assets/sample-data/sampleData.js** - Sample datasets

### Phase 3: Core Components

9. **components/GridLayout.vue** - AG-Grid wrapper
10. **components/PlotWidget.vue** - Main plot component
11. **components/DataSelector.vue** - Data selection UI
12. **components/LegendEditor.vue** - Legend configuration

### Phase 4: Configuration and Layout

13. **components/PlotConfiguration.vue** - Settings panel
14. **components/Dashboard.vue** - Main dashboard
15. **composables/usePlotData.js** - Data management composable
16. **composables/usePlotConfig.js** - Configuration composable

### Phase 5: Styling

17. **assets/styles/main.css** - Global styles
18. **assets/styles/dashboard.css** - Dashboard styles
19. **assets/styles/plot-widget.css** - Widget styles
20. **assets/styles/grid-layout.css** - Grid styles

## Key Dependencies

```json
{
  "vue": "^3.4.0",
  "ag-grid-vue3": "^31.0.0",
  "ag-grid-community": "^31.0.0",
  "webgl-plot": "^0.8.0",
  "vue-router": "^4.0.0"
}
```

## Core Features Breakdown

### WebGL Plot Integration

- Line plots with customizable colors and styles
- Scatter plots with configurable markers
- Real-time data streaming capability
- Semi-logarithmic axis support
- Multiple datasets per widget
- Hardware-accelerated rendering

### Grid Dashboard Capabilities

- Drag-and-drop widget repositioning
- Resizable widgets with aspect ratio options
- Add/remove widgets dynamically
- Save/load dashboard layouts
- Responsive design for different screen sizes

### Configuration Options

- Data source selection (file upload, sample data, real-time)
- Visual customization (colors, line styles, markers)
- Axis configuration (labels, ranges, scale types)
- Legend positioning and styling
- Title and subtitle options
- Scale factors and data transformations

### Data Management

- Support for time series data
- CSV/JSON import functionality
- Real-time data simulation
- Data filtering and transformation
- Multiple dataset overlay capability

This structure provides a robust foundation for a professional-grade dashboard application with high-performance WebGL plotting capabilities. Each component is designed to be modular and reusable, with clear separation of concerns.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
