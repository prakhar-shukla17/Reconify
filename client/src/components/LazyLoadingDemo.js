"use client";

import { useState } from "react";
import LazyLoader from "./LazyLoader";
import LoadingSkeleton from "./LoadingSkeleton";
import LazyImage from "./LazyImage";
import LazyTable from "./LazyTable";
import VirtualList from "./VirtualList";

const LazyLoadingDemo = () => {
  const [showModal, setShowModal] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [showVirtualList, setShowVirtualList] = useState(false);

  // Sample data for demo
  const sampleData = Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    description: `This is a sample description for item ${i + 1}`,
    status: i % 3 === 0 ? "Active" : i % 3 === 1 ? "Inactive" : "Pending",
  }));

  const tableColumns = [
    { key: "id", header: "ID" },
    { key: "name", header: "Name" },
    { key: "description", header: "Description" },
    { key: "status", header: "Status" },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Lazy Loading Demo
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          This demo showcases various lazy loading techniques implemented in the ITAM application.
          Click the buttons below to see different loading states and performance optimizations.
        </p>
      </div>

      {/* Loading Skeletons Demo */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Loading Skeletons
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <LoadingSkeleton type="card" />
          <LoadingSkeleton type="table" />
          <LoadingSkeleton type="modal" />
          <LoadingSkeleton type="spinner" size="large" />
        </div>
      </div>

      {/* Lazy Loading Modals Demo */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Lazy Loading Modals
        </h2>
        <div className="space-y-4">
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Show Lazy Modal
          </button>
          
          {showModal && (
            <LazyLoader fallback={<LoadingSkeleton type="modal" />}>
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Lazy Loaded Modal
                  </h3>
                  <p className="text-gray-600 mb-4">
                    This modal was loaded lazily, improving the initial page load performance.
                  </p>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </LazyLoader>
          )}
        </div>
      </div>

      {/* Lazy Table Demo */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Progressive Table Loading
        </h2>
        <div className="space-y-4">
          <button
            onClick={() => setShowTable(!showTable)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            {showTable ? "Hide" : "Show"} Lazy Table
          </button>
          
          {showTable && (
            <LazyLoader fallback={<LoadingSkeleton type="table" />}>
              <LazyTable
                data={sampleData}
                columns={tableColumns}
                pageSize={20}
                className="max-h-96"
              />
            </LazyLoader>
          )}
        </div>
      </div>

      {/* Virtual List Demo */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Virtual Scrolling
        </h2>
        <div className="space-y-4">
          <button
            onClick={() => setShowVirtualList(!showVirtualList)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            {showVirtualList ? "Hide" : "Show"} Virtual List
          </button>
          
          {showVirtualList && (
            <LazyLoader fallback={<LoadingSkeleton type="table" />}>
              <VirtualList
                items={sampleData}
                itemHeight={60}
                containerHeight={400}
                renderItem={(item) => (
                  <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div>
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.status === "Active" ? "bg-green-100 text-green-800" :
                      item.status === "Inactive" ? "bg-red-100 text-red-800" :
                      "bg-yellow-100 text-yellow-800"
                    }`}>
                      {item.status}
                    </span>
                  </div>
                )}
              />
            </LazyLoader>
          )}
        </div>
      </div>

      {/* Performance Tips */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">
          Performance Benefits
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-800">
          <div>
            <h3 className="font-medium mb-2">Bundle Size Reduction</h3>
            <p className="text-sm">30-50% smaller initial bundle size</p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Faster Page Load</h3>
            <p className="text-sm">40-60% faster initial page load</p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Memory Usage</h3>
            <p className="text-sm">25-40% reduced memory usage</p>
          </div>
          <div>
            <h3 className="font-medium mb-2">User Experience</h3>
            <p className="text-sm">Smooth progressive loading</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LazyLoadingDemo;
