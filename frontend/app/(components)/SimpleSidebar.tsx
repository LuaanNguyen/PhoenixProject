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
    <div className="w-80 h-full border-gray-200 border-r-4 flex flex-col shadow-lg">
      {/* Modern Header */}
      <div className="p-6 relative overflow-hidden">
        <div className=""></div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div>
              <h1 className="text-xl font-bold">Phoenix Project</h1>
              <p className="text-gray-400 text-sm font-medium">
                Emergency Response System
              </p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 border bg-opacity-10 backdrop-blur-sm rounded-xl p-4 borderborder-opacity-20">
            <div className="text-xs mb-2 uppercase tracking-wider font-medium">
              Deployment Zone
            </div>
            <div className="text-sm font-semibold">
              Angeles National Forest, CA
            </div>
            <div className="text-xs text-gray-400 mt-1">
              65 sensors • Dense forest coverage
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced System Status */}
      <div
        className="border-b border-gray-100 p-6 bg-gradient-to-r from-gray-50 to-white"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgb(249 250 251 / 0.5), white)",
        }}
      >
        <div className="space-y-4">
          <div className="relative overflow-hidden bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 opacity-10 rounded-full transform -translate-y-10 translate-x-10"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full animate-pulse ${
                      wsStatus === "connected"
                        ? "bg-green-500 shadow-lg ring-4 ring-green-500 ring-opacity-20"
                        : "bg-red-500 shadow-lg ring-4 ring-red-500 ring-opacity-20"
                    }`}
                    style={{
                      boxShadow:
                        wsStatus === "connected"
                          ? "0 10px 15px -3px rgb(34 197 94 / 0.3)"
                          : "0 10px 15px -3px rgb(239 68 68 / 0.3)",
                    }}
                  ></div>
                  <div>
                    <div className="text-base font-bold text-gray-900">
                      System Status
                    </div>
                    <div className="text-xs text-gray-500">
                      Real-time monitoring active
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-lg font-black ${
                      wsStatus === "connected"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {wsStatus === "connected" ? "ONLINE" : "OFFLINE"}
                  </div>
                  <div className="text-xs text-gray-500 font-medium">
                    {filteredPoints.length} sensors active
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 text-center">
              <div className="text-xs font-semibold text-blue-600 tracking-wider mb-1">
                Normal
              </div>
              <div className="text-xl font-black text-blue-700">
                {stats.normal}
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-4 text-center">
              <div className="text-xs font-semibold text-orange-600 tracking-wider mb-1">
                Elevated
              </div>
              <div className="text-xl font-black text-orange-700">
                {stats.elevatedTemp}
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 text-center">
              <div className="text-xs font-semibold text-red-600 tracking-wider mb-1">
                Critical
              </div>
              <div className="text-xl font-black text-red-700">
                {stats.fireDetected}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 space-y-6 flex-1 overflow-y-auto">
        {/* Enhanced AI Decision Engine */}
        <div
          className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50 to-purple-50 border border-gray-200 rounded-md p-6 shadow-lg"
          style={{
            backgroundImage:
              "linear-gradient(to bottom right, white, rgb(239 246 255 / 0.3), rgb(250 245 255 / 0.3))",
          }}
        >
          <div className=" opacity-10 transform -translate-y-16 translate-x-16"></div>
          <div className="relative">
            <div className="flex items-center gap-4 mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Decision Engine
                </h3>
                <p className="text-sm text-gray-600 font-medium">
                  Autonomous emergency response system
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
                  className="w-full bg-gray-200 hover:bg-gray-300  text-sm font-medium py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
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
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
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
        </div>

        {/* AI Judge Decisions */}
        {stats.fireDetected > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Critical Sensors
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
      </div>
    </div>
  );
}
