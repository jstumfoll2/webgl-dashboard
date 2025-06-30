/**
 * Sample Datasets for WebGL Dashboard
 * Provides various sample datasets for testing and demonstration
 */

/**
 * Mathematical functions for generating datasets
 */
const MathFunctions = {
  /**
   * Generate sine wave data
   */
  sineWave: (amplitude = 1, frequency = 1, phase = 0, points = 1000, xMin = 0, xMax = 10) => {
    const xData = [];
    const yData = [];
    const step = (xMax - xMin) / (points - 1);
    
    for (let i = 0; i < points; i++) {
      const x = xMin + i * step;
      const y = amplitude * Math.sin(2 * Math.PI * frequency * x + phase);
      xData.push(x);
      yData.push(y);
    }
    
    return { x: xData, y: yData };
  },

  /**
   * Generate cosine wave data
   */
  cosineWave: (amplitude = 1, frequency = 1, phase = 0, points = 1000, xMin = 0, xMax = 10) => {
    const xData = [];
    const yData = [];
    const step = (xMax - xMin) / (points - 1);
    
    for (let i = 0; i < points; i++) {
      const x = xMin + i * step;
      const y = amplitude * Math.cos(2 * Math.PI * frequency * x + phase);
      xData.push(x);
      yData.push(y);
    }
    
    return { x: xData, y: yData };
  },

  /**
   * Generate exponential decay
   */
  exponentialDecay: (amplitude = 1, timeConstant = 1, points = 1000, xMin = 0, xMax = 10) => {
    const xData = [];
    const yData = [];
    const step = (xMax - xMin) / (points - 1);
    
    for (let i = 0; i < points; i++) {
      const x = xMin + i * step;
      const y = amplitude * Math.exp(-x / timeConstant);
      xData.push(x);
      yData.push(y);
    }
    
    return { x: xData, y: yData };
  },

  /**
   * Generate exponential growth
   */
  exponentialGrowth: (amplitude = 1, growthRate = 0.1, points = 1000, xMin = 0, xMax = 10) => {
    const xData = [];
    const yData = [];
    const step = (xMax - xMin) / (points - 1);
    
    for (let i = 0; i < points; i++) {
      const x = xMin + i * step;
      const y = amplitude * Math.exp(growthRate * x);
      xData.push(x);
      yData.push(y);
    }
    
    return { x: xData, y: yData };
  },

  /**
   * Generate logarithmic data
   */
  logarithmic: (amplitude = 1, base = Math.E, points = 1000, xMin = 0.1, xMax = 10) => {
    const xData = [];
    const yData = [];
    const step = (xMax - xMin) / (points - 1);
    
    for (let i = 0; i < points; i++) {
      const x = xMin + i * step;
      const y = amplitude * Math.log(x) / Math.log(base);
      xData.push(x);
      yData.push(y);
    }
    
    return { x: xData, y: yData };
  },

  /**
   * Generate polynomial data
   */
  polynomial: (coefficients = [1, 0, 0], points = 1000, xMin = -5, xMax = 5) => {
    const xData = [];
    const yData = [];
    const step = (xMax - xMin) / (points - 1);
    
    for (let i = 0; i < points; i++) {
      const x = xMin + i * step;
      let y = 0;
      for (let j = 0; j < coefficients.length; j++) {
        y += coefficients[j] * Math.pow(x, j);
      }
      xData.push(x);
      yData.push(y);
    }
    
    return { x: xData, y: yData };
  },

  /**
   * Generate Gaussian (normal distribution) data
   */
  gaussian: (amplitude = 1, mean = 0, stdDev = 1, points = 1000, xMin = -5, xMax = 5) => {
    const xData = [];
    const yData = [];
    const step = (xMax - xMin) / (points - 1);
    
    for (let i = 0; i < points; i++) {
      const x = xMin + i * step;
      const exponent = -0.5 * Math.pow((x - mean) / stdDev, 2);
      const y = amplitude * Math.exp(exponent) / (stdDev * Math.sqrt(2 * Math.PI));
      xData.push(x);
      yData.push(y);
    }
    
    return { x: xData, y: yData };
  },

  /**
   * Generate damped oscillation
   */
  dampedOscillation: (amplitude = 1, frequency = 1, dampingFactor = 0.1, points = 1000, xMin = 0, xMax = 20) => {
    const xData = [];
    const yData = [];
    const step = (xMax - xMin) / (points - 1);
    
    for (let i = 0; i < points; i++) {
      const x = xMin + i * step;
      const envelope = Math.exp(-dampingFactor * x);
      const y = amplitude * envelope * Math.sin(2 * Math.PI * frequency * x);
      xData.push(x);
      yData.push(y);
    }
    
    return { x: xData, y: yData };
  }
};

