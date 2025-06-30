<template>
  <div class="plot-configuration">
    <div class="config-header">
      <h3>Plot Configuration</h3>
      <button @click="$emit('close')" class="close-btn">
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <div class="config-content">
      <!-- Title Configuration -->
      <div class="config-section">
        <h4>Title & Labels</h4>
        <div class="form-group">
          <label for="plot-title">Plot Title</label>
          <input
            id="plot-title"
            v-model="localConfig.title"
            type="text"
            placeholder="Enter plot title"
            @input="updateConfig"
          />
        </div>
        <div class="form-group">
          <label for="x-axis-label">X-Axis Label</label>
          <input
            id="x-axis-label"
            v-model="localConfig.xAxisLabel"
            type="text"
            placeholder="X-axis label"
            @input="updateConfig"
          />
        </div>
        <div class="form-group">
          <label for="y-axis-label">Y-Axis Label</label>
          <input
            id="y-axis-label"
            v-model="localConfig.yAxisLabel"
            type="text"
            placeholder="Y-axis label"
            @input="updateConfig"
          />
        </div>
      </div>

      <!-- Axis Configuration -->
      <div class="config-section">
        <h4>Axis Settings</h4>
        <div class="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              v-model="localConfig.semiLogY"
              @change="updateConfig"
            />
            Semi-logarithmic Y-axis
          </label>
        </div>
        <div class="form-group">
          <label for="x-min">X-axis Range</label>
          <div class="range-inputs">
            <input
              id="x-min"
              v-model.number="localConfig.xMin"
              type="number"
              placeholder="Min"
              @input="updateConfig"
            />
            <span>to</span>
            <input
              v-model.number="localConfig.xMax"
              type="number"
              placeholder="Max"
              @input="updateConfig"
            />
          </div>
        </div>
        <div class="form-group">
          <label for="y-min">Y-axis Range</label>
          <div class="range-inputs">
            <input
              id="y-min"
              v-model.number="localConfig.yMin"
              type="number"
              placeholder="Min"
              @input="updateConfig"
            />
            <span>to</span>
            <input
              v-model.number="localConfig.yMax"
              type="number"
              placeholder="Max"
              @input="updateConfig"
            />
          </div>
        </div>
        <div class="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              v-model="localConfig.autoScale"
              @change="updateConfig"
            />
            Auto-scale axes
          </label>
        </div>
      </div>

      <!-- Data Sources -->
      <div class="config-section">
        <h4>Data Sources</h4>
        <div class="data-sources-list">
          <div
            v-for="(source, index) in localConfig.dataSources"
            :key="source.id"
            class="data-source-item"
          >
            <div class="source-header">
              <span class="source-name">{{ source.name || `Dataset ${index + 1}` }}</span>
              <button @click="removeDataSource(index)" class="remove-btn">
                <svg width="14" height="14" viewBox="0 0 14 14">
                  <path d="M10.5 3.5L3.5 10.5M3.5 3.5l7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
            
            <!-- Data Source Configuration -->
            <div class="source-config">
              <div class="form-group">
                <label>Data Source</label>
                <select v-model="source.type" @change="updateConfig">
                  <option value="sample">Sample Data</option>
                  <option value="file">File Upload</option>
                  <option value="realtime">Real-time</option>
                </select>
              </div>

              <div v-if="source.type === 'sample'" class="form-group">
                <label>Sample Dataset</label>
                <select v-model="source.sampleType" @change="updateConfig">
                  <option value="sine">Sine Wave</option>
                  <option value="cosine">Cosine Wave</option>
                  <option value="random">Random Data</option>
                  <option value="linear">Linear Trend</option>
                  <option value="exponential">Exponential Growth</option>
                </select>
              </div>

              <div v-if="source.type === 'file'" class="form-group">
                <label>File</label>
                <input
                  type="file"
                  accept=".csv,.json,.txt"
                  @change="handleFileUpload($event, index)"
                />
              </div>

              <div v-if="source.type === 'realtime'" class="form-group">
                <label>Update Interval (ms)</label>
                <input
                  v-model.number="source.updateInterval"
                  type="number"
                  min="50"
                  max="5000"
                  @input="updateConfig"
                />
              </div>

              <!-- Visual Configuration -->
              <div class="visual-config">
                <div class="form-group">
                  <label>Plot Type</label>
                  <select v-model="source.plotType" @change="updateConfig">
                    <option value="line">Line Plot</option>
                    <option value="scatter">Scatter Plot</option>
                    <option value="both">Line + Markers</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Color</label>
                  <div class="color-input">
                    <input
                      type="color"
                      v-model="source.color"
                      @input="updateConfig"
                    />
                    <input
                      type="text"
                      v-model="source.color"
                      @input="updateConfig"
                      class="color-text"
                    />
                  </div>
                </div>

                <div class="form-group">
                  <label>Line Width</label>
                  <input
                    v-model.number="source.lineWidth"
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    @input="updateConfig"
                  />
                  <span class="range-value">{{ source.lineWidth }}px</span>
                </div>

                <div v-if="source.plotType !== 'line'" class="form-group">
                  <label>Marker Size</label>
                  <input
                    v-model.number="source.markerSize"
                    type="range"
                    min="2"
                    max="20"
                    @input="updateConfig"
                  />
                  <span class="range-value">{{ source.markerSize }}px</span>
                </div>

                <!-- Scale Factors -->
                <div class="form-group">
                  <label>Scale Factor X</label>
                  <input
                    v-model.number="source.scaleX"
                    type="number"
                    step="0.1"
                    @input="updateConfig"
                  />
                </div>

                <div class="form-group">
                  <label>Scale Factor Y</label>
                  <input
                    v-model.number="source.scaleY"
                    type="number"
                    step="0.1"
                    @input="updateConfig"
                  />
                </div>

                <div class="form-group">
                  <label>Offset X</label>
                  <input
                    v-model.number="source.offsetX"
                    type="number"
                    step="0.1"
                    @input="updateConfig"
                  />
                </div>

                <div class="form-group">
                  <label>Offset Y</label>
                  <input
                    v-model.number="source.offsetY"
                    type="number"
                    step="0.1"
                    @input="updateConfig"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <button @click="addDataSource" class="add-btn">
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Add Data Source
        </button>
      </div>

      <!-- Legend Configuration -->
      <div class="config-section">
        <h4>Legend</h4>
        <div class="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              v-model="localConfig.legend.show"
              @change="updateConfig"
            />
            Show Legend
          </label>
        </div>

        <div v-if="localConfig.legend.show" class="legend-config">
          <div class="form-group">
            <label>Position</label>
            <select v-model="localConfig.legend.position" @change="updateConfig">
              <option value="top-right">Top Right</option>
              <option value="top-left">Top Left</option>
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
            </select>
          </div>

          <div class="form-group">
            <label>Background</label>
            <select v-model="localConfig.legend.background" @change="updateConfig">
              <option value="transparent">Transparent</option>
              <option value="white">White</option>
              <option value="black">Black</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div v-if="localConfig.legend.background === 'custom'" class="form-group">
            <label>Background Color</label>
            <input
              type="color"
              v-model="localConfig.legend.backgroundColor"
              @input="updateConfig"
            />
          </div>
        </div>
      </div>

      <!-- Grid Configuration -->
      <div class="config-section">
        <h4>Grid & Appearance</h4>
        <div class="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              v-model="localConfig.showGrid"
              @change="updateConfig"
            />
            Show Grid
          </label>
        </div>

        <div class="form-group">
          <label>Background Color</label>
          <div class="color-input">
            <input
              type="color"
              v-model="localConfig.backgroundColor"
              @input="updateConfig"
            />
            <input
              type="text"
              v-model="localConfig.backgroundColor"
              @input="updateConfig"
              class="color-text"
            />
          </div>
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              v-model="localConfig.antialias"
              @change="updateConfig"
            />
            Anti-aliasing
          </label>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="config-actions">
      <button @click="resetToDefaults" class="reset-btn">Reset to Defaults</button>
      <button @click="$emit('apply', localConfig)" class="apply-btn">Apply Changes</button>
    </div>
  </div>
