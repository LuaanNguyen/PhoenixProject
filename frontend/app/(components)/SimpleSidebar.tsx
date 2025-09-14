"use client";

import React from "react";
import { useStore } from "../(lib)/store";

export default function SimpleSidebar() {
  const { filteredPoints, live, wsStatus, actions, wsClient } = useStore();

  // Simple stats
  const stats = React.useMemo(() => {
    const fireDetected = filteredPoints.filter(
      (p) => p.temperature && p.temperature > 60
    );
    const elevatedTemp = filteredPoints.filter(
      (p) => p.temperature && p.temperature > 30 && p.temperature <= 60
    );
    const normal = filteredPoints.filter(
      (p) => !p.temperature || p.temperature <= 30
    );
    const maxTemp = Math.max(...filteredPoints.map((p) => p.temperature || 20));

    return {
      total: filteredPoints.length,
      fireDetected: fireDetected.length,
      elevatedTemp: elevatedTemp.length,
      normal: normal.length,
      maxTemp,
    };
  }, [filteredPoints]);

  const clearFires = () => {
    if (wsClient?.ws?.readyState === WebSocket.OPEN) {
      wsClient.ws.send(JSON.stringify({ type: "clear_fires" }));
    }
  };

  return (
    <div className="w-80 h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Simple Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-gray-900">
            Fire Monitoring System
          </h1>
          <p className="text-sm text-gray-600">Eldorado National Forest</p>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Status:</span>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  wsStatus === "connected" ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-gray-900 capitalize">{wsStatus}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Sensors:</span>
            <span className="text-gray-900 font-medium">
              {filteredPoints.length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Coverage:</span>
            <span className="text-gray-900 font-medium">10.2 × 13.1 km</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 space-y-6 flex-1 overflow-y-auto">
        {/* Controls */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Controls</h3>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded">
              <div className="text-sm text-gray-700 mb-2">Fire Simulation</div>
              <div className="text-xs text-gray-600">
                Click anywhere on the map to start a fire simulation.
              </div>
            </div>

            <button
              onClick={clearFires}
              className="w-full px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded text-sm font-medium transition-colors"
            >
              Clear All Fires
            </button>
          </div>
        </div>

        {/* Sensor Status */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Sensor Status
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 border border-gray-200 rounded">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-700">Fire Detected</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {stats.fireDetected}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 border border-gray-200 rounded">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-sm text-gray-700">Elevated Temp</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {stats.elevatedTemp}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 border border-gray-200 rounded">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-700">Normal</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {stats.normal}
              </span>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Statistics
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Max Temperature:</span>
              <span className="font-semibold text-gray-900">
                {stats.maxTemp.toFixed(1)}°C
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Sensors Affected:</span>
              <span className="font-semibold text-gray-900">
                {stats.fireDetected + stats.elevatedTemp}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Operational:</span>
              <span className="font-semibold text-gray-900">
                {Math.round((stats.normal / filteredPoints.length) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Fire Alerts */}
        {stats.fireDetected > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Fire Alerts
            </h3>
            <div className="space-y-2">
              {filteredPoints
                .filter(
                  (sensor) => sensor.temperature && sensor.temperature > 60
                )
                .slice(0, 5)
                .map((sensor) => (
                  <button
                    key={sensor.id}
                    onClick={() =>
                      actions.setView({
                        longitude: sensor.lon,
                        latitude: sensor.lat,
                        zoom: 15,
                      })
                    }
                    className="w-full p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-left transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {sensor.id.replace("ARDUINO_", "Sensor ")}
                        </div>
                        <div className="text-xs text-gray-600">
                          Fire detected
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          {Math.round(sensor.temperature || 20)}°C
                        </div>
                        <div className="text-xs text-gray-600">
                          {sensor.lat.toFixed(3)}, {sensor.lon.toFixed(3)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            🎮 How to Use
          </h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>• Click anywhere on map to start a fire</div>
            <div>• Watch Arduino sensors detect temperature rise</div>
            <div>• Red sensors = Fire detected (&gt;60°C)</div>
            <div>• Orange sensors = Elevated temp (30-60°C)</div>
            <div>• Green sensors = Normal (&lt;30°C)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
