"use client";

import { AQI_BANDS } from "../(lib)/aqi";

export default function AQILegend() {
  return (
    <div className="absolute bottom-4 right-4 z-10 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg shadow-md p-3 min-w-[180px] transition-colors">
      <h3 className="text-sm font-medium text-gray-900 mb-2">AQI Legend</h3>
      <div className="space-y-2">
        {AQI_BANDS.map((band, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: band.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-900 truncate">
                {band.label}
              </div>
              <div className="text-xs text-gray-600">
                {band.min === 0 ? "≤" : ""}
                {band.min}
                {band.max === Infinity ? "+" : `–${band.max}`} μg/m³
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
