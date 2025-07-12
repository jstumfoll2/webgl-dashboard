/**
 * Grid Layout Utilities for AG-Grid Dashboard
 * Provides helper functions for grid layout management, widget positioning,
 * and responsive grid operations.
 */

/**
 * Default grid configuration settings
 */
export const DEFAULT_GRID_CONFIG = {
  defaultColDef: {
    sortable: false,
    filter: false,
    resizable: true,
    suppressHeaderMenuButton: true,
    suppressMovable: false,
  },
  enableRangeSelection: false,
  enableCellSelection: false,
  suppressRowClickSelection: true,
  suppressCellFocus: true,
  rowSelection: 'none',
  animateRows: true,
  enableBrowserTooltips: false,
  suppressContextMenu: true,
  headerHeight: 0,
  rowHeight: 200,
  minWidth: 300,
  minHeight: 200,
};

/**
 * Widget size presets for different plot types
 */
export const WIDGET_SIZE_PRESETS = {
  small: { width: 300, height: 200, colSpan: 1, rowSpan: 1 },
  medium: { width: 500, height: 300, colSpan: 2, rowSpan: 1 },
  large: { width: 700, height: 400, colSpan: 3, rowSpan: 2 },
  wide: { width: 800, height: 250, colSpan: 4, rowSpan: 1 },
  tall: { width: 400, height: 500, colSpan: 2, rowSpan: 2 },
};

/**
 * Generate a unique widget ID
 * @returns {string} Unique widget identifier
 */
