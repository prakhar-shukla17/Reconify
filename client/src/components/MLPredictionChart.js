"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Activity,
  BarChart3,
} from "lucide-react";

const MLPredictionChart = ({ predictions, title, type = "storage" }) => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (predictions) {
      generateChartData();
    }
  }, [predictions]);

  const generateChartData = () => {
    // Generate sample data points for visualization
    const data = [];
    const currentValue = getCurrentValue();

    // Generate 30 days of historical simulation
    for (let i = 29; i >= 0; i--) {
      const dayOffset = i;
      let value;

      if (type === "storage") {
        // Simulate storage growth
        const growthRate = predictions.storage_growth_acceleration || 0.5;
        value = Math.max(
          0,
          currentValue - dayOffset * growthRate + (Math.random() - 0.5) * 5
        );
      } else if (type === "memory") {
        // Simulate memory usage
        const baseValue = currentValue - dayOffset * 0.3;
        value = Math.max(0, baseValue + (Math.random() - 0.5) * 10);
      } else if (type === "cpu") {
        // Simulate CPU usage with more volatility
        const baseValue = currentValue - dayOffset * 0.2;
        value = Math.max(0, baseValue + (Math.random() - 0.5) * 15);
      } else {
        value = Math.max(
          0,
          currentValue - dayOffset * 0.4 + (Math.random() - 0.5) * 8
        );
      }

      data.push({
        day: i === 0 ? "Today" : `${i}d ago`,
        value: Math.round(value * 10) / 10,
        predicted: false,
      });
    }

    // Add future predictions
    if (type === "storage" && predictions.storage_full_in_days) {
      const daysToFull = predictions.storage_full_in_days;
      const growthRate = (100 - currentValue) / daysToFull;

      for (let i = 1; i <= Math.min(30, daysToFull); i++) {
        data.push({
          day: `+${i}d`,
          value: Math.min(100, currentValue + i * growthRate),
          predicted: true,
        });
      }
    }

    setChartData(data.slice(-60)); // Show last 60 data points
  };

  const getCurrentValue = () => {
    if (type === "storage") return 75;
    if (type === "memory") return 68;
    if (type === "cpu") return 45;
    return 60;
  };

  const getMaxValue = () => {
    return Math.max(...chartData.map((d) => d.value));
  };

  const getTrendIcon = () => {
    if (chartData.length < 2) return <Activity className="h-4 w-4" />;

    const recent = chartData.slice(-5);
    const older = chartData.slice(-10, -5);

    if (recent.length === 0 || older.length === 0)
      return <Activity className="h-4 w-4" />;

    const recentAvg =
      recent.reduce((sum, d) => sum + d.value, 0) / recent.length;
    const olderAvg = older.reduce((sum, d) => sum + d.value, 0) / older.length;

    if (recentAvg > olderAvg + 2) {
      return <TrendingUp className="h-4 w-4 text-red-600" />;
    } else if (recentAvg < olderAvg - 2) {
      return <TrendingDown className="h-4 w-4 text-green-600" />;
    } else {
      return <Activity className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusColor = () => {
    const currentValue = getCurrentValue();
    if (type === "storage") {
      if (currentValue > 90) return "text-red-600";
      if (currentValue > 80) return "text-yellow-600";
      return "text-green-600";
    }
    if (type === "memory") {
      if (currentValue > 85) return "text-red-600";
      if (currentValue > 75) return "text-yellow-600";
      return "text-green-600";
    }
    if (type === "cpu") {
      if (currentValue > 80) return "text-red-600";
      if (currentValue > 60) return "text-yellow-600";
      return "text-green-600";
    }
    return "text-blue-600";
  };

  const maxValue = getMaxValue();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            {getTrendIcon()}
            <span className="ml-2">{title}</span>
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Current:{" "}
            <span className={`font-medium ${getStatusColor()}`}>
              {getCurrentValue()}%
            </span>
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">ML Prediction</div>
          {type === "storage" && predictions.storage_full_in_days && (
            <div className="text-lg font-semibold text-red-600">
              Full in {predictions.storage_full_in_days} days
            </div>
          )}
          {type === "memory" && predictions.memory_pressure_in_hours && (
            <div className="text-lg font-semibold text-yellow-600">
              Pressure in {Math.round(predictions.memory_pressure_in_hours)}h
            </div>
          )}
          {type === "cpu" && predictions.cpu_spike_probability && (
            <div className="text-lg font-semibold text-orange-600">
              Spike risk: {Math.round(predictions.cpu_spike_probability * 100)}%
            </div>
          )}
        </div>
      </div>

      {/* Simple Chart */}
      <div className="h-32 flex items-end space-x-1 overflow-x-auto">
        {chartData.map((point, index) => {
          const height = (point.value / maxValue) * 100;
          const isToday = point.day === "Today";
          const isPredicted = point.predicted;

          return (
            <div
              key={index}
              className="flex flex-col items-center min-w-0 flex-1"
              title={`${point.day}: ${point.value}%`}
            >
              <div
                className={`w-full rounded-t transition-all duration-300 ${
                  isPredicted
                    ? "bg-gradient-to-t from-red-200 to-red-400 opacity-70"
                    : isToday
                    ? "bg-gradient-to-t from-blue-400 to-blue-600"
                    : "bg-gradient-to-t from-gray-200 to-gray-400"
                }`}
                style={{ height: `${Math.max(2, height)}%` }}
              />
              {index % 5 === 0 && (
                <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-left">
                  {point.day.length > 4 ? point.day.slice(0, 4) : point.day}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center mt-4 space-x-6 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-gradient-to-t from-gray-200 to-gray-400 rounded mr-2"></div>
          <span className="text-gray-600">Historical</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-gradient-to-t from-blue-400 to-blue-600 rounded mr-2"></div>
          <span className="text-gray-600">Current</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-gradient-to-t from-red-200 to-red-400 opacity-70 rounded mr-2"></div>
          <span className="text-gray-600">Predicted</span>
        </div>
      </div>

      {/* Insights */}
      {predictions && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <span>ML Confidence:</span>
              <span className="font-medium">
                {type === "storage" && predictions.storage_confidence
                  ? `${Math.round(predictions.storage_confidence * 100)}%`
                  : type === "memory" && predictions.memory_leak_probability
                  ? `${Math.round(
                      (1 - predictions.memory_leak_probability) * 100
                    )}%`
                  : "N/A"}
              </span>
            </div>
            {type === "storage" && predictions.storage_volatility && (
              <div className="flex items-center justify-between mt-1">
                <span>Volatility:</span>
                <span className="font-medium">
                  {predictions.storage_volatility.toFixed(1)}%
                </span>
              </div>
            )}
            {type === "memory" && predictions.memory_volatility && (
              <div className="flex items-center justify-between mt-1">
                <span>Volatility:</span>
                <span className="font-medium">
                  {predictions.memory_volatility.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MLPredictionChart;
