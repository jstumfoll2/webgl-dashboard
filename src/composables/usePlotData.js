import { ref, computed, watch, nextTick } from 'vue'
import { dataUtils } from '../utils/dataUtils.js'
import { sampleData } from '../assets/sample-data/sampleData.js'

export function usePlotData(widgetId) {
  // Reactive state
  const datasets = ref([])
  const activeDatasets = ref([])
  const selectedDataSource = ref('sample')
  const selectedSampleDataset = ref('sine')
  const isLoading = ref(false)
  const error = ref(null)
  const realTimeActive = ref(false)
  const realTimeInterval = ref(null)
  const uploadedFiles = ref([])
  
  // Data transformation settings
  const transformSettings = ref({
    xOffset: 0,
    yOffset: 0,
    xScale: 1,
    yScale: 1,
    logScale: false,
    filterEnabled: false,
    filterMin: null,
    filterMax: null
  })

  // Real-time data settings
  const realTimeSettings = ref({
    intervalMs: 100,
    maxPoints: 1000,
    amplitude: 1,
    frequency: 1,
    phase: 0,
    noiseLevel: 0
  })

  // Computed properties
  const processedDatasets = computed(() => {
    return activeDatasets.value.map(dataset => {
      let processedData = applyTransformations(dataset.data, transformSettings.value)
      
      if (transformSettings.value.filterEnabled) {
        processedData = filterData(processedData, transformSettings.value)
      }
      
      return {
        ...dataset,
        data: processedData,
        pointCount: processedData.length
      }
    })
  })

  const hasData = computed(() => activeDatasets.value.length > 0)
  
  const dataSourceOptions = computed(() => [
    { value: 'sample', label: 'Sample Data' },
    { value: 'upload', label: 'Upload File' },
    { value: 'realtime', label: 'Real-time Simulation' }
  ])

  const sampleDataOptions = computed(() => 
    Object.keys(sampleData).map(key => ({
      value: key,
      label: sampleData[key].name
    }))
  )

  // Data loading functions
  async function loadSampleData(datasetKey) {
    try {
      isLoading.value = true
      error.value = null
      
      const dataset = sampleData[datasetKey]
      if (!dataset) {
        throw new Error(`Sample dataset '${datasetKey}' not found`)
      }
      
      const data = typeof dataset.generate === 'function' 
        ? dataset.generate() 
        : dataset.data
      
      const newDataset = {
        id: `sample_${datasetKey}_${Date.now()}`,
        name: dataset.name,
        data: data,
        color: dataset.color || getNextColor(),
        lineWidth: 2,
        visible: true,
        type: 'line',
        source: 'sample',
        sourceKey: datasetKey
      }
      
      addDataset(newDataset)
    } catch (err) {
      error.value = `Failed to load sample data: ${err.message}`
    } finally {
      isLoading.value = false
    }
  }

  async function loadFileData(file) {
    try {
      isLoading.value = true
      error.value = null
      
      const data = await dataUtils.parseFile(file)
      
      const newDataset = {
        id: `file_${file.name}_${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        data: data,
        color: getNextColor(),
        lineWidth: 2,
        visible: true,
        type: 'line',
        source: 'file',
        fileName: file.name,
        fileSize: file.size
      }
      
      addDataset(newDataset)
      uploadedFiles.value.push({
        name: file.name,
        size: file.size,
        uploadTime: new Date()
      })
    } catch (err) {
      error.value = `Failed to load file: ${err.message}`
    } finally {
      isLoading.value = false
    }
  }

  function startRealTimeData() {
    if (realTimeActive.value) return
    
    realTimeActive.value = true
    const datasetId = `realtime_${Date.now()}`
    
    const newDataset = {
      id: datasetId,
      name: 'Real-time Data',
      data: [],
      color: getNextColor(),
      lineWidth: 2,
      visible: true,
      type: 'line',
      source: 'realtime'
    }
    
    addDataset(newDataset)
    
    let time = 0
    realTimeInterval.value = setInterval(() => {
      const settings = realTimeSettings.value
      const baseValue = settings.amplitude * Math.sin(
        2 * Math.PI * settings.frequency * time + settings.phase
      )
      const noise = (Math.random() - 0.5) * 2 * settings.noiseLevel
      const y = baseValue + noise
      
      const dataset = activeDatasets.value.find(d => d.id === datasetId)
      if (dataset) {
        dataset.data.push({ x: time, y: y })
        
        // Limit number of points
        if (dataset.data.length > settings.maxPoints) {
          dataset.data.shift()
        }
      }
      
      time += settings.intervalMs / 1000
    }, settings.intervalMs)
  }

  function stopRealTimeData() {
    realTimeActive.value = false
    if (realTimeInterval.value) {
      clearInterval(realTimeInterval.value)
      realTimeInterval.value = null
    }
  }

  // Dataset management
  function addDataset(dataset) {
    datasets.value.push(dataset)
    activeDatasets.value.push(dataset)
  }

  function removeDataset(datasetId) {
    const index = datasets.value.findIndex(d => d.id === datasetId)
    if (index !== -1) {
      datasets.value.splice(index, 1)
    }
    
    const activeIndex = activeDatasets.value.findIndex(d => d.id === datasetId)
    if (activeIndex !== -1) {
      activeDatasets.value.splice(activeIndex, 1)
    }
    
    // Stop real-time data if this was a real-time dataset
    const dataset = datasets.value.find(d => d.id === datasetId)
    if (dataset && dataset.source === 'realtime') {
      stopRealTimeData()
    }
  }

  function updateDataset(datasetId, updates) {
    const dataset = activeDatasets.value.find(d => d.id === datasetId)
    if (dataset) {
      Object.assign(dataset, updates)
    }
  }

  function toggleDatasetVisibility(datasetId) {
    const dataset = activeDatasets.value.find(d => d.id === datasetId)
    if (dataset) {
      dataset.visible = !dataset.visible
    }
  }

  function clearAllDatasets() {
    stopRealTimeData()
    datasets.value = []
    activeDatasets.value = []
    uploadedFiles.value = []
  }

  // Data transformation functions
  function applyTransformations(data, settings) {
    return data.map(point => ({
      x: (point.x + settings.xOffset) * settings.xScale,
      y: settings.logScale && point.y > 0 
        ? Math.log10((point.y + settings.yOffset) * settings.yScale)
        : (point.y + settings.yOffset) * settings.yScale
    }))
  }

  function filterData(data, settings) {
    if (!settings.filterEnabled) return data
    
    return data.filter(point => {
      const withinMin = settings.filterMin === null || point.x >= settings.filterMin
      const withinMax = settings.filterMax === null || point.x <= settings.filterMax
      return withinMin && withinMax
    })
  }

  function updateTransformSettings(newSettings) {
    Object.assign(transformSettings.value, newSettings)
  }

  function resetTransformSettings() {
    transformSettings.value = {
      xOffset: 0,
      yOffset: 0,
      xScale: 1,
      yScale: 1,
      logScale: false,
      filterEnabled: false,
      filterMin: null,
      filterMax: null
    }
  }

  // Utility functions
  function getNextColor() {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9'
    ]
    const usedColors = activeDatasets.value.map(d => d.color)
    const availableColors = colors.filter(c => !usedColors.includes(c))
    return availableColors.length > 0 
      ? availableColors[0] 
      : colors[Math.floor(Math.random() * colors.length)]
  }

  function getDataStatistics(datasetId) {
    const dataset = activeDatasets.value.find(d => d.id === datasetId)
    if (!dataset || !dataset.data.length) return null
    
    const xValues = dataset.data.map(p => p.x)
    const yValues = dataset.data.map(p => p.y)
    
    return {
      pointCount: dataset.data.length,
      xRange: {
        min: Math.min(...xValues),
        max: Math.max(...xValues)
      },
      yRange: {
        min: Math.min(...yValues),
        max: Math.max(...yValues)
      },
      xMean: xValues.reduce((a, b) => a + b, 0) / xValues.length,
      yMean: yValues.reduce((a, b) => a + b, 0) / yValues.length
    }
  }

  function exportData(datasetId, format = 'csv') {
    const dataset = activeDatasets.value.find(d => d.id === datasetId)
    if (!dataset) return null
    
    return dataUtils.exportData(dataset.data, format, dataset.name)
  }

  function duplicateDataset(datasetId) {
    const dataset = activeDatasets.value.find(d => d.id === datasetId)
    if (!dataset) return
    
    const duplicated = {
      ...dataset,
      id: `${dataset.id}_copy_${Date.now()}`,
      name: `${dataset.name} (Copy)`,
      color: getNextColor()
    }
    
    addDataset(duplicated)
  }

  // Data source change handler
  watch(selectedDataSource, (newSource) => {
    if (newSource === 'realtime' && !realTimeActive.value) {
      // Don't auto-start, let user click start button
    } else if (newSource !== 'realtime' && realTimeActive.value) {
      stopRealTimeData()
    }
  })

  // Sample dataset change handler
  watch(selectedSampleDataset, (newDataset) => {
    if (selectedDataSource.value === 'sample') {
      loadSampleData(newDataset)
    }
  })

  // Cleanup
  function cleanup() {
    stopRealTimeData()
    clearAllDatasets()
  }

  return {
    // State
    datasets,
    activeDatasets,
    selectedDataSource,
    selectedSampleDataset,
    isLoading,
    error,
    realTimeActive,
    uploadedFiles,
    transformSettings,
    realTimeSettings,
    
    // Computed
    processedDatasets,
    hasData,
    dataSourceOptions,
    sampleDataOptions,
    
    // Data loading
    loadSampleData,
    loadFileData,
    startRealTimeData,
    stopRealTimeData,
    
    // Dataset management
    addDataset,
    removeDataset,
    updateDataset,
    toggleDatasetVisibility,
    clearAllDatasets,
    duplicateDataset,
    
    // Transformations
    updateTransformSettings,
    resetTransformSettings,
    
    // Utilities
    getDataStatistics,
    exportData,
    cleanup
  }
}