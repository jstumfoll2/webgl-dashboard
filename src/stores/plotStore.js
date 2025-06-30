// stores/plotStore.js
import { reactive, ref } from 'vue'

// Default plot configuration
const defaultPlotConfig = {
  title: '',
  subtitle: '',
  showLegend: true,
  legendPosition: 'top-right',
  xAxis: {
    label: 'X Axis',
    min: null,
    max: null,
    autoScale: true,
    logScale: false
  },
  yAxis: {
    label: 'Y Axis',
    min: null,
    max: null,
    autoScale: true,
    logScale: false
  },
  grid: {
    show: true,
    color: '#e0e0e0',
    opacity: 0.3
  },
  backgroundColor: '#ffffff',
  borderColor: '#cccccc',
  borderWidth: 1
}

// Default dataset configuration
const defaultDatasetConfig = {
  id: '',
  name: 'Dataset',
  visible: true,
  color: '#3366cc',
  lineWidth: 2,
  lineStyle: 'solid', // solid, dashed, dotted
  markerType: 'none', // none, circle, square, triangle
  markerSize: 4,
  markerColor: null, // null uses line color
  scaleFactor: 1,
  offset: 0,
  dataSource: 'sample', // sample, file, realtime
  sampleDataType: 'sine' // sine, cosine, random, linear
}

