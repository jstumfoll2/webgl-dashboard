/**
 * Dashboard Store - State Management
 * Manages dashboard layout, widgets, and global configuration using Vue 3 reactive state
 */

import { reactive, computed, watch, nextTick } from 'vue';
import { DEFAULT_LINE_COLORS, getLineColor } from '../utils/plotUtils.jsx';

/**
 * Default widget configuration
 */
const DEFAULT_WIDGET_CONFIG = {
  type: 'plot',
  title: 'New Plot Widget',
  showTitle: true,
  showLegend: true,
  legendPosition: 'topRight',
  backgroundColor: '#1a1a1a',
  gridColor: '#333333',
  axisColor: '#cccccc',
  textColor: '#ffffff',
  showGrid: true,
  showAxis: true,
  autoScale: true,
  logScale: false,
  xAxisLabel: 'X Axis',
  yAxisLabel: 'Y Axis',
  showAxisLabels: true,
  datasets: []
};

/**
 * Default dataset configuration
 */
const DEFAULT_DATASET_CONFIG = {
  id: null,
  name: 'Dataset',
  dataSource: 'sample',
  data: { x: [], y: [] },
  visible: true,
  color: '#2196F3',
  lineWidth: 1.0,
  lineStyle: 'solid',
  markerStyle: 'none',
  markerSize: 3,
  scaleX: 1.0,
  scaleY: 1.0,
  offsetX: 0.0,
  offsetY: 0.0,
  interpolation: 'linear'
};

/**
 * Default grid layout configuration
 */
const DEFAULT_LAYOUT_CONFIG = {
  columns: 12,
  rowHeight: 50,
  margin: 10,
  autoSize: true,
  resizable: true,
  draggable: true,
  mirrored: false
};

/**
 * Create the dashboard store
 */
