"use client";

import React from "react";
import { useStore } from "../(lib)/store";
import { AQI_BANDS } from "../(lib)/aqi";

const ConnectionDot = ({ connected }: { connected: boolean }) => (
  <div
    className={`w-2 h-2 rounded-full ${
      connected ? "bg-green-400" : "bg-gray-400"
    }`}
  />
);

export default function Sidebar() {
  const {
    filteredPoints,
    layerMode,
    live,
    wsStatus,
    hotspots,
    simulationCancel,
    actions,
  } = useStore();

  // Calculate simple stats
  const stats = React.useMemo(() => {
    if (filteredPoints.length === 0) {
      return { count: 0, maxPM25: 0, avgPM25: 0 };
    }

    const pm25Values = filteredPoints.map((p) => p.pm25);
    const max = Math.max(...pm25Values);
    const avg = pm25Values.reduce((a, b) => a + b, 0) / pm25Values.length;

    return {
      count: filteredPoints.length,
      maxPM25: max,
      avgPM25: avg,
    };
  }, [filteredPoints]);

  return (
    <div className="w-80 h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-sm">🌲</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                FlamDirect
              </h1>
              <p className="text-xs text-gray-500">Forest Monitor</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ConnectionDot connected={wsStatus === "connected"} />
            <span className="text-xs text-gray-600 capitalize">{wsStatus}</span>
          </div>
        </div>
        <div className="text-sm text-gray-700">
          <div className="font-medium">Eldorado National Forest</div>
          <div className="text-xs text-gray-500 mt-1">California</div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 space-y-6 flex-1 overflow-y-auto">
        {/* Live Data */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Live Updates</h3>
            <p className="text-xs text-gray-500 mt-1">
              {live ? "Streaming data" : "Updates paused"}
            </p>
          </div>
          <button
            onClick={live ? actions.stopLive : actions.startLive}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              live ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                live ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={
              simulationCancel ? actions.stopSimulation : actions.simulateSmoke
            }
            className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
              simulationCancel
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-orange-500 hover:bg-orange-600 text-white"
            }`}
          >
            {simulationCancel ? "Stop Simulation" : "Simulate Fire"}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={actions.recenter}
              className="py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Recenter
            </button>
            <button
              onClick={actions.clearData}
              className="py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Active Sensors</span>
              <span className="font-medium text-gray-900">{stats.count}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Max PM2.5</span>
              <span className="font-medium text-gray-900">
                {stats.maxPM25.toFixed(1)} μg/m³
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Average PM2.5</span>
              <span className="font-medium text-gray-900">
                {stats.avgPM25.toFixed(1)} μg/m³
              </span>
            </div>
          </div>
        </div>

        {/* Top Hotspots */}
        {hotspots.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Top Hotspots
            </h3>
            <div className="space-y-2">
              {hotspots.slice(0, 3).map((sensor) => (
                <button
                  key={sensor.id}
                  onClick={() =>
                    actions.setView({
                      longitude: sensor.lon,
                      latitude: sensor.lat,
                      zoom: 13,
                    })
                  }
                  className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-all duration-200 hover:shadow-sm hover:scale-[1.02]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {sensor.id
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </div>
                      <div className="text-xs text-gray-600">
                        {new Date(sensor.ts).toLocaleTimeString()}
                      </div>
                    </div>
                    <div
                      className="text-lg font-bold"
                      style={{
                        color:
                          sensor.pm25 <= 35
                            ? "#84994F"
                            : sensor.pm25 <= 75
                            ? "#FCB53B"
                            : "#B45253",
                      }}
                    >
                      {sensor.pm25.toFixed(1)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* View Mode */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">View Mode</h3>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => actions.setLayerMode("heatmap")}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                layerMode === "heatmap"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Heatmap
            </button>
            <button
              onClick={() => actions.setLayerMode("scatter")}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                layerMode === "scatter"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Points
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
