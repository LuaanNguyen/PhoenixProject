"use client";

import { useStore } from "../(lib)/store";

export default function StatusIndicator() {
  const { filteredPoints, wsStatus, live } = useStore();

  const activeCount = filteredPoints.length;
  const avgPM25 =
    filteredPoints.length > 0
      ? filteredPoints.reduce((sum, p) => sum + p.pm25, 0) /
        filteredPoints.length
      : 0;

  const overallStatus =
    avgPM25 <= 35 ? "Good" : avgPM25 <= 75 ? "Moderate" : "Unhealthy";
  const statusColor =
    avgPM25 <= 35 ? "#84994F" : avgPM25 <= 75 ? "#FCB53B" : "#B45253";

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
      <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-gray-200/50 px-4 py-3">
        <div className="flex items-center gap-6">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                wsStatus === "connected"
                  ? "bg-green-500 animate-pulse"
                  : "bg-gray-400"
              }`}
            />
            <span className="text-sm font-medium text-gray-700">
              {wsStatus === "connected" ? "Connected" : "Disconnected"}
            </span>
          </div>

          {/* Sensor Count */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sensors:</span>
            <span className="text-sm font-bold text-gray-900">
              {activeCount}
            </span>
          </div>

          {/* Overall Status */}
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full shadow-sm"
              style={{ backgroundColor: statusColor }}
            />
            <span
              className="text-sm font-medium"
              style={{ color: statusColor }}
            >
              {overallStatus}
            </span>
          </div>

          {/* Average PM2.5 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Avg:</span>
            <span className="text-sm font-bold" style={{ color: statusColor }}>
              {avgPM25.toFixed(1)} μg/m³
            </span>
          </div>

          {/* Live Status */}
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                live ? "bg-blue-500 animate-pulse" : "bg-gray-400"
              }`}
            />
            <span className="text-sm text-gray-600">
              {live ? "Live" : "Paused"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
