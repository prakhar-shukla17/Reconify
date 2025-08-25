/**
 * Performance Configuration
 * 
 * Centralized configuration for performance optimizations across the admin panel
 */

export const PERFORMANCE_CONFIG = {
  // Caching Configuration
  CACHE: {
    // Asset cache settings
    ASSET_CACHE_DURATION: 10 * 60 * 1000, // 10 minutes
    ASSET_CACHE_MAX_SIZE: 50, // Maximum number of cached entries
    
    // Ticket cache settings
    TICKET_CACHE_DURATION: 10 * 60 * 1000, // 10 minutes
    TICKET_CACHE_MAX_SIZE: 30, // Maximum number of cached entries
    
    // User cache settings
    USER_CACHE_DURATION: 15 * 60 * 1000, // 15 minutes
    USER_CACHE_MAX_SIZE: 20, // Maximum number of cached entries
    
    // Alert cache settings
    ALERT_CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
    ALERT_CACHE_MAX_SIZE: 10, // Maximum number of cached entries
  },

  // API Configuration
  API: {
    // Request timeout
    REQUEST_TIMEOUT: 30000, // 30 seconds
    
    // Retry configuration
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // 1 second
    
    // Batch size for bulk operations
    BATCH_SIZE: 100,
    
    // Debounce delays
    SEARCH_DEBOUNCE: 500, // 500ms
    FILTER_DEBOUNCE: 300, // 300ms
  },

  // Virtual Scrolling Configuration
  VIRTUAL_SCROLL: {
    // Default item heights
    ITEM_HEIGHT: {
      HARDWARE_CARD: 200,
      SOFTWARE_CARD: 180,
      USER_ROW: 60,
      TICKET_CARD: 150,
      ALERT_ITEM: 80,
    },
    
    // Container heights
    CONTAINER_HEIGHT: {
      DEFAULT: 400,
      LARGE: 600,
      SMALL: 300,
    },
    
    // Overscan (number of items to render outside viewport)
    OVERSCAN: 5,
    
    // Enable performance monitoring
    ENABLE_MONITORING: true,
  },

  // Lazy Loading Configuration
  LAZY_LOAD: {
    // Intersection observer threshold
    THRESHOLD: 0.1,
    
    // Root margin for intersection observer
    ROOT_MARGIN: '50px',
    
    // Delay before loading
    LOAD_DELAY: 100, // 100ms
  },

  // Background Processing Configuration
  BACKGROUND: {
    // Enable background prefetching
    ENABLE_PREFETCH: true,
    
    // Delay before starting background operations
    PREFETCH_DELAY: 2000, // 2 seconds
    
    // Maximum concurrent background operations
    MAX_CONCURRENT: 2,
    
    // Background operation timeout
    OPERATION_TIMEOUT: 30000, // 30 seconds
  },

  // Performance Monitoring Configuration
  MONITORING: {
    // Enable performance monitoring
    ENABLED: true,
    
    // Metrics collection interval
    COLLECTION_INTERVAL: 5000, // 5 seconds
    
    // Performance thresholds
    THRESHOLDS: {
      RENDER_TIME: {
        EXCELLENT: 50, // ms
        GOOD: 100,     // ms
        FAIR: 200,     // ms
        POOR: 500,     // ms
      },
      MEMORY_USAGE: {
        WARNING: 100,  // MB
        CRITICAL: 200, // MB
      },
      CACHE_HIT_RATE: {
        MINIMUM: 0.7,  // 70%
        TARGET: 0.9,   // 90%
      },
    },
    
    // Enable console logging
    CONSOLE_LOGGING: false,
    
    // Enable performance warnings
    WARNINGS: true,
  },

  // Search and Filter Configuration
  SEARCH: {
    // Minimum search length
    MIN_LENGTH: 2,
    
    // Maximum search results
    MAX_RESULTS: 1000,
    
    // Search index configuration
    INDEX: {
      ENABLE_FUZZY: true,
      FUZZY_THRESHOLD: 0.6,
      ENABLE_HIGHLIGHTING: true,
    },
  },

  // Pagination Configuration
  PAGINATION: {
    // Default page sizes
    PAGE_SIZES: [12, 24, 48, 96],
    
    // Default page size
    DEFAULT_SIZE: 24,
    
    // Maximum page size
    MAX_SIZE: 100,
    
    // Enable infinite scroll
    INFINITE_SCROLL: false,
  },

  // Animation Configuration
  ANIMATION: {
    // Enable animations
    ENABLED: true,
    
    // Animation durations
    DURATION: {
      FAST: 150,    // ms
      NORMAL: 300,  // ms
      SLOW: 500,    // ms
    },
    
    // Enable reduced motion for accessibility
    REDUCE_MOTION: false,
  },

  // Error Handling Configuration
  ERROR_HANDLING: {
    // Enable error boundaries
    ENABLE_BOUNDARIES: true,
    
    // Error reporting
    REPORTING: {
      ENABLED: false,
      ENDPOINT: null,
      SAMPLE_RATE: 0.1, // 10% of errors
    },
    
    // Retry configuration
    RETRY: {
      ENABLED: true,
      MAX_ATTEMPTS: 3,
      BACKOFF_MULTIPLIER: 2,
    },
  },
};

