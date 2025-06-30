/**
 * Type definitions and interfaces for the WebGL Dashboard Application
 * This file defines all data structures, enums, and type constants used throughout the application
 */

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

/**
 * Supported plot types for WebGL rendering
 */
export const PLOT_TYPES = {
  LINE: 'line',
  SCATTER: 'scatter',
  AREA: 'area',
  BAR: 'bar',
  HISTOGRAM: 'histogram'
}

/**
 * Axis scale types
 */
export const AXIS_SCALE_TYPES = {
  LINEAR: 'linear',
  LOG: 'log',
  SEMI_LOG_X: 'semiLogX',
  SEMI_LOG_Y: 'semiLogY',
  LOG_LOG: 'logLog'
}

/**
 * Data source types
 */
export const DATA_SOURCE_TYPES = {
  SAMPLE: 'sample',
  FILE: 'file',
  REALTIME: 'realtime',
  FUNCTION: 'function',
  API: 'api'
}

/**
 * Widget size presets
 */
export const WIDGET_SIZES = {
  SMALL: { width: 300, height: 200 },
  MEDIUM: { width: 450, height: 300 },
  LARGE: { width: 600, height: 400 },
  XLARGE: { width: 800, height: 500 }
}

/**
 * Color palettes for plots
 */
export const COLOR_PALETTES = {
  DEFAULT: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f'],
  VIRIDIS: ['#440154', '#3b528b', '#21908c', '#5dc863', '#fde725'],
  PLASMA: ['#0d0887', '#6a00a8', '#b12a90', '#e16462', '#fca636'],
  COOL: ['#0000ff', '#0080ff', '#00ffff', '#80ff80', '#ffff00'],
  WARM: ['#ff0000', '#ff8000', '#ffff00', '#80ff00', '#00ff00'],
  MONOCHROME: ['#000000', '#333333', '#666666', '#999999', '#cccccc']
}

/**
 * Line styles for plots
 */
export const LINE_STYLES = {
  SOLID: 'solid',
  DASHED: 'dashed',
  DOTTED: 'dotted',
  DASH_DOT: 'dashDot'
}

/**
 * Marker styles for scatter plots
 */
export const MARKER_STYLES = {
  CIRCLE: 'circle',
  SQUARE: 'square',
  TRIANGLE: 'triangle',
  DIAMOND: 'diamond',
  CROSS: 'cross',
  PLUS: 'plus'
}

/**
 * Legend positions
 */
export const LEGEND_POSITIONS = {
  TOP_LEFT: 'topLeft',
  TOP_RIGHT: 'topRight',
  BOTTOM_LEFT: 'bottomLeft',
  BOTTOM_RIGHT: 'bottomRight',
  TOP_CENTER: 'topCenter',
  BOTTOM_CENTER: 'bottomCenter',
  LEFT: 'left',
  RIGHT: 'right'
}

/**
 * Grid layout modes
 */
export const GRID_MODES = {
  FIXED: 'fixed',
  FLUID: 'fluid',
  RESPONSIVE: 'responsive'
}

// ============================================================================
// DATA STRUCTURES
// ============================================================================

/**
 * Point data structure for 2D plotting
 */
export const createPoint = (x = 0, y = 0, metadata = {}) => ({
  x,
  y,
  metadata
})

/**
 * Dataset configuration for a single data series
 */
export const createDataset = (config = {}) => ({
  id: config.id || generateId(),
  name: config.name || 'Dataset',
  data: config.data || [],
  type: config.type || PLOT_TYPES.LINE,
  visible: config.visible !== false,
  
  // Visual properties
  color: config.color || COLOR_PALETTES.DEFAULT[0],
  lineWidth: config.lineWidth || 2,
  lineStyle: config.lineStyle || LINE_STYLES.SOLID,
  markerSize: config.markerSize || 4,
  markerStyle: config.markerStyle || MARKER_STYLES.CIRCLE,
  opacity: config.opacity || 1.0,
  
  // Data transformations
  xScale: config.xScale || 1,
  yScale: config.yScale || 1,
  xOffset: config.xOffset || 0,
  yOffset: config.yOffset || 0,
  
  // Metadata
  units: config.units || { x: '', y: '' },
  description: config.description || '',
  source: config.source || DATA_SOURCE_TYPES.SAMPLE,
  
  // WebGL specific
  glBuffer: null,
  needsUpdate: true
})

/**
 * Axis configuration
 */
export const createAxisConfig = (config = {}) => ({
  label: config.label || '',
  min: config.min || null,
  max: config.max || null,
  autoScale: config.autoScale !== false,
  scaleType: config.scaleType || AXIS_SCALE_TYPES.LINEAR,
  tickCount: config.tickCount || 10,
  showGrid: config.showGrid !== false,
  gridColor: config.gridColor || '#e0e0e0',
  gridWidth: config.gridWidth || 1,
  showTicks: config.showTicks !== false,
  tickColor: config.tickColor || '#666666',
  labelColor: config.labelColor || '#333333',
  fontSize: config.fontSize || 12,
  fontFamily: config.fontFamily || 'Arial, sans-serif'
})

