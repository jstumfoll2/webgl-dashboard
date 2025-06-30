<template>
  <div class="legend-editor">
    <div class="legend-editor-header">
      <h3>Legend Configuration</h3>
      <button 
        class="toggle-btn"
        @click="toggleLegend"
        :class="{ active: localConfig.enabled }"
      >
        {{ localConfig.enabled ? 'Enabled' : 'Disabled' }}
      </button>
    </div>

    <div v-if="localConfig.enabled" class="legend-editor-content">
      <!-- Position Settings -->
      <div class="config-section">
        <h4>Position</h4>
        <div class="position-grid">
          <button
            v-for="position in positionOptions"
            :key="position.value"
            class="position-btn"
            :class="{ active: localConfig.position === position.value }"
            @click="updatePosition(position.value)"
            :title="position.label"
          >
            <span class="position-icon" :data-position="position.value"></span>
          </button>
        </div>
      </div>

      <!-- Appearance Settings -->
      <div class="config-section">
        <h4>Appearance</h4>
        
        <div class="form-group">
          <label for="legend-background">Background Color:</label>
          <div class="color-input-group">
            <input
              id="legend-background"
              type="color"
              v-model="localConfig.backgroundColor"
              @input="updateConfig"
            />
            <input
              type="text"
              v-model="localConfig.backgroundColor"
              @input="updateConfig"
              class="color-text"
              placeholder="#FFFFFF"
            />
            <button 
              class="transparent-btn"
              @click="setTransparentBackground"
              :class="{ active: localConfig.backgroundColor === 'transparent' }"
            >
              Transparent
            </button>
          </div>
        </div>

        <div class="form-group">
          <label for="legend-text-color">Text Color:</label>
          <div class="color-input-group">
            <input
              id="legend-text-color"
              type="color"
              v-model="localConfig.textColor"
              @input="updateConfig"
            />
            <input
              type="text"
              v-model="localConfig.textColor"
              @input="updateConfig"
              class="color-text"
              placeholder="#000000"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="legend-border">Border:</label>
          <div class="border-controls">
            <input
              type="checkbox"
              id="border-enabled"
              v-model="localConfig.border.enabled"
              @change="updateConfig"
            />
            <label for="border-enabled">Show Border</label>
            <div v-if="localConfig.border.enabled" class="border-options">
              <input
                type="color"
                v-model="localConfig.border.color"
                @input="updateConfig"
              />
              <input
                type="range"
                min="1"
                max="5"
                v-model="localConfig.border.width"
                @input="updateConfig"
                class="border-width-slider"
              />
              <span class="border-width-label">{{ localConfig.border.width }}px</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Layout Settings -->
      <div class="config-section">
        <h4>Layout</h4>
        
        <div class="form-group">
          <label for="legend-orientation">Orientation:</label>
          <select 
            id="legend-orientation"
            v-model="localConfig.orientation"
            @change="updateConfig"
          >
            <option value="vertical">Vertical</option>
            <option value="horizontal">Horizontal</option>
          </select>
        </div>

        <div class="form-group">
          <label for="legend-padding">Padding:</label>
          <input
            id="legend-padding"
            type="range"
            min="5"
            max="20"
            v-model="localConfig.padding"
            @input="updateConfig"
          />
          <span class="value-label">{{ localConfig.padding }}px</span>
        </div>

        <div class="form-group">
          <label for="legend-margin">Margin:</label>
          <input
            id="legend-margin"
            type="range"
            min="5"
            max="30"
            v-model="localConfig.margin"
            @input="updateConfig"
          />
          <span class="value-label">{{ localConfig.margin }}px</span>
        </div>

        <div class="form-group">
          <label for="legend-opacity">Opacity:</label>
          <input
            id="legend-opacity"
            type="range"
            min="0"
            max="1"
            step="0.1"
            v-model="localConfig.opacity"
            @input="updateConfig"
          />
          <span class="value-label">{{ Math.round(localConfig.opacity * 100) }}%</span>
        </div>
      </div>

      <!-- Font Settings -->
      <div class="config-section">
        <h4>Font</h4>
        
        <div class="form-group">
          <label for="legend-font-size">Font Size:</label>
          <input
            id="legend-font-size"
            type="range"
            min="10"
            max="18"
            v-model="localConfig.fontSize"
            @input="updateConfig"
          />
          <span class="value-label">{{ localConfig.fontSize }}px</span>
        </div>

        <div class="form-group">
          <label for="legend-font-family">Font Family:</label>
          <select 
            id="legend-font-family"
            v-model="localConfig.fontFamily"
            @change="updateConfig"
          >
            <option value="Arial, sans-serif">Arial</option>
            <option value="'Times New Roman', serif">Times New Roman</option>
            <option value="'Courier New', monospace">Courier New</option>
            <option value="Helvetica, sans-serif">Helvetica</option>
            <option value="Georgia, serif">Georgia</option>
          </select>
        </div>

        <div class="form-group">
          <label>Font Style:</label>
          <div class="font-style-controls">
            <button
              class="style-btn"
              :class="{ active: localConfig.fontWeight === 'bold' }"
              @click="toggleFontWeight"
            >
              <strong>B</strong>
            </button>
            <button
              class="style-btn"
              :class="{ active: localConfig.fontStyle === 'italic' }"
              @click="toggleFontStyle"
            >
              <em>I</em>
            </button>
          </div>
        </div>
      </div>

      <!-- Legend Items Settings -->
      <div class="config-section">
        <h4>Legend Items</h4>
        
        <div class="form-group">
          <label for="legend-item-spacing">Item Spacing:</label>
          <input
            id="legend-item-spacing"
            type="range"
            min="5"
            max="20"
            v-model="localConfig.itemSpacing"
            @input="updateConfig"
          />
          <span class="value-label">{{ localConfig.itemSpacing }}px</span>
        </div>

        <div class="form-group">
          <label for="legend-symbol-width">Symbol Width:</label>
          <input
            id="legend-symbol-width"
            type="range"
            min="15"
            max="40"
            v-model="localConfig.symbolWidth"
            @input="updateConfig"
          />
          <span class="value-label">{{ localConfig.symbolWidth }}px</span>
        </div>

        <div class="form-group">
          <label for="legend-symbol-height">Symbol Height:</label>
          <input
            id="legend-symbol-height"
            type="range"
            min="2"
            max="8"
            v-model="localConfig.symbolHeight"
            @input="updateConfig"
          />
          <span class="value-label">{{ localConfig.symbolHeight }}px</span>
        </div>

        <div class="form-group">
          <label>Show Symbols:</label>
          <div class="checkbox-group">
            <input
              type="checkbox"
              id="show-lines"
              v-model="localConfig.showLines"
              @change="updateConfig"
            />
            <label for="show-lines">Lines</label>
            <input
              type="checkbox"
              id="show-markers"
              v-model="localConfig.showMarkers"
              @change="updateConfig"
            />
            <label for="show-markers">Markers</label>
          </div>
        </div>
      </div>

      <!-- Preview Section -->
      <div class="config-section">
        <h4>Preview</h4>
        <div class="legend-preview" :style="previewStyle">
          <div 
            v-for="(dataset, index) in sampleDatasets"
            :key="index"
            class="legend-item"
            :style="legendItemStyle"
          >
            <div class="legend-symbol">
              <div 
                v-if="localConfig.showLines"
                class="legend-line"
                :style="{ 
                  backgroundColor: dataset.color,
                  width: localConfig.symbolWidth + 'px',
                  height: localConfig.symbolHeight + 'px'
                }"
              ></div>
              <div 
                v-if="localConfig.showMarkers"
                class="legend-marker"
                :style="{ 
                  backgroundColor: dataset.color,
                  marginLeft: localConfig.showLines ? '5px' : '0'
                }"
              ></div>
            </div>
            <span class="legend-text">{{ dataset.name }}</span>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="legend-editor-actions">
        <button class="reset-btn" @click="resetToDefaults">
          Reset to Defaults
        </button>
        <button class="apply-btn" @click="applyConfig">
          Apply Changes
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'

