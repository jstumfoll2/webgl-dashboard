<template>
  <div 
    ref="plotContainer" 
    class="plot-widget"
    :class="{ 
      'config-open': showConfig,
      'loading': isLoading,
      'error': hasError 
    }"
  >
    <!-- Widget Header -->
    <div v-if="config.showTitle" class="plot-header">
      <h3 class="plot-title">{{ config.title || 'Untitled Plot' }}</h3>
      <div class="plot-controls">
        <button 
          class="control-btn"
          @click="toggleConfig"
          :class="{ active: showConfig }"
          title="Configure Plot"
        >
          ⚙️
        </button>
        <button 
          class="control-btn"
          @click="exportPlot"
          title="Export Plot"
        >
          📸
        </button>
        <button 
          class="control-btn"
          @click="toggleFullscreen"
          title="Toggle Fullscreen"
        >
          ⛶
        </button>
      </div>
    </div>

    <!-- Main Plot Area -->
    <div class="plot-content">
      <!-- WebGL Canvas Container -->
      <div 
        ref="canvasContainer" 
        class="canvas-container"
        :style="canvasStyle"
      >
        <canvas 
          ref="plotCanvas"
          class="plot-canvas"
          @wheel="onWheel"
          @mousedown="onMouseDown"
          @mousemove="onMouseMove"
          @mouseup="onMouseUp"
          @mouseleave="onMouseLeave"
          @contextmenu.prevent
        />
        
        <!-- Loading Overlay -->
        <div v-if="isLoading" class="loading-overlay">
          <div class="loading-spinner"></div>
          <span>Loading plot data...</span>
        </div>
        
        <!-- Error Overlay -->
        <div v-if="hasError" class="error-overlay">
          <div class="error-icon">⚠️</div>
          <span>{{ errorMessage }}</span>
          <button @click="retryPlot" class="retry-btn">Retry</button>
        </div>
        
        <!-- No Data Overlay -->
        <div v-if="!hasData && !isLoading && !hasError" class="no-data-overlay">
          <div class="no-data-icon">📊</div>
          <span>No data to display</span>
          <button @click="openDataSelector" class="select-data-btn">Select Data</button>
        </div>
      </div>

      <!-- Legend -->
      <div 
        v-if="config.showLegend && hasData && plotLines.length > 0" 
        class="plot-legend"
        :class="[`legend-${config.legendPosition}`]"
      >
        <div class="legend-title" v-if="config.legendTitle">
          {{ config.legendTitle }}
        </div>
        <div class="legend-items">
          <div 
            v-for="(line, index) in plotLines" 
            :key="line.id"
            class="legend-item"
            @click="toggleLineVisibility(index)"
          >
            <div 
              class="legend-color"
              :style="{ backgroundColor: line.color }"
            ></div>
            <span 
              class="legend-label"
              :class="{ hidden: !line.visible }"
            >
              {{ line.label || `Series ${index + 1}` }}
            </span>
            <span class="legend-toggle">
              {{ line.visible ? '👁️' : '🚫' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Configuration Panel -->
    <div v-if="showConfig" class="config-panel">
      <div class="config-header">
        <h4>Plot Configuration</h4>
        <button @click="closeConfig" class="close-btn">×</button>
      </div>
      
      <div class="config-content">
        <plot-configuration
          :config="config"
          :data-sets="plotLines"
          @config-changed="onConfigChanged"
          @data-changed="onDataChanged"
        />
      </div>
    </div>

    <!-- Zoom Controls -->
    <div v-if="config.showZoomControls" class="zoom-controls">
      <button @click="zoomIn" class="zoom-btn" title="Zoom In">+</button>
      <button @click="zoomOut" class="zoom-btn" title="Zoom Out">−</button>
      <button @click="resetZoom" class="zoom-btn" title="Reset Zoom">⌂</button>
      <button @click="fitToData" class="zoom-btn" title="Fit to Data">⊞</button>
    </div>

    <!-- Crosshair Info -->
    <div 
      v-if="config.showCrosshair && crosshairInfo.visible" 
      class="crosshair-info"
      :style="crosshairInfo.style"
    >
      <div class="crosshair-values">
        <div class="crosshair-value">
          <span class="axis-label">X:</span>
          <span class="axis-value">{{ formatValue(crosshairInfo.x, 'x') }}</span>
        </div>
        <div class="crosshair-value">
          <span class="axis-label">Y:</span>
          <span class="axis-value">{{ formatValue(crosshairInfo.y, 'y') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { WebglPlot, WebglLine, ColorRGBA } from 'webgl-plot'
import PlotConfiguration from './PlotConfiguration.vue'

export default {
  name: 'PlotWidget',
  components: {
    PlotConfiguration
  },
  props: {
    widgetId: {
      type: String,
      required: true
    },
    config: {
      type: Object,
      default: () => ({
        title: 'Plot Widget',
        showTitle: true,
        showLegend: true,
        showGrid: true,
        showCrosshair: true,
        showZoomControls: true,
        legendPosition: 'right',
        legendTitle: '',
        backgroundColor: '#ffffff',
        gridColor: '#e0e0e0',
        axisColor: '#333333',
        xAxis: {
          label: 'X Axis',
          min: null,
          max: null,
          logScale: false,
          showLabels: true
        },
        yAxis: {
          label: 'Y Axis',
          min: null,
          max: null,
          logScale: false,
          showLabels: true
        },
        animation: {
          enabled: true,
          duration: 300
        }
      })
    },
    data: {
      type: Array,
      default: () => []
    }
  },
  emits: [
    'config-changed',
    'data-changed',
    'export-requested',
    'fullscreen-toggle'
  ],
  setup(props, { emit }) {
    // Refs
    const plotContainer = ref(null)
    const canvasContainer = ref(null)
    const plotCanvas = ref(null)
    
    // Reactive state
    const showConfig = ref(false)
    const isLoading = ref(false)
    const hasError = ref(false)
    const errorMessage = ref('')
    const webglPlot = ref(null)
    const plotLines = ref([])
    const animationId = ref(null)
    
    // Mouse interaction state
    const mouseState = reactive({
      isDown: false,
      isDragging: false,
      lastX: 0,
      lastY: 0,
      startX: 0,
      startY: 0
    })
    
    // Zoom state
    const zoomState = reactive({
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      minScale: 0.1,
      maxScale: 10
    })
    
    // Crosshair state
    const crosshairInfo = reactive({
      visible: false,
      x: 0,
      y: 0,
      style: {}
    })

    // Computed properties
    const hasData = computed(() => {
      return props.data && props.data.length > 0 && 
             props.data.some(dataset => dataset.data && dataset.data.length > 0)
    })

    const canvasStyle = computed(() => ({
      backgroundColor: props.config.backgroundColor || '#ffffff'
    }))

    // WebGL Plot initialization
    const initializePlot = async () => {
      if (!plotCanvas.value) return

      try {
        isLoading.value = true
        hasError.value = false

        // Create WebGL plot instance
        webglPlot.value = new WebglPlot(plotCanvas.value)
        
        // Configure plot appearance
        configureWebGLPlot()
        
        // Load data
        await loadPlotData()
        
        // Start render loop
        startRenderLoop()
        
        isLoading.value = false
      } catch (error) {
        console.error('Failed to initialize plot:', error)
        hasError.value = true
        errorMessage.value = error.message || 'Failed to initialize plot'
        isLoading.value = false
      }
    }

    const configureWebGLPlot = () => {
      if (!webglPlot.value) return

      // Set background color
      const bgColor = hexToRgba(props.config.backgroundColor || '#ffffff')
      webglPlot.value.gClearColor(bgColor.r, bgColor.g, bgColor.b, bgColor.a)

      // Configure axes
      if (props.config.showGrid) {
        webglPlot.value.gGridColor = hexToRgba(props.config.gridColor || '#e0e0e0')
        webglPlot.value.gShowGrid = true
      }

      // Set axis ranges
      updateAxisRanges()
    }

    const loadPlotData = async () => {
      if (!webglPlot.value || !hasData.value) return

      // Clear existing lines
      plotLines.value = []
      webglPlot.value.removeAllLines()

      // Process each dataset
      for (let i = 0; i < props.data.length; i++) {
        const dataset = props.data[i]
        if (!dataset.data || dataset.data.length === 0) continue

        await addDataset(dataset, i)
      }
    }

    const addDataset = async (dataset, index) => {
      try {
        const config = {
          color: dataset.color || getDefaultColor(index),
          lineWidth: dataset.lineWidth || 2,
          visible: dataset.visible !== false,
          label: dataset.label || `Series ${index + 1}`,
          type: dataset.type || 'line',
          scaleFactor: dataset.scaleFactor || 1,
          offset: dataset.offset || 0,
          ...dataset.config
        }

        // Process data points
        const processedData = processDataPoints(dataset.data, config)
        
        // Create WebGL line
        const color = hexToRgba(config.color)
        const webglLine = new WebglLine(color, processedData.length)
        
        // Set line properties
        webglLine.lineWidth = config.lineWidth
        webglLine.visible = config.visible

        // Add data points
        for (let i = 0; i < processedData.length; i++) {
          webglLine.setY(i, processedData[i].y)
          if (processedData[i].x !== undefined) {
            webglLine.setX(i, processedData[i].x)
          }
        }

        // Add to WebGL plot
        webglPlot.value.addLine(webglLine)

        // Store line reference
        plotLines.value.push({
          id: `line_${index}`,
          webglLine,
          config,
          data: processedData,
          visible: config.visible,
          color: config.color,
          label: config.label
        })

      } catch (error) {
        console.error(`Failed to add dataset ${index}:`, error)
      }
    }

    const processDataPoints = (data, config) => {
      return data.map(point => {
        let x, y

        if (Array.isArray(point)) {
          x = point[0]
          y = point[1]
        } else if (typeof point === 'object') {
          x = point.x
          y = point.y
        } else {
          x = data.indexOf(point)
          y = point
        }

        // Apply scale factor and offset
        y = (y * config.scaleFactor) + config.offset

        // Handle logarithmic scale
        if (props.config.yAxis.logScale && y > 0) {
          y = Math.log10(y)
        }
        if (props.config.xAxis.logScale && x > 0) {
          x = Math.log10(x)
        }

        return { x, y }
      })
    }

    const updateAxisRanges = () => {
      if (!webglPlot.value) return

      // Set X axis range
      if (props.config.xAxis.min !== null && props.config.xAxis.max !== null) {
        webglPlot.value.gScaleX = props.config.xAxis.max - props.config.xAxis.min
        webglPlot.value.gOffsetX = -props.config.xAxis.min
      }

      // Set Y axis range
      if (props.config.yAxis.min !== null && props.config.yAxis.max !== null) {
        webglPlot.value.gScaleY = props.config.yAxis.max - props.config.yAxis.min
        webglPlot.value.gOffsetY = -props.config.yAxis.min
      }
    }

    const startRenderLoop = () => {
      const render = () => {
        if (webglPlot.value) {
          webglPlot.value.update()
        }
        animationId.value = requestAnimationFrame(render)
      }
      render()
    }

    const stopRenderLoop = () => {
      if (animationId.value) {
        cancelAnimationFrame(animationId.value)
        animationId.value = null
      }
    }

    // Event handlers
    const onWheel = (event) => {
      if (!props.config.showZoomControls) return

      event.preventDefault()
      const delta = event.deltaY > 0 ? 0.9 : 1.1
      zoom(delta, event.offsetX, event.offsetY)
    }

    const onMouseDown = (event) => {
      mouseState.isDown = true
      mouseState.startX = event.offsetX
      mouseState.startY = event.offsetY
      mouseState.lastX = event.offsetX
      mouseState.lastY = event.offsetY
    }

    const onMouseMove = (event) => {
      if (props.config.showCrosshair) {
        updateCrosshair(event)
      }

      if (mouseState.isDown) {
        const deltaX = event.offsetX - mouseState.lastX
        const deltaY = event.offsetY - mouseState.lastY

        if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
          mouseState.isDragging = true
          pan(deltaX, deltaY)
        }

        mouseState.lastX = event.offsetX
        mouseState.lastY = event.offsetY
      }
    }

    const onMouseUp = () => {
      mouseState.isDown = false
      mouseState.isDragging = false
    }

    const onMouseLeave = () => {
      mouseState.isDown = false
      mouseState.isDragging = false
      crosshairInfo.visible = false
    }

    const updateCrosshair = (event) => {
      if (!webglPlot.value) return

      const rect = plotCanvas.value.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      // Convert canvas coordinates to data coordinates
      const dataX = canvasToDataX(x)
      const dataY = canvasToDataY(y)

      crosshairInfo.visible = true
      crosshairInfo.x = dataX
      crosshairInfo.y = dataY
      crosshairInfo.style = {
        left: `${x + 10}px`,
        top: `${y - 10}px`
      }
    }

    // Utility functions
    const hexToRgba = (hex, alpha = 1) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
        a: alpha
      } : { r: 0, g: 0, b: 0, a: 1 }
    }

    const getDefaultColor = (index) => {
      const colors = [
        '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
        '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
      ]
      return colors[index % colors.length]
    }

    const formatValue = (value, axis) => {
      if (value === null || value === undefined) return 'N/A'
      
      const config = axis === 'x' ? props.config.xAxis : props.config.yAxis
      if (config.logScale) {
        value = Math.pow(10, value)
      }
      
      return value.toFixed(3)
    }

    const canvasToDataX = (canvasX) => {
      if (!webglPlot.value) return 0
      const normalizedX = (canvasX / plotCanvas.value.width) * 2 - 1
      return (normalizedX - webglPlot.value.gOffsetX) / webglPlot.value.gScaleX
    }

    const canvasToDataY = (canvasY) => {
      if (!webglPlot.value) return 0
      const normalizedY = 1 - (canvasY / plotCanvas.value.height) * 2
      return (normalizedY - webglPlot.value.gOffsetY) / webglPlot.value.gScaleY
    }

    // Control methods
    const toggleConfig = () => {
      showConfig.value = !showConfig.value
    }

    const closeConfig = () => {
      showConfig.value = false
    }

    const exportPlot = () => {
      if (!plotCanvas.value) return
      
      const dataURL = plotCanvas.value.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `${props.config.title || 'plot'}.png`
      link.href = dataURL
      link.click()
      
      emit('export-requested', { dataURL, title: props.config.title })
    }

    const toggleFullscreen = () => {
      emit('fullscreen-toggle', props.widgetId)
    }

    const toggleLineVisibility = (index) => {
      if (plotLines.value[index]) {
        plotLines.value[index].visible = !plotLines.value[index].visible
        plotLines.value[index].webglLine.visible = plotLines.value[index].visible
      }
    }

    const zoom = (factor, centerX, centerY) => {
      const newScale = Math.max(
        zoomState.minScale,
        Math.min(zoomState.maxScale, zoomState.scale * factor)
      )
      
      if (newScale !== zoomState.scale) {
        zoomState.scale = newScale
        updateZoom()
      }
    }

    const pan = (deltaX, deltaY) => {
      zoomState.offsetX += deltaX / zoomState.scale
      zoomState.offsetY -= deltaY / zoomState.scale
      updateZoom()
    }

    const updateZoom = () => {
      if (!webglPlot.value) return
      
      webglPlot.value.gScaleX = zoomState.scale
      webglPlot.value.gScaleY = zoomState.scale
      webglPlot.value.gOffsetX = zoomState.offsetX
      webglPlot.value.gOffsetY = zoomState.offsetY
    }

    const zoomIn = () => zoom(1.2, 0, 0)
    const zoomOut = () => zoom(0.8, 0, 0)
    
    const resetZoom = () => {
      zoomState.scale = 1
      zoomState.offsetX = 0
      zoomState.offsetY = 0
      updateZoom()
    }

    const fitToData = () => {
      if (!hasData.value || plotLines.value.length === 0) return

      let minX = Infinity, maxX = -Infinity
      let minY = Infinity, maxY = -Infinity

      plotLines.value.forEach(line => {
        if (!line.visible) return
        
        line.data.forEach(point => {
          minX = Math.min(minX, point.x)
          maxX = Math.max(maxX, point.x)
          minY = Math.min(minY, point.y)
          maxY = Math.max(maxY, point.y)
        })
      })

      if (isFinite(minX) && isFinite(maxX) && isFinite(minY) && isFinite(maxY)) {
        const rangeX = maxX - minX
        const rangeY = maxY - minY
        const margin = 0.1

        webglPlot.value.gScaleX = 2 / (rangeX * (1 + margin))
        webglPlot.value.gScaleY = 2 / (rangeY * (1 + margin))
        webglPlot.value.gOffsetX = -(minX + rangeX / 2) * webglPlot.value.gScaleX
        webglPlot.value.gOffsetY = -(minY + rangeY / 2) * webglPlot.value.gScaleY
      }
    }

    const retryPlot = () => {
      hasError.value = false
      errorMessage.value = ''
      initializePlot()
    }

    const openDataSelector = () => {
      toggleConfig()
    }

    // Event handlers for child components
    const onConfigChanged = (newConfig) => {
      emit('config-changed', newConfig)
    }

    const onDataChanged = (newData) => {
      emit('data-changed', newData)
    }

    // Resize handler
    const handleResize = () => {
      if (!plotCanvas.value || !webglPlot.value) return

      nextTick(() => {
        const container = canvasContainer.value
        if (!container) return

        const rect = container.getBoundingClientRect()
        plotCanvas.value.width = rect.width
        plotCanvas.value.height = rect.height
        
        webglPlot.value.update()
      })
    }

    // Watchers
    watch(() => props.config, (newConfig) => {
      if (webglPlot.value) {
        configureWebGLPlot()
        updateAxisRanges()
      }
    }, { deep: true })

    watch(() => props.data, () => {
      if (webglPlot.value) {
        loadPlotData()
      }
    }, { deep: true })

    // Lifecycle
    onMounted(() => {
      nextTick(() => {
        initializePlot()
        window.addEventListener('resize', handleResize)
      })
    })

    onUnmounted(() => {
      stopRenderLoop()
      window.removeEventListener('resize', handleResize)
      if (webglPlot.value) {
        webglPlot.value.removeAllLines()
      }
    })

    return {
      // Refs
      plotContainer,
      canvasContainer,
      plotCanvas,
      
      // Reactive state
      showConfig,
      isLoading,
      hasError,
      errorMessage,
      plotLines,
      crosshairInfo,
      
      // Computed
      hasData,
      canvasStyle,
      
      // Methods
      toggleConfig,
      closeConfig,
      exportPlot,
      toggleFullscreen,
      toggleLineVisibility,
      zoomIn,
      zoomOut,
      resetZoom,
      fitToData,
      retryPlot,
      openDataSelector,
      formatValue,
      
      // Event handlers
      onWheel,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave,
      onConfigChanged,
      onDataChanged
    }
  }
}
</script>

<style scoped>
.plot-widget {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.plot-widget.loading {
  pointer-events: none;
}

.plot-widget.error {
  border: 2px solid #dc3545;
}

.plot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  min-height: 40px;
}

.plot-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  flex: 1;
}

