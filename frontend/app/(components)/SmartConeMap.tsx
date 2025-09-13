"use client";

import React, { useMemo } from "react";
import Map from "react-map-gl/maplibre";
import DeckGL from "@deck.gl/react";
import { ScatterplotLayer } from "@deck.gl/layers";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { useStore } from "../(lib)/store";
import { getColorRange } from "../(lib)/color";
import { pm25ToRGB } from "../(lib)/aqi";
import { ViewState } from "../(types)/sensor";

// Simplified map style for better performance
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

const MAPBOX_STYLE = "mapbox://styles/mapbox/dark-v11";

export default function SmartConeMap() {
  const { filteredPoints, layerMode, view, actions } = useStore();

  // Optimized layer data - memoized for performance
  const layerData = useMemo(() => {
    return filteredPoints.map((point) => ({
      ...point,
      position: [point.lon, point.lat] as [number, number],
    }));
  }, [filteredPoints]);

  // Optimized layers for better performance
  const layers = useMemo(() => {
    if (layerData.length === 0) return [];

    if (layerMode === "heatmap") {
      return [
        new HeatmapLayer({
          id: "heatmap-layer",
          data: layerData,
          getPosition: (d: { position: [number, number] }) => d.position,
          getWeight: (d: { pm25: number }) => d.pm25,
          radiusPixels: 40,
          intensity: 1,
          threshold: 0.05,
          colorRange: [
            [132, 153, 79], // Good - Green
            [252, 181, 59], // Moderate - Yellow
            [180, 82, 83], // Unhealthy - Red
          ],
        }),
      ];
    }

    // Simplified scatter layer for better performance
    return [
      new ScatterplotLayer({
        id: "scatter-layer",
        data: layerData,
        getPosition: (d: { position: [number, number] }) => d.position,
        getRadius: 120,
        getFillColor: (d: { pm25: number }) => pm25ToRGB(d.pm25),
        stroked: false,
        opacity: 0.7,
        pickable: true,
        radiusUnits: "meters",
        radiusScale: 1,
        updateTriggers: {
          getFillColor: [layerData.length],
        },
      }),
    ];
  }, [layerMode, layerData]);

  const handleViewStateChange = ({ viewState }: { viewState: unknown }) => {
    actions.setView(viewState as Partial<ViewState>);
  };

  // Determine map provider and configuration
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const useMapbox = !!mapboxToken;

  return (
    <div className="relative w-full h-full">
      <DeckGL
        initialViewState={view}
        controller={true}
        layers={layers}
        onViewStateChange={handleViewStateChange}
        getTooltip={({ object }) => {
          if (object && object.pm25) {
            const status =
              object.pm25 <= 35
                ? "Good"
                : object.pm25 <= 75
                ? "Moderate"
                : "High";
            const color =
              object.pm25 <= 35
                ? "#84994F"
                : object.pm25 <= 75
                ? "#FCB53B"
                : "#B45253";

            return {
              html: `
                <div class="bg-white rounded-lg shadow-lg border p-3">
                  <div class="font-medium text-gray-900">${object.id.replace(
                    /_/g,
                    " "
                  )}</div>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-lg font-bold" style="color: ${color}">${object.pm25.toFixed(
                1
              )} μg/m³</span>
                    <span class="text-xs px-2 py-1 rounded text-white" style="background: ${color}">${status}</span>
                  </div>
                </div>
              `,
              style: {
                backgroundColor: "transparent",
                padding: "0px",
              },
            };
          }
          return null;
        }}
      >
        <Map
          mapStyle={useMapbox ? MAPBOX_STYLE : MAPLIBRE_STYLE}
          {...(useMapbox ? { mapboxAccessToken: mapboxToken } : {})}
          style={{ width: "100%", height: "100%" }}
          attributionControl={false}
        />
      </DeckGL>
    </div>
  );
}