function createDashboardStore() {
  // Main reactive state
  const state = reactive({
    // Dashboard metadata
    dashboardId: null,
    dashboardName: 'New Dashboard',
    lastModified: new Date().toISOString(),
    version: '1.0.0',
    
    // Layout configuration
    layout: { ...DEFAULT_LAYOUT_CONFIG },
    
    // Widget management
    widgets: new Map(),
    selectedWidgetId: null,
    draggedWidgetId: null,
    
    // Grid state
    gridItems: [],
    gridLayout: [],
    
    // Global settings
    theme: 'dark',
    autoSave: true,
    autoSaveInterval: 30000, // 30 seconds
    autoLayout: true,
    
    // UI state
    isLoading: false,
    showConfigPanel: false,
    showDataPanel: false,
    sidebarCollapsed: false,
    
    // Performance settings
    renderMode: 'realtime', // 'realtime' | 'ondemand'
    maxDataPoints: 10000,
    updateInterval: 16, // ~60fps
    
    // Error handling
    errors: [],
    warnings: []
  });

  // Computed properties
  const computedState = {
    // Get all widgets as array
    widgetsList: computed(() => Array.from(state.widgets.values())),
    
    // Get visible widgets
    visibleWidgets: computed(() => 
      Array.from(state.widgets.values()).filter(widget => widget.visible !== false)
    ),
    
    // Get selected widget
    selectedWidget: computed(() => 
      state.selectedWidgetId ? state.widgets.get(state.selectedWidgetId) : null
    ),
    
    // Dashboard statistics
    dashboardStats: computed(() => ({
      totalWidgets: state.widgets.size,
      visibleWidgets: computedState.visibleWidgets.value.length,
      totalDatasets: Array.from(state.widgets.values())
        .reduce((total, widget) => total + (widget.datasets?.length || 0), 0),
      lastModified: state.lastModified
    })),
    
    // Layout validation
    isLayoutValid: computed(() => {
      return state.gridLayout.every(item => 
        item.i && typeof item.x === 'number' && typeof item.y === 'number' &&
        typeof item.w === 'number' && typeof item.h === 'number'
      );
    }),
    
    // Has unsaved changes
    hasUnsavedChanges: computed(() => {
      const lastSaved = localStorage.getItem('dashboardLastSaved');
      return !lastSaved || new Date(state.lastModified) > new Date(lastSaved);
    })
  };

  // Actions
  const actions = {
    /**
     * Initialize dashboard
     */
    async initializeDashboard(config = {}) {
      state.isLoading = true;
      
      try {
        // Load saved dashboard or create new
        if (config.dashboardId) {
          await actions.loadDashboard(config.dashboardId);
        } else {
          actions.createNewDashboard(config);
        }
        
        // Setup auto-save if enabled
        if (state.autoSave) {
          actions.setupAutoSave();
        }
        
      } catch (error) {
        actions.addError('Failed to initialize dashboard', error);
      } finally {
        state.isLoading = false;
      }
    },

    /**
     * Create new dashboard
     */
    createNewDashboard(config = {}) {
      state.dashboardId = config.dashboardId || `dashboard_${Date.now()}`;
      state.dashboardName = config.dashboardName || 'New Dashboard';
      state.widgets.clear();
      state.gridItems = [];
      state.gridLayout = [];
      state.selectedWidgetId = null;
      state.lastModified = new Date().toISOString();
      
      // Add default widget if requested
      if (config.addDefaultWidget !== false) {
        actions.addWidget();
      }
    },

    /**
     * Add new widget to dashboard
     */
    addWidget(config = {}) {
      const widgetId = config.id || `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const widget = {
        id: widgetId,
        ...DEFAULT_WIDGET_CONFIG,
        ...config,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        datasets: config.datasets || []
      };
      
      // Add to widgets map
      state.widgets.set(widgetId, widget);
      
      // Add to grid layout
      const gridItem = {
        i: widgetId,
        x: config.x || 0,
        y: config.y || 0,
        w: config.w || 4,
        h: config.h || 4,
        minW: 2,
        minH: 2,
        maxW: 12,
        maxH: 10
      };
      
      state.gridLayout.push(gridItem);
      
      // Select the new widget
      state.selectedWidgetId = widgetId;
      
      actions.updateLastModified();
      
      return widgetId;
    },

    /**
     * Remove widget from dashboard
     */
    removeWidget(widgetId) {
      if (!state.widgets.has(widgetId)) {
        console.warn(`Widget ${widgetId} not found`);
        return;
      }
      
      // Remove from widgets
      state.widgets.delete(widgetId);
      
      // Remove from grid layout
      state.gridLayout = state.gridLayout.filter(item => item.i !== widgetId);
      
      // Clear selection if this widget was selected
      if (state.selectedWidgetId === widgetId) {
        state.selectedWidgetId = null;
      }
      
      actions.updateLastModified();
    },

    /**
     * Update widget configuration
     */
    updateWidget(widgetId, updates) {
      const widget = state.widgets.get(widgetId);
      if (!widget) {
        console.warn(`Widget ${widgetId} not found`);
        return;
      }
      
      // Deep merge updates
      Object.assign(widget, updates, {
        updatedAt: new Date().toISOString()
      });
      
      actions.updateLastModified();
    },

    /**
     * Update widget config specifically
     */
    updateWidgetConfig(widgetId, config) {
      actions.updateWidget(widgetId, { config });
    },

    /**
     * Update widget data specifically
     */
    updateWidgetData(widgetId, data) {
      actions.updateWidget(widgetId, { data });
    },

    /**
     * Duplicate widget
     */
    duplicateWidget(widgetId) {
      const widget = state.widgets.get(widgetId);
      if (!widget) {
        console.warn(`Widget ${widgetId} not found`);
        return;
      }
      
      const duplicatedWidget = {
        ...widget,
        id: undefined, // Will be generated
        title: `${widget.title} (Copy)`,
        x: (widget.x || 0) + 1,
        y: (widget.y || 0) + 1
      };
      
      return actions.addWidget(duplicatedWidget);
    },

    /**
     * Add dataset to widget
     */
    addDatasetToWidget(widgetId, datasetConfig = {}) {
      const widget = state.widgets.get(widgetId);
      if (!widget) {
        console.warn(`Widget ${widgetId} not found`);
        return;
      }
      
      const datasetId = datasetConfig.id || `dataset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const colorIndex = widget.datasets.length;
      
      const dataset = {
        ...DEFAULT_DATASET_CONFIG,
        ...datasetConfig,
        id: datasetId,
        color: datasetConfig.color || getLineColor(colorIndex),
        name: datasetConfig.name || `Dataset ${widget.datasets.length + 1}`
      };
      
      widget.datasets.push(dataset);
      widget.updatedAt = new Date().toISOString();
      
      actions.updateLastModified();
      
      return datasetId;
    },

    /**
     * Remove dataset from widget
     */
    removeDatasetFromWidget(widgetId, datasetId) {
      const widget = state.widgets.get(widgetId);
      if (!widget) {
        console.warn(`Widget ${widgetId} not found`);
        return;
      }
      
      widget.datasets = widget.datasets.filter(dataset => dataset.id !== datasetId);
      widget.updatedAt = new Date().toISOString();
      
      actions.updateLastModified();
    },

    /**
     * Update dataset in widget
     */
    updateDatasetInWidget(widgetId, datasetId, updates) {
      const widget = state.widgets.get(widgetId);
      if (!widget) {
        console.warn(`Widget ${widgetId} not found`);
        return;
      }
      
      const dataset = widget.datasets.find(d => d.id === datasetId);
      if (!dataset) {
        console.warn(`Dataset ${datasetId} not found in widget ${widgetId}`);
        return;
      }
      
      Object.assign(dataset, updates);
      widget.updatedAt = new Date().toISOString();
      
      actions.updateLastModified();
    },

    /**
     * Update grid layout
     */
    updateGridLayout(newLayout) {
      state.gridLayout = [...newLayout];
      actions.updateLastModified();
    },

    /**
     * Select widget
     */
    selectWidget(widgetId) {
      if (widgetId && state.widgets.has(widgetId)) {
        state.selectedWidgetId = widgetId;
      } else {
        state.selectedWidgetId = null;
      }
    },

    /**
     * Toggle configuration panel
     */
    toggleConfigPanel() {
      state.showConfigPanel = !state.showConfigPanel;
    },

    /**
     * Toggle data panel
     */
    toggleDataPanel() {
      state.showDataPanel = !state.showDataPanel;
    },

    /**
     * Update theme
     */
    updateTheme(theme) {
      state.theme = theme;
      actions.updateLastModified();
    },

    /**
     * Set auto layout
     */
    setAutoLayout(enabled) {
      state.autoLayout = enabled;
      actions.updateLastModified();
    },

    /**
     * Get current layout
     */
    getLayout() {
      try {
        const savedData = localStorage.getItem('dashboardLayout');
        return savedData ? JSON.parse(savedData) : null;
      } catch (error) {
        console.error('Error loading layout:', error);
        return null;
      }
    },

    /**
     * Save layout to localStorage
     */
    saveLayout(layout) {
      try {
        const layoutData = {
          widgets: Array.from(state.widgets.entries()),
          gridLayout: state.gridLayout,
          autoLayout: state.autoLayout,
          savedAt: new Date().toISOString()
        };
        
        localStorage.setItem('dashboardLayout', JSON.stringify(layoutData));
        return true;
      } catch (error) {
        actions.addError('Failed to save layout', error);
        return false;
      }
    },

    /**
     * Export layout
     */
    exportLayout(layout) {
      try {
        localStorage.setItem('dashboardExport', JSON.stringify(layout));
        return true;
      } catch (error) {
        actions.addError('Failed to export layout', error);
        return false;
      }
    },

    /**
     * Import layout
     */
    importLayout(layout) {
      try {
        if (layout.widgets && Array.isArray(layout.widgets)) {
          state.widgets.clear();
          layout.widgets.forEach(([id, widget]) => {
            state.widgets.set(id, widget);
          });
        }
        
        if (layout.gridLayout) {
          state.gridLayout = layout.gridLayout;
        }
        
        if (typeof layout.autoLayout === 'boolean') {
          state.autoLayout = layout.autoLayout;
        }
        
        actions.updateLastModified();
        return true;
      } catch (error) {
        actions.addError('Failed to import layout', error);
        return false;
      }
    },

    /**
     * Save dashboard to localStorage
     */
    saveDashboard() {
      try {
        const dashboardData = {
          dashboardId: state.dashboardId,
          dashboardName: state.dashboardName,
          version: state.version,
          layout: state.layout,
          widgets: Array.from(state.widgets.entries()),
          gridLayout: state.gridLayout,
          theme: state.theme,
          lastModified: state.lastModified,
          savedAt: new Date().toISOString()
        };
        
        localStorage.setItem(`dashboard_${state.dashboardId}`, JSON.stringify(dashboardData));
        localStorage.setItem('dashboardLastSaved', dashboardData.savedAt);
        localStorage.setItem('lastDashboardId', state.dashboardId);
        
        return true;
      } catch (error) {
        actions.addError('Failed to save dashboard', error);
        return false;
      }
    },

    /**
     * Load dashboard from localStorage
     */
    async loadDashboard(dashboardId) {
      try {
        const savedData = localStorage.getItem(`dashboard_${dashboardId}`);
        if (!savedData) {
          throw new Error(`Dashboard ${dashboardId} not found`);
        }
        
        const dashboardData = JSON.parse(savedData);
        
        // Restore state
        state.dashboardId = dashboardData.dashboardId;
        state.dashboardName = dashboardData.dashboardName;
        state.version = dashboardData.version || '1.0.0';
        state.layout = { ...DEFAULT_LAYOUT_CONFIG, ...dashboardData.layout };
        state.gridLayout = dashboardData.gridLayout || [];
        state.theme = dashboardData.theme || 'dark';
        state.lastModified = dashboardData.lastModified;
        
        // Restore widgets
        state.widgets.clear();
        if (dashboardData.widgets) {
          dashboardData.widgets.forEach(([id, widget]) => {
            state.widgets.set(id, widget);
          });
        }
        
        return true;
      } catch (error) {
        actions.addError('Failed to load dashboard', error);
        return false;
      }
    },

    /**
     * Export dashboard configuration
     */
    exportDashboard() {
      const dashboardData = {
        dashboardId: state.dashboardId,
        dashboardName: state.dashboardName,
        version: state.version,
        layout: state.layout,
        widgets: Array.from(state.widgets.entries()),
        gridLayout: state.gridLayout,
        theme: state.theme,
        exportedAt: new Date().toISOString()
      };
      
      return JSON.stringify(dashboardData, null, 2);
    },

    /**
     * Import dashboard configuration
     */
    async importDashboard(dashboardJson) {
      try {
        const dashboardData = JSON.parse(dashboardJson);
        
        // Validate structure
        if (!dashboardData.dashboardId || !dashboardData.widgets) {
          throw new Error('Invalid dashboard format');
        }
        
        // Load the dashboard
        state.dashboardId = dashboardData.dashboardId;
        state.dashboardName = dashboardData.dashboardName || 'Imported Dashboard';
        state.version = dashboardData.version || '1.0.0';
        state.layout = { ...DEFAULT_LAYOUT_CONFIG, ...dashboardData.layout };
        state.gridLayout = dashboardData.gridLayout || [];
        state.theme = dashboardData.theme || 'dark';
        
        // Load widgets
        state.widgets.clear();
        dashboardData.widgets.forEach(([id, widget]) => {
          state.widgets.set(id, widget);
        });
        
        actions.updateLastModified();
        
        return true;
      } catch (error) {
        actions.addError('Failed to import dashboard', error);
        return false;
      }
    },

    /**
     * Setup auto-save functionality
     */
    setupAutoSave() {
      if (actions._autoSaveInterval) {
        clearInterval(actions._autoSaveInterval);
      }
      
      actions._autoSaveInterval = setInterval(() => {
        if (computedState.hasUnsavedChanges.value) {
          actions.saveDashboard();
        }
      }, state.autoSaveInterval);
    },

    /**
     * Clear auto-save
     */
    clearAutoSave() {
      if (actions._autoSaveInterval) {
        clearInterval(actions._autoSaveInterval);
        actions._autoSaveInterval = null;
      }
    },

    /**
     * Update last modified timestamp
     */
    updateLastModified() {
      state.lastModified = new Date().toISOString();
    },

    /**
     * Add error message
     */
    addError(message, error = null) {
      const errorObj = {
        id: Date.now(),
        message,
        details: error?.message || null,
        timestamp: new Date().toISOString(),
        type: 'error'
      };
      
      state.errors.push(errorObj);
      console.error(message, error);
    },

    /**
     * Add warning message
     */
    addWarning(message) {
      const warningObj = {
        id: Date.now(),
        message,
        timestamp: new Date().toISOString(),
        type: 'warning'
      };
      
      state.warnings.push(warningObj);
      console.warn(message);
    },

    /**
     * Clear errors and warnings
     */
    clearMessages() {
      state.errors = [];
      state.warnings = [];
    },

    /**
     * Reset dashboard to initial state
     */
    resetDashboard() {
      actions.clearAutoSave();
      actions.createNewDashboard();
      actions.clearMessages();
    }
  };

  // Watchers for reactive behavior
  watch(
    () => state.widgets.size,
    (newSize, oldSize) => {
      if (newSize === 0 && oldSize > 0) {
        state.selectedWidgetId = null;
      }
    }
  );

  // Watch for layout changes and auto-save if enabled
  watch(
    () => [state.gridLayout, state.widgets],
    () => {
      if (state.autoSave) {
        nextTick(() => {
          actions.saveDashboard();
        });
      }
    },
    { deep: true }
  );

  return {
    state,
    ...computedState,
    ...actions
  };
}

// Create and export the dashboard store instance
export const dashboardStore = createDashboardStore();

// Create the composable function that your Vue component expects
export function useDashboardStore() {
  return dashboardStore;
}

// Export store creation function for testing or multiple instances
export { createDashboardStore };

// Export default configurations for external use
export { 
  DEFAULT_WIDGET_CONFIG, 
  DEFAULT_DATASET_CONFIG, 
  DEFAULT_LAYOUT_CONFIG 
};