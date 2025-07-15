<template>
  <div class="dashboard-container">
    <!-- Dashboard Toolbar -->
    <div class="dashboard-toolbar">
      <div class="toolbar-left">
        <h1 class="dashboard-title">WebGL Dashboard</h1>
        <div class="widget-counter">
          {{ widgets.length }} widget{{ widgets.length !== 1 ? 's' : '' }}
        </div>
      </div>

      <div class="toolbar-center">
        <button class="btn btn-primary" @click="addWidget" :disabled="isAddingWidget">
          <span class="btn-icon">+</span>
          Add Plot Widget
        </button>

        <button class="btn btn-secondary" @click="toggleAutoLayout" :class="{ active: autoLayout }">
          <span class="btn-icon">⚡</span>
          Auto Layout
        </button>

        <button class="btn btn-secondary" @click="resetLayout">
          <span class="btn-icon">↻</span>
          Reset Layout
        </button>
      </div>

      <div class="toolbar-right">
        <button class="btn btn-outline" @click="saveLayout">
          <span class="btn-icon">💾</span>
          Save Layout
        </button>

        <button class="btn btn-outline" @click="loadLayout">
          <span class="btn-icon">📁</span>
          Load Layout
        </button>

        <div class="view-toggle">
          <button class="btn btn-sm" @click="toggleFullscreen" :class="{ active: isFullscreen }">
            <span class="btn-icon">⛶</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Dashboard Content -->
    <div class="dashboard-content" :class="{ fullscreen: isFullscreen }">
      <GridLayout
        ref="gridLayoutRef"
        :widgets="widgets"
        :auto-layout="autoLayout"
        :grid-options="gridOptions"
        :show-grid-lines="showGridLines"
        @widget-moved="onWidgetMoved"
        @widget-resized="onWidgetResized"
        @widget-removed="removeWidget"
        @layout-changed="onLayoutChanged"
      >
        <template #widget="{ widget }">
          <PlotWidget
            :key="widget.id"
            :widget-id="widget.id"
            :config="widget.config"
            :data="widget.data"
            :title="widget.title"
            :show-config="widget.showConfig"
            :is-resizing="widget.isResizing"
            @config-updated="updateWidgetConfig(widget.id, $event)"
            @data-updated="updateWidgetData(widget.id, $event)"
            @title-updated="updateWidgetTitle(widget.id, $event)"
            @toggle-config="toggleWidgetConfig(widget.id)"
            @remove-widget="removeWidget(widget.id)"
            @widget-focus="setActiveWidget(widget.id)"
          />
        </template>
      </GridLayout>

      <!-- Empty State -->
      <div v-if="widgets.length === 0" class="empty-state">
        <div class="empty-state-content">
          <div class="empty-state-icon">📊</div>
          <h2>No Plot Widgets</h2>
          <p>Add your first plot widget to get started with data visualization</p>
          <button class="btn btn-primary btn-lg" @click="addWidget">
            <span class="btn-icon">+</span>
            Add Your First Widget
          </button>
        </div>
      </div>
    </div>

    <!-- Status Bar -->
    <div class="dashboard-status-bar">
      <div class="status-left">
        <span class="status-item">
          <span class="status-label">Layout:</span>
          <span class="status-value">{{ autoLayout ? 'Auto' : 'Manual' }}</span>
        </span>
        <span class="status-item" v-if="activeWidget">
          <span class="status-label">Active:</span>
          <span class="status-value">{{ getWidgetTitle(activeWidget) }}</span>
        </span>
      </div>

      <div class="status-right">
        <span class="status-item">
          <span class="status-label">Performance:</span>
          <span class="status-value" :class="performanceClass">{{ performanceStatus }}</span>
        </span>
        <span class="status-item">
          <span class="status-label">Updated:</span>
          <span class="status-value">{{ lastUpdateTime }}</span>
        </span>
      </div>
    </div>

    <!-- Context Menu -->
    <div
      v-if="contextMenu.visible"
      class="context-menu"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      @click.stop
    >
      <div class="context-menu-item" @click="duplicateWidget(contextMenu.widgetId)">
        <span class="menu-icon">📋</span>
        Duplicate Widget
      </div>
      <div class="context-menu-item" @click="exportWidget(contextMenu.widgetId)">
        <span class="menu-icon">📤</span>
        Export Data
      </div>
      <div class="context-menu-separator"></div>
      <div class="context-menu-item danger" @click="removeWidget(contextMenu.widgetId)">
        <span class="menu-icon">🗑️</span>
        Remove Widget
      </div>
    </div>

    <!-- Overlay for context menu -->
    <div v-if="contextMenu.visible" class="context-menu-overlay" @click="hideContextMenu"></div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useDashboardStore } from '../stores/dashboardStore'
