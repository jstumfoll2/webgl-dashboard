<template>
  <div class="plot-widget" :class="{ 'config-open': showConfig }">
    <!-- Widget Header -->
    <div class="widget-header">
      <div class="widget-title">
        <h3 v-if="config.title" class="plot-title">{{ config.title }}</h3>
        <h4 v-if="config.subtitle" class="plot-subtitle">{{ config.subtitle }}</h4>
      </div>
      <div class="widget-controls">
        <button 
          class="btn-icon" 
          @click="toggleConfig"
          :class="{ active: showConfig }"
          title="Configure Plot"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11.03L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11.03C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
          </svg>
        </button>
        <button 
          class="btn-icon btn-remove" 
          @click="$emit('remove')"
          title="Remove Widget"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="widget-content">
      <!-- Plot Canvas Container -->
      <div class="plot-container" ref="plotContainer">
        <canvas 
          ref="plotCanvas" 
          class="plot-canvas"
          @wheel="handleWheel"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @mouseleave="handleMouseUp"
        ></canvas>
        
        <!-- Legend -->
        <div 
          v-if="config.legend.show && datasets.length > 0" 
          class="plot-legend"
          :class="[
            `legend-${config.legend.position}`,
            { 'legend-inside': config.legend.inside }
          ]"
        >
          <div 
            v-for="(dataset, index) in datasets" 
            :key="dataset.id"
            class="legend-item"
          >
            <div 
              class="legend-color"
              :style="{ 
                backgroundColor: dataset.color,
                borderColor: dataset.borderColor || dataset.color
              }"
            ></div>
            <span class="legend-label">{{ dataset.label || `Dataset ${index + 1}` }}</span>
          </div>
        </div>

        <!-- Loading Indicator -->
        <div v-if="loading" class="plot-loading">
          <div class="spinner"></div>
          <span>Loading data...</span>
        </div>

        <!-- No Data Message -->
        <div v-if="!loading && datasets.length === 0" class="plot-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22,21H2V3H4V19H6V17H10V19H12V16H16V19H18V17H22V21Z"/>
          </svg>
          <p>No data to display</p>
          <button class="btn-primary" @click="showConfig = true">Configure Data</button>
        </div>
      </div>

      <!-- Configuration Panel -->
      <div v-if="showConfig" class="config-panel">
        <PlotConfiguration 
          :config="config"
          :datasets="datasets"
          @update-config="handleConfigUpdate"
          @update-datasets="handleDatasetsUpdate"
          @close="showConfig = false"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, watch, nextTick } from 'vue'
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
    initialConfig: {
      type: Object,
      default: () => ({})
    },
    initialDatasets: {
      type: Array,
      default: () => []
    }
  },
  emits: ['remove', 'config-changed', 'datasets-changed'],
  setup(props, { emit }) {
    // Refs
    const plotContainer = ref(null)
    const plotCanvas = ref(null)
    const showConfig = ref(false)
    const loading = ref(false)

    // WebGL Plot instance
    let webglPlot = null
    let animationId = null
    let resizeObserver = null

    // Reactive state
    const config = reactive({
      title: '',
      subtitle: '',
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
        opacity: 0.5
      },
      legend: {
        show: true,
        position: 'top-right',
        inside: true
      },
      background: '#ffffff',
      ...props.initialConfig
    })

    const datasets = ref([...props.initialDatasets])

    // Mouse interaction state
    const mouseState = reactive({
      isDragging: false,
      lastX: 0,
      lastY: 0,
      startX: 0,
      startY: 0
    })

    // Initialize WebGL plot
    const initPlot = async () => {
      if (!plotCanvas.value) return

      try {
        // Create WebGL plot instance
        webglPlot = new WebglPlot(plotCanvas.value)
        
        // Set initial size
        resizePlot()
        
        // Start render loop
        startRenderLoop()
        
        console.log('WebGL plot initialized for widget:', props.widgetId)
      } catch (error) {
        console.error('Failed to initialize WebGL plot:', error)
      }
    }

    // Resize plot to fit container
    const resizePlot = () => {
      if (!webglPlot || !plotContainer.value) return

      const container = plotContainer.value
      const rect = container.getBoundingClientRect()
      
      const width = Math.max(300, rect.width - 20) // Account for padding
      const height = Math.max(200, rect.height - 60) // Account for header and padding

      plotCanvas.value.width = width
      plotCanvas.value.height = height
      plotCanvas.value.style.width = `${width}px`
      plotCanvas.value.style.height = `${height}px`

      webglPlot.resize(width, height)
      updatePlot()
    }

    // Update plot with current datasets
    const updatePlot = () => {
      if (!webglPlot) return

      // Clear existing lines
      webglPlot.removeAllLines()

      // Add lines for each dataset
      datasets.value.forEach((dataset, index) => {
        if (!dataset.data || dataset.data.length === 0) return

        try {
          // Create WebGL line
          const color = parseColor(dataset.color)
          const line = new WebglLine(color, dataset.data.length)
          
          // Apply data transformations
          const transformedData = transformData(dataset.data, dataset.transforms || {})
          
          // Set line data
          transformedData.forEach((point, i) => {
            if (i < line.numPoints) {
              line.setX(i, point.x)
              line.setY(i, point.y)
            }
          })

          // Configure line style
          line.lineWidth = dataset.lineWidth || 2
          
          // Add line to plot
          webglPlot.addLine(line)
        } catch (error) {
          console.error(`Error adding dataset ${index}:`, error)
        }
      })

      // Apply axis scaling
      applyAxisScaling()
    }

    // Transform data based on configuration
    const transformData = (data, transforms) => {
      return data.map(point => ({
        x: (point.x * (transforms.xScale || 1)) + (transforms.xOffset || 0),
        y: (point.y * (transforms.yScale || 1)) + (transforms.yOffset || 0)
      }))
    }

    // Apply axis scaling (linear/log)
    const applyAxisScaling = () => {
      if (!webglPlot) return

      // Set axis limits if not auto-scaling
      if (!config.xAxis.autoScale && config.xAxis.min !== null && config.xAxis.max !== null) {
        webglPlot.gScaleX = 2 / (config.xAxis.max - config.xAxis.min)
        webglPlot.gOffsetX = -1 - config.xAxis.min * webglPlot.gScaleX
      }

      if (!config.yAxis.autoScale && config.yAxis.min !== null && config.yAxis.max !== null) {
        webglPlot.gScaleY = 2 / (config.yAxis.max - config.yAxis.min)
        webglPlot.gOffsetY = -1 - config.yAxis.min * webglPlot.gScaleY
      }
    }

    // Parse color string to ColorRGBA
    const parseColor = (colorStr) => {
      // Handle hex colors
      if (colorStr.startsWith('#')) {
        const hex = colorStr.slice(1)
        const r = parseInt(hex.slice(0, 2), 16) / 255
        const g = parseInt(hex.slice(2, 4), 16) / 255
        const b = parseInt(hex.slice(4, 6), 16) / 255
        return new ColorRGBA(r, g, b, 1)
      }
      
      // Default colors
      const colors = [
        new ColorRGBA(1, 0, 0, 1), // Red
        new ColorRGBA(0, 1, 0, 1), // Green
        new ColorRGBA(0, 0, 1, 1), // Blue
        new ColorRGBA(1, 1, 0, 1), // Yellow
        new ColorRGBA(1, 0, 1, 1), // Magenta
        new ColorRGBA(0, 1, 1, 1), // Cyan
      ]
      
      return colors[0] // Default to red
    }

    // Start render loop
    const startRenderLoop = () => {
      const render = () => {
        if (webglPlot) {
          webglPlot.update()
        }
        animationId = requestAnimationFrame(render)
      }
      render()
    }

    // Stop render loop
    const stopRenderLoop = () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
        animationId = null
      }
    }

    // Event handlers
    const toggleConfig = () => {
      showConfig.value = !showConfig.value
    }

    const handleConfigUpdate = (newConfig) => {
      Object.assign(config, newConfig)
      emit('config-changed', { ...config })
      updatePlot()
    }

    const handleDatasetsUpdate = (newDatasets) => {
      datasets.value = [...newDatasets]
      emit('datasets-changed', [...datasets.value])
      updatePlot()
    }

    // Mouse event handlers for pan/zoom
    const handleMouseDown = (event) => {
      mouseState.isDragging = true
      mouseState.startX = mouseState.lastX = event.clientX
      mouseState.startY = mouseState.lastY = event.clientY
      event.preventDefault()
    }

    const handleMouseMove = (event) => {
      if (!mouseState.isDragging || !webglPlot) return

      const deltaX = event.clientX - mouseState.lastX
      const deltaY = event.clientY - mouseState.lastY

      // Pan the plot
      webglPlot.gOffsetX += deltaX * 0.01
      webglPlot.gOffsetY -= deltaY * 0.01

      mouseState.lastX = event.clientX
      mouseState.lastY = event.clientY
      event.preventDefault()
    }

    const handleMouseUp = () => {
      mouseState.isDragging = false
    }

    const handleWheel = (event) => {
      if (!webglPlot) return

      const zoomFactor = event.deltaY > 0 ? 1.1 : 0.9
      webglPlot.gScaleX *= zoomFactor
      webglPlot.gScaleY *= zoomFactor

      event.preventDefault()
    }

    // Setup resize observer
    const setupResizeObserver = () => {
      if (!window.ResizeObserver) return

      resizeObserver = new ResizeObserver(() => {
        nextTick(() => {
          resizePlot()
        })
      })

      if (plotContainer.value) {
        resizeObserver.observe(plotContainer.value)
      }
    }

    // Watchers
    watch(() => props.initialConfig, (newConfig) => {
      Object.assign(config, newConfig)
      updatePlot()
    }, { deep: true })

    watch(() => props.initialDatasets, (newDatasets) => {
      datasets.value = [...newDatasets]
      updatePlot()
    }, { deep: true })

    watch(datasets, () => {
      updatePlot()
    }, { deep: true })

    // Lifecycle hooks
    onMounted(async () => {
      await nextTick()
      await initPlot()
      setupResizeObserver()
    })

    onUnmounted(() => {
      stopRenderLoop()
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
      if (webglPlot) {
        webglPlot = null
      }
    })

    return {
      // Refs
      plotContainer,
      plotCanvas,
      showConfig,
      loading,
      
      // State
      config,
      datasets,
      
      // Methods
      toggleConfig,
      handleConfigUpdate,
      handleDatasetsUpdate,
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
      handleWheel
    }
  }
}
</script>

