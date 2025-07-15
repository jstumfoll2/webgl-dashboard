<template>
  <div class="grid-layout-container">
    <!-- Vue Grid Layout Container -->
    <div
      ref="gridContainer"
      class="vue-grid-container"
      :class="{ 'show-grid-lines': showGridLines }"
    >
      <grid-layout
        v-model:layout="layout"
        :col-num="gridConfig.columns"
        :row-height="gridConfig.cellHeight"
        :is-draggable="true"
        :is-resizable="true"
        :is-mirrored="false"
        :vertical-compact="false"
        :margin="[10, 10]"
        :use-css-transforms="true"
        @layout-created="onLayoutCreated"
        @layout-before-mount="onLayoutBeforeMount"
        @layout-mounted="onLayoutMounted"
        @layout-ready="onLayoutReady"
        @layout-updated="onLayoutUpdated"
        @breakpoint-changed="onBreakpointChanged"
      >
        <template v-if="layout && layout.length > 0">
          <grid-item
            v-for="item in filteredLayout"
            :key="item.i || `item-${item.x}-${item.y}`"
            :x="item.x"
            :y="item.y"
            :w="item.w"
            :h="item.h"
            :i="item.i"
            :is-draggable="true"
            :is-resizable="true"
            class="grid-item"
          >
            <div class="widget-wrapper">
              <div class="widget-header">
                <span class="widget-title">{{ getWidgetTitle(item.i) }}</span>
                <div class="widget-controls">
                  <button class="widget-btn" title="Configure" @click="configureWidget(item.i)">
                    ⚙
                  </button>
                  <button
                    class="widget-btn remove-btn"
                    title="Remove"
                    @click="removeWidget(item.i)"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div class="widget-content">
                <plot-widget
                  :widget-id="item.i"
                  :data="getWidgetData(item.i)"
                  :config="getWidgetConfig(item.i)"
                  @widget-updated="onWidgetUpdated"
                />
              </div>
            </div>
          </grid-item>
        </template>
      </grid-layout>
    </div>

    <!-- Widget Size Dialog -->
    <div v-if="showSizeDialog" class="modal-overlay" @click="closeSizeDialog">
      <div class="size-dialog" @click.stop>
        <h3>Add New Plot Widget</h3>
        <div class="size-options">
          <div class="size-option" @click="createWidget('small')">
            <div class="size-preview small"></div>
            <span>Small (2×2)</span>
          </div>
          <div class="size-option" @click="createWidget('medium')">
            <div class="size-preview medium"></div>
            <span>Medium (3×3)</span>
          </div>
          <div class="size-option" @click="createWidget('large')">
            <div class="size-preview large"></div>
            <span>Large (4×4)</span>
          </div>
          <div class="size-option" @click="createWidget('wide')">
            <div class="size-preview wide"></div>
            <span>Wide (6×3)</span>
          </div>
        </div>
        <button class="btn-secondary" @click="closeSizeDialog">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { GridLayout, GridItem } from 'vue3-grid-layout-next'
import PlotWidget from './PlotWidget.vue'