import { usePlotConfig } from '../composables/usePlotConfig'
import { usePlotData } from '../composables/usePlotData'
import { generateId } from '../utils/plotUtils'
import GridLayout from './GridLayout.vue'
import PlotWidget from './PlotWidget.vue'

export default {
  name: 'AppDashboard',
  components: {
    GridLayout,
    PlotWidget,
  },
  setup() {
    // Refs
    const gridLayoutRef = ref(null)

    // Store
    const dashboardStore = useDashboardStore()

    // Composables
    const { createDefaultConfig } = usePlotConfig()
    const { generateSampleData } = usePlotData()

    // Reactive state
    const widgets = computed(() => dashboardStore.widgetsList.value)
    const activeWidget = ref(null)
    const autoLayout = ref(true)
    const isFullscreen = ref(false)
    const isAddingWidget = ref(false)
    const lastUpdateTime = ref('')
    const performanceStatus = ref('Good')
    const showGridLines = ref(true)

    // Context menu state
    const contextMenu = reactive({
      visible: false,
      x: 0,
      y: 0,
      widgetId: null,
    })

    // Grid options
    const gridOptions = reactive({
      defaultColDef: {
        resizable: true,
        sortable: false,
        filter: false,
      },
      rowHeight: 300,
      suppressRowClickSelection: true,
      suppressCellFocus: true,
      suppressRowHoverHighlight: true,
      animateRows: true,
      enableCellChangeFlash: false,
    })

    // Computed properties
    const performanceClass = computed(() => {
      const status = performanceStatus.value.toLowerCase()
      if (status === 'excellent' || status === 'good') return 'status-good'
      if (status === 'fair') return 'status-warning'
      return 'status-error'
    })

    // Methods
    const addWidget = async () => {
      if (isAddingWidget.value) return

      isAddingWidget.value = true

      try {
        const widgetId = generateId('widget')
        const defaultConfig = createDefaultConfig()
        const sampleData = generateSampleData('sine-wave')

        const newWidget = {
          id: widgetId,
          title: `Plot ${widgets.value.length + 1}`,
          config: defaultConfig,
          data: sampleData,
          showConfig: false,
          isResizing: false,
          position: calculateOptimalPosition(),
          size: { width: 400, height: 300 },
        }

        // Validate widget has required properties
        if (!newWidget.id || typeof newWidget.id !== 'string' || newWidget.id.trim() === '') {
          throw new Error('Widget must have a valid string ID')
        }

        widgets.value.push(newWidget)
        setActiveWidget(widgetId)
        updateLastUpdateTime()

        // Widget added successfully
        await nextTick()

        // Save to store
        dashboardStore.addWidget(newWidget)
      } catch (error) {
        console.error('Error adding widget:', error)
      } finally {
        isAddingWidget.value = false
      }
    }

    const removeWidget = (widgetId) => {
      const index = widgets.value.findIndex((w) => w.id === widgetId)
      if (index !== -1) {
        widgets.value.splice(index, 1)
        dashboardStore.removeWidget(widgetId)

        if (activeWidget.value === widgetId) {
          activeWidget.value = widgets.value.length > 0 ? widgets.value[0].id : null
        }

        updateLastUpdateTime()
        hideContextMenu()
      }
    }

    const duplicateWidget = (widgetId) => {
      const widget = widgets.value.find((w) => w.id === widgetId)
      if (widget) {
        const newWidgetId = generateId('widget')
        const duplicatedWidget = {
          ...widget,
          id: newWidgetId,
          title: `${widget.title} (Copy)`,
          position: calculateOptimalPosition(),
          showConfig: false,
        }

        widgets.value.push(duplicatedWidget)
        dashboardStore.addWidget(duplicatedWidget)
        setActiveWidget(newWidgetId)
        updateLastUpdateTime()
      }
      hideContextMenu()
    }

    const calculateOptimalPosition = () => {
      // Simple algorithm to find an optimal position for new widgets
      const gridCols = 4 // Assuming 4 columns
      const occupiedPositions = widgets.value.map((w) => w.position || { x: 0, y: 0 })

      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < gridCols; x++) {
          const position = { x, y }
          const isOccupied = occupiedPositions.some(
            (pos) => pos.x === position.x && pos.y === position.y,
          )
          if (!isOccupied) {
            return position
          }
        }
      }

      return { x: 0, y: widgets.value.length }
    }

    const updateWidgetConfig = (widgetId, config) => {
      const widget = widgets.value.find((w) => w.id === widgetId)
      if (widget) {
        widget.config = { ...widget.config, ...config }
        dashboardStore.updateWidgetConfig(widgetId, widget.config)
        updateLastUpdateTime()
      }
    }

    const updateWidgetData = (widgetId, data) => {
      const widget = widgets.value.find((w) => w.id === widgetId)
      if (widget) {
        widget.data = data
        dashboardStore.updateWidgetData(widgetId, data)
        updateLastUpdateTime()
      }
    }

    const updateWidgetTitle = (widgetId, title) => {
      const widget = widgets.value.find((w) => w.id === widgetId)
      if (widget) {
        widget.title = title
        dashboardStore.updateWidget(widgetId, { title })
        updateLastUpdateTime()
      }
    }

    const toggleWidgetConfig = (widgetId) => {
      const widget = widgets.value.find((w) => w.id === widgetId)
      if (widget) {
        widget.showConfig = !widget.showConfig
      }
    }

    const setActiveWidget = (widgetId) => {
      activeWidget.value = widgetId
    }

    const getWidgetTitle = (widgetId) => {
      const widget = widgets.value.find((w) => w.id === widgetId)
      return widget ? widget.title : 'Unknown Widget'
    }

    const onWidgetMoved = (widgetId, position) => {
      const widget = widgets.value.find((w) => w.id === widgetId)
      if (widget) {
        widget.position = position
        dashboardStore.updateWidget(widgetId, { position })
        updateLastUpdateTime()
      }
    }

    const onWidgetResized = (widgetId, size) => {
      const widget = widgets.value.find((w) => w.id === widgetId)
      if (widget) {
        widget.size = size
        widget.isResizing = true

        // Reset resizing flag after a delay
        setTimeout(() => {
          widget.isResizing = false
        }, 300)

        dashboardStore.updateWidget(widgetId, { size })
        updateLastUpdateTime()
      }
    }

    const onLayoutChanged = (layout) => {
      dashboardStore.saveLayout(layout)
      updateLastUpdateTime()
    }

    const toggleAutoLayout = () => {
      autoLayout.value = !autoLayout.value
      dashboardStore.setAutoLayout(autoLayout.value)
    }

    const resetLayout = () => {
      widgets.value = []
      activeWidget.value = null
      dashboardStore.resetDashboard()
      updateLastUpdateTime()
    }

    const saveLayout = () => {
      const layout = {
        widgets: widgets.value,
        autoLayout: autoLayout.value,
        timestamp: Date.now(),
      }

      dashboardStore.exportLayout(layout)

      // Create and trigger download
      const blob = new Blob([JSON.stringify(layout, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dashboard-layout-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }

    const loadLayout = () => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json'
      input.onchange = async (e) => {
        const file = e.target.files[0]
        if (file) {
          try {
            const text = await file.text()
            const layout = JSON.parse(text)

            if (layout.widgets && Array.isArray(layout.widgets)) {
              layout.widgets.forEach((widget, index) => {
                if (!widget.id || typeof widget.id !== 'string' || widget.id.trim() === '') {
                  console.warn(`Widget at index ${index} has invalid ID, generating new ID`)
                  widget.id = generateId('widget')
                }
                // Flatten position/size
                widget.x = widget.position?.x ?? 0
                widget.y = widget.position?.y ?? 0
                widget.width = widget.size?.width ?? 2
                widget.height = widget.size?.height ?? 2
                // Wrap data for PlotWidget if needed
                if (
                  Array.isArray(widget.data) &&
                  widget.data.length &&
                  widget.data[0].x !== undefined &&
                  widget.data[0].y !== undefined
                ) {
                  widget.data = [{ data: widget.data }]
                }
              })

              if (typeof layout.autoLayout === 'boolean') {
                autoLayout.value = layout.autoLayout
              }

              dashboardStore.importLayout(layout)
              updateLastUpdateTime()

              if (dashboardStore.widgetsList.value.length > 0) {
                setActiveWidget(dashboardStore.widgetsList.value[0].id)
              }
            }
          } catch (error) {
            console.error('Error loading layout:', error)
            alert('Error loading layout file. Please check the file format.')
          }
        }
      }
      input.click()
    }

    const exportWidget = (widgetId) => {
      const widget = widgets.value.find((w) => w.id === widgetId)
      if (widget && widget.data) {
        const csvContent = convertDataToCSV(widget.data)
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${widget.title.replace(/\s+/g, '_')}_data.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
      hideContextMenu()
    }

    const convertDataToCSV = (data) => {
      if (!data || !Array.isArray(data) || data.length === 0) {
        return 'No data available'
      }

      const headers = Object.keys(data[0])
      const csvRows = [headers.join(',')]

      for (const row of data) {
        const values = headers.map((header) => {
          const value = row[header]
          return typeof value === 'string' ? `"${value}"` : value
        })
        csvRows.push(values.join(','))
      }

      return csvRows.join('\n')
    }

    const toggleFullscreen = () => {
      isFullscreen.value = !isFullscreen.value
    }

    const toggleGridLines = () => {
      showGridLines.value = !showGridLines.value
    }

    const showContextMenu = (event, widgetId) => {
      event.preventDefault()
      contextMenu.visible = true
      contextMenu.x = event.clientX
      contextMenu.y = event.clientY
      contextMenu.widgetId = widgetId
    }

    const hideContextMenu = () => {
      contextMenu.visible = false
      contextMenu.widgetId = null
    }

    const updateLastUpdateTime = () => {
      lastUpdateTime.value = new Date().toLocaleTimeString()
    }

    const updatePerformanceStatus = () => {
      const widgetCount = widgets.value.length
      if (widgetCount === 0) {
        performanceStatus.value = 'Good'
      } else if (widgetCount <= 4) {
        performanceStatus.value = 'Excellent'
      } else if (widgetCount <= 8) {
        performanceStatus.value = 'Good'
      } else if (widgetCount <= 12) {
        performanceStatus.value = 'Fair'
      } else {
        performanceStatus.value = 'Poor'
      }
    }

    // Lifecycle hooks
    onMounted(async () => {
      // Load saved layout from store
      const savedLayout = dashboardStore.getLayout()
      if (savedLayout) {
        // Validate and fix widgets with missing or invalid IDs
        const validatedWidgets = (savedLayout.widgets || []).map((widget, index) => {
          if (!widget.id || typeof widget.id !== 'string' || widget.id.trim() === '') {
            console.warn(
              `Widget at index ${index} from saved layout has invalid ID, generating new ID`,
            )
            widget.id = generateId('widget')
          }
          return widget
        })

        widgets.value = validatedWidgets
        autoLayout.value = savedLayout.autoLayout !== false

        if (widgets.value.length > 0) {
          setActiveWidget(widgets.value[0].id)
        }
      }

      updateLastUpdateTime()
      updatePerformanceStatus()

      // Set up performance monitoring
      const performanceInterval = setInterval(updatePerformanceStatus, 5000)

      // Global click handler for context menu
      document.addEventListener('click', hideContextMenu)
      document.addEventListener('contextmenu', (e) => {
        if (!e.target.closest('.plot-widget')) {
          e.preventDefault()
        }
      })

      // Cleanup on unmount
      onUnmounted(() => {
        clearInterval(performanceInterval)
        document.removeEventListener('click', hideContextMenu)
      })
    })

    return {
      // Refs
      gridLayoutRef,

      // State
      widgets,
      activeWidget,
      autoLayout,
      isFullscreen,
      isAddingWidget,
      lastUpdateTime,
      performanceStatus,
      contextMenu,
      gridOptions,
      showGridLines,

      // Computed
      performanceClass,

      // Methods
      addWidget,
      removeWidget,
      duplicateWidget,
      updateWidgetConfig,
      updateWidgetData,
      updateWidgetTitle,
      toggleWidgetConfig,
      setActiveWidget,
      getWidgetTitle,
      onWidgetMoved,
      onWidgetResized,
      onLayoutChanged,
      toggleAutoLayout,
      resetLayout,
      saveLayout,
      loadLayout,
      exportWidget,
      toggleFullscreen,
      toggleGridLines,
      showContextMenu,
      hideContextMenu,
    }
  },
}
</script>

<style scoped>
.dashboard-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f7fa;
}