// Plot store state
const plotStore = reactive({
  // All plot widgets indexed by widgetId
  plots: {},
  
  // Available sample data types
  sampleDataTypes: [
    { value: 'sine', label: 'Sine Wave' },
    { value: 'cosine', label: 'Cosine Wave' },
    { value: 'random', label: 'Random Walk' },
    { value: 'linear', label: 'Linear Trend' },
    { value: 'exponential', label: 'Exponential Decay' },
    { value: 'noisy_sine', label: 'Noisy Sine Wave' }
  ],
  
  // Available colors for datasets
  defaultColors: [
    '#3366cc', '#dc3912', '#ff9900', '#109618',
    '#990099', '#0099c6', '#dd4477', '#66aa00',
    '#b82e2e', '#316395', '#994499', '#22aa99',
    '#aaaa11', '#6633cc', '#e67300', '#8b0707'
  ],
  
  // Line styles
  lineStyles: [
    { value: 'solid', label: 'Solid' },
    { value: 'dashed', label: 'Dashed' },
    { value: 'dotted', label: 'Dotted' }
  ],
  
  // Marker types
  markerTypes: [
    { value: 'none', label: 'None' },
    { value: 'circle', label: 'Circle' },
    { value: 'square', label: 'Square' },
    { value: 'triangle', label: 'Triangle' },
    { value: 'diamond', label: 'Diamond' },
    { value: 'cross', label: 'Cross' }
  ],
  
  // Legend positions
  legendPositions: [
    { value: 'top-left', label: 'Top Left' },
    { value: 'top-right', label: 'Top Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'bottom-right', label: 'Bottom Right' },
    { value: 'center', label: 'Center' }
  ],
  
  // Real-time data settings
  realTimeSettings: {
    updateInterval: 100, // milliseconds
    maxDataPoints: 1000,
    isRunning: false
  }
})

// Plot store actions
const plotStoreActions = {
  // Create a new plot widget
  createPlot(widgetId, config = {}) {
    const plotConfig = {
      ...defaultPlotConfig,
      ...config
    }
    
    plotStore.plots[widgetId] = {
      id: widgetId,
      config: plotConfig,
      datasets: {},
      dataCache: {},
      lastUpdate: Date.now(),
      isConfigVisible: false
    }
    
    // Add a default dataset
    this.addDataset(widgetId, {
      id: 'dataset_1',
      name: 'Dataset 1',
      color: plotStore.defaultColors[0]
    })
    
    return plotStore.plots[widgetId]
  },
  
  // Remove a plot widget
  removePlot(widgetId) {
    if (plotStore.plots[widgetId]) {
      delete plotStore.plots[widgetId]
    }
  },
  
  // Get a plot by widget ID
  getPlot(widgetId) {
    return plotStore.plots[widgetId] || null
  },
  
  // Update plot configuration
  updatePlotConfig(widgetId, configUpdate) {
    const plot = plotStore.plots[widgetId]
    if (plot) {
      plot.config = {
        ...plot.config,
        ...configUpdate
      }
      plot.lastUpdate = Date.now()
    }
  },
  
  // Add a dataset to a plot
  addDataset(widgetId, datasetConfig = {}) {
    const plot = plotStore.plots[widgetId]
    if (!plot) return null
    
    const datasetId = datasetConfig.id || `dataset_${Date.now()}`
    const colorIndex = Object.keys(plot.datasets).length % plotStore.defaultColors.length
    
    const dataset = {
      ...defaultDatasetConfig,
      ...datasetConfig,
      id: datasetId,
      color: datasetConfig.color || plotStore.defaultColors[colorIndex]
    }
    
    plot.datasets[datasetId] = dataset
    plot.dataCache[datasetId] = {
      x: [],
      y: [],
      lastGenerated: 0
    }
    
    return dataset
  },
  
  // Remove a dataset from a plot
  removeDataset(widgetId, datasetId) {
    const plot = plotStore.plots[widgetId]
    if (plot && plot.datasets[datasetId]) {
      delete plot.datasets[datasetId]
      delete plot.dataCache[datasetId]
    }
  },
  
  // Update dataset configuration
  updateDataset(widgetId, datasetId, datasetUpdate) {
    const plot = plotStore.plots[widgetId]
    if (plot && plot.datasets[datasetId]) {
      plot.datasets[datasetId] = {
        ...plot.datasets[datasetId],
        ...datasetUpdate
      }
      plot.lastUpdate = Date.now()
    }
  },
  
  // Get dataset by ID
  getDataset(widgetId, datasetId) {
    const plot = plotStore.plots[widgetId]
    return plot?.datasets[datasetId] || null
  },
  
  // Set data for a dataset
  setDatasetData(widgetId, datasetId, xData, yData) {
    const plot = plotStore.plots[widgetId]
    if (plot && plot.dataCache[datasetId]) {
      const dataset = plot.datasets[datasetId]
      const cache = plot.dataCache[datasetId]
      
      // Apply scale factor and offset
      const scaledY = yData.map(y => (y * dataset.scaleFactor) + dataset.offset)
      
      cache.x = [...xData]
      cache.y = [...scaledY]
      cache.lastGenerated = Date.now()
      plot.lastUpdate = Date.now()
    }
  },
  
  // Get data for a dataset
  getDatasetData(widgetId, datasetId) {
    const plot = plotStore.plots[widgetId]
    return plot?.dataCache[datasetId] || { x: [], y: [] }
  },
  
  // Toggle dataset visibility
  toggleDatasetVisibility(widgetId, datasetId) {
    const plot = plotStore.plots[widgetId]
    if (plot && plot.datasets[datasetId]) {
      plot.datasets[datasetId].visible = !plot.datasets[datasetId].visible
      plot.lastUpdate = Date.now()
    }
  },
  
  // Toggle plot configuration panel
  togglePlotConfig(widgetId) {
    const plot = plotStore.plots[widgetId]
    if (plot) {
      plot.isConfigVisible = !plot.isConfigVisible
    }
  },
  
  // Get all visible datasets for a plot
  getVisibleDatasets(widgetId) {
    const plot = plotStore.plots[widgetId]
    if (!plot) return []
    
    return Object.values(plot.datasets).filter(dataset => dataset.visible)
  },
  
  // Clone a plot configuration
  clonePlot(sourceWidgetId, targetWidgetId) {
    const sourcePlot = plotStore.plots[sourceWidgetId]
    if (!sourcePlot) return null
    
    // Deep copy the configuration
    const clonedConfig = JSON.parse(JSON.stringify(sourcePlot.config))
    const clonedPlot = this.createPlot(targetWidgetId, clonedConfig)
    
    // Copy datasets
    Object.values(sourcePlot.datasets).forEach(dataset => {
      const clonedDataset = JSON.parse(JSON.stringify(dataset))
      clonedDataset.id = `${dataset.id}_clone`
      this.addDataset(targetWidgetId, clonedDataset)
      
      // Copy data
      const sourceData = this.getDatasetData(sourceWidgetId, dataset.id)
      this.setDatasetData(targetWidgetId, clonedDataset.id, sourceData.x, sourceData.y)
    })
    
    return clonedPlot
  },
  
  // Export plot configuration
  exportPlotConfig(widgetId) {
    const plot = plotStore.plots[widgetId]
    if (!plot) return null
    
    return {
      config: plot.config,
      datasets: plot.datasets,
      data: plot.dataCache
    }
  },
  
  // Import plot configuration
  importPlotConfig(widgetId, importData) {
    if (!importData) return null
    
    const plot = this.createPlot(widgetId, importData.config)
    
    // Clear default dataset
    Object.keys(plot.datasets).forEach(datasetId => {
      this.removeDataset(widgetId, datasetId)
    })
    
    // Import datasets
    Object.values(importData.datasets).forEach(dataset => {
      this.addDataset(widgetId, dataset)
    })
    
    // Import data
    Object.entries(importData.data).forEach(([datasetId, data]) => {
      this.setDatasetData(widgetId, datasetId, data.x, data.y)
    })
    
    return plot
  },
  
  // Clear all plots
  clearAllPlots() {
    plotStore.plots = {}
  },
  
  // Get plot statistics
  getPlotStats(widgetId) {
    const plot = plotStore.plots[widgetId]
    if (!plot) return null
    
    const stats = {
      totalDatasets: Object.keys(plot.datasets).length,
      visibleDatasets: Object.values(plot.datasets).filter(d => d.visible).length,
      totalDataPoints: 0,
      lastUpdate: plot.lastUpdate
    }
    
    Object.values(plot.dataCache).forEach(cache => {
      stats.totalDataPoints += cache.x.length
    })
    
    return stats
  },
  
  // Update real-time settings
  updateRealTimeSettings(settings) {
    plotStore.realTimeSettings = {
      ...plotStore.realTimeSettings,
      ...settings
    }
  }
}

// Export the store and actions
export { plotStore, plotStoreActions, defaultPlotConfig, defaultDatasetConfig }