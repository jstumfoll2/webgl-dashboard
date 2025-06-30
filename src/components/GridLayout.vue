<template>
  <div class="grid-layout-container">
    <!-- Grid Toolbar -->
    <div class="grid-toolbar">
      <div class="toolbar-left">
        <button 
          class="btn-primary"
          @click="addWidget"
          :disabled="isAddingWidget"
        >
          <span class="icon">+</span>
          Add Plot Widget
        </button>
        
        <button 
          class="btn-secondary"
          @click="toggleGridLines"
        >
          <span class="icon">⋯</span>
          {{ showGridLines ? 'Hide Grid' : 'Show Grid' }}
        </button>
        
        <button 
          class="btn-secondary"
          @click="autoSize"
        >
          <span class="icon">⚏</span>
          Auto Size
        </button>
      </div>
      
      <div class="toolbar-right">
        <button 
          class="btn-secondary"
          @click="saveLayout"
        >
          <span class="icon">💾</span>
          Save Layout
        </button>
        
        <button 
          class="btn-secondary"
          @click="loadLayout"
        >
          <span class="icon">📁</span>
          Load Layout
        </button>
        
        <button 
          class="btn-secondary"
          @click="resetLayout"
        >
          <span class="icon">🔄</span>
          Reset
        </button>
      </div>
    </div>

    <!-- AG-Grid Container -->
    <div 
      ref="gridContainer"
      class="ag-grid-container"
      :class="{ 'show-grid-lines': showGridLines }"
    >
      <ag-grid-vue
        ref="agGrid"
        class="ag-theme-alpine dashboard-grid"
        :columnDefs="columnDefs"
        :rowData="rowData"
        :gridOptions="gridOptions"
        :suppressRowClickSelection="true"
        :suppressCellFocus="true"
        :suppressRowSelection="true"
        :enableRangeSelection="false"
        :defaultColDef="defaultColDef"
        @grid-ready="onGridReady"
        @cell-value-changed="onCellValueChanged"
        @column-resized="onColumnResized"
        @row-drag-end="onRowDragEnd"
      />
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
import { ref, reactive, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { AgGridVue } from 'ag-grid-vue3'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import PlotWidget from './PlotWidget.vue'

export default {
  name: 'GridLayout',
  components: {
    AgGridVue
  },
  props: {
    widgets: {
      type: Array,
      default: () => []
    },
    gridConfig: {
      type: Object,
      default: () => ({
        columns: 12,
        rows: 20,
        cellHeight: 60,
        cellWidth: 100
      })
    }
  },
  emits: [
    'widget-added',
    'widget-removed',
    'widget-moved',
    'widget-resized',
    'layout-changed',
    'layout-saved',
    'layout-loaded'
  ],
  setup(props, { emit }) {
    // Refs
    const gridContainer = ref(null)
    const agGrid = ref(null)
    
    // Reactive state
    const showGridLines = ref(true)
    const showSizeDialog = ref(false)
    const isAddingWidget = ref(false)
    const gridApi = ref(null)
    const columnApi = ref(null)
    
    // Grid configuration
    const gridOptions = reactive({
      suppressMovableColumns: false,
      suppressColumnMoveAnimation: false,
      animateRows: true,
      rowDragManaged: true,
      rowSelection: 'single',
      suppressRowClickSelection: true,
      suppressCellFocus: true,
      enableRangeSelection: false,
      rowHeight: props.gridConfig.cellHeight,
      headerHeight: 0,
      suppressHorizontalScroll: false,
      suppressVerticalScroll: false,
      alwaysShowHorizontalScroll: false,
      alwaysShowVerticalScroll: false,
      domLayout: 'normal'
    })

    // Column definitions - creates grid columns
    const columnDefs = ref([])
    
    // Row data - represents grid cells
    const rowData = ref([])

    // Default column definition
    const defaultColDef = reactive({
      resizable: true,
      sortable: false,
      filter: false,
      width: props.gridConfig.cellWidth,
      minWidth: 50,
      suppressMenu: true,
      suppressHeaderMenuButton: true,
      suppressHeaderFilterButton: true,
      suppressHeaderContextMenu: true
    })

    // Initialize grid structure
    const initializeGrid = () => {
      // Create column definitions
      const cols = []
      for (let i = 0; i < props.gridConfig.columns; i++) {
        cols.push({
          field: `col${i}`,
          headerName: '',
          width: props.gridConfig.cellWidth,
          cellRenderer: 'widgetCellRenderer',
          editable: false,
          suppressMenu: true,
          sortable: false,
          resizable: true
        })
      }
      columnDefs.value = cols

      // Create row data
      const rows = []
      for (let i = 0; i < props.gridConfig.rows; i++) {
        const row = { id: i }
        for (let j = 0; j < props.gridConfig.columns; j++) {
          row[`col${j}`] = null
        }
        rows.push(row)
      }
      rowData.value = rows
    }

    // Widget cell renderer component
    const widgetCellRenderer = {
      template: `
        <div 
          v-if="params.value" 
          class="widget-cell"
          :style="getWidgetStyle()"
          @mousedown="startDrag"
        >
          <div class="widget-header">
            <span class="widget-title">{{ params.value.title || 'Plot Widget' }}</span>
            <div class="widget-controls">
              <button 
                class="widget-btn resize-btn" 
                @click="resizeWidget"
                title="Resize Widget"
              >⚏</button>
              <button 
                class="widget-btn config-btn" 
                @click="configureWidget"
                title="Configure Widget"
              >⚙</button>
              <button 
                class="widget-btn remove-btn" 
                @click="removeWidget"
                title="Remove Widget"
              >×</button>
            </div>
          </div>
          <div class="widget-content">
            <plot-widget 
              :widget-id="params.value.id"
              :config="params.value.config"
              :data="params.value.data"
              @config-changed="onWidgetConfigChanged"
            />
          </div>
        </div>
      `,
      setup(props) {
        const getWidgetStyle = () => {
          if (!props.params.value) return {}
          
          const widget = props.params.value
          return {
            width: `${widget.width * props.gridConfig.cellWidth}px`,
            height: `${widget.height * props.gridConfig.cellHeight}px`,
            position: 'absolute',
            top: '0',
            left: '0',
            zIndex: widget.zIndex || 1
          }
        }

        const startDrag = (event) => {
          // Implement drag functionality
          emit('widget-drag-start', {
            widget: props.params.value,
            event
          })
        }

        const resizeWidget = () => {
          emit('widget-resize-request', props.params.value)
        }

        const configureWidget = () => {
          emit('widget-configure', props.params.value)
        }

        const removeWidget = () => {
          emit('widget-removed', props.params.value.id)
        }

        const onWidgetConfigChanged = (config) => {
          emit('widget-config-changed', {
            widgetId: props.params.value.id,
            config
          })
        }

        return {
          getWidgetStyle,
          startDrag,
          resizeWidget,
          configureWidget,
          removeWidget,
          onWidgetConfigChanged
        }
      }
    }

    // Grid event handlers
    const onGridReady = (params) => {
      gridApi.value = params.api
      columnApi.value = params.columnApi
      
      // Register cell renderer
      params.api.setGridOption('components', {
        widgetCellRenderer
      })
      
      // Auto-size columns
      autoSize()
    }

    const onCellValueChanged = (event) => {
      emit('layout-changed', {
        row: event.rowIndex,
        column: event.colDef.field,
        newValue: event.newValue,
        oldValue: event.oldValue
      })
    }

    const onColumnResized = (event) => {
      if (event.finished) {
        emit('layout-changed', {
          type: 'column-resize',
          columns: event.columns.map(col => ({
            field: col.colId,
            width: col.actualWidth
          }))
        })
      }
    }

    const onRowDragEnd = (event) => {
      emit('widget-moved', {
        widgetId: event.node.data.id,
        fromIndex: event.overIndex,
        toIndex: event.overIndex
      })
    }

    // Widget management methods
    const addWidget = () => {
      showSizeDialog.value = true
    }

    const createWidget = (size) => {
      const sizeConfig = {
        small: { width: 2, height: 2 },
        medium: { width: 3, height: 3 },
        large: { width: 4, height: 4 },
        wide: { width: 6, height: 3 }
      }

      const position = findEmptyPosition(sizeConfig[size])
      if (position) {
        const widget = {
          id: `widget_${Date.now()}`,
          x: position.x,
          y: position.y,
          width: sizeConfig[size].width,
          height: sizeConfig[size].height,
          title: `Plot ${props.widgets.length + 1}`,
          config: {
            type: 'line',
            color: '#1f77b4',
            showLegend: true,
            showGrid: true
          },
          data: []
        }

        placeWidget(widget)
        emit('widget-added', widget)
      } else {
        alert('No space available for this widget size')
      }
      
      closeSizeDialog()
    }

    const findEmptyPosition = (size) => {
      for (let y = 0; y <= props.gridConfig.rows - size.height; y++) {
        for (let x = 0; x <= props.gridConfig.columns - size.width; x++) {
          if (isPositionEmpty(x, y, size.width, size.height)) {
            return { x, y }
          }
        }
      }
      return null
    }

    const isPositionEmpty = (x, y, width, height) => {
      for (let row = y; row < y + height; row++) {
        for (let col = x; col < x + width; col++) {
          if (row >= rowData.value.length || col >= props.gridConfig.columns) {
            return false
          }
          if (rowData.value[row][`col${col}`] !== null) {
            return false
          }
        }
      }
      return true
    }

    const placeWidget = (widget) => {
      for (let row = widget.y; row < widget.y + widget.height; row++) {
        for (let col = widget.x; col < widget.x + widget.width; col++) {
          if (row === widget.y && col === widget.x) {
            rowData.value[row][`col${col}`] = widget
          } else {
            rowData.value[row][`col${col}`] = { occupied: true, parentId: widget.id }
          }
        }
      }
    }

    const removeWidget = (widgetId) => {
      // Find and remove widget from grid
      for (let row = 0; row < rowData.value.length; row++) {
        for (let col = 0; col < props.gridConfig.columns; col++) {
          const cell = rowData.value[row][`col${col}`]
          if (cell && (cell.id === widgetId || cell.parentId === widgetId)) {
            rowData.value[row][`col${col}`] = null
          }
        }
      }
      
      emit('widget-removed', widgetId)
    }

    const closeSizeDialog = () => {
      showSizeDialog.value = false
      isAddingWidget.value = false
    }

    // Layout management methods
    const toggleGridLines = () => {
      showGridLines.value = !showGridLines.value
    }

    const autoSize = () => {
      if (gridApi.value) {
        gridApi.value.sizeColumnsToFit()
      }
    }

    const saveLayout = () => {
      const layout = {
        widgets: props.widgets,
        gridConfig: props.gridConfig,
        timestamp: Date.now()
      }
      
      // Save to localStorage
      localStorage.setItem('dashboard-layout', JSON.stringify(layout))
      emit('layout-saved', layout)
    }

    const loadLayout = () => {
      try {
        const saved = localStorage.getItem('dashboard-layout')
        if (saved) {
          const layout = JSON.parse(saved)
          emit('layout-loaded', layout)
        }
      } catch (error) {
        console.error('Failed to load layout:', error)
      }
    }

    const resetLayout = () => {
      // Clear all widgets
      rowData.value.forEach(row => {
        Object.keys(row).forEach(key => {
          if (key !== 'id') {
            row[key] = null
          }
        })
      })
      
      emit('layout-changed', { type: 'reset' })
    }

    // Resize handling
    const handleResize = () => {
      if (gridApi.value) {
        nextTick(() => {
          gridApi.value.sizeColumnsToFit()
        })
      }
    }

    // Watch for widgets changes
    watch(() => props.widgets, (newWidgets) => {
      // Update grid when widgets change
      initializeGrid()
      newWidgets.forEach(widget => {
        placeWidget(widget)
      })
    }, { deep: true })

    // Lifecycle
    onMounted(() => {
      initializeGrid()
      window.addEventListener('resize', handleResize)
    })

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
    })

    return {
      // Refs
      gridContainer,
      agGrid,
      
      // Reactive state
      showGridLines,
      showSizeDialog,
      isAddingWidget,
      
      // Grid config
      columnDefs,
      rowData,
      gridOptions,
      defaultColDef,
      
      // Methods
      addWidget,
      createWidget,
      removeWidget,
      closeSizeDialog,
      toggleGridLines,
      autoSize,
      saveLayout,
      loadLayout,
      resetLayout,
      
      // Event handlers
      onGridReady,
      onCellValueChanged,
      onColumnResized,
      onRowDragEnd
    }
  }
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
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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

.ag-grid-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.dashboard-grid {
  width: 100%;
  height: 100%;
}

.show-grid-lines .ag-cell {
  border: 1px dashed #ddd !important;
}

.widget-cell {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: all 0.2s ease;
  overflow: hidden;
}

.widget-cell:hover {
  border-color: #007bff;
  box-shadow: 0 4px 12px rgba(0,123,255,0.2);
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
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.size-dialog {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
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