.dashboard-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.dashboard-title {
  font-size: 20px;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

.widget-counter {
  font-size: 14px;
  color: #718096;
  background: #edf2f7;
  padding: 4px 8px;
  border-radius: 12px;
}

.toolbar-center {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #4299e1;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #3182ce;
}

.btn-secondary {
  background: #edf2f7;
  color: #4a5568;
}

.btn-secondary:hover {
  background: #e2e8f0;
}

.btn-secondary.active {
  background: #bee3f8;
  color: #2b6cb0;
}

.btn-outline {
  background: transparent;
  color: #4a5568;
  border: 1px solid #e2e8f0;
}

.btn-outline:hover {
  background: #f7fafc;
  border-color: #cbd5e0;
}

.btn-sm {
  padding: 6px 10px;
  font-size: 12px;
}

.btn-lg {
  padding: 12px 24px;
  font-size: 16px;
}

.btn-icon {
  font-size: 14px;
}

.view-toggle .btn.active {
  background: #4299e1;
  color: white;
}

.dashboard-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.dashboard-content.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  background: #f5f7fa;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: white;
  margin: 20px;
  border-radius: 8px;
  border: 2px dashed #e2e8f0;
}

.empty-state-content {
  text-align: center;
  max-width: 400px;
  padding: 40px;
}

