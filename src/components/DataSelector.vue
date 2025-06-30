<template>
  <div class="data-selector">
    <div class="data-selector-header">
      <h3>Data Source</h3>
      <button 
        class="btn-secondary btn-small"
        @click="$emit('close')"
        title="Close data selector"
      >
        ×
      </button>
    </div>

    <div class="data-source-tabs">
      <button
        v-for="tab in dataSources"
        :key="tab.id"
        :class="['tab', { active: activeTab === tab.id }]"
        @click="setActiveTab(tab.id)"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="data-source-content">
      <!-- Sample Data Tab -->
      <div v-if="activeTab === 'sample'" class="tab-content">
        <div class="sample-data-list">
          <div
            v-for="dataset in sampleDatasets"
            :key="dataset.id"
            :class="['dataset-item', { selected: selectedSampleDataset === dataset.id }]"
            @click="selectSampleDataset(dataset.id)"
          >
            <div class="dataset-header">
              <h4>{{ dataset.name }}</h4>
              <span class="dataset-type">{{ dataset.type }}</span>
            </div>
            <p class="dataset-description">{{ dataset.description }}</p>
            <div class="dataset-info">
              <span>{{ dataset.points }} points</span>
              <span>{{ dataset.series }} series</span>
            </div>
          </div>
        </div>
      </div>

      <!-- File Upload Tab -->
      <div v-if="activeTab === 'file'" class="tab-content">
        <div class="file-upload-area">
          <div
            :class="['drop-zone', { dragover: isDragOver }]"
            @dragover.prevent="handleDragOver"
            @dragleave.prevent="handleDragLeave"
            @drop.prevent="handleFileDrop"
          >
            <div class="drop-zone-content">
              <div class="upload-icon">📁</div>
              <p>Drop CSV or JSON files here</p>
              <p class="upload-subtitle">or</p>
              <input
                ref="fileInput"
                type="file"
                accept=".csv,.json"
                multiple
                @change="handleFileSelect"
                style="display: none"
              />
              <button class="btn-primary" @click="$refs.fileInput.click()">
                Choose Files
              </button>
            </div>
          </div>

          <div v-if="uploadedFiles.length > 0" class="uploaded-files">
            <h4>Uploaded Files</h4>
            <div
              v-for="file in uploadedFiles"
              :key="file.id"
              :class="['file-item', { selected: selectedUploadedFile === file.id }]"
              @click="selectUploadedFile(file.id)"
            >
              <div class="file-header">
                <span class="file-name">{{ file.name }}</span>
                <button
                  class="btn-danger btn-small"
                  @click.stop="removeFile(file.id)"
                >
                  Remove
                </button>
              </div>
              <div class="file-info">
                <span>{{ file.rows }} rows</span>
                <span>{{ file.columns }} columns</span>
                <span>{{ file.size }}</span>
              </div>
              <div v-if="file.columns > 0" class="file-columns">
                <small>Columns: {{ file.columnNames.join(', ') }}</small>
              </div>
            </div>
          </div>
        </div>

        <div class="file-format-info">
          <h4>Supported Formats</h4>
          <div class="format-examples">
            <div class="format-example">
              <strong>CSV Format:</strong>
              <pre>time,value1,value2
