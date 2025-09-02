import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createVirtualScroller, memoize, debounce } from '../utils/performance.js';

// Enhanced lazy loading hook with performance optimizations
export const useLazyLoad = (items, options = {}) => {
  const {
    itemHeight = 100,
    containerHeight = 400,
    overscan = 5,
    enableVirtualization = true,
    enableMemoization = true,
    debounceDelay = 100
  } = options;

  const [visibleItems, setVisibleItems] = useState([]);
  const [scrollTop, setScrollTop] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef(null);
  const observerRef = useRef(null);

  // Memoized virtual scroller
  const virtualScroller = useMemo(() => {
    if (!enableVirtualization || !items || items.length === 0) return null;
    return createVirtualScroller(items, itemHeight, containerHeight);
  }, [items, itemHeight, containerHeight, enableVirtualization]);

  // Memoized visible range calculation
  const getVisibleRange = useCallback(
    memoize((scrollTop, items) => {
      if (!virtualScroller || !items || items.length === 0) {
        return { startIndex: 0, endIndex: 0, visibleItems: [], offsetY: 0 };
      }
      return virtualScroller.getVisibleRange(scrollTop);
    }, { maxSize: 50, ttl: 1000 }),
    [virtualScroller]
  );

  // Debounced scroll handler
  const handleScroll = useCallback(
    debounce((event) => {
      const newScrollTop = event.target.scrollTop;
      setScrollTop(newScrollTop);
    }, debounceDelay),
    [debounceDelay]
  );

  // Update visible items when scroll position or items change
  useEffect(() => {
    if (!items || items.length === 0) {
      setVisibleItems([]);
      return;
    }

    if (enableVirtualization && virtualScroller) {
      const { visibleItems: newVisibleItems } = getVisibleRange(scrollTop, items);
      setVisibleItems(newVisibleItems);
    } else {
      setVisibleItems(items);
    }
  }, [items, scrollTop, enableVirtualization, virtualScroller, getVisibleRange]);

  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (!enableVirtualization || !containerRef.current) return;

    const container = containerRef.current;
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Trigger data loading if needed
            setIsLoading(false);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    observerRef.current.observe(container);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [enableVirtualization]);

  // Calculate total height for virtual scrolling
  const totalHeight = useMemo(() => {
    if (!enableVirtualization || !virtualScroller) return 'auto';
    return virtualScroller.getTotalHeight();
  }, [enableVirtualization, virtualScroller]);

  // Memoized scroll container styles
  const scrollContainerStyles = useMemo(() => ({
    height: containerHeight,
    overflow: 'auto',
    position: 'relative'
  }), [containerHeight]);

  // Memoized content wrapper styles
  const contentWrapperStyles = useMemo(() => ({
    height: totalHeight,
    position: 'relative'
  }), [totalHeight]);

  // Memoized visible content styles
  const visibleContentStyles = useMemo(() => {
    if (!enableVirtualization || !virtualScroller) return {};
    
    const { offsetY } = getVisibleRange(scrollTop, items);
    return {
      position: 'absolute',
      top: offsetY,
      left: 0,
      right: 0
    };
  }, [enableVirtualization, virtualScroller, scrollTop, items, getVisibleRange]);

  // Enhanced scroll to item function
  const scrollToItem = useCallback((index) => {
    if (!containerRef.current || !enableVirtualization) return;
    
    const targetScrollTop = index * itemHeight;
    containerRef.current.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth'
    });
  }, [itemHeight, enableVirtualization]);

  // Enhanced scroll to top function
  const scrollToTop = useCallback(() => {
    if (!containerRef.current) return;
    
    containerRef.current.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  // Get item index by scroll position
  const getItemIndexAtScrollTop = useCallback((scrollTop) => {
    if (!enableVirtualization) return 0;
    return Math.floor(scrollTop / itemHeight);
  }, [enableVirtualization, itemHeight]);

  // Check if item is visible
  const isItemVisible = useCallback((index) => {
    if (!enableVirtualization) return true;
    
    const { startIndex, endIndex } = getVisibleRange(scrollTop, items);
    return index >= startIndex && index <= endIndex;
  }, [enableVirtualization, scrollTop, items, getVisibleRange]);

  // Performance metrics
  const performanceMetrics = useMemo(() => {
    if (!enableVirtualization) return null;
    
    const visibleCount = visibleItems.length;
    const totalCount = items?.length || 0;
    const renderRatio = totalCount > 0 ? (visibleCount / totalCount) * 100 : 0;
    
    return {
      visibleCount,
      totalCount,
      renderRatio: renderRatio.toFixed(2),
      scrollTop,
      itemHeight,
      containerHeight
    };
  }, [enableVirtualization, visibleItems.length, items?.length, scrollTop, itemHeight, containerHeight]);

  return {
    // State
    visibleItems,
    scrollTop,
    isLoading,
    
    // Refs
    containerRef,
    
    // Styles
    scrollContainerStyles,
    contentWrapperStyles,
    visibleContentStyles,
    
    // Functions
    handleScroll,
    scrollToItem,
    scrollToTop,
    getItemIndexAtScrollTop,
    isItemVisible,
    
    // Performance
    performanceMetrics,
    totalHeight,
    
    // Configuration
    enableVirtualization,
    itemHeight,
    containerHeight
  };
};

// Specialized hook for table data with row virtualization
export const useTableLazyLoad = (data, options = {}) => {
  const {
    rowHeight = 50,
    containerHeight = 400,
    enableSorting = true,
    enableFiltering = true,
    enablePagination = true,
    pageSize = 20
  } = options;

  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filters, setFilters] = useState({});
  const [filteredData, setFilteredData] = useState([]);

  // Memoized filtered and sorted data
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply filters
    if (enableFiltering && Object.keys(filters).length > 0) {
      result = result.filter(item => {
        return Object.entries(filters).every(([key, value]) => {
          if (!value || value === '') return true;
          const itemValue = item[key];
          if (typeof itemValue === 'string') {
            return itemValue.toLowerCase().includes(value.toLowerCase());
          }
          return itemValue === value;
        });
      });
    }

    // Apply sorting
    if (enableSorting && sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, filters, sortConfig, enableFiltering, enableSorting]);

  // Paginated data
  const paginatedData = useMemo(() => {
    if (!enablePagination) return processedData;
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return processedData.slice(startIndex, endIndex);
  }, [processedData, currentPage, pageSize, enablePagination]);

  // Use the base lazy load hook for virtualization
  const lazyLoadProps = useLazyLoad(paginatedData, {
    itemHeight: rowHeight,
    containerHeight,
    enableVirtualization: true
  });

  // Enhanced sorting function
  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1); // Reset to first page when sorting
  }, []);

  // Enhanced filtering function
  const handleFilter = useCallback((newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filtering
  }, []);

  // Pagination functions
  const goToPage = useCallback((page) => {
    setCurrentPage(Math.max(1, Math.min(page, Math.ceil(processedData.length / pageSize)));
  }, [processedData.length, pageSize]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  // Pagination info
  const paginationInfo = useMemo(() => {
    if (!enablePagination) return null;
    
    const totalPages = Math.ceil(processedData.length / pageSize);
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, processedData.length);
    
    return {
      currentPage,
      totalPages,
      totalItems: processedData.length,
      startItem,
      endItem,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    };
  }, [enablePagination, currentPage, pageSize, processedData.length]);

  return {
    ...lazyLoadProps,
    
    // Data
    data: paginatedData,
    filteredData: processedData,
    
    // Sorting
    sortConfig,
    handleSort,
    
    // Filtering
    filters,
    handleFilter,
    
    // Pagination
    paginationInfo,
    goToPage,
    nextPage,
    prevPage,
    
    // Configuration
    enableSorting,
    enableFiltering,
    enablePagination,
    pageSize
  };
};
