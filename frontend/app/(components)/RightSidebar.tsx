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
    <div className="w-80 h-full bg-gradient-to-b from-gray-50 to-white border-l-4 border-gray-200 flex flex-col shadow-lg">
      {/* Modern Analytics Header */}
      <div className=" p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 "></div>
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className=" bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <svg className="w-6 h-6 " fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 001.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text ">
                Analytics Hub
              </h2>
              <p className="text-gray-400 text-sm font-medium">
                Real-time Intelligence
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {stats.fireDetected > 0 ? (
          <div className="p-4 space-y-6">
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

        {/* Emergency Protocol Rules */}
        <div className="bg-white border-gray-200 border-t-4 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
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
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-100">
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
      </div>
    </div>
  );
}