</template>

<script>
import { ref, watch, onMounted } from 'vue'

export default {
  name: 'PlotConfiguration',
  emits: ['close', 'apply', 'update'],
  props: {
    config: {
      type: Object,
      required: true
    }
  },
  setup(props, { emit }) {
    const localConfig = ref({})

    // Default configuration
    const defaultConfig = {
      title: '',
      xAxisLabel: '',
      yAxisLabel: '',
      semiLogY: false,
      xMin: null,
      xMax: null,
      yMin: null,
      yMax: null,
      autoScale: true,
      showGrid: true,
      backgroundColor: '#ffffff',
      antialias: true,
      legend: {
        show: true,
        position: 'top-right',
        background: 'transparent',
        backgroundColor: '#ffffff'
      },
      dataSources: []
    }

    // Initialize local config
    const initializeConfig = () => {
      localConfig.value = JSON.parse(JSON.stringify({
        ...defaultConfig,
        ...props.config
      }))
    }

    // Update configuration
    const updateConfig = () => {
      emit('update', localConfig.value)
    }

    // Add new data source
    const addDataSource = () => {
      const newSource = {
        id: Date.now().toString(),
        name: `Dataset ${localConfig.value.dataSources.length + 1}`,
        type: 'sample',
        sampleType: 'sine',
        plotType: 'line',
        color: getRandomColor(),
        lineWidth: 2,
        markerSize: 6,
        scaleX: 1,
        scaleY: 1,
        offsetX: 0,
        offsetY: 0,
        updateInterval: 100,
        visible: true
      }
      localConfig.value.dataSources.push(newSource)
      updateConfig()
    }

    // Remove data source
    const removeDataSource = (index) => {
      localConfig.value.dataSources.splice(index, 1)
      updateConfig()
    }

    // Handle file upload
    const handleFileUpload = (event, index) => {
      const file = event.target.files[0]
      if (file) {
        localConfig.value.dataSources[index].fileName = file.name
        localConfig.value.dataSources[index].file = file
        updateConfig()
      }
    }

    // Reset to defaults
    const resetToDefaults = () => {
      localConfig.value = JSON.parse(JSON.stringify(defaultConfig))
      updateConfig()
    }

    // Generate random color
    const getRandomColor = () => {
      const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
      ]
      return colors[Math.floor(Math.random() * colors.length)]
    }

    // Watch for config changes
    watch(
      () => props.config,
      (newConfig) => {
        if (newConfig) {
          initializeConfig()
        }
      },
      { deep: true, immediate: true }
    )

    onMounted(() => {
      initializeConfig()
    })

    return {
      localConfig,
      updateConfig,
      addDataSource,
      removeDataSource,
      handleFileUpload,
      resetToDefaults
    }
  }
}
</script>

