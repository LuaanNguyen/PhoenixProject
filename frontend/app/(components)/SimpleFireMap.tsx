"use client";

import React, { useMemo } from "react";
import Map from "react-map-gl/maplibre";
import DeckGL from "@deck.gl/react";
import { ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import { useStore } from "../(lib)/store";
import { ViewState, SensorPoint } from "../(types)/sensor";

// Simple map style
const MAPLIBRE_STYLE = {
  version: 8 as const,
  sources: {
    "simple-tiles": {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap",
    },
  },
  layers: [
    {
      id: "simple-tiles",
      type: "raster" as const,
      source: "simple-tiles",
      minzoom: 0,
      maxzoom: 18,
    },
  ],
};

export default function SimpleFireMap() {
  const { filteredPoints, actions, wsClient } = useStore();

  // Optimized sensor visualization with memoization
  const layers = useMemo(() => {
    if (filteredPoints.length === 0) return [];

    // Pre-calculate sensor states for performance
    const sensorStates = filteredPoints.map((d) => ({
      ...d,
      isHot: d.temperature && d.temperature > 30,
      isFire: d.temperature && d.temperature > 60,
      radius:
        d.temperature && d.temperature > 60
          ? 120
          : d.temperature && d.temperature > 30
          ? 100
          : 80,
    }));

    return [
      // Arduino sensor base circles (optimized)
      new ScatterplotLayer({
        id: "arduino-sensor-base",
        data: sensorStates,
        getPosition: (d) => [d.lon, d.lat],
        getRadius: (d) => d.radius,
        getFillColor: (d) =>
          d.isFire
            ? [255, 0, 0, 100]
            : d.isHot
            ? [255, 165, 0, 80]
            : [0, 255, 0, 60],
        getLineColor: (d) =>
          d.isFire
            ? [255, 0, 0, 255]
            : d.isHot
            ? [255, 165, 0, 255]
            : [0, 200, 0, 255],
        lineWidthMinPixels: 2,
        stroked: true,
        filled: true,
        pickable: true,
        radiusUnits: "meters",
        updateTriggers: {
          getRadius: [sensorStates.map((d) => d.temperature)],
          getFillColor: [sensorStates.map((d) => d.temperature)],
          getLineColor: [sensorStates.map((d) => d.temperature)],
        },
      }),

      // Arduino sensor icons (optimized)
      new TextLayer({
        id: "arduino-sensor-icons",
        data: sensorStates,
        getPosition: (d) => [d.lon, d.lat],
        getText: (d) => (d.isFire ? "🔥" : d.isHot ? "🌡️" : "📡"),
        getSize: 20,
        getColor: [255, 255, 255, 255],
        getAngle: 0,
        getTextAnchor: "middle",
        getAlignmentBaseline: "center",
        pickable: true,
        updateTriggers: {
          getText: [sensorStates.map((d) => d.temperature)],
        },
      }),

      // Temperature labels for hot sensors (optimized)
      new TextLayer({
        id: "temperature-labels",
        data: sensorStates.filter((d) => d.isHot),
        getPosition: (d: SensorPoint) => [d.lon, d.lat],
        getText: (d: SensorPoint) => `${Math.round(d.temperature || 20)}°C`,
        getSize: 12,
        getColor: [255, 255, 255, 255],
        getAngle: 0,
        getTextAnchor: "middle",
        getAlignmentBaseline: "center",
        fontFamily: "Arial, sans-serif",
        fontWeight: "bold",
        background: true,
        getBackgroundColor: (d: SensorPoint) => {
          if (d.temperature && d.temperature > 60) return [255, 0, 0, 180];
          return [255, 165, 0, 180];
        },
        pickable: false,
      }),
    ];
  }, [filteredPoints]);

  // Simple Compass component
  const Compass = () => (
    <div className="absolute bottom-4 left-4 bg-white border border-gray-200 rounded p-3 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10">
          {/* Compass circle */}
          <div className="absolute inset-0 border-2 border-gray-300 rounded-full"></div>

          {/* North indicator */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1">
            <div className="w-0 h-0 border-l-2 border-r-2 border-b-4 border-l-transparent border-r-transparent border-b-red-500"></div>
          </div>

          {/* Cardinal directions */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-full h-full">
              <span className="absolute top-0.5 left-1/2 transform -translate-x-1/2 text-xs font-bold text-red-600">
                N
              </span>
              <span className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-600">
                S
              </span>
              <span className="absolute right-0.5 top-1/2 transform -translate-y-1/2 text-xs font-medium text-gray-600">
                E
              </span>
              <span className="absolute left-0.5 top-1/2 transform -translate-y-1/2 text-xs font-medium text-gray-600">
                W
              </span>
            </div>
          </div>

          {/* Center dot */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-gray-800 rounded-full"></div>
        </div>
        <div className="text-xs">
          <div className="font-semibold text-gray-900">Compass</div>
          <div className="text-gray-600">True North</div>
        </div>
      </div>
    </div>
  );

  const handleViewStateChange = ({ viewState }: { viewState: unknown }) => {
    actions.setView(viewState as Partial<ViewState>);
  };

  const handleMapClick = (event: { coordinate?: number[] }) => {
    if (event.coordinate && wsClient?.ws?.readyState === WebSocket.OPEN) {
      const [lon, lat] = event.coordinate;

      // Send fire start command to backend
      wsClient.ws.send(
        JSON.stringify({
          type: "start_fire",
          lat: lat,
          lon: lon,
          intensity: 1.0,
        })
      );

      console.log(`🔥 Starting fire at ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    }
  };

  const getTooltip = ({ object }: { object?: SensorPoint }) => {
    if (!object) return null;

    const status =
      (object.temperature || 0) > 60
        ? "🔥 FIRE DETECTED!"
        : (object.temperature || 0) > 30
        ? "🟡 ELEVATED TEMP"
        : "🟢 NORMAL";

    const color =
      (object.temperature || 0) > 60
        ? "#FF0000"
        : (object.temperature || 0) > 30
        ? "#FFA500"
        : "#00FF00";

    return {
      html: `
        <div style="background: rgba(0,0,0,0.9); color: white; padding: 12px; border-radius: 8px; font-size: 12px; border-left: 4px solid ${color};">
          <div style="font-weight: bold; margin-bottom: 8px;">${object.id}</div>
          <div><strong>Temperature:</strong> ${Math.round(
            object.temperature || 20
          )}°C</div>
          <div><strong>Status:</strong> <span style="color: ${color}">${status}</span></div>
          <div><strong>Battery:</strong> ${Math.round(
            object.battery_level || 100
          )}%</div>
           <div style="font-size: 10px; color: #ccc; margin-top: 8px;">
             📍 ${object.lat?.toFixed(4)}, ${object.lon?.toFixed(4)}
           </div>
          <div style="font-size: 10px; color: #ccc; margin-top: 4px;">
            💡 Click anywhere on map to start a fire
          </div>
        </div>
      `,
      style: {
        backgroundColor: "transparent",
        fontSize: "12px",
      },
    };
  };

  return (
    <div className="relative w-full h-full">
      <DeckGL
        initialViewState={{
          longitude: -120.424,
          latitude: 38.79,
          zoom: 11.5,
          pitch: 0,
          bearing: 0,
        }}
        controller={true}
        layers={layers}
        onViewStateChange={handleViewStateChange}
        onClick={handleMapClick}
        getTooltip={getTooltip}
      >
        <Map
          mapStyle={MAPLIBRE_STYLE}
          style={{ width: "100%", height: "100%" }}
          attributionControl={false}
        />
      </DeckGL>

      {/* Instructions */}
      <div className="absolute top-4 left-4 bg-white border border-gray-200 p-4 rounded shadow-lg text-sm max-w-sm">
        <div className="font-semibold text-gray-900 mb-2">Fire Simulation</div>
        <div className="text-gray-600 text-xs space-y-1">
          <div>• Click anywhere to start a fire simulation</div>
          <div>• Watch sensors detect temperature changes</div>
          <div>• Real-time monitoring system</div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white border border-gray-200 p-4 rounded shadow-lg text-sm">
        <div className="font-semibold text-gray-900 mb-3">Sensor Status</div>
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500"></div>
            <span className="text-gray-700 text-xs">Normal (&lt;30°C)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500"></div>
            <span className="text-gray-700 text-xs">Elevated (30-60°C)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500"></div>
            <span className="text-gray-700 text-xs">Fire (&gt;60°C)</span>
          </div>
        </div>
        <div className="pt-3 border-t border-gray-200 text-xs text-gray-600">
          <div className="flex justify-between mb-1">
            <span>Sensors:</span>
            <span className="font-medium">{filteredPoints.length}</span>
          </div>
          <div className="text-xs text-gray-500">Coverage: 10.2 × 13.1 km</div>
        </div>
      </div>

      {/* AI Judge Live Decision */}
      {filteredPoints.some((p) => p.temperature && p.temperature > 30) && (
        <div className="absolute bottom-4 right-4 bg-white border border-gray-200 p-4 rounded shadow-lg text-sm max-w-xs">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">⚖️</span>
            <div className="font-semibold text-gray-900">AI Judge Decision</div>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <div className="font-bold text-red-800 mb-1">
                LEVEL{" "}
                {filteredPoints.filter(
                  (p) => p.temperature && p.temperature > 60
                ).length >= 10
                  ? "4"
                  : filteredPoints.filter(
                      (p) => p.temperature && p.temperature > 60
                    ).length >= 5
                  ? "3"
                  : filteredPoints.filter(
                      (p) => p.temperature && p.temperature > 60
                    ).length >= 3
                  ? "2"
                  : "1"}{" "}
                RESPONSE REQUIRED
              </div>
              <div className="text-xs text-red-600">
                {filteredPoints.filter(
                  (p) => p.temperature && p.temperature > 60
                ).length >= 10 && "Multi-agency response activated"}
                {filteredPoints.filter(
                  (p) => p.temperature && p.temperature > 60
                ).length >= 5 &&
                  filteredPoints.filter(
                    (p) => p.temperature && p.temperature > 60
                  ).length < 10 &&
                  "Evacuation protocols initiated"}
                {filteredPoints.filter(
                  (p) => p.temperature && p.temperature > 60
                ).length >= 3 &&
                  filteredPoints.filter(
                    (p) => p.temperature && p.temperature > 60
                  ).length < 5 &&
                  "Fire crew dispatched"}
                {filteredPoints.filter(
                  (p) => p.temperature && p.temperature > 60
                ).length < 3 && "Local patrol dispatched"}
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Critical Sensors:</span>
                <span className="font-bold text-red-600">
                  {
                    filteredPoints.filter(
                      (p) => p.temperature && p.temperature > 60
                    ).length
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Confidence:</span>
                <span className="font-bold text-green-600">
                  {Math.min(
                    95,
                    70 +
                      filteredPoints.filter(
                        (p) => p.temperature && p.temperature > 60
                      ).length *
                        5
                  )}
                  %
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Response Time:</span>
                <span className="font-bold text-blue-600">0.8s</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compass */}
      <Compass />
    </div>
  );
}
