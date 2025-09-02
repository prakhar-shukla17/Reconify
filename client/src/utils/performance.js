// Debounce function to limit how often a function can be called
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};

// Throttle function to limit function execution rate
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Advanced memoization with cache size limit and TTL
export const memoize = (fn, options = {}) => {
  const {
    maxSize = 100,
    ttl = 5 * 60 * 1000, // 5 minutes default
    keyGenerator = (...args) => JSON.stringify(args)
  } = options;

  const cache = new Map();
  const timestamps = new Map();

  return function memoizedFunction(...args) {
    const key = keyGenerator(...args);
    const now = Date.now();

    // Check if cache entry exists and is still valid
    if (cache.has(key)) {
      const timestamp = timestamps.get(key);
      if (now - timestamp < ttl) {
        return cache.get(key);
      } else {
        // Remove expired entry
        cache.delete(key);
        timestamps.delete(key);
      }
    }

    // If cache is full, remove oldest entry
    if (cache.size >= maxSize) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
      timestamps.delete(oldestKey);
    }

    // Execute function and cache result
    const result = fn.apply(this, args);
    cache.set(key, result);
    timestamps.set(key, now);

    return result;
  };
};

// Request batching utility
export const createRequestBatcher = (batchSize = 10, delay = 50) => {
  let batch = [];
  let timeout = null;

  const processBatch = () => {
    if (batch.length > 0) {
      const currentBatch = batch.splice(0, batchSize);
      // Process batch here - you can customize this
      currentBatch.forEach(request => {
        if (request.resolve) request.resolve();
      });
    }
    timeout = null;
  };

  return (request) => {
    return new Promise((resolve) => {
      batch.push({ ...request, resolve });
      
      if (batch.length >= batchSize) {
        processBatch();
      } else if (!timeout) {
        timeout = setTimeout(processBatch, delay);
      }
    });
  };
};

// Virtual scrolling helper
export const createVirtualScroller = (items, itemHeight, containerHeight) => {
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const overscan = 5; // Render extra items for smooth scrolling
  
  return {
    getVisibleRange: (scrollTop) => {
      const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      const endIndex = Math.min(
        items.length - 1,
        Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
      );
      
      return {
        startIndex,
        endIndex,
        visibleItems: items.slice(startIndex, endIndex + 1),
        offsetY: startIndex * itemHeight
      };
    },
    
    getTotalHeight: () => items.length * itemHeight
  };
};

// Image lazy loading utility
export const createImageLazyLoader = (options = {}) => {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    fallbackSrc = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YWFhYSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+'
  } = options;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src || img.src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    },
    { threshold, rootMargin }
  );

  return {
    observe: (img) => {
      if (img.dataset.src) {
        img.src = fallbackSrc;
        img.classList.add('lazy');
        observer.observe(img);
      }
    },
    disconnect: () => observer.disconnect()
  };
};

// Performance monitoring utility
export const createPerformanceMonitor = () => {
  const metrics = {
    renderTimes: [],
    apiCallTimes: [],
    memoryUsage: [],
    errors: []
  };

  const measure = (name, fn) => {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      metrics.renderTimes.push({ name, duration, timestamp: Date.now() });
      return result;
    } catch (error) {
      metrics.errors.push({ name, error: error.message, timestamp: Date.now() });
      throw error;
    }
  };

  const measureAsync = async (name, fn) => {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      metrics.apiCallTimes.push({ name, duration, timestamp: Date.now() });
      return result;
    } catch (error) {
      metrics.errors.push({ name, error: error.message, timestamp: Date.now() });
      throw error;
    }
  };

  const getMetrics = () => ({
    ...metrics,
    averageRenderTime: metrics.renderTimes.length > 0 
      ? metrics.renderTimes.reduce((sum, m) => sum + m.duration, 0) / metrics.renderTimes.length 
      : 0,
    averageApiCallTime: metrics.apiCallTimes.length > 0 
      ? metrics.apiCallTimes.reduce((sum, m) => sum + m.duration, 0) / metrics.apiCallTimes.length 
      : 0
  });

  return { measure, measureAsync, getMetrics };
};

// Cache utility with automatic cleanup
export const createCache = (options = {}) => {
  const {
    maxSize = 100,
    ttl = 5 * 60 * 1000,
    cleanupInterval = 60 * 1000
  } = options;

  const cache = new Map();
  const timestamps = new Map();

  // Cleanup expired entries
  const cleanup = () => {
    const now = Date.now();
    for (const [key, timestamp] of timestamps.entries()) {
      if (now - timestamp > ttl) {
        cache.delete(key);
        timestamps.delete(key);
      }
    }
  };

  // Set up periodic cleanup
  const cleanupTimer = setInterval(cleanup, cleanupInterval);

  return {
    get: (key) => {
      const timestamp = timestamps.get(key);
      if (timestamp && Date.now() - timestamp < ttl) {
        return cache.get(key);
      }
      return undefined;
    },
    
    set: (key, value) => {
      if (cache.size >= maxSize) {
        const oldestKey = cache.keys().next().value;
        cache.delete(oldestKey);
        timestamps.delete(oldestKey);
      }
      cache.set(key, value);
      timestamps.set(key, Date.now());
    },
    
    has: (key) => {
      const timestamp = timestamps.get(key);
      return timestamp && Date.now() - timestamp < ttl;
    },
    
    clear: () => {
      cache.clear();
      timestamps.clear();
    },
    
    destroy: () => {
      clearInterval(cleanupTimer);
      cache.clear();
      timestamps.clear();
    }
  };
};
