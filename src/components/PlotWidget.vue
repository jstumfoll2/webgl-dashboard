<template>
  <div
    ref="plotContainer"
    class="plot-widget"
    :class="{
      'config-open': showConfig,
      loading: isLoading,
      error: hasError,
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
        <button class="control-btn" @click="exportPlot" title="Export Plot">📸</button>
        <button class="control-btn" @click="toggleFullscreen" title="Toggle Fullscreen">⛶</button>
      </div>
    </div>

    <!-- Main Plot Area -->
    <div class="plot-content">
      <!-- Plotly Container -->
      <div ref="plotlyContainer" class="plotly-container" :style="canvasStyle"></div>
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

    <!-- Configuration Panel -->
    <div v-if="showConfig" class="config-panel">
      <div class="config-header">
        <h4>Plot Configuration</h4>
        <button @click="closeConfig" class="close-btn">×</button>
      </div>
      <div class="config-content">
        <plot-configuration
          :config="config"
          :data-sets="plotlyTraces"
          @config-changed="onConfigChanged"
          @data-changed="onDataChanged"
        />
      </div>
    </div>

    <!-- Zoom Controls (optional, can use Plotly relayout) -->
    <div v-if="config.showZoomControls" class="zoom-controls">
      <button @click="zoomIn" class="zoom-btn" title="Zoom In">+</button>
      <button @click="zoomOut" class="zoom-btn" title="Zoom Out">−</button>
      <button @click="resetZoom" class="zoom-btn" title="Reset Zoom">⌂</button>
      <button @click="fitToData" class="zoom-btn" title="Fit to Data">⊞</button>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import PlotConfiguration from './PlotConfiguration.vue'

export default {
  name: 'PlotWidget',
  components: {
    PlotConfiguration,
  },
  props: {
    widgetId: {
      type: String,
      required: true,
    },
    config: {
      type: Object,
      default: () => ({}),
    },
    data: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['config-changed', 'data-changed', 'export-requested', 'fullscreen-toggle'],
  setup(props, { emit }) {
    const plotContainer = ref(null)
    const plotlyContainer = ref(null)
    const showConfig = ref(false)
    const isLoading = ref(false)
    const hasError = ref(false)
    const errorMessage = ref('')

    // Computed: check if there is data
    const hasData = computed(() => {
      return (
        Array.isArray(props.data) &&
        props.data.length > 0 &&
        (props.data[0].data ? props.data[0].data.length > 0 : props.data.length > 0)
      )
    })

    // Convert props.data/config to Plotly traces/layout
    const plotlyTraces = computed(() => {
      // If data is [{data: [...]}, ...], convert to Plotly traces
      if (Array.isArray(props.data) && props.data.length && props.data[0].data) {
        return props.data.map((series, i) => ({
          x: series.data.map((pt) => pt.x),
          y: series.data.map((pt) => pt.y),
          type: 'scatter',
          mode: 'lines+markers',
          name: series.label || `Series ${i + 1}`,
          line: { color: series.color || undefined },
        }))
      }
      // If data is just [{x, y}, ...], wrap as one trace
      if (Array.isArray(props.data) && props.data.length && props.data[0].x !== undefined) {
        return [
          {
            x: props.data.map((pt) => pt.x),
            y: props.data.map((pt) => pt.y),
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Series 1',
          },
        ]
      }
      return []
    })

    const plotlyLayout = computed(() => {
      return {
        title: props.config.title || '',
        xaxis: { title: props.config.xAxis?.label || 'X Axis' },
        yaxis: { title: props.config.yAxis?.label || 'Y Axis' },
        showlegend: props.config.showLegend !== false,
        legend: { orientation: 'h', x: 0, y: 1.1 },
        plot_bgcolor: props.config.backgroundColor || '#fff',
        paper_bgcolor: props.config.backgroundColor || '#fff',
        autosize: true,
        margin: { t: 40, l: 50, r: 30, b: 40 },
      }
    })

    const canvasStyle = computed(() => ({
      backgroundColor: props.config.backgroundColor || '#ffffff',
    }))

    // Plotly rendering
    const renderPlot = async () => {
      if (!window.Plotly) {
        isLoading.value = true
        await loadPlotlyScript()
        isLoading.value = false
      }
      if (!plotlyContainer.value) return
      try {
        isLoading.value = true
        hasError.value = false
        await window.Plotly.newPlot(plotlyContainer.value, plotlyTraces.value, plotlyLayout.value, {
          responsive: true,
        })
        isLoading.value = false
      } catch (err) {
        hasError.value = true
        errorMessage.value = err.message || 'Failed to render plot'
        isLoading.value = false
      }
    }

    // Load Plotly.js from CDN if not present
    const loadPlotlyScript = () => {
      return new Promise((resolve, reject) => {
        if (window.Plotly) return resolve()
        const script = document.createElement('script')
        script.src = 'https://cdn.plot.ly/plotly-2.26.0.min.js'
        script.onload = resolve
        script.onerror = reject
        document.head.appendChild(script)
      })
    }

    // Export as PNG
    const exportPlot = async () => {
      if (window.Plotly && plotlyContainer.value) {
        await window.Plotly.downloadImage(plotlyContainer.value, {
          format: 'png',
          filename: props.config.title || 'plot',
        })
        emit('export-requested', { title: props.config.title })
      }
    }

    // Zoom controls (optional, can use Plotly relayout)
    const zoomIn = () => {
      if (window.Plotly && plotlyContainer.value) {
        window.Plotly.relayout(plotlyContainer.value, {
          'xaxis.range': [null, null],
          'yaxis.range': [null, null],
          'xaxis.autorange': true,
          'yaxis.autorange': true,
        })
      }
    }
    const zoomOut = zoomIn
    const resetZoom = zoomIn
    const fitToData = zoomIn

    const retryPlot = () => {
      hasError.value = false
      errorMessage.value = ''
      renderPlot()
    }

    const openDataSelector = () => {
      toggleConfig()
    }

    // Config panel events
    const onConfigChanged = (newConfig) => {
      emit('config-changed', newConfig)
    }
    const onDataChanged = (newData) => {
      emit('data-changed', newData)
    }

    // Watch for prop changes
    watch(
      () => [props.data, props.config],
      () => {
        renderPlot()
      },
      { deep: true },
    )

    // Lifecycle
    onMounted(() => {
      nextTick(() => {
        renderPlot()
      })
    })
    onUnmounted(() => {
      // Optionally, clean up Plotly plot
      if (window.Plotly && plotlyContainer.value) {
        window.Plotly.purge(plotlyContainer.value)
      }
    })

    // Add toggleConfig function
    const toggleConfig = () => {
      showConfig.value = !showConfig.value
    }

    return {
      plotContainer,
      plotlyContainer,
      showConfig,
      isLoading,
      hasError,
      errorMessage,
      plotlyTraces,
      canvasStyle,
      hasData,
      toggleConfig,
      closeConfig: () => (showConfig.value = false),
      exportPlot,
      toggleFullscreen: () => emit('fullscreen-toggle', props.widgetId),
      zoomIn,
      zoomOut,
      resetZoom,
      fitToData,
      retryPlot,
      openDataSelector,
      onConfigChanged,
      onDataChanged,
    }
  },
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
.plot-content {
  flex: 1;
  position: relative;
  min-height: 200px;
}
.plotly-container {
  width: 100%;
  height: 100%;
  min-height: 200px;
}
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
}
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 0, 0, 0.07);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
}
.no-data-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(240, 240, 240, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
}
</style>
