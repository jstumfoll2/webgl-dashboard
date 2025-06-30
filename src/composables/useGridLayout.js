import { ref, reactive, computed, nextTick } from 'vue'

/**
 * Composable for managing grid layout functionality
 * Handles widget positioning, resizing, and dashboard state
 */
export function useGridLayout() {
  // Grid state
  const gridApi = ref(null)
  const columnApi = ref(null)
  const gridReady = ref(false)
  
  // Layout configuration
  const gridOptions = reactive({
    columnDefs: [],
    rowData: [],
    defaultColDef: {
      resizable: true,
      sortable: false,
      filter: false,
      editable: false,
      suppressMenu: true,
      minWidth: 200,
      maxWidth: 800
    },
    suppressRowClickSelection: true,
    suppressCellSelection: true,
    suppressMovableColumns: false,
    suppressDragLeaveHidesColumns: true,
    animateRows: true,
    enableRangeSelection: false,
    rowHeight: 300,
    headerHeight: 0, // Hide headers for dashboard view
    suppressHorizontalScroll: false,
    suppressVerticalScroll: false,
    domLayout: 'normal'
  })

  // Widget management
  const widgets = ref([])
  const nextWidgetId = ref(1)
  const selectedWidget = ref(null)

  // Layout state
  const layoutConfig = reactive({
    columns: 3,
    rows: 2,
    gap: 10,
    autoResize: true
  })

  /**
   * Initialize grid API references
   */
  const onGridReady = (params) => {
    gridApi.value = params.api
    columnApi.value = params.columnApi
    gridReady.value = true
    
    // Setup initial layout
    setupInitialLayout()
  }

  /**
   * Setup initial grid layout with default columns
   */
  const setupInitialLayout = () => {
    if (!gridApi.value) return

    // Create default column structure
    const columns = []
    for (let i = 0; i < layoutConfig.columns; i++) {
      columns.push({
        headerName: `Column ${i + 1}`,
        field: `col${i}`,
        width: 300,
        minWidth: 200,
        maxWidth: 600,
        resizable: true,
        cellRenderer: 'plotWidgetRenderer',
        cellRendererParams: {
          columnIndex: i
        }
      })
    }

    gridOptions.columnDefs = columns
    
    // Create initial empty rows
    const rows = []
    for (let i = 0; i < layoutConfig.rows; i++) {
      const row = { id: `row-${i}` }
      for (let j = 0; j < layoutConfig.columns; j++) {
        row[`col${j}`] = null
      }
      rows.push(row)
    }
    
    gridOptions.rowData = rows
    
    // Apply to grid
    if (gridApi.value) {
      gridApi.value.setColumnDefs(gridOptions.columnDefs)
      gridApi.value.setRowData(gridOptions.rowData)
    }
  }

  /**
   * Add a new widget to the grid
   */
  const addWidget = (widgetConfig = {}) => {
    const widget = {
      id: `widget-${nextWidgetId.value++}`,
      type: 'plot',
      title: widgetConfig.title || `Plot ${widgets.value.length + 1}`,
      position: findNextAvailablePosition(),
      size: widgetConfig.size || { width: 1, height: 1 },
      config: {
        datasets: [],
        xAxis: { label: 'X Axis', scale: 'linear' },
        yAxis: { label: 'Y Axis', scale: 'linear' },
        legend: { visible: true, position: 'top-right' },
        colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
        ...widgetConfig.config
      },
      created: new Date().toISOString(),
      ...widgetConfig
    }

    widgets.value.push(widget)
    updateGridLayout()
    
    return widget
  }

  /**
   * Remove a widget from the grid
   */
  const removeWidget = (widgetId) => {
    const index = widgets.value.findIndex(w => w.id === widgetId)
    if (index > -1) {
      widgets.value.splice(index, 1)
      updateGridLayout()
      
      // Clear selection if removed widget was selected
      if (selectedWidget.value?.id === widgetId) {
        selectedWidget.value = null
      }
    }
  }

  /**
   * Update widget configuration
   */
  const updateWidget = (widgetId, updates) => {
    const widget = widgets.value.find(w => w.id === widgetId)
    if (widget) {
      Object.assign(widget, updates)
      updateGridLayout()
    }
  }

  /**
   * Find next available position in grid
   */
  const findNextAvailablePosition = () => {
    const occupied = new Set()
    
    widgets.value.forEach(widget => {
      if (widget.position) {
        const key = `${widget.position.row}-${widget.position.col}`
        occupied.add(key)
      }
    })

    // Find first available position
    for (let row = 0; row < layoutConfig.rows; row++) {
      for (let col = 0; col < layoutConfig.columns; col++) {
        const key = `${row}-${col}`
        if (!occupied.has(key)) {
          return { row, col }
        }
      }
    }

    // If no position available, expand grid
    return { row: layoutConfig.rows, col: 0 }
  }

  /**
   * Update grid layout based on current widgets
   */
  const updateGridLayout = async () => {
    if (!gridApi.value) return

    await nextTick()

    // Ensure grid has enough rows for all widgets
    const maxRow = Math.max(
      ...widgets.value.map(w => w.position?.row || 0),
      layoutConfig.rows - 1
    )

    if (maxRow >= layoutConfig.rows) {
      layoutConfig.rows = maxRow + 1
    }

    // Update row data with widget assignments
    const rows = []
    for (let i = 0; i < layoutConfig.rows; i++) {
      const row = { id: `row-${i}` }
      for (let j = 0; j < layoutConfig.columns; j++) {
        const widget = widgets.value.find(w => 
          w.position?.row === i && w.position?.col === j
        )
        row[`col${j}`] = widget || null
      }
      rows.push(row)
    }

    gridOptions.rowData = rows
    gridApi.value.setRowData(rows)
  }

  /**
   * Handle widget drag and drop
   */
  const onWidgetDragEnd = (event) => {
    const { widgetId, newPosition } = event
    const widget = widgets.value.find(w => w.id === widgetId)
    
    if (widget && newPosition) {
      widget.position = newPosition
      updateGridLayout()
    }
  }

  /**
   * Handle column resize
   */
  const onColumnResized = (event) => {
    if (layoutConfig.autoResize) {
      // Update widget sizes based on column widths
      const columnSizes = event.columns.map(col => ({
        field: col.colId,
        width: col.actualWidth
      }))
      
      // Update widgets in affected columns
      widgets.value.forEach(widget => {
        if (widget.position) {
          const columnSize = columnSizes.find(c => c.field === `col${widget.position.col}`)
          if (columnSize) {
            widget.size = {
              ...widget.size,
              width: columnSize.width
            }
          }
        }
      })
    }
  }

  /**
   * Resize grid layout
   */
  const resizeGrid = (columns, rows) => {
    layoutConfig.columns = Math.max(1, columns)
    layoutConfig.rows = Math.max(1, rows)
    
    // Reposition widgets that are outside new bounds
    widgets.value.forEach(widget => {
      if (widget.position) {
        if (widget.position.col >= layoutConfig.columns) {
          widget.position.col = layoutConfig.columns - 1
        }
        if (widget.position.row >= layoutConfig.rows) {
          widget.position.row = layoutConfig.rows - 1
        }
      }
    })

    setupInitialLayout()
    updateGridLayout()
  }

  /**
   * Get layout configuration for persistence
   */
  const getLayoutConfig = () => {
    return {
      layoutConfig: { ...layoutConfig },
      widgets: widgets.value.map(w => ({
        ...w,
        // Deep clone config to avoid reference issues
        config: JSON.parse(JSON.stringify(w.config))
      }))
    }
  }

  /**
   * Load layout configuration
   */
  const loadLayoutConfig = (config) => {
    if (config.layoutConfig) {
      Object.assign(layoutConfig, config.layoutConfig)
    }
    
    if (config.widgets) {
      widgets.value = config.widgets.map(w => ({
        ...w,
        config: { ...w.config }
      }))
      
      // Update next widget ID
      const maxId = Math.max(...widgets.value.map(w => 
        parseInt(w.id.replace('widget-', '')) || 0
      ), 0)
      nextWidgetId.value = maxId + 1
    }

    setupInitialLayout()
    updateGridLayout()
  }

  /**
   * Clear all widgets
   */
  const clearLayout = () => {
    widgets.value = []
    selectedWidget.value = null
    nextWidgetId.value = 1
    updateGridLayout()
  }

  /**
   * Select a widget
   */
  const selectWidget = (widgetId) => {
    selectedWidget.value = widgets.value.find(w => w.id === widgetId) || null
  }

  // Computed properties
  const hasWidgets = computed(() => widgets.value.length > 0)
  const widgetCount = computed(() => widgets.value.length)
  const availablePositions = computed(() => {
    const total = layoutConfig.columns * layoutConfig.rows
    return total - widgets.value.length
  })

  return {
    // Grid state
    gridApi,
    columnApi,
    gridReady,
    gridOptions,
    
    // Layout state
    layoutConfig,
    widgets,
    selectedWidget,
    
    // Methods
    onGridReady,
    addWidget,
    removeWidget,
    updateWidget,
    updateGridLayout,
    onWidgetDragEnd,
    onColumnResized,
    resizeGrid,
    getLayoutConfig,
    loadLayoutConfig,
    clearLayout,
    selectWidget,
    
    // Computed
    hasWidgets,
    widgetCount,
    availablePositions
  }
}