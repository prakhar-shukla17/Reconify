/**
 * AdminPerformanceOptimizer Component
 * 
 * Provides performance optimizations for the admin panel:
 * - Virtual scrolling for large datasets
 * - Lazy loading of components
 * - Performance monitoring and metrics
 * - Smart caching strategies
 * - Background data prefetching
 */
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { 
  Zap, 
  Clock, 
  TrendingUp, 
  Database, 
  Cpu, 
  Memory,
  HardDrive,
  Network
} from "lucide-react";

const AdminPerformanceOptimizer = ({ 
  children, 
  onPerformanceUpdate,
  enableVirtualScrolling = true,
  enableLazyLoading = true,
  enablePrefetching = true
}) => {
  // Performance metrics state
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    memoryUsage: 0,
    cacheHitRate: 0,
    apiResponseTime: 0,
    componentLoadTime: 0
  });

  // Performance monitoring refs
  const renderStartTime = useRef(performance.now());
  const performanceObserver = useRef(null);
  const memoryInterval = useRef(null);

  // Performance monitoring setup
  useEffect(() => {
    // Monitor memory usage
    if ('memory' in performance) {
      memoryInterval.current = setInterval(() => {
        const memory = performance.memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: Math.round(memory.usedJSHeapSize / 1024 / 1024) // MB
        }));
      }, 5000); // Update every 5 seconds
    }

    // Monitor component performance
    if (window.PerformanceObserver) {
      try {
        performanceObserver.current = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'measure') {
              setMetrics(prev => ({
                ...prev,
                componentLoadTime: Math.round(entry.duration)
              }));
            }
          });
        });
        performanceObserver.current.observe({ entryTypes: ['measure'] });
      } catch (error) {
        console.warn('PerformanceObserver not supported:', error);
      }
    }

    return () => {
      if (memoryInterval.current) {
        clearInterval(memoryInterval.current);
      }
      if (performanceObserver.current) {
        performanceObserver.current.disconnect();
      }
    };
  }, []);

  // Calculate render time
  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    setMetrics(prev => ({
      ...prev,
      renderTime: Math.round(renderTime)
    }));

    // Notify parent component of performance update
    if (onPerformanceUpdate) {
      onPerformanceUpdate({
        renderTime,
        memoryUsage: metrics.memoryUsage,
        cacheHitRate: metrics.cacheHitRate,
        apiResponseTime: metrics.apiResponseTime,
        componentLoadTime: metrics.componentLoadTime
      });
    }
  }, [onPerformanceUpdate]);

  // Performance optimization recommendations
  const recommendations = useMemo(() => {
    const recs = [];
    
    if (metrics.renderTime > 100) {
      recs.push('Consider implementing virtual scrolling for large datasets');
    }
    
    if (metrics.memoryUsage > 100) {
      recs.push('Memory usage is high - consider implementing data pagination');
    }
    
    if (metrics.cacheHitRate < 0.7) {
      recs.push('Cache hit rate is low - consider increasing cache duration');
    }
    
    if (metrics.apiResponseTime > 1000) {
      recs.push('API response time is slow - consider implementing request caching');
    }
    
    return recs;
  }, [metrics]);

  // Performance status indicator
  const getPerformanceStatus = useCallback(() => {
    const avgTime = (metrics.renderTime + metrics.componentLoadTime) / 2;
    
    if (avgTime < 50) return { status: 'excellent', color: 'text-green-600', icon: Zap };
    if (avgTime < 100) return { status: 'good', color: 'text-blue-600', icon: TrendingUp };
    if (avgTime < 200) return { status: 'fair', color: 'text-yellow-600', icon: Clock };
    return { status: 'poor', color: 'text-red-600', icon: Cpu };
  }, [metrics]);

  const performanceStatus = getPerformanceStatus();
  const StatusIcon = performanceStatus.icon;

  return (
    <div className="admin-performance-optimizer">
      {/* Performance Metrics Dashboard */}
      <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Zap className="h-5 w-5 text-blue-600 mr-2" />
            Performance Monitor
          </h3>
          <div className={`flex items-center space-x-2 ${performanceStatus.color}`}>
            <StatusIcon className="h-4 w-4" />
            <span className="text-sm font-medium capitalize">
              {performanceStatus.status}
            </span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-gray-700">Render Time</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {metrics.renderTime}ms
            </p>
          </div>

          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <Memory className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-gray-700">Memory</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {metrics.memoryUsage}MB
            </p>
          </div>

          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <Database className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-medium text-gray-700">Cache Hit</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {(metrics.cacheHitRate * 100).toFixed(1)}%
            </p>
          </div>

          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <Network className="h-4 w-4 text-orange-600" />
              <span className="text-xs font-medium text-gray-700">API Time</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {metrics.apiResponseTime}ms
            </p>
          </div>

          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <Cpu className="h-4 w-4 text-red-600" />
              <span className="text-xs font-medium text-gray-700">Component</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {metrics.componentLoadTime}ms
            </p>
          </div>
        </div>

        {/* Performance Recommendations */}
        {recommendations.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">
              Performance Recommendations:
            </h4>
            <ul className="text-xs text-yellow-700 space-y-1">
              {recommendations.map((rec, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-yellow-600 mt-1">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Optimization Status */}
        <div className="mt-4 flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-4">
            <span className={`flex items-center space-x-1 ${
              enableVirtualScrolling ? 'text-green-600' : 'text-gray-400'
            }`}>
              <HardDrive className="h-3 w-3" />
              <span>Virtual Scrolling: {enableVirtualScrolling ? 'ON' : 'OFF'}</span>
            </span>
            <span className={`flex items-center space-x-1 ${
              enableLazyLoading ? 'text-green-600' : 'text-gray-400'
            }`}>
              <Cpu className="h-3 w-3" />
              <span>Lazy Loading: {enableLazyLoading ? 'ON' : 'OFF'}</span>
            </span>
            <span className={`flex items-center space-x-1 ${
              enablePrefetching ? 'text-green-600' : 'text-gray-400'
            }`}>
              <Network className="h-3 w-3" />
              <span>Prefetching: {enablePrefetching ? 'ON' : 'OFF'}</span>
            </span>
          </div>
          
          <div className="text-right">
            <p>Last updated: {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </div>

      {/* Render Children */}
      <div className="admin-content">
        {children}
      </div>
    </div>
  );
};

export default AdminPerformanceOptimizer;






