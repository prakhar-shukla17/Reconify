import React, { memo, useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { createPerformanceMonitor, createCache, throttle, debounce } from '../utils/performance.js';

// Performance-optimized wrapper component
export const PerformanceWrapper = memo(({ 
  children, 
  cacheKey, 
  dependencies = [], 
  enableMemoization = true,
  enableCaching = true,
  cacheOptions = {}
}) => {
  const cache = useRef(createCache(cacheOptions));
  const monitor = useRef(createPerformanceMonitor());
  
  // Memoized children with performance monitoring
  const memoizedChildren = useMemo(() => {
    if (!enableMemoization) return children;
    
    return monitor.current.measure('render', () => children);
  }, [children, enableMemoization, ...dependencies]);
  
  // Cache management
  useEffect(() => {
    if (enableCaching && cacheKey) {
      cache.current.set(cacheKey, memoizedChildren);
    }
    
    return () => {
      if (enableCaching) {
        cache.current.destroy();
      }
    };
  }, [cacheKey, memoizedChildren, enableCaching]);
  
  return memoizedChildren;
});

// Virtualized list component for large datasets
export const VirtualizedList = memo(({ 
  items, 
  renderItem, 
  itemHeight = 100, 
  containerHeight = 400,
  overscan = 5,
  className = ''
}) => {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  
  // Calculate visible range
  const visibleRange = useMemo(() => {
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
  }, [items, scrollTop, itemHeight, containerHeight, overscan]);
  
  // Handle scroll with throttling
  const handleScroll = useCallback(
    throttle((event) => {
      setScrollTop(event.target.scrollTop);
    }, 16), // ~60fps
    []
  );
  
  // Total height for virtual scrolling
  const totalHeight = useMemo(() => items.length * itemHeight, [items.length, itemHeight]);
  
  return (
    <div
      ref={containerRef}
      className={`virtualized-list ${className}`}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative'
      }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: visibleRange.offsetY,
            left: 0,
            right: 0
          }}
        >
          {visibleRange.visibleItems.map((item, index) => 
            renderItem(item, visibleRange.startIndex + index)
          )}
        </div>
      </div>
    </div>
  );
});

// Lazy image component with intersection observer
export const LazyImage = memo(({ 
  src, 
  alt, 
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YWFhYSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+',
  className = '',
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);
  
  useEffect(() => {
    if (!imgRef.current) return;
    
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.unobserve(entry.target);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );
    
    observerRef.current.observe(imgRef.current);
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);
  
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);
  
  return (
    <img
      ref={imgRef}
      src={isInView ? src : placeholder}
      alt={alt}
      className={`lazy-image ${isLoaded ? 'loaded' : ''} ${className}`}
      onLoad={handleLoad}
      style={{
        opacity: isLoaded ? 1 : 0.7,
        transition: 'opacity 0.3s ease-in-out'
      }}
      {...props}
    />
  );
});

// Debounced input component
export const DebouncedInput = memo(({ 
  value, 
  onChange, 
  delay = 300, 
  placeholder = '',
  className = '',
  ...props 
}) => {
  const [localValue, setLocalValue] = useState(value);
  
  // Debounced onChange handler
  const debouncedOnChange = useCallback(
    debounce((newValue) => {
      onChange?.(newValue);
    }, delay),
    [onChange, delay]
  );
  
  // Handle local value change
  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedOnChange(newValue);
  }, [debouncedOnChange]);
  
  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  return (
    <input
      type="text"
      value={localValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={`debounced-input ${className}`}
      {...props}
    />
  );
});

// Performance monitoring component
export const PerformanceMonitor = memo(({ 
  children, 
  name = 'component',
  enableMonitoring = true 
}) => {
  const monitor = useRef(createPerformanceMonitor());
  const renderStart = useRef(performance.now());
  
  useEffect(() => {
    if (enableMonitoring) {
      const renderTime = performance.now() - renderStart.current;
      monitor.current.measure(name, () => renderTime);
    }
  }, [name, enableMonitoring]);
  
  // Performance metrics display (for development)
  const metrics = monitor.current.getMetrics();
  
  if (process.env.NODE_ENV === 'development' && enableMonitoring) {
    return (
      <div className="performance-monitor">
        {children}
        <div className="performance-metrics" style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          zIndex: 9999
        }}>
          <div>Render: {metrics.averageRenderTime.toFixed(2)}ms</div>
          <div>API: {metrics.averageApiCallTime.toFixed(2)}ms</div>
          <div>Errors: {metrics.errors.length}</div>
        </div>
      </div>
    );
  }
  
  return children;
});

// Infinite scroll component
export const InfiniteScroll = memo(({ 
  items, 
  renderItem, 
  onLoadMore, 
  hasMore = true,
  threshold = 100,
  className = ''
}) => {
  const containerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!containerRef.current || !hasMore) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && hasMore && !isLoading) {
            setIsLoading(true);
            onLoadMore?.().finally(() => setIsLoading(false));
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: `${threshold}px`
      }
    );
    
    observer.observe(containerRef.current);
    
    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore, threshold]);
  
  return (
    <div className={`infinite-scroll ${className}`}>
      {items.map((item, index) => renderItem(item, index))}
      
      {hasMore && (
        <div ref={containerRef} className="load-more-trigger">
          {isLoading ? (
            <div className="loading-spinner">Loading...</div>
          ) : (
            <div className="scroll-to-load">Scroll to load more</div>
          )}
        </div>
      )}
    </div>
  );
});

// Export all components
export default {
  PerformanceWrapper,
  VirtualizedList,
  LazyImage,
  DebouncedInput,
  PerformanceMonitor,
  InfiniteScroll
};