export default {
  name: 'LegendEditor',
  props: {
    config: {
      type: Object,
      default: () => ({
        enabled: true,
        position: 'top-right',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        border: {
          enabled: true,
          color: '#cccccc',
          width: 1
        },
        orientation: 'vertical',
        padding: 10,
        margin: 15,
        opacity: 0.9,
        fontSize: 12,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'normal',
        fontStyle: 'normal',
        itemSpacing: 8,
        symbolWidth: 20,
        symbolHeight: 3,
        showLines: true,
        showMarkers: false
      })
    },
    datasets: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:config', 'apply'],
  setup(props, { emit }) {
    const localConfig = ref({ ...props.config })
    
    const positionOptions = [
      { value: 'top-left', label: 'Top Left' },
      { value: 'top-center', label: 'Top Center' },
      { value: 'top-right', label: 'Top Right' },
      { value: 'center-left', label: 'Center Left' },
      { value: 'center-right', label: 'Center Right' },
      { value: 'bottom-left', label: 'Bottom Left' },
      { value: 'bottom-center', label: 'Bottom Center' },
      { value: 'bottom-right', label: 'Bottom Right' }
    ]

    const sampleDatasets = ref([
      { name: 'Dataset 1', color: '#ff6b6b' },
      { name: 'Dataset 2', color: '#4ecdc4' },
      { name: 'Dataset 3', color: '#45b7d1' }
    ])

    const previewStyle = computed(() => ({
      backgroundColor: localConfig.value.backgroundColor === 'transparent' 
        ? 'rgba(255, 255, 255, 0)' 
        : localConfig.value.backgroundColor,
      color: localConfig.value.textColor,
      border: localConfig.value.border.enabled 
        ? `${localConfig.value.border.width}px solid ${localConfig.value.border.color}`
        : 'none',
      padding: `${localConfig.value.padding}px`,
      opacity: localConfig.value.opacity,
      fontSize: `${localConfig.value.fontSize}px`,
      fontFamily: localConfig.value.fontFamily,
      fontWeight: localConfig.value.fontWeight,
      fontStyle: localConfig.value.fontStyle,
      flexDirection: localConfig.value.orientation === 'horizontal' ? 'row' : 'column'
    }))

    const legendItemStyle = computed(() => ({
      marginBottom: localConfig.value.orientation === 'vertical' 
        ? `${localConfig.value.itemSpacing}px` 
        : '0',
      marginRight: localConfig.value.orientation === 'horizontal' 
        ? `${localConfig.value.itemSpacing}px` 
        : '0'
    }))

    const toggleLegend = () => {
      localConfig.value.enabled = !localConfig.value.enabled
      updateConfig()
    }

    const updatePosition = (position) => {
      localConfig.value.position = position
      updateConfig()
    }

    const setTransparentBackground = () => {
      localConfig.value.backgroundColor = 'transparent'
      updateConfig()
    }

    const toggleFontWeight = () => {
      localConfig.value.fontWeight = localConfig.value.fontWeight === 'bold' ? 'normal' : 'bold'
      updateConfig()
    }

    const toggleFontStyle = () => {
      localConfig.value.fontStyle = localConfig.value.fontStyle === 'italic' ? 'normal' : 'italic'
      updateConfig()
    }

    const updateConfig = () => {
      emit('update:config', { ...localConfig.value })
    }

    const applyConfig = () => {
      emit('apply', { ...localConfig.value })
    }

    const resetToDefaults = () => {
      localConfig.value = {
        enabled: true,
        position: 'top-right',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        border: {
          enabled: true,
          color: '#cccccc',
          width: 1
        },
        orientation: 'vertical',
        padding: 10,
        margin: 15,
        opacity: 0.9,
        fontSize: 12,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'normal',
        fontStyle: 'normal',
        itemSpacing: 8,
        symbolWidth: 20,
        symbolHeight: 3,
        showLines: true,
        showMarkers: false
      }
      updateConfig()
    }

    // Watch for external config changes
    watch(() => props.config, (newConfig) => {
      localConfig.value = { ...newConfig }
    }, { deep: true })

    // Update sample datasets based on actual datasets
    watch(() => props.datasets, (newDatasets) => {
      if (newDatasets && newDatasets.length > 0) {
        sampleDatasets.value = newDatasets.map(dataset => ({
          name: dataset.name || dataset.label || 'Unnamed Dataset',
          color: dataset.color || '#666666'
        }))
      }
    }, { immediate: true })

    onMounted(() => {
      if (props.datasets && props.datasets.length > 0) {
        sampleDatasets.value = props.datasets.map(dataset => ({
          name: dataset.name || dataset.label || 'Unnamed Dataset',
          color: dataset.color || '#666666'
        }))
      }
    })

    return {
      localConfig,
      positionOptions,
      sampleDatasets,
      previewStyle,
      legendItemStyle,
      toggleLegend,
      updatePosition,
      setTransparentBackground,
      toggleFontWeight,
      toggleFontStyle,
      updateConfig,
      applyConfig,
      resetToDefaults
    }
  }
}
</script>

<style scoped>
.legend-editor {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.legend-editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.legend-editor-header h3 {
  margin: 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.toggle-btn {
  padding: 6px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
  color: #666;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.toggle-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.legend-editor-content {
  padding: 20px;
  max-height: 600px;
  overflow-y: auto;
}

.config-section {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.config-section:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.config-section h4 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 14px;
  font-weight: 600;
}

.position-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  max-width: 200px;
}

.position-btn {
  width: 60px;
  height: 40px;
  border: 2px solid #ddd;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.position-btn:hover {
  border-color: #007bff;
}

.position-btn.active {
  border-color: #007bff;
  background: #e3f2fd;
}

.position-icon {
  width: 8px;
  height: 8px;
  background: #666;
  border-radius: 50%;
  position: relative;
}

.position-icon[data-position="top-left"] { margin: 4px 20px 20px 4px; }
.position-icon[data-position="top-center"] { margin: 4px auto 20px auto; }
.position-icon[data-position="top-right"] { margin: 4px 4px 20px 20px; }
.position-icon[data-position="center-left"] { margin: auto 20px auto 4px; }
.position-icon[data-position="center-right"] { margin: auto 4px auto 20px; }
.position-icon[data-position="bottom-left"] { margin: 20px 20px 4px 4px; }
.position-icon[data-position="bottom-center"] { margin: 20px auto 4px auto; }
.position-icon[data-position="bottom-right"] { margin: 20px 4px 4px 20px; }

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  color: #555;
  font-size: 13px;
  font-weight: 500;
}

.color-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-input-group input[type="color"] {
  width: 40px;
  height: 32px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.color-text {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
}

.transparent-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  color: #666;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.2s ease;
}

.transparent-btn.active {
  background: #e9ecef;
  border-color: #adb5bd;
}

.border-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.border-options {
  display: flex;
  align-items: center;
  gap: 8px;
}

.border-width-slider {
  width: 80px;
}

.border-width-label {
  font-size: 12px;
  color: #666;
  min-width: 30px;
}

input[type="range"] {
  flex: 1;
  max-width: 120px;
}

select {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
}

.value-label {
  margin-left: 8px;
  font-size: 12px;
  color: #666;
  min-width: 40px;
}

.font-style-controls {
  display: flex;
  gap: 8px;
}

.style-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.style-btn:hover {
  border-color: #007bff;
}

.style-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.checkbox-group {
  display: flex;
  gap: 16px;
  align-items: center;
}

.checkbox-group input[type="checkbox"] {
  margin-right: 4px;
}

.legend-preview {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 16px;
  background: #f8f9fa;
  display: flex;
  min-height: 80px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-symbol {
  display: flex;
  align-items: center;
}

.legend-line {
  border-radius: 1px;
}

.legend-marker {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-text {
  font-size: inherit;
  color: inherit;
}

.legend-editor-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
  margin-top: 20px;
}

.reset-btn, .apply-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s ease;
}

.reset-btn {
  background: #fff;
  color: #666;
}

.reset-btn:hover {
  background: #f8f9fa;
  border-color: #adb5bd;
}

.apply-btn {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.apply-btn:hover {
  background: #0056b3;
  border-color: #0056b3;
}
</style>