/**
 * Legend configuration
 */
export const createLegendConfig = (config = {}) => ({
  visible: config.visible !== false,
  position: config.position || LEGEND_POSITIONS.TOP_RIGHT,
  backgroundColor: config.backgroundColor || 'rgba(255, 255, 255, 0.9)',
  borderColor: config.borderColor || '#cccccc',
  borderWidth: config.borderWidth || 1,
  padding: config.padding || 8,
  fontSize: config.fontSize || 11,
  fontFamily: config.fontFamily || 'Arial, sans-serif',
  textColor: config.textColor || '#333333',
  itemSpacing: config.itemSpacing || 4,
  symbolWidth: config.symbolWidth || 20,
  symbolHeight: config.symbolHeight || 2
})

/**
 * Plot configuration
 */
export const createPlotConfig = (config = {}) => ({
  id: config.id || generateId(),
  title: config.title || '',
  subtitle: config.subtitle || '',
  width: config.width || WIDGET_SIZES.MEDIUM.width,
  height: config.height || WIDGET_SIZES.MEDIUM.height,
  
  // Background and styling
  backgroundColor: config.backgroundColor || '#ffffff',
  borderColor: config.borderColor || '#dddddd',
  borderWidth: config.borderWidth || 1,
  
  // Margins and padding
  margin: config.margin || { top: 40, right: 40, bottom: 60, left: 80 },
  padding: config.padding || { top: 10, right: 10, bottom: 10, left: 10 },
  
  // Axes configuration
  xAxis: createAxisConfig(config.xAxis),
  yAxis: createAxisConfig(config.yAxis),
  
  // Legend configuration
  legend: createLegendConfig(config.legend),
  
  // Datasets
  datasets: config.datasets || [],
  
  // Interaction settings
  enableZoom: config.enableZoom !== false,
  enablePan: config.enablePan !== false,
  enableCrosshair: config.enableCrosshair || false,
  enableTooltip: config.enableTooltip !== false,
  
  // Performance settings
  maxDataPoints: config.maxDataPoints || 10000,
  animationDuration: config.animationDuration || 300,
  throttleUpdates: config.throttleUpdates !== false,
  
  // WebGL settings
  antialias: config.antialias !== false,
  preserveDrawingBuffer: config.preserveDrawingBuffer || false,
  powerPreference: config.powerPreference || 'default'
})

/**
 * Widget configuration for grid layout
 */
export const createWidgetConfig = (config = {}) => ({
  id: config.id || generateId(),
  title: config.title || 'New Widget',
  type: config.type || 'plot',
  
  // Grid position and size
  gridPosition: config.gridPosition || { x: 0, y: 0, width: 4, height: 3 },
  minSize: config.minSize || { width: 200, height: 150 },
  maxSize: config.maxSize || { width: 1200, height: 800 },
  
  // Widget state
  visible: config.visible !== false,
  locked: config.locked || false,
  minimized: config.minimized || false,
  
  // Plot configuration
  plotConfig: createPlotConfig(config.plotConfig),
  
  // Widget styling
  headerColor: config.headerColor || '#f8f9fa',
  headerHeight: config.headerHeight || 40,
  
  // Metadata
  created: config.created || new Date().toISOString(),
  modified: config.modified || new Date().toISOString(),
  tags: config.tags || []
})

/**
 * Dashboard configuration
 */
export const createDashboardConfig = (config = {}) => ({
  id: config.id || generateId(),
  name: config.name || 'New Dashboard',
  description: config.description || '',
  
  // Grid configuration
  gridConfig: {
    columns: config.gridConfig?.columns || 12,
    rowHeight: config.gridConfig?.rowHeight || 60,
    margin: config.gridConfig?.margin || [10, 10],
    containerPadding: config.gridConfig?.containerPadding || [20, 20],
    resizable: config.gridConfig?.resizable !== false,
    draggable: config.gridConfig?.draggable !== false
  },
  
  // Widgets
  widgets: config.widgets || [],
  
  // Layout settings
  autoArrange: config.autoArrange || false,
  snapToGrid: config.snapToGrid !== false,
  
  // Theme and styling
  theme: config.theme || 'light',
  backgroundColor: config.backgroundColor || '#f5f5f5',
  
  // Metadata
  created: config.created || new Date().toISOString(),
  modified: config.modified || new Date().toISOString(),
  version: config.version || '1.0.0',
  author: config.author || '',
  tags: config.tags || []
})

/**
 * Data source configuration
 */
export const createDataSourceConfig = (config = {}) => ({
  id: config.id || generateId(),
  name: config.name || 'Data Source',
  type: config.type || DATA_SOURCE_TYPES.SAMPLE,
  
  // Source-specific configuration
  url: config.url || '',
  filePath: config.filePath || '',
  apiEndpoint: config.apiEndpoint || '',
  
  // Data format
  format: config.format || 'json', // json, csv, tsv, xml
  delimiter: config.delimiter || ',',
  headers: config.headers || true,
  
  // Refresh settings
  refreshInterval: config.refreshInterval || 0, // 0 = no auto-refresh
  lastRefresh: config.lastRefresh || null,
  
  // Data transformation
  xColumn: config.xColumn || 0,
  yColumn: config.yColumn || 1,
  filterExpression: config.filterExpression || '',
  
  // Metadata
  description: config.description || '',
  created: config.created || new Date().toISOString()
})

