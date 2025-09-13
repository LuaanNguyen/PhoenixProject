"use client";

import { useState } from "react";
import { useStore } from "../(lib)/store";

export default function MiniMap() {
  const [isVisible, setIsVisible] = useState(false);
  const { filteredPoints, view, actions } = useStore();

  const handleMiniMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Convert to lat/lon (simplified for demo)
    const lon = -120.55 + x * 0.3;
    const lat = 38.95 - y * 0.3;

    actions.setView({ longitude: lon, latitude: lat, zoom: 12 });
  };

  return (
    <div className="absolute bottom-6 right-4 z-10">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="mb-2 w-10 h-10 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg shadow-md flex items-center justify-center text-gray-700 hover:text-gray-900 transition-colors"
        title="Toggle mini map"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 6h18"></path>
          <path d="M3 12h18"></path>
          <path d="M3 18h18"></path>
        </svg>
      </button>

      {isVisible && (
        <div className="w-48 h-32 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-200 overflow-hidden">
          <div
            className="w-full h-full bg-gradient-to-br from-green-100 to-green-200 relative cursor-crosshair"
            onClick={handleMiniMapClick}
          >
            {/* Forest area representation */}
            <div className="absolute inset-2 bg-green-300/30 rounded"></div>

            {/* Sensor points */}
            {filteredPoints.map((point) => {
              // Simplified positioning for demo
              const x = ((point.lon + 120.55) / 0.3) * 100;
              const y = ((38.95 - point.lat) / 0.3) * 100;
              const color =
                point.pm25 <= 35
                  ? "#84994F"
                  : point.pm25 <= 75
                  ? "#FCB53B"
                  : "#B45253";

              return (
                <div
                  key={point.id}
                  className="absolute w-2 h-2 rounded-full shadow-sm transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${Math.max(0, Math.min(100, x))}%`,
                    top: `${Math.max(0, Math.min(100, y))}%`,
                    backgroundColor: color,
                  }}
                />
              );
            })}

            {/* Current view indicator */}
            <div
              className="absolute w-4 h-4 border-2 border-blue-500 bg-blue-500/20 rounded transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${((view.longitude + 120.55) / 0.3) * 100}%`,
                top: `${((38.95 - view.latitude) / 0.3) * 100}%`,
              }}
            />

            <div className="absolute bottom-1 left-1 text-xs text-green-700 font-medium">
              Eldorado Forest
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
