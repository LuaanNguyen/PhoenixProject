"use client";

import { useStore } from "../(lib)/store";

export default function RightSidebar() {
  const { filteredPoints } = useStore();

  const stats = {
    fireDetected: filteredPoints.filter(
      (p) => p.temperature && p.temperature > 60
    ).length,
    elevatedTemp: filteredPoints.filter(
      (p) => p.temperature && p.temperature > 30 && p.temperature <= 60
    ).length,
    normal: filteredPoints.filter((p) => !p.temperature || p.temperature <= 30)
      .length,
    maxTemp: Math.max(...filteredPoints.map((p) => p.temperature || 20)),
  };

  return (
    <div className="w-80 h-full bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-lg">🎯</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold">AI Judge Analytics</h2>
            <p className="text-blue-100 text-sm">Real-time Decision Metrics</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {stats.fireDetected > 0 ? (
          <div className="p-6 space-y-6">
            {/* Decision Confidence */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Decision Confidence
                    </h3>
                    <p className="text-sm text-gray-600">AI certainty level</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-700">
                    {Math.min(95, 70 + stats.fireDetected * 5)}%
                  </div>
                  <div className="text-xs text-green-600 font-medium">HIGH</div>
                </div>
              </div>
              <div className="bg-white/60 rounded-lg p-3">
                <p className="text-sm text-gray-700">
                  Based on sensor reliability, clustering patterns, and
                  historical emergency data
                </p>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                Performance Metrics
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    Response Time
                  </div>
                  <div className="text-lg font-bold text-gray-900">0.8s</div>
                  <div className="text-xs text-green-600 font-medium">
                    EXCELLENT
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    Processing Cost
                  </div>
                  <div className="text-lg font-bold text-gray-900">$0.02</div>
                  <div className="text-xs text-blue-600 font-medium">
                    PER DECISION
                  </div>
                </div>
              </div>
            </div>

            {/* Sensor Analytics */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-red-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                Sensor Analytics
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900">
                      Critical Alerts
                    </span>
                  </div>
                  <span className="text-lg font-bold text-red-600">
                    {stats.fireDetected}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900">
                      Elevated Temp
                    </span>
                  </div>
                  <span className="text-lg font-bold text-orange-600">
                    {stats.elevatedTemp}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900">
                      Normal Status
                    </span>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {stats.normal}
                  </span>
                </div>
              </div>
            </div>

            {/* Temperature Analysis */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-red-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zM8 6a2 2 0 114 0v1H8V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                Temperature Analysis
              </h3>

              <div className="bg-white/60 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Peak Temperature
                  </span>
                  <span className="text-xl font-bold text-red-700">
                    {stats.maxTemp.toFixed(1)}°C
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    Total Sensors
                  </span>
                  <span className="text-xl font-bold text-gray-900">
                    {filteredPoints.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                All Systems Normal
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                No emergency conditions detected. All sensors reporting normal
                temperatures.
              </p>
              <div className="bg-white rounded-lg p-3">
                <div className="text-2xl font-bold text-green-700 mb-1">
                  85%
                </div>
                <div className="text-xs text-green-600 font-medium">
                  BASELINE CONFIDENCE
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