// Performance optimization presets
export const PERFORMANCE_PRESETS = {
  // High performance preset for large datasets
  HIGH_PERFORMANCE: {
    CACHE: {
      ASSET_CACHE_DURATION: 15 * 60 * 1000, // 15 minutes
      ASSET_CACHE_MAX_SIZE: 100,
      TICKET_CACHE_DURATION: 15 * 60 * 1000,
      TICKET_CACHE_MAX_SIZE: 50,
    },
    VIRTUAL_SCROLL: {
      OVERSCAN: 10,
      ENABLE_MONITORING: true,
    },
    BACKGROUND: {
      ENABLE_PREFETCH: true,
      PREFETCH_DELAY: 1000,
      MAX_CONCURRENT: 3,
    },
    PAGINATION: {
      DEFAULT_SIZE: 48,
      MAX_SIZE: 200,
    },
  },

  // Memory efficient preset
  MEMORY_EFFICIENT: {
    CACHE: {
      ASSET_CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
      ASSET_CACHE_MAX_SIZE: 20,
      TICKET_CACHE_DURATION: 5 * 60 * 1000,
      TICKET_CACHE_MAX_SIZE: 15,
    },
    VIRTUAL_SCROLL: {
      OVERSCAN: 3,
      ENABLE_MONITORING: false,
    },
    BACKGROUND: {
      ENABLE_PREFETCH: false,
      MAX_CONCURRENT: 1,
    },
    PAGINATION: {
      DEFAULT_SIZE: 12,
      MAX_SIZE: 50,
    },
  },

  // Balanced preset (default)
  BALANCED: {
    ...PERFORMANCE_CONFIG,
  },
};

// Get current performance preset
export const getPerformancePreset = (presetName = 'BALANCED') => {
  return PERFORMANCE_PRESETS[presetName] || PERFORMANCE_PRESETS.BALANCED;
};

// Performance utility functions
export const PerformanceUtils = {
  // Measure execution time
  measure: (name, fn) => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    if (PERFORMANCE_CONFIG.MONITORING.CONSOLE_LOGGING) {
      console.log(`${name} took ${(end - start).toFixed(2)}ms`);
    }
    
    return { result, duration: end - start };
  },

  // Debounce function
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle function
  throttle: (func, limit) => {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Check if device is low-end
  isLowEndDevice: () => {
    if (typeof navigator !== 'undefined') {
      const hardwareConcurrency = navigator.hardwareConcurrency || 4;
      const memory = navigator.deviceMemory || 4;
      
      return hardwareConcurrency < 4 || memory < 4;
    }
    return false;
  },

  // Get optimal performance preset based on device
  getOptimalPreset: () => {
    if (PerformanceUtils.isLowEndDevice()) {
      return 'MEMORY_EFFICIENT';
    }
    
    // Check for large datasets
    const urlParams = new URLSearchParams(window.location.search);
    const hasLargeDataset = urlParams.get('large') === 'true';
    
    if (hasLargeDataset) {
      return 'HIGH_PERFORMANCE';
    }
    
    return 'BALANCED';
  },
};

export default PERFORMANCE_CONFIG;

