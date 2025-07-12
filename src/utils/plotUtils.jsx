import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Default line colors for multiple datasets
export const DEFAULT_LINE_COLORS = [
  '#2196F3', // Blue
  '#F44336', // Red
  '#4CAF50', // Green
  '#FF9800', // Orange
  '#9C27B0', // Purple
  '#00BCD4', // Cyan
  '#FFEB3B', // Yellow
  '#795548', // Brown
  '#607D8B', // Blue Grey
  '#E91E63', // Pink
  '#3F51B5', // Indigo
  '#009688'  // Teal
];

// Get line color by index, cycling through the default colors
export const getLineColor = (index) => {
  return DEFAULT_LINE_COLORS[index % DEFAULT_LINE_COLORS.length];
};

// Utility functions
export const generateId = (prefix = 'id') => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const createDefaultConfig = () => ({
  backgroundColor: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
  gridColor: { r: 0.3, g: 0.3, b: 0.3, a: 1.0 },
  lineColor: { r: 0.2, g: 0.6, b: 1.0, a: 1.0 },
  showGrid: true,
  showAxis: true,
  lineWidth: 2.0,
  logScale: false,
  title: '',
  xLabel: 'X',
  yLabel: 'Y'
});

const generateSampleData = (type = 'sine', points = 1000) => {
  const data = [];
  for (let i = 0; i < points; i++) {
    const x = (i / points) * 4 * Math.PI;
    let y;
    
    switch (type) {
      case 'sine':
        y = Math.sin(x);
        break;
      case 'cosine':
        y = Math.cos(x);
        break;
      case 'tangent':
        y = Math.tan(x * 0.1);
        break;
      case 'exponential':
        y = Math.exp(x * 0.1);
        break;
      case 'logarithmic':
        y = Math.log(x + 1);
        break;
      case 'random':
        y = Math.random() * 2 - 1;
        break;
      default:
        y = Math.sin(x);
    }
    
    data.push({ x, y });
  }
  return data;
};

