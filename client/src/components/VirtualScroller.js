/**
 * VirtualScroller Component
 * 
 * Provides virtual scrolling for large datasets to improve performance:
 * - Only renders visible items
 * - Smooth scrolling with minimal memory usage
 * - Configurable item heights
 * - Performance monitoring
 */
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ChevronUp, ChevronDown, ArrowUp, ArrowDown } from "lucide-react";

const VirtualScroller = ({
  items = [],
  itemHeight = 60,
  containerHeight = 400,
  overscan = 5,
  renderItem,
  onScroll,
  className = "",
  enablePerformanceMonitoring = true
}) => {
  // State for virtual scrolling
  const [scrollTop, setScrollTop] = useState(0);
  const [containerRef, setContainerRef] = useState(null);
  const [isScrolling, setIsScrolling] = useState(false);
  
  // Performance monitoring
  const [performanceMetrics, setPerformanceMetrics] = useState({
    renderCount: 0,
    scrollEvents: 0,
    averageRenderTime: 0
  });
  
  const renderStartTime = useRef(performance.now());
  const scrollTimeoutRef = useRef(null);
  const lastScrollTime = useRef(0);

  // Calculate virtual scrolling dimensions
  const totalHeight = items.length * itemHeight;
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  // Get visible items
  const visibleItems = useMemo(() => {
    const start = performance.now();
    
    const visible = items.slice(startIndex, endIndex).map((item, index) => ({
      ...item,
      virtualIndex: startIndex + index,
      style: {
        position: 'absolute',
        top: (startIndex + index) * itemHeight,
        height: itemHeight,
        width: '100%'
      }
    }));

    const renderTime = performance.now() - start;
    
    if (enablePerformanceMonitoring) {
      setPerformanceMetrics(prev => ({
        ...prev,
        renderCount: visible.length,
        averageRenderTime: (prev.averageRenderTime + renderTime) / 2
      }));
    }

    return visible;
  }, [items, startIndex, endIndex, itemHeight, enablePerformanceMonitoring]);

  // Handle scroll events with throttling
  const handleScroll = useCallback((event) => {
    const currentTime = performance.now();
    
    // Throttle scroll events for better performance
    if (currentTime - lastScrollTime.current < 16) { // ~60fps
      return;
    }
    
    lastScrollTime.current = currentTime;
    const newScrollTop = event.target.scrollTop;
    
    setScrollTop(newScrollTop);
    setIsScrolling(true);
    
    if (onScroll) {
      onScroll(newScrollTop);
    }

    // Clear scrolling state after scroll ends
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, [onScroll]);

  // Scroll to specific item
  const scrollToItem = useCallback((index) => {
    if (containerRef) {
      const targetScrollTop = index * itemHeight;
      containerRef.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
    }
  }, [containerRef, itemHeight]);

  // Scroll to top/bottom
  const scrollToTop = useCallback(() => {
    if (containerRef) {
      containerRef.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [containerRef]);

  const scrollToBottom = useCallback(() => {
    if (containerRef) {
      containerRef.scrollTo({ top: totalHeight, behavior: 'smooth' });
    }
  }, [containerRef, totalHeight]);

  // Performance monitoring effect
  useEffect(() => {
    if (enablePerformanceMonitoring) {
      const renderTime = performance.now() - renderStartTime.current;
      setPerformanceMetrics(prev => ({
        ...prev,
        averageRenderTime: (prev.averageRenderTime + renderTime) / 2
      }));
    }
  }, [visibleItems, enablePerformanceMonitoring]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`virtual-scroller ${className}`}>
      {/* Performance Metrics (if enabled) */}
      {enablePerformanceMonitoring && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <span className="font-medium text-blue-700">Visible Items:</span>
              <p className="text-blue-900 font-bold">{performanceMetrics.renderCount}</p>
            </div>
            <div>
              <span className="font-medium text-blue-700">Scroll Events:</span>
              <p className="text-blue-900 font-bold">{performanceMetrics.scrollEvents}</p>
            </div>
            <div>
              <span className="font-medium text-blue-700">Avg Render:</span>
              <p className="text-blue-900 font-bold">{performanceMetrics.averageRenderTime.toFixed(2)}ms</p>
            </div>
          </div>
        </div>
      )}

      {/* Scroll Controls */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={scrollToTop}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Scroll to top"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            onClick={scrollToBottom}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Scroll to bottom"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        </div>
        
        <div className="text-sm text-gray-600">
          Showing {startIndex + 1}-{endIndex} of {items.length} items
        </div>
      </div>

      {/* Virtual Scrolling Container */}
      <div
        ref={setContainerRef}
        className="border border-gray-200 rounded-lg overflow-auto bg-white"
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        <div
          className="relative"
          style={{ height: totalHeight }}
        >
          {visibleItems.map((item) => (
            <div
              key={item.virtualIndex}
              style={item.style}
              className={`virtual-item ${isScrolling ? 'scrolling' : ''}`}
            >
              {renderItem(item, item.virtualIndex)}
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Position Indicator */}
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-2">
          <span>Scroll Position:</span>
          <span className="font-mono">
            {Math.round(scrollTop)} / {totalHeight}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span>Progress:</span>
          <span className="font-mono">
            {totalHeight > 0 ? Math.round((scrollTop / totalHeight) * 100) : 0}%
          </span>
        </div>
      </div>

      {/* Quick Navigation */}
      {items.length > 100 && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <div className="text-xs font-medium text-gray-700 mb-2">Quick Navigation:</div>
          <div className="flex flex-wrap gap-2">
            {[0, Math.floor(items.length * 0.25), Math.floor(items.length * 0.5), Math.floor(items.length * 0.75), items.length - 1].map((index) => (
              <button
                key={index}
                onClick={() => scrollToItem(index)}
                className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                {index === 0 ? 'Start' : 
                 index === items.length - 1 ? 'End' : 
                 `${Math.round((index / items.length) * 100)}%`}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualScroller;