/**
 * Noise generators
 */
const NoiseGenerators = {
  /**
   * Generate white noise
   */
  whiteNoise: (amplitude = 1, points = 1000, xMin = 0, xMax = 10) => {
    const xData = [];
    const yData = [];
    const step = (xMax - xMin) / (points - 1);
    
    for (let i = 0; i < points; i++) {
      const x = xMin + i * step;
      const y = amplitude * (Math.random() - 0.5) * 2;
      xData.push(x);
      yData.push(y);
    }
    
    return { x: xData, y: yData };
  },

  /**
   * Generate random walk data
   */
  randomWalk: (stepSize = 0.1, points = 1000, startValue = 0, xMin = 0, xMax = 10) => {
    const xData = [];
    const yData = [];
    const step = (xMax - xMin) / (points - 1);
    let currentValue = startValue;
    
    for (let i = 0; i < points; i++) {
      const x = xMin + i * step;
      currentValue += (Math.random() - 0.5) * stepSize;
      xData.push(x);
      yData.push(currentValue);
    }
    
    return { x: xData, y: yData };
  },

  /**
   * Add noise to existing data
   */
  addNoise: (data, noiseAmplitude = 0.1) => {
    const noisyData = {
      x: [...data.x],
      y: data.y.map(y => y + (Math.random() - 0.5) * 2 * noiseAmplitude)
    };
    return noisyData;
  }
};

/**
 * Time series generators
 */
const TimeSeriesGenerators = {
  /**
   * Generate stock price-like data
   */
  stockPrice: (initialPrice = 100, volatility = 0.02, trend = 0.0001, points = 1000) => {
    const xData = [];
    const yData = [];
    let price = initialPrice;
    
    for (let i = 0; i < points; i++) {
      const date = new Date();
      date.setTime(date.getTime() + i * 24 * 60 * 60 * 1000); // Daily data
      
      const randomChange = (Math.random() - 0.5) * volatility;
      const trendChange = trend;
      price *= (1 + randomChange + trendChange);
      
      xData.push(i);
      yData.push(price);
    }
    
    return { x: xData, y: yData };
  },

  /**
   * Generate temperature data with seasonal variation
   */
  temperatureData: (avgTemp = 20, seasonalVariation = 10, points = 365) => {
    const xData = [];
    const yData = [];
    
    for (let i = 0; i < points; i++) {
      const dayOfYear = i;
      const seasonal = seasonalVariation * Math.sin(2 * Math.PI * dayOfYear / 365);
      const dailyVariation = (Math.random() - 0.5) * 8;
      const temperature = avgTemp + seasonal + dailyVariation;
      
      xData.push(dayOfYear);
      yData.push(temperature);
    }
    
    return { x: xData, y: yData };
  },

  /**
   * Generate sensor data with drift and noise
   */
  sensorData: (baseline = 50, drift = 0.001, noiseLevel = 1, points = 1000) => {
    const xData = [];
    const yData = [];
    
    for (let i = 0; i < points; i++) {
      const time = i;
      const driftComponent = baseline + drift * time;
      const noise = (Math.random() - 0.5) * 2 * noiseLevel;
      const value = driftComponent + noise;
      
      xData.push(time);
      yData.push(value);
    }
    
    return { x: xData, y: yData };
  }
};

/**
 * Real-world inspired datasets
 */