// WebGL Plot Component
const WebGLPlot = ({ data, config, width, height, title }) => {
  const canvasRef = useRef(null);
  const plotRef = useRef(null);
  const animationFrameRef = useRef(null);

  const initializePlot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    
    // Simple WebGL rendering
    plotRef.current = {
      gl,
      canvas,
      data: data || [],
      config: config || createDefaultConfig()
    };

    renderPlot();
  }, [data, config, width, height]);

  const renderPlot = useCallback(() => {
    const plot = plotRef.current;
    if (!plot || !plot.gl) return;

    const { gl } = plot;
    const bgColor = plot.config.backgroundColor;
    
    gl.clearColor(bgColor.r, bgColor.g, bgColor.b, bgColor.a);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Simple line rendering (placeholder for actual WebGL plot implementation)
    if (plot.data && plot.data.length > 0) {
      // This would contain the actual WebGL line rendering code
      // For now, we'll use a simple 2D canvas overlay for demonstration
      renderSimplePlot();
    }
  }, []);

  const renderSimplePlot = () => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;

    // Create a 2D overlay for demonstration
    const overlay = document.getElementById(`overlay-${canvas.id}`);
    let ctx;
    
    if (!overlay) {
      const overlayCanvas = document.createElement('canvas');
      overlayCanvas.id = `overlay-${canvas.id}`;
      overlayCanvas.width = canvas.width;
      overlayCanvas.height = canvas.height;
      overlayCanvas.style.position = 'absolute';
      overlayCanvas.style.top = '0';
      overlayCanvas.style.left = '0';
      overlayCanvas.style.width = canvas.style.width;
      overlayCanvas.style.height = canvas.style.height;
      overlayCanvas.style.pointerEvents = 'none';
      canvas.parentNode.style.position = 'relative';
      canvas.parentNode.appendChild(overlayCanvas);
      ctx = overlayCanvas.getContext('2d');
    } else {
      ctx = overlay.getContext('2d');
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (data.length === 0) return;

    // Find data bounds
    const xMin = Math.min(...data.map(d => d.x));
    const xMax = Math.max(...data.map(d => d.x));
    const yMin = Math.min(...data.map(d => d.y));
    const yMax = Math.max(...data.map(d => d.y));

    const padding = 40;
    const plotWidth = canvas.width - 2 * padding;
    const plotHeight = canvas.height - 2 * padding;

    // Draw grid
    if (config.showGrid) {
      ctx.strokeStyle = `rgba(${config.gridColor.r * 255}, ${config.gridColor.g * 255}, ${config.gridColor.b * 255}, ${config.gridColor.a})`;
      ctx.lineWidth = 1;
      
      // Vertical grid lines
      for (let i = 0; i <= 10; i++) {
        const x = padding + (i / 10) * plotWidth;
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, padding + plotHeight);
        ctx.stroke();
      }
      
      // Horizontal grid lines
      for (let i = 0; i <= 10; i++) {
        const y = padding + (i / 10) * plotHeight;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(padding + plotWidth, y);
        ctx.stroke();
      }
    }

    // Draw data line
    ctx.strokeStyle = `rgba(${config.lineColor.r * 255}, ${config.lineColor.g * 255}, ${config.lineColor.b * 255}, ${config.lineColor.a})`;
    ctx.lineWidth = config.lineWidth;
    ctx.beginPath();

    data.forEach((point, index) => {
      const x = padding + ((point.x - xMin) / (xMax - xMin)) * plotWidth;
      let y = padding + plotHeight - ((point.y - yMin) / (yMax - yMin)) * plotHeight;
      
      if (config.logScale && point.y > 0) {
        const logY = Math.log10(point.y);
        const logYMin = Math.log10(Math.max(yMin, 0.001));
        const logYMax = Math.log10(yMax);
        y = padding + plotHeight - ((logY - logYMin) / (logYMax - logYMin)) * plotHeight;
      }

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
  };

  useEffect(() => {
    initializePlot();
    
    const animate = () => {
      renderPlot();
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [initializePlot, renderPlot]);

  return (
    <div className="webgl-plot-container">
      {title && <div className="plot-title">{title}</div>}
      <canvas
        ref={canvasRef}
        id={generateId('canvas')}
        style={{ 
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: '#1a1a1a'
        }}
      />
    </div>
  );
};

// Plot Widget Component
const PlotWidget = ({ widget, onConfigChange, onRemove, onDataChange }) => {
  const [showConfig, setShowConfig] = useState(false);
  const [localConfig, setLocalConfig] = useState(widget.config);

  const dataTypes = ['sine', 'cosine', 'tangent', 'exponential', 'logarithmic', 'random'];

  const handleConfigChange = (key, value) => {
    const newConfig = { ...localConfig, [key]: value };
    setLocalConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handleColorChange = (colorKey, component, value) => {
    const newColor = { ...localConfig[colorKey] };
    newColor[component] = parseFloat(value);
    handleConfigChange(colorKey, newColor);
  };

  const generateNewData = (type) => {
    const newData = generateSampleData(type);
    onDataChange(newData);
  };

  return (
    <div className="plot-widget">
      <div className="widget-header">
        <input
          type="text"
          value={widget.title}
          onChange={(e) => handleConfigChange('title', e.target.value)}
          className="widget-title-input"
          placeholder="Widget Title"
        />
        <div className="widget-controls">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="config-btn"
            title="Toggle Configuration"
          >
            ⚙️
          </button>
          <button
            onClick={() => onRemove(widget.id)}
            className="remove-btn"
            title="Remove Widget"
          >
            ✕
          </button>
        </div>
      </div>

      {showConfig && (
        <div className="config-panel">
          <div className="config-section">
            <h4>Data</h4>
            <select
              onChange={(e) => generateNewData(e.target.value)}
              className="data-select"
            >
              <option value="">Select Data Type</option>
              {dataTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="config-section">
            <h4>Display</h4>
            <label>
              <input
                type="checkbox"
                checked={localConfig.showGrid}
                onChange={(e) => handleConfigChange('showGrid', e.target.checked)}
              />
              Show Grid
            </label>
            <label>
              <input
                type="checkbox"
                checked={localConfig.logScale}
                onChange={(e) => handleConfigChange('logScale', e.target.checked)}
              />
              Log Scale
            </label>
            <label>
              Line Width:
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.1"
                value={localConfig.lineWidth}
                onChange={(e) => handleConfigChange('lineWidth', parseFloat(e.target.value))}
              />
              {localConfig.lineWidth}
            </label>
          </div>

          <div className="config-section">
            <h4>Colors</h4>
            <div className="color-controls">
              <label>Line Color:</label>
              <div className="rgb-controls">
                {['r', 'g', 'b'].map(component => (
                  <input
                    key={component}
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={localConfig.lineColor[component]}
                    onChange={(e) => handleColorChange('lineColor', component, e.target.value)}
                    className={`color-slider ${component}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="plot-container">
        <WebGLPlot
          data={widget.data}
          config={localConfig}
          width={350}
          height={250}
          title={localConfig.title}
        />
      </div>
    </div>
  );
};

// Main Dashboard Component
const WebGLDashboard = () => {
  const [widgets, setWidgets] = useState([]);
  const [isAddingWidget, setIsAddingWidget] = useState(false);
  const gridRef = useRef(null);

  const columnDefs = [
    {
      headerName: 'Widgets',
      field: 'content',
      cellRenderer: 'widgetRenderer',
      width: 400,
      height: 350,
      resizable: true,
      sortable: false,
      filter: false
    }
  ];

  const components = {
    widgetRenderer: (params) => {
      if (!params.data || !params.data.widget) return null;
      
      return React.createElement(PlotWidget, {
        widget: params.data.widget,
        onConfigChange: (config) => updateWidgetConfig(params.data.widget.id, config),
        onRemove: (id) => removeWidget(id),
        onDataChange: (data) => updateWidgetData(params.data.widget.id, data)
      });
    }
  };

  const addWidget = async () => {
    if (isAddingWidget) return;
    
    setIsAddingWidget(true);
    try {
      const widgetId = generateId('widget');
      const defaultConfig = createDefaultConfig();
      const sampleData = generateSampleData('sine');
      
      const newWidget = {
        id: widgetId,
        title: `Plot ${widgets.length + 1}`,
        config: defaultConfig,
        data: sampleData
      };
      
      setWidgets(prev => [...prev, newWidget]);
    } catch (error) {
      console.error('Error adding widget:', error);
    } finally {
      setIsAddingWidget(false);
    }
  };

  const removeWidget = (widgetId) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
  };

  const updateWidgetConfig = (widgetId, config) => {
    setWidgets(prev => prev.map(w => 
      w.id === widgetId ? { ...w, config } : w
    ));
  };

  const updateWidgetData = (widgetId, data) => {
    setWidgets(prev => prev.map(w => 
      w.id === widgetId ? { ...w, data } : w
    ));
  };

  const clearAllWidgets = () => {
    setWidgets([]);
  };

  const exportLayout = () => {
    const layout = {
      widgets: widgets,
      timestamp: Date.now()
    };
    
    const blob = new Blob([JSON.stringify(layout, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `webgl-dashboard-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importLayout = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const text = await file.text();
          const layout = JSON.parse(text);
          
          if (layout.widgets && Array.isArray(layout.widgets)) {
            setWidgets(layout.widgets);
          }
        } catch (error) {
          console.error('Error loading layout:', error);
          alert('Error loading layout file. Please check the file format.');
        }
      }
    };
    input.click();
  };

  // Convert widgets to grid data
  const rowData = widgets.map(widget => ({
    id: widget.id,
    widget: widget,
    content: widget.title
  }));

  const defaultColDef = {
    resizable: true,
    sortable: false,
    filter: false
  };

  const gridOptions = {
    rowHeight: 380,
    suppressRowClickSelection: true,
    suppressCellFocus: true,
    suppressRowHoverHighlight: true,
    animateRows: true
  };

  return (
    <div className="dashboard-container">
      {/* Dashboard Toolbar */}
      <div className="dashboard-toolbar">
        <div className="toolbar-left">
          <h1 className="dashboard-title">WebGL Dashboard</h1>
          <div className="widget-counter">
            {widgets.length} widget{widgets.length !== 1 ? 's' : ''}
          </div>
        </div>
        
        <div className="toolbar-center">
          <button 
            className="btn btn-primary"
            onClick={addWidget}
            disabled={isAddingWidget}
          >
            <span className="btn-icon">➕</span>
            Add Plot Widget
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={clearAllWidgets}
            disabled={widgets.length === 0}
          >
            <span className="btn-icon">🗑️</span>
            Clear All
          </button>
        </div>
        
        <div className="toolbar-right">
          <button 
            className="btn btn-outline"
            onClick={exportLayout}
            disabled={widgets.length === 0}
          >
            <span className="btn-icon">💾</span>
            Export
          </button>
          
          <button 
            className="btn btn-outline"
            onClick={importLayout}
          >
            <span className="btn-icon">📁</span>
            Import
          </button>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="dashboard-content">
        {widgets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-content">
              <div className="empty-state-icon">📊</div>
              <h2>No Plot Widgets</h2>
              <p>Add your first plot widget to get started with data visualization</p>
              <button 
                className="btn btn-primary btn-lg"
                onClick={addWidget}
              >
                <span className="btn-icon">➕</span>
                Add Your First Widget
              </button>
            </div>
          </div>
        ) : (
          <div className="ag-theme-alpine" style={{ height: '100%', width: '100%' }}>
            <AgGridReact
              ref={gridRef}
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              components={components}
              gridOptions={gridOptions}
              domLayout="autoHeight"
            />
          </div>
        )}
      </div>

      <style jsx>{`
        .dashboard-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #f5f7fa;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
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

        .toolbar-left, .toolbar-center, .toolbar-right {
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

        .btn-secondary:hover:not(:disabled) {
          background: #e2e8f0;
        }

        .btn-outline {
          background: transparent;
          color: #4a5568;
          border: 1px solid #e2e8f0;
        }

        .btn-outline:hover:not(:disabled) {
          background: #f7fafc;
          border-color: #cbd5e0;
        }

        .btn-lg {
          padding: 12px 24px;
          font-size: 16px;
        }

        .btn-icon {
          font-size: 14px;
        }

        .dashboard-content {
          flex: 1;
          overflow: hidden;
          position: relative;
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

        .plot-widget {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          margin: 10px;
          overflow: hidden;
        }

        .widget-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
        }

        .widget-title-input {
          border: none;
          background: transparent;
          font-size: 16px;
          font-weight: 600;
          color: #2d3748;
          flex: 1;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .widget-title-input:focus {
          background: white;
          outline: 2px solid #4299e1;
        }

        .widget-controls {
          display: flex;
          gap: 8px;
        }

        .config-btn, .remove-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .config-btn:hover {
          background: #e2e8f0;
        }

        .remove-btn:hover {
          background: #fed7d7;
          color: #e53e3e;
        }

        .config-panel {
          padding: 16px;
          background: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
        }

        .config-section {
          margin-bottom: 16px;
        }

        .config-section h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
          color: #2d3748;
        }

        .config-section label {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 14px;
          color: #4a5568;
        }

        .data-select {
          width: 100%;
          padding: 8px;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          background: white;
        }

        .color-controls {
          margin-top: 8px;
        }

        .rgb-controls {
          display: flex;
          gap: 8px;
          margin-top: 4px;
        }

        .color-slider {
          flex: 1;
          height: 20px;
        }

        .color-slider.r::-webkit-slider-thumb {
          background: #ef4444;
        }

        .color-slider.g::-webkit-slider-thumb {
          background: #10b981;
        }

        .color-slider.b::-webkit-slider-thumb {
          background: #3b82f6;
        }

        .plot-container {
          padding: 16px;
        }

        .webgl-plot-container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .plot-title {
          font-size: 16px;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 8px;
          text-align: center;
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
        }
      `}</style>
    </div>
  );
};

export default WebGLDashboard;