0,1.2,2.1
1,1.5,2.3
2,1.1,2.0</pre>
            </div>
            <div class="format-example">
              <strong>JSON Format:</strong>
              <pre>{
  "data": [
    {"x": 0, "y": 1.2},
    {"x": 1, "y": 1.5}
  ]
}</pre>
            </div>
          </div>
        </div>
      </div>

      <!-- Real-time Data Tab -->
      <div v-if="activeTab === 'realtime'" class="tab-content">
        <div class="realtime-config">
          <div class="config-section">
            <h4>Data Generation</h4>
            <div class="form-group">
              <label>Signal Type:</label>
              <select v-model="realtimeConfig.signalType" @change="updateRealtimeConfig">
                <option value="sine">Sine Wave</option>
                <option value="cosine">Cosine Wave</option>
                <option value="random">Random Walk</option>
                <option value="noise">White Noise</option>
                <option value="sawtooth">Sawtooth</option>
                <option value="square">Square Wave</option>
              </select>
            </div>

            <div class="form-group">
              <label>Update Rate (Hz):</label>
              <input
                type="number"
                v-model.number="realtimeConfig.updateRate"
                min="1"
                max="60"
                @change="updateRealtimeConfig"
              />
            </div>

            <div class="form-group">
              <label>Buffer Size:</label>
              <input
                type="number"
                v-model.number="realtimeConfig.bufferSize"
                min="100"
                max="10000"
                step="100"
                @change="updateRealtimeConfig"
              />
            </div>
          </div>

          <div class="config-section">
            <h4>Signal Parameters</h4>
            <div class="form-group">
              <label>Amplitude:</label>
              <input
                type="number"
                v-model.number="realtimeConfig.amplitude"
                min="0.1"
                max="10"
                step="0.1"
                @change="updateRealtimeConfig"
              />
            </div>

            <div class="form-group">
              <label>Frequency:</label>
              <input
                type="number"
                v-model.number="realtimeConfig.frequency"
                min="0.1"
                max="5"
                step="0.1"
                @change="updateRealtimeConfig"
              />
            </div>

            <div class="form-group">
              <label>Noise Level:</label>
              <input
                type="number"
                v-model.number="realtimeConfig.noiseLevel"
                min="0"
                max="1"
                step="0.01"
                @change="updateRealtimeConfig"
              />
            </div>
          </div>

          <div class="realtime-controls">
            <button
              :class="['btn-primary', { 'btn-danger': realtimeConfig.isActive }]"
              @click="toggleRealtime"
            >
              {{ realtimeConfig.isActive ? 'Stop Generation' : 'Start Generation' }}
            </button>
            <button class="btn-secondary" @click="clearRealtimeData">
              Clear Data
            </button>
          </div>

          <div v-if="realtimeConfig.isActive" class="realtime-status">
            <div class="status-indicator">
              <span class="status-dot active"></span>
              <span>Generating data at {{ realtimeConfig.updateRate }} Hz</span>
            </div>
            <div class="data-stats">
              <span>Points: {{ realtimeDataPoints }}</span>
              <span>Duration: {{ realtimeDuration }}s</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="data-selector-footer">
      <div class="selected-info">
        <span v-if="hasSelectedData">
          Selected: {{ getSelectedDataInfo() }}
        </span>
        <span v-else class="no-selection">
          No data source selected
        </span>
      </div>
      <div class="footer-actions">
        <button class="btn-secondary" @click="$emit('close')">
          Cancel
        </button>
        <button
          class="btn-primary"
          :disabled="!hasSelectedData"
          @click="applyDataSelection"
        >
          Apply
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { usePlotData } from '../composables/usePlotData'
import { parseCSV, parseJSON, formatFileSize } from '../utils/dataUtils'
import { sampleDatasets } from '../assets/sample-data/sampleData'