.empty-state-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state h2 {
  font-size: 24px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 8px 0;
}

.empty-state p {
  font-size: 16px;
  color: #718096;
  margin: 0 0 24px 0;
  line-height: 1.5;
}

.dashboard-status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 20px;
  background: #2d3748;
  color: white;
  font-size: 12px;
}

.status-left,
.status-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-label {
  color: #a0aec0;
}

.status-value {
  color: white;
  font-weight: 500;
}

.status-value.status-good {
  color: #68d391;
}

.status-value.status-warning {
  color: #fbb439;
}

.status-value.status-error {
  color: #fc8181;
}

.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 180px;
  overflow: hidden;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  font-size: 14px;
  color: #4a5568;
  cursor: pointer;
  transition: background-color 0.2s;
}

.context-menu-item:hover {
  background: #f7fafc;
}

.context-menu-item.danger {
  color: #e53e3e;
}

.context-menu-item.danger:hover {
  background: #fed7d7;
}

.context-menu-separator {
  height: 1px;
  background: #e2e8f0;
  margin: 4px 0;
}

.menu-icon {
  font-size: 14px;
  width: 16px;
  text-align: center;
}

.context-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}

@media (max-width: 768px) {
  .dashboard-toolbar {
    flex-direction: column;
    gap: 12px;
    padding: 16px;
  }

  .toolbar-left,
  .toolbar-center,
  .toolbar-right {
    justify-content: center;
  }

  .toolbar-center {
    flex-wrap: wrap;
  }

  .dashboard-status-bar {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }

  .status-left,
  .status-right {
    justify-content: center;
  }
}
</style>