export default {
  name: 'DashboardGridLayout',
  components: {
    GridLayout,
    GridItem,
    PlotWidget,
  },
  props: {
    widgets: {
      type: Array,
      default: () => [],
    },
    gridConfig: {
      type: Object,
      default: () => ({
        columns: 12,
        rows: 20,
        cellHeight: 60,
        cellWidth: 100,
      }),
    },
    showGridLines: {
      type: Boolean,
      default: true,
    },
  },
  emits: [
    'widget-added',
    'widget-removed',
    'widget-moved',
    'widget-resized',
    'layout-changed',
    'layout-saved',
    'layout-loaded',
    'widget-configure',
  ],
  setup(props, { emit }) {
    // Refs
    const gridContainer = ref(null)

    // Reactive state
    const showSizeDialog = ref(false)
    const isAddingWidget = ref(false)

    // Vue Grid Layout state
    const layout = ref([])

    // Computed property to filter valid layout items
    const filteredLayout = computed(() =>
      layout.value.filter((item) => item && item.i && typeof item.i === 'string'),
    )

    // Widget data store
    const widgetData = ref(new Map())

    // Convert props.widgets to layout format
    const updateLayoutFromWidgets = () => {
      // Filter out widgets without valid IDs and validate
      const validWidgets = props.widgets.filter((widget) => {
        if (!widget.id || typeof widget.id !== 'string' || widget.id.trim() === '') {
          console.warn('Widget missing valid ID, skipping:', widget)
          return false
        }
        return true
      })

      // Map valid widgets to layout format
      layout.value = validWidgets.map((widget) => ({
        i: widget.id,
        x: widget.x || 0,
        y: widget.y || 0,
        w: widget.width || 2,
        h: widget.height || 2,
        minW: 1,
        minH: 1,
      }))

      // Store widget data only for valid widgets
      validWidgets.forEach((widget) => {
        widgetData.value.set(widget.id, widget)
      })
    }

    // Vue Grid Layout event handlers
    const onLayoutCreated = (newLayout) => {
      console.log('Layout created:', newLayout)
    }

    const onLayoutBeforeMount = (newLayout) => {
      console.log('Layout before mount:', newLayout)
    }

    const onLayoutMounted = (newLayout) => {
      console.log('Layout mounted:', newLayout)
    }

    const onLayoutReady = (newLayout) => {
      console.log('Layout ready:', newLayout)
    }

    const onLayoutUpdated = (newLayout) => {
      console.log('Layout updated:', newLayout)

      // Prevent infinite loops by checking if layout actually changed
      const hasChanges = newLayout.some((layoutItem) => {
        const widget = props.widgets.find((w) => w.id === layoutItem.i)
        return (
          widget &&
          (widget.x !== layoutItem.x ||
            widget.y !== layoutItem.y ||
            widget.width !== layoutItem.w ||
            widget.height !== layoutItem.h)
        )
      })

      if (!hasChanges) {
        return // No actual changes, prevent emit
      }

      // Update widget positions
      const updatedWidgets = props.widgets.map((widget) => {
        const layoutItem = newLayout.find((item) => item.i === widget.id)
        if (layoutItem) {
          return {
            ...widget,
            x: layoutItem.x,
            y: layoutItem.y,
            width: layoutItem.w,
            height: layoutItem.h,
          }
        }
        return widget
      })

      emit('layout-changed', updatedWidgets)
    }

    const onBreakpointChanged = (newBreakpoint, newLayout) => {
      console.log('Breakpoint changed:', newBreakpoint, newLayout)
    }

    // Widget management methods
    const addWidget = () => {
      showSizeDialog.value = true
    }

    const createWidget = (size) => {
      const sizeConfig = {
        small: { w: 2, h: 2 },
        medium: { w: 3, h: 3 },
        large: { w: 4, h: 4 },
        wide: { w: 6, h: 3 },
      }

      const position = findEmptyPosition(sizeConfig[size])
      const widgetId = `widget_${Date.now()}`

      const widget = {
        id: widgetId,
        x: position.x,
        y: position.y,
        width: sizeConfig[size].w,
        height: sizeConfig[size].h,
        title: `Plot ${props.widgets.length + 1}`,
        config: {
          type: 'line',
          color: '#1f77b4',
          showLegend: true,
          showGrid: true,
        },
        data: [],
      }

      // Add to layout
      layout.value.push({
        i: widgetId,
        x: position.x,
        y: position.y,
        w: sizeConfig[size].w,
        h: sizeConfig[size].h,
        minW: 1,
        minH: 1,
      })

      // Store widget data
      widgetData.value.set(widgetId, widget)

      emit('widget-added', widget)
      closeSizeDialog()
    }

    const findEmptyPosition = (size) => {
      // Simple algorithm to find empty position
      for (let y = 0; y < 20; y++) {
        for (let x = 0; x <= props.gridConfig.columns - size.w; x++) {
          if (isPositionEmpty(x, y, size.w, size.h)) {
            return { x, y }
          }
        }
      }
      return { x: 0, y: 0 } // Fallback
    }

    const isPositionEmpty = (x, y, width, height) => {
      return !layout.value.some((item) => {
        return (
          x < item.x + item.w && x + width > item.x && y < item.y + item.h && y + height > item.y
        )
      })
    }

    const removeWidget = (widgetId) => {
      // Remove from layout
      layout.value = layout.value.filter((item) => item.i !== widgetId)

      // Remove from widget data
      widgetData.value.delete(widgetId)

      emit('widget-removed', widgetId)
    }

    const configureWidget = (widgetId) => {
      console.log('Configure widget:', widgetId)
      // Emit event or show configuration dialog
      emit('widget-configure', widgetId)
    }

    const closeSizeDialog = () => {
      showSizeDialog.value = false
      isAddingWidget.value = false
    }

    // Helper methods for template
    const getWidgetTitle = (widgetId) => {
      if (!widgetId || typeof widgetId !== 'string') {
        return 'Invalid Widget'
      }
      const widget = widgetData.value.get(widgetId)
      return widget?.title || 'Plot Widget'
    }

    const getWidgetData = (widgetId) => {
      if (!widgetId || typeof widgetId !== 'string') {
        return []
      }
      const widget = widgetData.value.get(widgetId)
      return widget?.data || []
    }

    const getWidgetConfig = (widgetId) => {
      if (!widgetId || typeof widgetId !== 'string') {
        return {}
      }
      const widget = widgetData.value.get(widgetId)
      return widget?.config || {}
    }

    const onWidgetUpdated = (widgetId, data) => {
      const widget = widgetData.value.get(widgetId)
      if (widget) {
        widget.data = data
        emit('widget-updated', widgetId, data)
      }
    }

    // Watch for widgets changes
    watch(
      () => props.widgets,
      (newWidgets, oldWidgets) => {
        // Only update if widgets actually changed
        if (JSON.stringify(newWidgets) !== JSON.stringify(oldWidgets)) {
          updateLayoutFromWidgets()
        }
      },
      { deep: true },
    )

    // Lifecycle
    onMounted(() => {
      updateLayoutFromWidgets()
    })

    return {
      // Refs
      gridContainer,

      // Reactive state
      showSizeDialog,
      isAddingWidget,
      layout,

      // Methods
      addWidget,
      createWidget,
      removeWidget,
      configureWidget,
      closeSizeDialog,
      getWidgetTitle,
      getWidgetData,
      getWidgetConfig,
      onWidgetUpdated,

      // Vue Grid Layout event handlers
      onLayoutCreated,
      onLayoutBeforeMount,
      onLayoutMounted,
      onLayoutReady,
      onLayoutUpdated,
      onBreakpointChanged,

      // Computed property
      filteredLayout,
    }
  },
}
</script>