export function generateWidgetId() {
  return `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new widget configuration
 * @param {Object} options - Widget creation options
 * @param {string} options.type - Widget type ('plot', 'chart', etc.)
 * @param {string} options.title - Widget title
 * @param {string} options.size - Size preset ('small', 'medium', 'large', etc.)
 * @param {Object} options.position - Grid position {col, row}
 * @param {Object} options.plotConfig - Initial plot configuration
 * @returns {Object} Widget configuration object
 */
export function createWidgetConfig(options = {}) {
  const {
    type = 'plot',
    title = 'New Plot',
    size = 'medium',
    position = null,
    plotConfig = {},
  } = options;

  const sizeConfig = WIDGET_SIZE_PRESETS[size] || WIDGET_SIZE_PRESETS.medium;
  const widgetId = generateWidgetId();

  return {
    id: widgetId,
    type,
    title,
    ...sizeConfig,
    position: position || { col: 0, row: 0 },
    plotConfig: {
      datasets: [],
      xAxis: { label: 'X Axis', type: 'linear', min: null, max: null },
      yAxis: { label: 'Y Axis', type: 'linear', min: null, max: null },
      legend: { enabled: true, position: 'top-right' },
      colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'],
      ...plotConfig,
    },
    created: new Date().toISOString(),
    lastModified: new Date().toISOString(),
  };
}

/**
 * Calculate optimal grid dimensions based on widget count
 * @param {number} widgetCount - Number of widgets to display
 * @returns {Object} Grid dimensions {cols, rows}
 */
export function calculateGridDimensions(widgetCount) {
  if (widgetCount <= 0) return { cols: 1, rows: 1 };
  
  const cols = Math.ceil(Math.sqrt(widgetCount * 1.5));
  const rows = Math.ceil(widgetCount / cols);
  
  return { cols: Math.max(cols, 2), rows: Math.max(rows, 1) };
}

/**
 * Find the next available position in the grid
 * @param {Array} widgets - Current widgets array
 * @param {Object} newWidget - Widget to be placed
 * @param {number} gridCols - Number of grid columns
 * @returns {Object} Available position {col, row}
 */
export function findAvailablePosition(widgets, newWidget, gridCols = 4) {
  const occupied = new Set();
  
  // Mark occupied positions
  widgets.forEach(widget => {
    const { position, colSpan = 1, rowSpan = 1 } = widget;
    if (position) {
      for (let r = position.row; r < position.row + rowSpan; r++) {
        for (let c = position.col; c < position.col + colSpan; c++) {
          occupied.add(`${r}-${c}`);
        }
      }
    }
  });

  const { colSpan = 1, rowSpan = 1 } = newWidget;

  // Find first available position
  for (let row = 0; row < 100; row++) {
    for (let col = 0; col <= gridCols - colSpan; col++) {
      let canPlace = true;
      
      // Check if all required cells are available
      for (let r = row; r < row + rowSpan && canPlace; r++) {
        for (let c = col; c < col + colSpan && canPlace; c++) {
          if (occupied.has(`${r}-${c}`)) {
            canPlace = false;
          }
        }
      }
      
      if (canPlace) {
        return { col, row };
      }
    }
  }
  
  return { col: 0, row: 0 };
}

/**
 * Convert grid layout to AG-Grid column definitions
 * @param {Array} widgets - Widgets array
 * @param {number} gridCols - Number of grid columns
 * @returns {Array} AG-Grid column definitions
 */
export function createColumnDefinitions(widgets, gridCols = 4) {
  const columns = [];
  
  for (let i = 0; i < gridCols; i++) {
    columns.push({
      headerName: '',
      field: `col${i}`,
      width: 300,
      minWidth: 200,
      maxWidth: 800,
      resizable: true,
      cellRenderer: 'plotWidgetRenderer',
      cellRendererParams: {
        columnIndex: i,
      },
    });
  }
  
  return columns;
}

/**
 * Convert widgets to AG-Grid row data
 * @param {Array} widgets - Widgets array
 * @param {number} gridCols - Number of grid columns
 * @returns {Array} AG-Grid row data
 */
export function createRowData(widgets, gridCols = 4) {
  const grid = [];
  const maxRow = Math.max(...widgets.map(w => (w.position?.row || 0) + (w.rowSpan || 1)), 1);
  
  // Initialize grid with empty cells
  for (let row = 0; row < maxRow; row++) {
    const rowData = { id: `row_${row}` };
    for (let col = 0; col < gridCols; col++) {
      rowData[`col${col}`] = null;
    }
    grid.push(rowData);
  }
  
  // Place widgets in grid
  widgets.forEach(widget => {
    const { position, colSpan = 1, rowSpan = 1 } = widget;
    if (position && position.row < maxRow && position.col < gridCols) {
      // Place widget in the top-left cell of its span
      if (grid[position.row]) {
        grid[position.row][`col${position.col}`] = {
          ...widget,
          isMainCell: true,
        };
        
        // Mark spanned cells
        for (let r = position.row; r < position.row + rowSpan; r++) {
          for (let c = position.col; c < position.col + colSpan; c++) {
            if (r !== position.row || c !== position.col) {
              if (grid[r] && grid[r][`col${c}`] === null) {
                grid[r][`col${c}`] = {
                  ...widget,
                  isSpannedCell: true,
                  mainCellPosition: position,
                };
              }
            }
          }
        }
      }
    }
  });
  
  return grid;
}

/**
 * Save dashboard layout to localStorage
 * @param {string} layoutName - Name of the layout
 * @param {Array} widgets - Widgets configuration
 * @param {Object} gridConfig - Grid configuration
 */
export function saveDashboardLayout(layoutName, widgets, gridConfig = {}) {
  try {
    const layout = {
      name: layoutName,
      widgets: widgets.map(widget => ({
        ...widget,
        // Remove any runtime-only properties
        element: undefined,
        plotInstance: undefined,
      })),
      gridConfig,
      savedAt: new Date().toISOString(),
      version: '1.0',
    };
    
    localStorage.setItem(`dashboard_layout_${layoutName}`, JSON.stringify(layout));
    
    // Update saved layouts list
    const savedLayouts = getSavedLayoutsList();
    if (!savedLayouts.includes(layoutName)) {
      savedLayouts.push(layoutName);
      localStorage.setItem('dashboard_saved_layouts', JSON.stringify(savedLayouts));
    }
    
    return true;
  } catch (error) {
    console.error('Failed to save dashboard layout:', error);
    return false;
  }
}

/**
 * Load dashboard layout from localStorage
 * @param {string} layoutName - Name of the layout to load
 * @returns {Object|null} Layout configuration or null if not found
 */
export function loadDashboardLayout(layoutName) {
  try {
    const layoutData = localStorage.getItem(`dashboard_layout_${layoutName}`);
    if (!layoutData) return null;
    
    const layout = JSON.parse(layoutData);
    
    // Validate layout structure
    if (!layout.widgets || !Array.isArray(layout.widgets)) {
      throw new Error('Invalid layout format');
    }
    
    return layout;
  } catch (error) {
    console.error('Failed to load dashboard layout:', error);
    return null;
  }
}

/**
 * Get list of saved layout names
 * @returns {Array} Array of saved layout names
 */
export function getSavedLayoutsList() {
  try {
    const layouts = localStorage.getItem('dashboard_saved_layouts');
    return layouts ? JSON.parse(layouts) : [];
  } catch (error) {
    console.error('Failed to get saved layouts list:', error);
    return [];
  }
}

/**
 * Delete a saved layout
 * @param {string} layoutName - Name of the layout to delete
 * @returns {boolean} Success status
 */
export function deleteDashboardLayout(layoutName) {
  try {
    localStorage.removeItem(`dashboard_layout_${layoutName}`);
    
    // Update saved layouts list
    const savedLayouts = getSavedLayoutsList();
    const updatedLayouts = savedLayouts.filter(name => name !== layoutName);
    localStorage.setItem('dashboard_saved_layouts', JSON.stringify(updatedLayouts));
    
    return true;
  } catch (error) {
    console.error('Failed to delete dashboard layout:', error);
    return false;
  }
}

/**
 * Validate widget configuration
 * @param {Object} widget - Widget configuration to validate
 * @returns {Object} Validation result { isValid, errors }
 */
export function validateWidgetConfig(widget) {
  const errors = [];
  
  if (!widget.id) {
    errors.push('Widget must have an ID');
  }
  
  if (!widget.type) {
    errors.push('Widget must have a type');
  }
  
  if (!widget.position || typeof widget.position.col !== 'number' || typeof widget.position.row !== 'number') {
    errors.push('Widget must have valid position coordinates');
  }
  
  if (widget.colSpan && (widget.colSpan < 1 || widget.colSpan > 12)) {
    errors.push('Widget colSpan must be between 1 and 12');
  }
  
  if (widget.rowSpan && (widget.rowSpan < 1 || widget.rowSpan > 12)) {
    errors.push('Widget rowSpan must be between 1 and 12');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate responsive grid breakpoints
 * @param {number} screenWidth - Current screen width in pixels
 * @returns {Object} Responsive configuration
 */
export function getResponsiveGridConfig(screenWidth) {
  if (screenWidth < 768) {
    // Mobile
    return {
      gridCols: 1,
      minWidgetWidth: 280,
      defaultWidgetHeight: 200,
    };
  } else if (screenWidth < 1024) {
    // Tablet
    return {
      gridCols: 2,
      minWidgetWidth: 350,
      defaultWidgetHeight: 250,
    };
  } else if (screenWidth < 1440) {
    // Desktop
    return {
      gridCols: 3,
      minWidgetWidth: 400,
      defaultWidgetHeight: 300,
    };
  } else {
    // Large Desktop
    return {
      gridCols: 4,
      minWidgetWidth: 450,
      defaultWidgetHeight: 350,
    };
  }
}

/**
 * Auto-arrange widgets in grid to minimize empty space
 * @param {Array} widgets - Current widgets array
 * @param {number} gridCols - Number of grid columns
 * @returns {Array} Rearranged widgets array
 */
export function autoArrangeWidgets(widgets, gridCols = 4) {
  if (!widgets.length) return widgets;
  
  // Sort widgets by size (larger widgets first) and then by creation date
  const sortedWidgets = [...widgets].sort((a, b) => {
    const aSize = (a.colSpan || 1) * (a.rowSpan || 1);
    const bSize = (b.colSpan || 1) * (b.rowSpan || 1);
    
    if (aSize !== bSize) {
      return bSize - aSize; // Larger first
    }
    
    return new Date(a.created || 0) - new Date(b.created || 0); // Older first
  });
  
  // Reset positions and place widgets optimally
  const arrangedWidgets = [];
  
  sortedWidgets.forEach(widget => {
    const position = findAvailablePosition(arrangedWidgets, widget, gridCols);
    arrangedWidgets.push({
      ...widget,
      position,
      lastModified: new Date().toISOString(),
    });
  });
  
  return arrangedWidgets;
}

/**
 * Export utilities object for easier importing
 */
export default {
  DEFAULT_GRID_CONFIG,
  WIDGET_SIZE_PRESETS,
  generateWidgetId,
  createWidgetConfig,
  calculateGridDimensions,
  findAvailablePosition,
  createColumnDefinitions,
  createRowData,
  saveDashboardLayout,
  loadDashboardLayout,
  getSavedLayoutsList,
  deleteDashboardLayout,
  validateWidgetConfig,
  getResponsiveGridConfig,
  autoArrangeWidgets,
};