/**
 * Real-time data stream configuration
 */
export const createStreamConfig = (config = {}) => ({
  id: config.id || generateId(),
  name: config.name || 'Data Stream',
  active: config.active || false,
  
  // Stream settings
  updateInterval: config.updateInterval || 1000, // milliseconds
  bufferSize: config.bufferSize || 1000,
  autoScroll: config.autoScroll !== false,
  
  // Data generation (for simulated streams)
  generator: config.generator || null,
  generatorConfig: config.generatorConfig || {},
  
  // WebSocket settings (for real streams)
  websocketUrl: config.websocketUrl || '',
  reconnectAttempts: config.reconnectAttempts || 5,
  reconnectDelay: config.reconnectDelay || 1000
})

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a unique identifier
 */
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Validate plot configuration
 */
export const validatePlotConfig = (config) => {
  const errors = []
  
  if (!config) {
    errors.push('Plot configuration is required')
    return errors
  }
  
  if (!config.id) {
    errors.push('Plot ID is required')
  }
  
  if (config.width && (config.width < 100 || config.width > 2000)) {
    errors.push('Plot width must be between 100 and 2000 pixels')
  }
  
  if (config.height && (config.height < 100 || config.height > 1500)) {
    errors.push('Plot height must be between 100 and 1500 pixels')
  }
  
  if (config.datasets) {
    config.datasets.forEach((dataset, index) => {
      if (!dataset.id) {
        errors.push(`Dataset ${index} is missing an ID`)
      }
      if (!Array.isArray(dataset.data)) {
        errors.push(`Dataset ${index} data must be an array`)
      }
    })
  }
  
  return errors
}

/**
 * Validate dataset
 */
export const validateDataset = (dataset) => {
  const errors = []
  
  if (!dataset) {
    errors.push('Dataset is required')
    return errors
  }
  
  if (!dataset.id) {
    errors.push('Dataset ID is required')
  }
  
  if (!Array.isArray(dataset.data)) {
    errors.push('Dataset data must be an array')
  } else {
    // Validate data points
    dataset.data.forEach((point, index) => {
      if (typeof point.x !== 'number' || typeof point.y !== 'number') {
        errors.push(`Data point ${index} must have numeric x and y values`)
      }
      if (isNaN(point.x) || isNaN(point.y)) {
        errors.push(`Data point ${index} contains NaN values`)
      }
    })
  }
  
  if (dataset.color && !/^#[0-9A-F]{6}$/i.test(dataset.color)) {
    errors.push('Dataset color must be a valid hex color')
  }
  
  return errors
}

/**
 * Deep clone configuration objects
 */
export const cloneConfig = (config) => {
  return JSON.parse(JSON.stringify(config))
}

/**
 * Merge configuration objects
 */
export const mergeConfigs = (baseConfig, overrideConfig) => {
  const merged = cloneConfig(baseConfig)
  
  const merge = (target, source) => {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {}
        merge(target[key], source[key])
      } else {
        target[key] = source[key]
      }
    }
  }
  
  merge(merged, overrideConfig)
  return merged
}

/**
 * Get default configuration for a plot type
 */
export const getDefaultConfigForType = (plotType) => {
  const baseConfig = createPlotConfig()
  
  switch (plotType) {
    case PLOT_TYPES.LINE:
      return mergeConfigs(baseConfig, {
        datasets: [createDataset({ type: PLOT_TYPES.LINE })]
      })
      
    case PLOT_TYPES.SCATTER:
      return mergeConfigs(baseConfig, {
        datasets: [createDataset({ 
          type: PLOT_TYPES.SCATTER,
          lineWidth: 0,
          markerSize: 6
        })]
      })
      
    case PLOT_TYPES.AREA:
      return mergeConfigs(baseConfig, {
        datasets: [createDataset({ 
          type: PLOT_TYPES.AREA,
          opacity: 0.7
        })]
      })
      
    default:
      return baseConfig
  }
}

/**
 * Convert legacy configuration formats
 */
export const migrateConfig = (config, fromVersion = '1.0.0', toVersion = '1.0.0') => {
  // Add migration logic here as the application evolves
  return config
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Constants
  PLOT_TYPES,
  AXIS_SCALE_TYPES,
  DATA_SOURCE_TYPES,
  WIDGET_SIZES,
  COLOR_PALETTES,
  LINE_STYLES,
  MARKER_STYLES,
  LEGEND_POSITIONS,
  GRID_MODES,
  
  // Factories
  createPoint,
  createDataset,
  createAxisConfig,
  createLegendConfig,
  createPlotConfig,
  createWidgetConfig,
  createDashboardConfig,
  createDataSourceConfig,
  createStreamConfig,
  
  // Utilities
  generateId,
  validatePlotConfig,
  validateDataset,
  cloneConfig,
  mergeConfigs,
  getDefaultConfigForType,
  migrateConfig
}