<style scoped>
.grid-layout-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
}

.grid-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn-primary,
.btn-secondary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f8f9fa;
  color: #495057;
  border: 1px solid #dee2e6;
}

.btn-secondary:hover {
  background: #e9ecef;
}

.icon {
  font-size: 16px;
}

.vue-grid-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  padding: 10px;
}

.vue-grid-layout {
  background: transparent;
}

.vue-grid-item {
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  touch-action: none;
}

.vue-grid-item:hover {
  border-color: #007bff;
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.2);
}

.vue-grid-item.vue-grid-item--dragging {
  opacity: 0.8;
  z-index: 1000;
}

.vue-grid-item.vue-grid-item--resizing {
  opacity: 0.8;
}

.vue-resizable-handle {
  opacity: 0.3;
  transition: opacity 0.2s ease;
}

.vue-grid-item:hover .vue-resizable-handle {
  opacity: 1;
}

.widget-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
}

.show-grid-lines .vue-grid-item {
  border: 1px dashed #ddd !important;
}

.widget-cell {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  overflow: hidden;
}

.widget-cell:hover {
  border-color: #007bff;
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.2);
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  cursor: move;
}

.widget-title {
  font-weight: 600;
  font-size: 14px;
  color: #495057;
}

.widget-controls {
  display: flex;
  gap: 4px;
}

.widget-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #6c757d;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.widget-btn:hover {
  background: #e9ecef;
}

.remove-btn:hover {
  background: #dc3545;
  color: white;
}

.widget-content {
  height: calc(100% - 41px);
  overflow: hidden;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.size-dialog {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  max-width: 500px;
  width: 90%;
}

.size-dialog h3 {
  margin: 0 0 20px 0;
  color: #333;
}

.size-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.size-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.size-option:hover {
  border-color: #007bff;
  background: #f8f9ff;
}

.size-preview {
  background: #007bff;
  border-radius: 4px;
}

.size-preview.small {
  width: 40px;
  height: 40px;
}

.size-preview.medium {
  width: 60px;
  height: 60px;
}

.size-preview.large {
  width: 80px;
  height: 80px;
}

.size-preview.wide {
  width: 100px;
  height: 50px;
}

.size-option span {
  font-weight: 500;
  color: #495057;
}
</style>