<style scoped>
.plot-widget {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  min-height: 40px;
}

.widget-title {
  flex: 1;
  min-width: 0;
}

.plot-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.plot-subtitle {
  font-size: 12px;
  font-weight: 400;
  margin: 2px 0 0 0;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.widget-controls {
  display: flex;
  gap: 4px;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s ease;
}

.btn-icon:hover {
  background: #e9ecef;
  color: #333;
}

.btn-icon.active {
  background: #007bff;
  color: white;
}

.btn-remove:hover {
  background: #dc3545;
  color: white;
}

.widget-content {
  display: flex;
  flex: 1;
  min-height: 0;
}

.plot-container {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 10px;
}

.plot-canvas {
  display: block;
  border-radius: 4px;
  cursor: grab;
}

.plot-canvas:active {
  cursor: grabbing;
}

.plot-legend {
  position: absolute;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 8px;
  font-size: 12px;
  backdrop-filter: blur(4px);
  z-index: 10;
}

.legend-top-left {
  top: 10px;
  left: 10px;
}

.legend-top-right {
  top: 10px;
  right: 10px;
}

.legend-bottom-left {
  bottom: 10px;
  left: 10px;
}

.legend-bottom-right {
  bottom: 10px;
  right: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.legend-item:last-child {
  margin-bottom: 0;
}

.legend-color {
  width: 16px;
  height: 3px;
  border-radius: 2px;
  border: 1px solid transparent;
}

.legend-label {
  color: #333;
  font-weight: 500;
}

.plot-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #666;
  font-size: 14px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #e0e0e0;
  border-top: 2px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.plot-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #999;
  text-align: center;
}

.plot-empty svg {
  opacity: 0.5;
}

.plot-empty p {
  margin: 0;
  font-size: 14px;
}

.btn-primary {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-primary:hover {
  background: #0056b3;
}

.config-panel {
  width: 300px;
  border-left: 1px solid #e0e0e0;
  background: #f8f9fa;
  overflow-y: auto;
}

.config-open .plot-container {
  border-right: 1px solid #e0e0e0;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .config-panel {
    width: 250px;
  }
  
  .widget-header {
    padding: 6px 8px;
  }
  
  .plot-title {
    font-size: 13px;
  }
  
  .plot-subtitle {
    font-size: 11px;
  }
}
</style>