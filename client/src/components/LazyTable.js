"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useIntersectionObserver } from "../hooks/useLazyLoad";

const LazyTable = ({ 
  data = [], 
  columns = [], 
  pageSize = 50,
  className = "",
  onRowClick = null,
  ...props 
}) => {
  const [visibleData, setVisibleData] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [tableRef, isIntersecting] = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: "100px",
  });

  const loadMoreData = useCallback(() => {
    if (isLoading) return;
    
    setIsLoading(true);
    const startIndex = currentPage * pageSize;
    const endIndex = startIndex + pageSize;
    const newData = data.slice(startIndex, endIndex);
    
    setVisibleData(prev => [...prev, ...newData]);
    setCurrentPage(prev => prev + 1);
    setIsLoading(false);
  }, [data, currentPage, pageSize, isLoading]);

  useEffect(() => {
    if (isIntersecting && visibleData.length < data.length) {
      loadMoreData();
    }
  }, [isIntersecting, visibleData.length, data.length, loadMoreData]);

  useEffect(() => {
    // Reset when data changes
    setVisibleData(data.slice(0, pageSize));
    setCurrentPage(1);
  }, [data, pageSize]);

  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 100 && !isLoading) {
      loadMoreData();
    }
  }, [loadMoreData, isLoading]);

  if (!data || data.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        No data available
      </div>
    );
  }

  return (
    <div className={`overflow-auto ${className}`} onScroll={handleScroll}>
      <table className="min-w-full divide-y divide-gray-200" {...props}>
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {visibleData.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              onClick={() => onRowClick && onRowClick(row)}
              className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
            >
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                >
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      {isLoading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading more...</span>
        </div>
      )}
      
      {visibleData.length >= data.length && data.length > 0 && (
        <div className="text-center py-4 text-gray-500">
          All data loaded
        </div>
      )}
      
      <div ref={tableRef} className="h-4" />
    </div>
  );
};

export default LazyTable;