export default {
  name: 'DataSelector',
  emits: ['close', 'dataSelected'],
  props: {
    currentDataSource: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props, { emit }) {
    const { generateRealtimeData, clearData } = usePlotData()

    // Reactive state
    const activeTab = ref('sample')
    const isDragOver = ref(false)
    const uploadedFiles = ref([])
    const selectedSampleDataset = ref(null)
    const selectedUploadedFile = ref(null)
    const realtimeDataPoints = ref(0)
    const realtimeDuration = ref(0)
    const realtimeInterval = ref(null)
    const realtimeStartTime = ref(null)

    const realtimeConfig = reactive({
      signalType: 'sine',
      updateRate: 10,
      bufferSize: 1000,
      amplitude: 1,
      frequency: 1,
      noiseLevel: 0.1,
      isActive: false
    })

    // Data sources configuration
    const dataSources = [
      { id: 'sample', label: 'Sample Data' },
      { id: 'file', label: 'File Upload' },
      { id: 'realtime', label: 'Real-time' }
    ]

    // Computed properties
    const hasSelectedData = computed(() => {
      return selectedSampleDataset.value || 
             selectedUploadedFile.value || 
             realtimeConfig.isActive
    })

    // Methods
    const setActiveTab = (tabId) => {
      activeTab.value = tabId
    }

    const selectSampleDataset = (datasetId) => {
      selectedSampleDataset.value = datasetId
      selectedUploadedFile.value = null
      if (realtimeConfig.isActive) {
        stopRealtime()
      }
    }

    const selectUploadedFile = (fileId) => {
      selectedUploadedFile.value = fileId
      selectedSampleDataset.value = null
      if (realtimeConfig.isActive) {
        stopRealtime()
      }
    }

    const handleDragOver = (event) => {
      isDragOver.value = true
    }

    const handleDragLeave = (event) => {
      isDragOver.value = false
    }

    const handleFileDrop = async (event) => {
      isDragOver.value = false
      const files = Array.from(event.dataTransfer.files)
      await processFiles(files)
    }

    const handleFileSelect = async (event) => {
      const files = Array.from(event.target.files)
      await processFiles(files)
    }

    const processFiles = async (files) => {
      for (const file of files) {
        if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
          await processCSVFile(file)
        } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
          await processJSONFile(file)
        }
      }
    }

    const processCSVFile = async (file) => {
      try {
        const text = await file.text()
        const data = parseCSV(text)
        
        const fileData = {
          id: Date.now() + Math.random(),
          name: file.name,
          type: 'csv',
          size: formatFileSize(file.size),
          rows: data.length,
          columns: data.length > 0 ? Object.keys(data[0]).length : 0,
          columnNames: data.length > 0 ? Object.keys(data[0]) : [],
          data: data,
          rawFile: file
        }
        
        uploadedFiles.value.push(fileData)
      } catch (error) {
        console.error('Error processing CSV file:', error)
        // TODO: Show error message to user
      }
    }

    const processJSONFile = async (file) => {
      try {
        const text = await file.text()
        const jsonData = JSON.parse(text)
        const data = parseJSON(jsonData)
        
        const fileData = {
          id: Date.now() + Math.random(),
          name: file.name,
          type: 'json',
          size: formatFileSize(file.size),
          rows: Array.isArray(data) ? data.length : 0,
          columns: Array.isArray(data) && data.length > 0 ? Object.keys(data[0]).length : 0,
          columnNames: Array.isArray(data) && data.length > 0 ? Object.keys(data[0]) : [],
          data: data,
          rawFile: file
        }
        
        uploadedFiles.value.push(fileData)
      } catch (error) {
        console.error('Error processing JSON file:', error)
        // TODO: Show error message to user
      }
    }

    const removeFile = (fileId) => {
      uploadedFiles.value = uploadedFiles.value.filter(file => file.id !== fileId)
      if (selectedUploadedFile.value === fileId) {
        selectedUploadedFile.value = null
      }
    }

    const updateRealtimeConfig = () => {
      if (realtimeConfig.isActive) {
        // Restart with new config
        stopRealtime()
        startRealtime()
      }
    }

    const toggleRealtime = () => {
      if (realtimeConfig.isActive) {
        stopRealtime()
      } else {
        startRealtime()
      }
    }

    const startRealtime = () => {
      selectedSampleDataset.value = null
      selectedUploadedFile.value = null
      realtimeConfig.isActive = true
      realtimeStartTime.value = Date.now()
      realtimeDataPoints.value = 0
      
      const intervalMs = 1000 / realtimeConfig.updateRate
      realtimeInterval.value = setInterval(() => {
        generateRealtimeData(realtimeConfig)
        realtimeDataPoints.value++
        realtimeDuration.value = Math.round((Date.now() - realtimeStartTime.value) / 1000)
      }, intervalMs)
    }

    const stopRealtime = () => {
      if (realtimeInterval.value) {
        clearInterval(realtimeInterval.value)
        realtimeInterval.value = null
      }
      realtimeConfig.isActive = false
    }

    const clearRealtimeData = () => {
      stopRealtime()
      clearData()
      realtimeDataPoints.value = 0
      realtimeDuration.value = 0
    }

    const getSelectedDataInfo = () => {
      if (selectedSampleDataset.value) {
        const dataset = sampleDatasets.find(d => d.id === selectedSampleDataset.value)
        return `${dataset?.name} (Sample)`
      }
      if (selectedUploadedFile.value) {
        const file = uploadedFiles.value.find(f => f.id === selectedUploadedFile.value)
        return `${file?.name} (File)`
      }
      if (realtimeConfig.isActive) {
        return `${realtimeConfig.signalType} (Real-time)`
      }
      return ''
    }

    const applyDataSelection = () => {
      let dataSource = null

      if (selectedSampleDataset.value) {
        const dataset = sampleDatasets.find(d => d.id === selectedSampleDataset.value)
        dataSource = {
          type: 'sample',
          id: dataset.id,
          name: dataset.name,
          data: dataset.data
        }
      } else if (selectedUploadedFile.value) {
        const file = uploadedFiles.value.find(f => f.id === selectedUploadedFile.value)
        dataSource = {
          type: 'file',
          id: file.id,
          name: file.name,
          data: file.data
        }
      } else if (realtimeConfig.isActive) {
        dataSource = {
          type: 'realtime',
          config: { ...realtimeConfig },
          name: `${realtimeConfig.signalType} Real-time`
        }
      }

      if (dataSource) {
        emit('dataSelected', dataSource)
        emit('close')
      }
    }

    // Initialize with current data source
    onMounted(() => {
      if (props.currentDataSource?.type) {
        activeTab.value = props.currentDataSource.type
        
        if (props.currentDataSource.type === 'sample') {
          selectedSampleDataset.value = props.currentDataSource.id
        } else if (props.currentDataSource.type === 'realtime') {
          Object.assign(realtimeConfig, props.currentDataSource.config || {})
        }
      }
    })

    // Cleanup on unmount
    onUnmounted(() => {
      if (realtimeInterval.value) {
        clearInterval(realtimeInterval.value)
      }
    })

    return {
      // Reactive state
      activeTab,
      isDragOver,
      uploadedFiles,
      selectedSampleDataset,
      selectedUploadedFile,
      realtimeConfig,
      realtimeDataPoints,
      realtimeDuration,
      
      // Data
      dataSources,
      sampleDatasets,
      
      // Computed
      hasSelectedData,
      
      // Methods
      setActiveTab,
      selectSampleDataset,
      selectUploadedFile,
      handleDragOver,
      handleDragLeave,
      handleFileDrop,
      handleFileSelect,
      removeFile,
      updateRealtimeConfig,
      toggleRealtime,
      clearRealtimeData,
      getSelectedDataInfo,
      applyDataSelection
    }
  }
}
</script>

