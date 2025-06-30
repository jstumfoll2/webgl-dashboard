/**
 * Data Processing Utilities for WebGL Dashboard
 * Handles data transformation, validation, generation, and format conversion
 */

import { 
  createPoint, 
  createDataset, 
  DATA_SOURCE_TYPES,
  AXIS_SCALE_TYPES,
  validateDataset 
} from '../types/plotTypes.js'

// ============================================================================
// DATA VALIDATION AND SANITIZATION
// ============================================================================

/**
 * Validate and sanitize raw data points
 */
export const sanitizeDataPoints = (data) => {
  if (!Array.isArray(data)) {
    console.warn('Data is not an array, converting...')
    return []
  }

  return data
    .map((point, index) => {
      // Handle different input formats
      if (Array.isArray(point)) {
        return createPoint(
          parseFloat(point[0]) || 0,
          parseFloat(point[1]) || 0,
          { originalIndex: index }
        )
      } else if (typeof point === 'object' && point !== null) {
        return createPoint(
          parseFloat(point.x) || 0,
          parseFloat(point.y) || 0,
          { ...point.metadata, originalIndex: index }
        )
      } else {
        // Assume it's a y-value with index as x
        return createPoint(
          index,
          parseFloat(point) || 0,
          { originalIndex: index }
        )
      }
    })
    .filter((point) => {
      // Remove invalid points
      return !isNaN(point.x) && !isNaN(point.y) && isFinite(point.x) && isFinite(point.y)
    })
}

/**
 * Remove outliers using IQR method
 */
export const removeOutliers = (data, factor = 1.5) => {
  if (data.length < 4) return data

  const yValues = data.map(point => point.y).sort((a, b) => a - b)
  const q1Index = Math.floor(yValues.length * 0.25)
  const q3Index = Math.floor(yValues.length * 0.75)
  const q1 = yValues[q1Index]
  const q3 = yValues[q3Index]
  const iqr = q3 - q1
  const lowerBound = q1 - factor * iqr
  const upperBound = q3 + factor * iqr

  return data.filter(point => point.y >= lowerBound && point.y <= upperBound)
}

/**
 * Validate data bounds and fix common issues
 */
export const validateDataBounds = (data, options = {}) => {
  const {
    maxPoints = 50000,
    minX = -Infinity,
    maxX = Infinity,
    minY = -Infinity,
    maxY = Infinity,
    removeOutliers: shouldRemoveOutliers = false,
    outlierFactor = 1.5
  } = options

  let processedData = [...data]

  // Remove outliers if requested
  if (shouldRemoveOutliers) {
    processedData = removeOutliers(processedData, outlierFactor)
  }

  // Apply bounds filtering
  processedData = processedData.filter(point => 
    point.x >= minX && point.x <= maxX && 
    point.y >= minY && point.y <= maxY
  )

  // Limit number of points for performance
  if (processedData.length > maxPoints) {
    const step = Math.ceil(processedData.length / maxPoints)
    processedData = processedData.filter((_, index) => index % step === 0)
  }

  return processedData
}

// ============================================================================
// DATA TRANSFORMATION
// ============================================================================

/**
 * Apply scale and offset transformations to data
 */
export const transformData = (data, transformConfig = {}) => {
  const {
    xScale = 1,
    yScale = 1,
    xOffset = 0,
    yOffset = 0,
    xFunction = null,
    yFunction = null
  } = transformConfig

  return data.map(point => {
    let x = point.x
    let y = point.y

    // Apply custom functions first
    if (xFunction && typeof xFunction === 'function') {
      x = xFunction(x)
    }
    if (yFunction && typeof yFunction === 'function') {
      y = yFunction(y)
    }

    // Apply scale and offset
    x = (x * xScale) + xOffset
    y = (y * yScale) + yOffset

    return createPoint(x, y, point.metadata)
  })
}

/**
 * Convert data for logarithmic scales
 */
