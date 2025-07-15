import { ref, computed, watch, reactive } from 'vue'
import { COLOR_PALETTES, LINE_STYLES, MARKER_STYLES, AXIS_SCALE_TYPES } from '../types/plotTypes.js'

export function usePlotConfig(plotId) {
  // Base configuration state
  const config = reactive({
    // General settings
    title: '',
    subtitle: '',
    showGrid: true,
    backgroundColor: '#ffffff',
    
    // Axis configuration
    xAxis: {
      label: 'X Axis',
      scale: AXIS_SCALE_TYPES.LINEAR,
      min: null,
      max: null,
      autoScale: true,
      showTicks: true,
      tickCount: 10
    },
    yAxis: {
      label: 'Y Axis',
      scale: AXIS_SCALE_TYPES.LINEAR,
      min: null,
      max: null,
      autoScale: true,
      showTicks: true,
      tickCount: 10
    },
    
    // Legend configuration
    legend: {
      enabled: true,
      position: 'top-right',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: '#cccccc',
      fontSize: 12,
      padding: 8
    },
    
    // Data series configurations
    series: []
  })

  // Available configuration options
  const availableColors = ref(Object.values(COLOR_PALETTES.DEFAULT))
  const availableLineStyles = ref(Object.values(LINE_STYLES))
  const availableMarkerTypes = ref(Object.values(MARKER_STYLES))
  const availableAxisScales = ref(Object.values(AXIS_SCALE_TYPES))
  const availableLegendPositions = ref([
    'top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'
  ])

  // Series management
  const addSeries = (seriesConfig = {}) => {
    const defaultConfig = {
      id: `series_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `Series ${config.series.length + 1}`,
      dataSource: null,
      xColumn: null,
      yColumn: null,
      color: availableColors.value[config.series.length % availableColors.value.length],
      lineStyle: LINE_STYLES.SOLID,
      lineWidth: 2,
      markerType: MARKER_STYLES.CIRCLE,
      markerSize: 4,
      visible: true,
      scaleFactor: {
        x: 1,
        y: 1
      },
      offset: {
        x: 0,
        y: 0
      }
    }
    
    const newSeries = { ...defaultConfig, ...seriesConfig }
    config.series.push(newSeries)
    return newSeries.id
  }

  const removeSeries = (seriesId) => {
    const index = config.series.findIndex(s => s.id === seriesId)
    if (index !== -1) {
      config.series.splice(index, 1)
    }
  }

  const updateSeries = (seriesId, updates) => {
    const series = config.series.find(s => s.id === seriesId)
    if (series) {
      Object.assign(series, updates)
    }
  }

  const getSeriesConfig = (seriesId) => {
    return config.series.find(s => s.id === seriesId)
  }

  // Configuration validation
  const validateConfig = () => {
    const errors = []
    
    // Validate axis ranges
    if (config.xAxis.min !== null && config.xAxis.max !== null) {
      if (config.xAxis.min >= config.xAxis.max) {
        errors.push('X-axis minimum must be less than maximum')
      }
    }
    
    if (config.yAxis.min !== null && config.yAxis.max !== null) {
      if (config.yAxis.min >= config.yAxis.max) {
        errors.push('Y-axis minimum must be less than maximum')
      }
    }
    
    // Validate series configurations
    config.series.forEach((series, index) => {
      if (!series.name.trim()) {
        errors.push(`Series ${index + 1} must have a name`)
      }
      
      if (!series.dataSource) {
        errors.push(`Series ${index + 1} must have a data source`)
      }
      
      if (series.lineWidth <= 0) {
        errors.push(`Series ${index + 1} line width must be positive`)
      }
      
      if (series.markerSize <= 0) {
        errors.push(`Series ${index + 1} marker size must be positive`)
      }
    })
    
    return errors
  }

  // Computed properties
  const isValid = computed(() => {
    return validateConfig().length === 0
  })

  const hasVisibleSeries = computed(() => {
    return config.series.some(s => s.visible)
  })

  const visibleSeries = computed(() => {
    return config.series.filter(s => s.visible)
  })

  const seriesCount = computed(() => {
    return config.series.length
  })

  const isLogarithmicX = computed(() => {
    return config.xAxis.scale === AXIS_SCALE_TYPES.LOG
  })

  const isLogarithmicY = computed(() => {
    return config.yAxis.scale === AXIS_SCALE_TYPES.LOG
  })

  // Configuration presets
  const applyPreset = (presetName) => {
    const presets = {
      default: {
        title: '',
        subtitle: '',
        showGrid: true,
        backgroundColor: '#ffffff',
        xAxis: {
          label: 'X Axis',
          scale: AXIS_SCALE_TYPES.LINEAR,
          autoScale: true
        },
        yAxis: {
          label: 'Y Axis',
          scale: AXIS_SCALE_TYPES.LINEAR,
          autoScale: true
        },
        legend: {
          enabled: true,
          position: 'top-right'
        }
      },
      scientific: {
        title: 'Scientific Plot',
        showGrid: true,
        backgroundColor: '#f8f9fa',
        xAxis: {
          label: 'Independent Variable',
          scale: AXIS_SCALE_TYPES.LINEAR,
          autoScale: true,
          showTicks: true,
          tickCount: 10
        },
        yAxis: {
          label: 'Dependent Variable',
          scale: AXIS_SCALE_TYPES.LINEAR,
          autoScale: true,
          showTicks: true,
          tickCount: 10
        },
        legend: {
          enabled: true,
          position: 'top-right',
          backgroundColor: 'rgba(248, 249, 250, 0.95)'
        }
      },
      financial: {
        title: 'Financial Chart',
        showGrid: true,
        backgroundColor: '#1a1a1a',
        xAxis: {
          label: 'Time',
          scale: AXIS_SCALE_TYPES.LINEAR,
          autoScale: true
        },
        yAxis: {
          label: 'Value',
          scale: AXIS_SCALE_TYPES.LINEAR,
          autoScale: true
        },
        legend: {
          enabled: true,
          position: 'top-left',
          backgroundColor: 'rgba(0, 0, 0, 0.8)'
        }
      }
    }
    
    const preset = presets[presetName]
    if (preset) {
      Object.assign(config, preset)
    }
  }

  // Configuration serialization
  const exportConfig = () => {
    return JSON.parse(JSON.stringify(config))
  }

  const importConfig = (configData) => {
    try {
      const imported = typeof configData === 'string' ? JSON.parse(configData) : configData
      
      // Validate imported config structure
      if (imported && typeof imported === 'object') {
        Object.assign(config, imported)
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to import configuration:', error)
      return false
    }
  }

  const resetConfig = () => {
    applyPreset('default')
    config.series.length = 0
  }

  // Axis configuration helpers
  const setAxisScale = (axis, scale) => {
    if (axis === 'x') {
      config.xAxis.scale = scale
    } else if (axis === 'y') {
      config.yAxis.scale = scale
    }
    
    // Reset manual ranges when switching scales
    if (scale === AXIS_SCALE_TYPES.LOG) {
      config[`${axis}Axis`].min = null
      config[`${axis}Axis`].max = null
      config[`${axis}Axis`].autoScale = true
    }
  }

  const setAxisRange = (axis, min, max) => {
    const axisConfig = axis === 'x' ? config.xAxis : config.yAxis
    axisConfig.min = min
    axisConfig.max = max
    axisConfig.autoScale = false
  }

  const resetAxisRange = (axis) => {
    const axisConfig = axis === 'x' ? config.xAxis : config.yAxis
    axisConfig.min = null
    axisConfig.max = null
    axisConfig.autoScale = true
  }

  // Legend configuration helpers
  const updateLegendPosition = (position) => {
    config.legend.position = position
  }

  const toggleLegend = () => {
    config.legend.enabled = !config.legend.enabled
  }

  // Watch for configuration changes
  const configChanged = ref(false)
  
  watch(config, () => {
    configChanged.value = true
  }, { deep: true })

  const markConfigSaved = () => {
    configChanged.value = false
  }

  // Auto-generate series names
  const generateSeriesName = (index) => {
    const defaultNames = [
      'Primary', 'Secondary', 'Tertiary', 'Quaternary',
      'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'
    ]
    
    if (index < defaultNames.length) {
      return defaultNames[index]
    }
    return `Series ${index + 1}`
  }

  // Color palette management
  const getNextAvailableColor = () => {
    const usedColors = config.series.map(s => s.color)
    const availableColor = availableColors.value.find(color => !usedColors.includes(color))
    return availableColor || availableColors.value[0]
  }

  // Create default configuration
  const createDefaultConfig = () => {
    return {
      title: '',
      subtitle: '',
      showGrid: true,
      backgroundColor: '#ffffff',
      xAxis: {
        label: 'X Axis',
        scale: AXIS_SCALE_TYPES.LINEAR,
        min: null,
        max: null,
        autoScale: true,
        showTicks: true,
        tickCount: 10
      },
      yAxis: {
        label: 'Y Axis',
        scale: AXIS_SCALE_TYPES.LINEAR,
        min: null,
        max: null,
        autoScale: true,
        showTicks: true,
        tickCount: 10
      },
      legend: {
        enabled: true,
        position: 'top-right',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: '#cccccc',
        fontSize: 12,
        padding: 8
      },
      series: []
    }
  }

  return {
    // Configuration state
    config,
    
    // Validation
    isValid,
    validateConfig,
    
    // Series management
    addSeries,
    removeSeries,
    updateSeries,
    getSeriesConfig,
    hasVisibleSeries,
    visibleSeries,
    seriesCount,
    
    // Axis configuration
    isLogarithmicX,
    isLogarithmicY,
    setAxisScale,
    setAxisRange,
    resetAxisRange,
    
    // Legend configuration
    updateLegendPosition,
    toggleLegend,
    
    // Configuration management
    applyPreset,
    exportConfig,
    importConfig,
    resetConfig,
    
    // Available options
    availableColors,
    availableLineStyles,
    availableMarkerTypes,
    availableAxisScales,
    availableLegendPositions,
    
    // Utilities
    configChanged,
    markConfigSaved,
    generateSeriesName,
    getNextAvailableColor,
    createDefaultConfig
  }
}