.plot-controls {
  display: flex;
  gap: 4px;
}

.control-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.2s ease;
}

.control-btn:hover {
  background: #e9ecef;
}

.control-btn.active {
  background: #007bff;
  color: white;
}

.plot-content {
  flex: 1;
  position: relative;
  display: flex;
}

.canvas-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.plot-canvas {
  width: 100%;
  height: 100%;
  display: block;
  cursor: crosshair;
}

.loading-overlay,
.error-overlay,
.no-data-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  z-index: 10;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon,
.no-data-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.retry-btn,
.select-data-btn {
  margin-top: 12px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: #007bff;
  color: white;
  cursor: pointer;
  font-size: 14px;
}

.retry-btn:hover,
.select-data-btn:hover {
  background: #0056b3;
}

.plot-legend {
  position: absolute;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 8px;
  font-size: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  z-index: 5;
}

.legend-right {
  right: 12px;
  top: 12px;
}

.legend-left {
  left: 12px;
  top: 12px;
}

.legend-bottom {
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
}

.legend-title {
  font-weight: 600;
  margin-bottom: 4px;
  color: #333;
}

.legend-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 2px;
  transition: background-color 0.2s ease;
}

.legend-item:hover {
  background: #f8f9fa;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  border: 1px solid #ccc;
}

.legend-label {
  flex: 1;
  transition: opacity 0.2s ease;
}

.legend-label.hidden {
  opacity: 0.5;
  text-decoration: line-through;
}

.legend-toggle {
  font-size: 10px;
}

.config-panel {
  position: absolute;
  right: 0;
  top: 0;
  width: 300px;
  height: 100%;
  background: white;
  border-left: 1px solid #e0e0e0;
  box-shadow: -2px 0 8px rgba(0,0,0,0.1);
  z-index: 20;
  display: flex;
  flex-direction: column;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
}

/* TODO: did not finish here... */
</style>