export const convertToLogScale = (data, scaleType = AXIS_SCALE_TYPES.LINEAR) => {
  if (scaleType === AXIS_SCALE_TYPES.LINEAR) {
    return data
  }

  return data.map(point => {
    let x = point.x
    let y = point.y

    // Handle different scale types
    switch (scaleType) {
      case AXIS_SCALE_TYPES.LOG:
      case AXIS_SCALE_TYPES.SEMI_LOG_Y:
        y = y > 0 ? Math.log10(y) : NaN
        break
      case AXIS_SCALE_TYPES.SEMI_LOG_X:
        x = x > 0 ? Math.log10(x) : NaN
        break
      case AXIS_SCALE_TYPES.LOG_LOG:
        x = x > 0 ? Math.log10(x) : NaN
        y = y > 0 ? Math.log10(y) : NaN
        break
    }

    return createPoint(x, y, point.metadata)
  }).filter(point => !isNaN(point.x) && !isNaN(point.y))
}

/**
 * Interpolate missing data points
 */
export const interpolateData = (data, method = 'linear') => {
  if (data.length < 2) return data

  const result = []
  
  for (let i = 0; i < data.length; i++) {
    result.push(data[i])
    
    // Check if we need to interpolate to the next point
    if (i < data.length - 1) {
      const current = data[i]
      const next = data[i + 1]
      const xGap = next.x - current.x
      
      // If there's a significant gap, add interpolated points
      if (xGap > 1) {
        const steps = Math.min(Math.floor(xGap), 10) // Limit interpolation points
        
        for (let step = 1; step < steps; step++) {
          const ratio = step / steps
          let interpY
          
          switch (method) {
            case 'linear':
              interpY = current.y + (next.y - current.y) * ratio
              break
            case 'cubic':
              // Simple cubic interpolation
              interpY = current.y + (next.y - current.y) * (ratio * ratio * (3 - 2 * ratio))
              break
            default:
              interpY = current.y + (next.y - current.y) * ratio
          }
          
          result.push(createPoint(
            current.x + xGap * ratio,
            interpY,
            { interpolated: true }
          ))
        }
      }
    }
  }
  
  return result
}

/**
 * Smooth data using moving average
 */
export const smoothData = (data, windowSize = 5) => {
  if (data.length <= windowSize) return data

  const result = []
  const halfWindow = Math.floor(windowSize / 2)

  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - halfWindow)
    const end = Math.min(data.length, i + halfWindow + 1)
    const window = data.slice(start, end)
    
    const avgY = window.reduce((sum, point) => sum + point.y, 0) / window.length
    
    result.push(createPoint(
      data[i].x,
      avgY,
      { ...data[i].metadata, smoothed: true }
    ))
  }

  return result
}

// ============================================================================
// DATA ANALYSIS
// ============================================================================

/**
 * Calculate basic statistics for a dataset
 */
export const calculateStatistics = (data) => {
  if (!data || data.length === 0) {
    return {
      count: 0,
      xStats: null,
      yStats: null
    }
  }

  const xValues = data.map(point => point.x)
  const yValues = data.map(point => point.y)

  const calculateStats = (values) => {
    const sorted = [...values].sort((a, b) => a - b)
    const sum = values.reduce((acc, val) => acc + val, 0)
    const mean = sum / values.length
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length
    const stdDev = Math.sqrt(variance)

    return {
      min: Math.min(...values),
      max: Math.max(...values),
      mean,
      median: sorted[Math.floor(sorted.length / 2)],
      stdDev,
      variance,
      sum,
      range: Math.max(...values) - Math.min(...values)
    }
  }

  return {
    count: data.length,
    xStats: calculateStats(xValues),
    yStats: calculateStats(yValues)
  }
}

/**
 * Find peaks in data
 */
export const findPeaks = (data, options = {}) => {
  const { 
    minHeight = -Infinity, 
    minDistance = 1,
    threshold = 0.1 
  } = options

  const peaks = []

  for (let i = 1; i < data.length - 1; i++) {
    const current = data[i]
    const prev = data[i - 1]
    const next = data[i + 1]

    // Check if it's a local maximum
    if (current.y > prev.y && current.y > next.y && current.y >= minHeight) {
      // Check minimum distance from other peaks
      const tooClose = peaks.some(peak => 
        Math.abs(peak.x - current.x) < minDistance
      )

      if (!tooClose) {
        peaks.push({
          ...current,
          peakIndex: i,
          prominence: Math.min(current.y - prev.y, current.y - next.y)
        })
      }
    }
  }

  return peaks.filter(peak => peak.prominence >= threshold)
}