const RealWorldDatasets = {
  /**
   * CPU usage simulation
   */
  cpuUsage: (points = 1000, spikeProbability = 0.05) => {
    const xData = [];
    const yData = [];
    let baseUsage = 20;
    
    for (let i = 0; i < points; i++) {
      const time = i;
      
      // Gradual baseline changes
      baseUsage += (Math.random() - 0.5) * 2;
      baseUsage = Math.max(10, Math.min(40, baseUsage));
      
      // Random spikes
      let usage = baseUsage;
      if (Math.random() < spikeProbability) {
        usage += Math.random() * 50;
      }
      
      // Add small random variations
      usage += (Math.random() - 0.5) * 5;
      usage = Math.max(0, Math.min(100, usage));
      
      xData.push(time);
      yData.push(usage);
    }
    
    return { x: xData, y: yData };
  },

  /**
   * Network traffic simulation
   */
  networkTraffic: (points = 1000) => {
    const xData = [];
    const yData = [];
    let baseTraffic = 100;
    
    for (let i = 0; i < points; i++) {
      const time = i;
      
      // Business hours pattern (higher during day)
      const hourOfDay = (i % 144) / 6; // Assuming 10-minute intervals
      const businessHoursMultiplier = 0.5 + 0.5 * Math.sin(Math.PI * (hourOfDay - 6) / 12);
      
      // Weekly pattern (lower on weekends)
      const dayOfWeek = Math.floor(i / 144) % 7;
      const weekdayMultiplier = dayOfWeek < 5 ? 1.0 : 0.6;
      
      // Random variations
      const randomMultiplier = 0.8 + Math.random() * 0.4;
      
      const traffic = baseTraffic * businessHoursMultiplier * weekdayMultiplier * randomMultiplier;
      
      xData.push(time);
      yData.push(traffic);
    }
    
    return { x: xData, y: yData };
  },

  /**
   * Heart rate data simulation
   */
  heartRate: (restingHR = 70, points = 1000) => {
    const xData = [];
    const yData = [];
    let currentHR = restingHR;
    
    for (let i = 0; i < points; i++) {
      const time = i;
      
      // Breathing variation
      const breathingVariation = 3 * Math.sin(2 * Math.PI * i / 20);
      
      // Random variation
      const randomVariation = (Math.random() - 0.5) * 4;
      
      // Gradual drift back to resting
      const drift = (restingHR - currentHR) * 0.01;
      
      currentHR += drift + randomVariation;
      const heartRate = currentHR + breathingVariation;
      
      xData.push(time);
      yData.push(Math.max(50, Math.min(120, heartRate)));
    }
    
    return { x: xData, y: yData };
  }
};

/**
 * Predefined sample datasets
 */
export const SAMPLE_DATASETS = {
  // Mathematical functions
  'sine-wave': {
    name: 'Sine Wave',
    description: 'Simple sine wave with amplitude 1, frequency 1',
    category: 'Mathematical',
    generator: () => MathFunctions.sineWave(1, 1, 0, 1000, 0, 10),
    suggestedColors: ['#2196F3']
  },

  'cosine-wave': {
    name: 'Cosine Wave',
    description: 'Cosine wave with amplitude 1, frequency 1',
    category: 'Mathematical',
    generator: () => MathFunctions.cosineWave(1, 1, 0, 1000, 0, 10),
    suggestedColors: ['#4CAF50']
  },

  'damped-oscillation': {
    name: 'Damped Oscillation',
    description: 'Oscillating signal with exponential decay',
    category: 'Mathematical',
    generator: () => MathFunctions.dampedOscillation(1, 0.5, 0.1, 1000, 0, 20),
    suggestedColors: ['#FF9800']
  },

  'exponential-decay': {
    name: 'Exponential Decay',
    description: 'Exponential decay with time constant 2',
    category: 'Mathematical',
    generator: () => MathFunctions.exponentialDecay(1, 2, 1000, 0, 10),
    suggestedColors: ['#F44336']
  },

  'exponential-growth': {
    name: 'Exponential Growth',
    description: 'Exponential growth with rate 0.1',
    category: 'Mathematical',
    generator: () => MathFunctions.exponentialGrowth(1, 0.1, 1000, 0, 5),
    suggestedColors: ['#9C27B0']
  },

  'logarithmic': {
    name: 'Logarithmic Function',
    description: 'Natural logarithm function',
    category: 'Mathematical',
    generator: () => MathFunctions.logarithmic(1, Math.E, 1000, 0.1, 10),
    suggestedColors: ['#607D8B']
  },

  'quadratic': {
    name: 'Quadratic Function',
    description: 'Parabola (x² - 5x + 6)',
    category: 'Mathematical',
    generator: () => MathFunctions.polynomial([6, -5, 1], 1000, -2, 8),
    suggestedColors: ['#795548']
  },

  'gaussian': {
    name: 'Gaussian Distribution',
    description: 'Normal distribution with mean=0, std=1',
    category: 'Statistical',
    generator: () => MathFunctions.gaussian(1, 0, 1, 1000, -5, 5),
    suggestedColors: ['#3F51B5']
  },

  // Noisy data
  'noisy-sine': {
    name: 'Noisy Sine Wave',
    description: 'Sine wave with added white noise',
    category: 'Noisy Signals',
    generator: () => {
      const sine = MathFunctions.sineWave(1, 1, 0, 1000, 0, 10);
      return NoiseGenerators.addNoise(sine, 0.2);
    },
    suggestedColors: ['#E91E63']
  },

  'white-noise': {
    name: 'White Noise',
    description: 'Random white noise signal',
    category: 'Noisy Signals',
    generator: () => NoiseGenerators.whiteNoise(1, 1000, 0, 10),
    suggestedColors: ['#9E9E9E']
  },

  'random-walk': {
    name: 'Random Walk',
    description: 'Random walk process',
    category: 'Statistical',
    generator: () => NoiseGenerators.randomWalk(0.1, 1000, 0, 0, 10),
    suggestedColors: ['#FF5722']
  },

  // Time series
  'stock-price': {
    name: 'Stock Price Simulation',
    description: 'Simulated stock price with trend and volatility',
    category: 'Time Series',
    generator: () => TimeSeriesGenerators.stockPrice(100, 0.02, 0.0001, 250),
    suggestedColors: ['#00BCD4']
  },

  'temperature-data': {
    name: 'Temperature Data',
    description: 'Annual temperature with seasonal variation',
    category: 'Time Series',
    generator: () => TimeSeriesGenerators.temperatureData(20, 10, 365),
    suggestedColors: ['#CDDC39']
  },

  'sensor-drift': {
    name: 'Sensor with Drift',
    description: 'Sensor data with gradual drift and noise',
    category: 'Time Series',
    generator: () => TimeSeriesGenerators.sensorData(50, 0.001, 1, 1000),
    suggestedColors: ['#8BC34A']
  },

  // Real-world simulations
  'cpu-usage': {
    name: 'CPU Usage',
    description: 'Simulated CPU usage with spikes',
    category: 'System Monitoring',
    generator: () => RealWorldDatasets.cpuUsage(1000, 0.05),
    suggestedColors: ['#FFC107']
  },

  'network-traffic': {
    name: 'Network Traffic',
    description: 'Network traffic with daily and weekly patterns',
    category: 'System Monitoring',
    generator: () => RealWorldDatasets.networkTraffic(1000),
    suggestedColors: ['#673AB7']
  },

  'heart-rate': {
    name: 'Heart Rate',
    description: 'Simulated heart rate with breathing variation',
    category: 'Biomedical',
    generator: () => RealWorldDatasets.heartRate(70, 1000),
    suggestedColors: ['#E91E63']
  }
};