<style scoped>
.plot-configuration {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  max-height: 80vh;
  width: 400px;
  position: relative;
}

.config-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
  border-radius: 8px 8px 0 0;
}

.config-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: #666;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e9ecef;
  color: #333;
}

.config-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px;
}

.config-section {
  margin: 20px 0;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.config-section:last-child {
  border-bottom: none;
}

.config-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #555;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.checkbox-group label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.checkbox-group input[type="checkbox"] {
  width: auto;
  margin-right: 8px;
}

.range-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.range-inputs input {
  flex: 1;
}

.range-inputs span {
  font-size: 14px;
  color: #666;
}

.color-input {
  display: flex;
  gap: 8px;
}

.color-input input[type="color"] {
  width: 50px;
  height: 36px;
  padding: 2px;
  border-radius: 4px;
  cursor: pointer;
}

.color-text {
  flex: 1;
}

.range-value {
  font-size: 12px;
  color: #666;
  min-width: 40px;
  text-align: right;
}

.data-sources-list {
  margin-bottom: 16px;
}

.data-source-item {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  margin-bottom: 12px;
  padding: 12px;
  background: #f8f9fa;
}

.source-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.source-name {
  font-weight: 600;
  color: #333;
}

.remove-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: #dc3545;
  transition: all 0.2s;
}

.remove-btn:hover {
  background: #f5c6cb;
}

.source-config {
  display: grid;
  gap: 12px;
}

.visual-config {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 12px;
}

.visual-config .form-group {
  margin-bottom: 0;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 10px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.add-btn:hover {
  background: #0056b3;
}

.legend-config {
  margin-top: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 4px;
}

.config-actions {
  padding: 16px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 12px;
  background: #f8f9fa;
  border-radius: 0 0 8px 8px;
}

.reset-btn,
.apply-btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.reset-btn {
  background: #6c757d;
  color: white;
}

.reset-btn:hover {
  background: #545b62;
}

.apply-btn {
  background: #28a745;
  color: white;
}

.apply-btn:hover {
  background: #1e7e34;
}

/* Scrollbar styling */
.config-content::-webkit-scrollbar {
  width: 6px;
}

.config-content::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.config-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.config-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>