/**
 * Calculate correlation between two datasets
 */
export const calculateCorrelation = (data1, data2) => {
  if (!data1 || !data2 || data1.length !== data2.length || data1.length === 0) {
    return null
  }

  const n = data1.length
  const x = data1.map(point => point.y)
  const y = data2.map(point => point.y)

  const sumX = x.reduce((acc, val) => acc + val, 0)
  const sumY = y.reduce((acc, val) => acc + val, 0)
  const sumXY = x.reduce((acc, val, i) => acc + val * y[i], 0)
  const sumXX = x.reduce((acc, val) => acc + val * val, 0)
  const sumYY = y.reduce((acc, val) => acc + val * val, 0)

  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY))

  return denominator === 0 ? 0 : numerator / denominator
}

// ============================================================================
// DATA GENERATION
// ============================================================================

/**
 * Generate sample data for testing
 */
export const generateSampleData = (type = 'sine', count = 100, options = {}) => {
  const {
    xMin = 0,
    xMax = 10,
    amplitude = 1,
    frequency = 1,
    phase = 0,
    noise = 0,
    offset = 0
  } = options

  const data = []
  const step = (xMax - xMin) / (count - 1)

  for (let i = 0; i < count; i++) {
    const x = xMin + i * step
    let y

    switch (type) {
      case 'sine':
        y = amplitude * Math.sin(frequency * x + phase) + offset
        break
      case 'cosine':
        y = amplitude * Math.cos(frequency * x + phase) + offset
        break
      case 'linear':
        y = amplitude * x + offset
        break
      case 'quadratic':
        y = amplitude * x * x + offset
        break
      case 'exponential':
        y = amplitude * Math.exp(frequency * x) + offset
        break
      case 'logarithmic':
        y = amplitude * Math.log(Math.max(0.001, frequency * x)) + offset
        break
      case 'random':
        y = amplitude * (Math.random() - 0.5) * 2 + offset
        break
      case 'normal':
        // Box-Muller transform for normal distribution
        y = amplitude * (Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random())) + offset
        break
      default:
        y = 0
    }

    // Add noise if specified
    if (noise > 0) {
      y += (Math.random() - 0.5) * noise
    }

    data.push(createPoint(x, y, { generated: true, type }))
  }

  return data
}

/**
 * Generate time series data
 */
export const generateTimeSeriesData = (options = {}) => {
  const {
    startTime = new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
    endTime = new Date(),
    interval = 60000, // 1 minute
    baseValue = 100,
    trend = 0,
    seasonality = { amplitude: 10, period: 24 * 60 * 60 * 1000 }, // Daily seasonality
    noise = 5
  } = options

  const data = []
  const totalDuration = endTime.getTime() - startTime.getTime()
  const pointCount = Math.floor(totalDuration / interval)

  for (let i = 0; i <= pointCount; i++) {
    const time = startTime.getTime() + i * interval
    const x = time / 1000 // Convert to seconds for plotting
    
    // Base trend
    let y = baseValue + trend * i
    
    // Add seasonality
    if (seasonality.amplitude > 0) {
      const seasonalPhase = (2 * Math.PI * time) / seasonality.period
      y += seasonality.amplitude * Math.sin(seasonalPhase)
    }
    
    // Add noise
    if (noise > 0) {
      y += (Math.random() - 0.5) * noise
    }

    data.push(createPoint(x, y, { 
      timestamp: time,
      date: new Date(time).toISOString()
    }))
  }

  return data
}

/**
 * Generate real-time data point
 */
export const generateRealtimePoint = (previousPoint, options = {}) => {
  const {
    volatility = 0.1,
    trend = 0,
    meanReversion = 0.05,
    targetValue = 100
  } = options

  const currentTime = Date.now() / 1000
  let newY

  if (previousPoint) {
    // Use previous value as starting point
    newY = previousPoint.y
    
    // Add trend
    newY += trend
    
    // Add mean reversion
    newY += (targetValue - newY) * meanReversion
    
    // Add random walk
    newY += (Math.random() - 0.5) * volatility
  } else {
    // First point
    newY = targetValue + (Math.random() - 0.5) * volatility
  }

  return createPoint(currentTime, newY, {
    timestamp: Date.now(),
    realtime: true
  })
}