/**
 * Get sample dataset by key
 */
export function getSampleDataset(key) {
  const dataset = SAMPLE_DATASETS[key];
  if (!dataset) {
    console.warn(`Sample dataset '${key}' not found`);
    return null;
  }
  
  return {
    ...dataset,
    data: dataset.generator()
  };
}

/**
 * Get all available dataset keys
 */
export function getAvailableDatasets() {
  return Object.keys(SAMPLE_DATASETS);
}

/**
 * Get datasets by category
 */
export function getDatasetsByCategory(category) {
  return Object.entries(SAMPLE_DATASETS)
    .filter(([key, dataset]) => dataset.category === category)
    .map(([key, dataset]) => ({ key, ...dataset }));
}

/**
 * Get all categories
 */
export function getCategories() {
  const categories = new Set();
  Object.values(SAMPLE_DATASETS).forEach(dataset => {
    categories.add(dataset.category);
  });
  return Array.from(categories).sort();
}

/**
 * Generate multiple datasets for comparison
 */
export function generateComparisonDatasets(baseFunction, variations) {
  const datasets = [];
  
  variations.forEach((variation, index) => {
    const data = baseFunction(...variation.params);
    datasets.push({
      name: variation.name,
      data: data,
      color: variation.color || `hsl(${index * 60}, 70%, 50%)`
    });
  });
  
  return datasets;
}

/**
 * Create a multi-dataset example
 */
export function createMultiDatasetExample() {
  return generateComparisonDatasets(
    MathFunctions.sineWave,
    [
      { name: 'Sine 1Hz', params: [1, 1, 0, 1000, 0, 10], color: '#2196F3' },
      { name: 'Sine 2Hz', params: [0.8, 2, 0, 1000, 0, 10], color: '#4CAF50' },
      { name: 'Sine 0.5Hz', params: [1.2, 0.5, 0, 1000, 0, 10], color: '#FF9800' }
    ]
  );
}

/**
 * Export math functions for external use
 */
export { MathFunctions, NoiseGenerators, TimeSeriesGenerators, RealWorldDatasets };