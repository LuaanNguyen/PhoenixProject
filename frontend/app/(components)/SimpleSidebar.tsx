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
    <div className="w-80 h-full bg-white border-r border-gray-100 flex flex-col shadow-sm">
      {/* Professional Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
            <svg
              className="w-5 h-5 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold">Emergency Response</h1>
            <p className="text-gray-300 text-sm">AI Decision Engine</p>
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="text-xs text-gray-300 mb-1">DEPLOYMENT REGION</div>
          <div className="text-sm font-medium">
            Eldorado National Forest, CA
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="border-b border-gray-100 p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  wsStatus === "connected"
                    ? "bg-green-500 shadow-sm shadow-green-500/50"
                    : "bg-red-500 shadow-sm shadow-red-500/50"
                }`}
              ></div>
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  System Status
                </div>
                <div className="text-xs text-gray-500">
                  Real-time monitoring
                </div>
              </div>
            </div>
            <div className="text-right">
              <div
                className={`text-sm font-bold ${
                  wsStatus === "connected" ? "text-green-700" : "text-red-700"
                }`}
              >
                {wsStatus === "connected" ? "ONLINE" : "OFFLINE"}
              </div>
              <div className="text-xs text-gray-500">
                {filteredPoints.length} active sensors
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Coverage Area
              </div>
              <div className="text-sm font-bold text-gray-900">
                10.2 × 13.1 km
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Network Health
              </div>
              <div className="text-sm font-bold text-green-700">OPTIMAL</div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 space-y-6 flex-1 overflow-y-auto">
        {/* AI Decision Engine */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                AI Decision Engine
              </h3>
              <p className="text-sm text-gray-500">
                Emergency response automation
              </p>
            </div>
          </div>

          {stats.fireDetected > 0 ? (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold text-red-900">
                      ACTIVE EMERGENCY
                    </span>
                  </div>
                  <div className="text-lg font-bold text-red-700">
                    LEVEL{" "}
                    {stats.fireDetected >= 10
                      ? "4"
                      : stats.fireDetected >= 5
                      ? "3"
                      : stats.fireDetected >= 3
                      ? "2"
                      : "1"}
                  </div>
                </div>
                <div className="text-sm text-red-800">
                  {stats.fireDetected} critical sensors detected
                  {stats.fireDetected >= 3 && " with clustering pattern"}
                </div>
              </div>

              <button
                onClick={clearFires}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                    clipRule="evenodd"
                  />
                </svg>
                Reset Emergency Scenario
              </button>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-semibold text-green-900">
                  SYSTEM NORMAL
                </span>
              </div>
              <div className="text-sm text-green-800 mb-3">
                All sensors reporting normal temperatures
              </div>
              <div className="text-xs text-gray-600 bg-white rounded p-2 border border-green-100">
                💡 Click anywhere on the map to simulate an emergency scenario
              </div>
            </div>
          )}
        </div>

        {/* Emergency Protocol Rules */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 text-purple-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Response Protocol
              </h3>
              <p className="text-sm text-gray-500">
                Automated escalation rules
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-700">
                  1
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Local Patrol
                  </div>
                  <div className="text-xs text-gray-500">1 sensor &gt;60°C</div>
                </div>
              </div>
              <div className="text-xs font-medium text-gray-600 bg-white px-2 py-1 rounded border">
                LOW
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-xs font-bold text-orange-700">
                  2
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Fire Crew
                  </div>
                  <div className="text-xs text-orange-600">
                    3+ sensors &gt;60°C
                  </div>
                </div>
              </div>
              <div className="text-xs font-medium text-orange-700 bg-white px-2 py-1 rounded border border-orange-200">
                MED
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-xs font-bold text-red-700">
                  3
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Evacuation
                  </div>
                  <div className="text-xs text-red-600">
                    5+ sensors &gt;60°C
                  </div>
                </div>
              </div>
              <div className="text-xs font-medium text-red-700 bg-white px-2 py-1 rounded border border-red-200">
                HIGH
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-100 rounded-lg border border-red-200">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-red-200 rounded-full flex items-center justify-center text-xs font-bold text-red-800">
                  4
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Multi-Agency
                  </div>
                  <div className="text-xs text-red-700">
                    10+ sensors &gt;60°C
                  </div>
                </div>
              </div>
              <div className="text-xs font-medium text-red-800 bg-white px-2 py-1 rounded border border-red-300">
                CRITICAL
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Sensor Analysis */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            🔍 AI Sensor Analysis
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

        {/* AI Judge Decisions */}
        {stats.fireDetected > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              ⚖️ AI Judge Decisions
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
                          🚨 {sensor.id.replace("ARDUINO_", "Sensor ")}
                        </div>
                        <div className="text-xs text-blue-600 font-medium">
                          AI Decision: Critical response required
                        </div>
                        <div className="text-xs text-gray-500">
                          Confidence:{" "}
                          {Math.min(
                            95,
                            75 + Math.round((sensor.temperature || 20) - 60)
                          )}
                          %
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-red-600">
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