// ============================================================================
// DATA FORMAT CONVERSION
// ============================================================================

/**
 * Parse CSV data
 */
export const parseCSV = (csvText, options = {}) => {
  const {
    delimiter = ',',
    hasHeaders = true,
    xColumn = 0,
    yColumn = 1,
    skipRows = 0
  } = options

  const lines = csvText.trim().split('\n').slice(skipRows)
  if (lines.length === 0) return []

  let startIndex = 0
  let headers = []

  if (hasHeaders) {
    headers = lines[0].split(delimiter).map(h => h.trim())
    startIndex = 1
  }

  const data = []

  for (let i = startIndex; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map(v => v.trim())
    
    if (values.length > Math.max(xColumn, yColumn)) {
      const x = parseFloat(values[xColumn])
      const y = parseFloat(values[yColumn])
      
      if (!isNaN(x) && !isNaN(y)) {
        data.push(createPoint(x, y, {
          row: i,
          headers,
          rawValues: values
        }))
      }
    }
  }

  return data
}

/**
 * Convert data to CSV format
 */
export const dataToCSV = (data, includeHeaders = true) => {
  if (!data || data.length === 0) return ''

  const rows = []
  
  if (includeHeaders) {
    rows.push('x,y')
  }

  data.forEach(point => {
    rows.push(`${point.x},${point.y}`)
  })

  return rows.join('\n')
}

/**
 * Parse JSON data
 */
export const parseJSON = (jsonText, options = {}) => {
  const { xProperty = 'x', yProperty = 'y' } = options

  try {
    const parsed = JSON.parse(jsonText)
    const array = Array.isArray(parsed) ? parsed : [parsed]

    return array.map((item, index) => {
      const x = item[xProperty] !== undefined ? parseFloat(item[xProperty]) : index
      const y = item[yProperty] !== undefined ? parseFloat(item[yProperty]) : 0

      return createPoint(x, y, { ...item, originalIndex: index })
    }).filter(point => !isNaN(point.x) && !isNaN(point.y))
  } catch (error) {
    console.error('Error parsing JSON:', error)
    return []
  }
}

/**
 * Convert data to JSON format
 */
export const dataToJSON = (data, format = 'object') => {
  if (!data || data.length === 0) return '[]'

  const converted = data.map(point => {
    switch (format) {
      case 'array':
        return [point.x, point.y]
      case 'object':
      default:
        return { x: point.x, y: point.y, ...point.metadata }
    }
  })

  return JSON.stringify(converted, null, 2)
}

// ============================================================================
// DATA CACHING AND PERFORMANCE
// ============================================================================

/**
 * Simple LRU cache for processed data
 */
class DataCache {
  constructor(maxSize = 50) {
    this.maxSize = maxSize
    this.cache = new Map()
  }

  get(key) {
    if (this.cache.has(key)) {
      // Move to end (most recently used)
      const value = this.cache.get(key)
      this.cache.delete(key)
      this.cache.set(key, value)
      return value
    }
    return null
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key)
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    this.cache.set(key, value)
  }

  clear() {
    this.cache.clear()
  }
}

// Global cache instance
export const dataCache = new DataCache()

/**
 * Generate cache key for data operations
 */
export const generateCacheKey = (operation, data, options = {}) => {
  const dataHash = data.length > 0 ? 
    `${data[0].x}_${data[0].y}_${data[data.length - 1].x}_${data[data.length - 1].y}_${data.length}` : 
    'empty'
  const optionsHash = JSON.stringify(options)
  return `${operation}_${dataHash}_${optionsHash}`.replace(/[^\w]/g, '_')
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Validation and sanitization
  sanitizeDataPoints,
  removeOutliers,
  validateDataBounds,
  
  // Transformation
  transformData,
  convertToLogScale,
  interpolateData,
  smoothData,
  
  // Analysis
  calculateStatistics,
  findPeaks,
  calculateCorrelation,
  
  // Generation
  generateSampleData,
  generateTimeSeriesData,
  generateRealtimePoint,
  
  // Format conversion
  parseCSV,
  dataToCSV,
  parseJSON,
  dataToJSON,
  
  // Caching
  dataCache,
  generateCacheKey
}