<style scoped>
.data-selector {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.data-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e1e5e9;
  background: #f8f9fa;
}

.data-selector-header h3 {
  margin: 0;
  color: #2c3e50;
}

.data-source-tabs {
  display: flex;
  border-bottom: 1px solid #e1e5e9;
  background: #f8f9fa;
}

.tab {
  flex: 1;
  padding: 12px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 3px solid transparent;
}

.tab:hover {
  background: #e9ecef;
}

.tab.active {
  background: white;
  border-bottom-color: #007bff;
  color: #007bff;
}

.data-source-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.tab-content {
  height: 100%;
}

/* Sample Data Styles */
.sample-data-list {
  display: grid;
  gap: 12px;
}

.dataset-item {
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dataset-item:hover {
  border-color: #007bff;
  background: #f8f9fa;
}

.dataset-item.selected {
  border-color: #007bff;
  background: #e3f2fd;
}

.dataset-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.dataset-header h4 {
  margin: 0;
  color: #2c3e50;
}

.dataset-type {
  background: #6c757d;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.dataset-description {
  margin: 8px 0;
  color: #6c757d;
  font-size: 14px;
}

.dataset-info {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #868e96;
}

/* File Upload Styles */
.drop-zone {
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  transition: all 0.2s ease;
  margin-bottom: 20px;
}

.drop-zone.dragover {
  border-color: #007bff;
  background: #f8f9fa;
}

.drop-zone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.upload-icon {
  font-size: 48px;
  opacity: 0.5;
}

.upload-subtitle {
  margin: 4px 0;
  color: #6c757d;
  font-size: 14px;
}

.uploaded-files h4 {
  margin-bottom: 12px;
  color: #2c3e50;
}

.file-item {
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.file-item:hover {
  border-color: #007bff;
}

.file-item.selected {
  border-color: #007bff;
  background: #e3f2fd;
}

.file-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.file-name {
  font-weight: 500;
  color: #2c3e50;
}

.file-info {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #868e96;
  margin-bottom: 4px;
}

.file-columns {
  font-size: 11px;
  color: #6c757d;
}

.format-examples {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 12px;
}

.format-example pre {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
}

/* Real-time Styles */
.realtime-config {
  display: grid;
  gap: 20px;
}

.config-section {
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  padding: 16px;
}

.config-section h4 {
  margin: 0 0 16px 0;
  color: #2c3e50;
}

.form-group {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.form-group label {
  min-width: 120px;
  font-weight: 500;
  color: #495057;
}

.form-group input,
.form-group select {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
}

.realtime-controls {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
}

.realtime-status {
  padding: 16px;
  background: #e8f5e8;
  border-radius: 6px;
  border: 1px solid #c3e6c3;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #6c757d;
}

.status-dot.active {
  background: #28a745;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.data-stats {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #495057;
}

/* Footer Styles */
.data-selector-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid #e1e5e9;
  background: #f8f9fa;
}

.selected-info {
  font-size: 14px;
  color: #495057;
}

.no-selection {
  color: #6c757d;
  font-style: italic;
}

.footer-actions {
  display: flex;
  gap: 12px;
}

/* Button Styles */
.btn-primary {
  background: #007bff;
  color: white;
  border: 1px solid #007bff;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
  border-color: #0056b3;
}

.btn-primary:disabled {
  background: #6c757d;
  border-color: #6c757d;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
  color: white;
  border: 1px solid #6c757d;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: #545b62;
  border-color: #545b62;
}

.btn-danger {
  background: #dc3545;
  color: white;
  border: 1px solid #dc3545;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-danger:hover {
  background: #c82333;
  border-color: #c82333;
}

.btn-small {
  padding: 4px 8px;
  font-size: 12px;
}
</style>