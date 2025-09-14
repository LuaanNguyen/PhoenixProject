"use client";

import React, { useMemo } from "react";
import Map from "react-map-gl/maplibre";
import DeckGL from "@deck.gl/react";
import type { PickingInfo } from "@deck.gl/core";
import { useStore } from "../(lib)/store";
import { ViewState } from "../(types)/sensor";
import { createFireLayers, getFireTooltip } from "./FireLayers";

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
  const {
    filteredPoints,
    layerMode,
    view,
    actions,
    fireSimulation,
    fireStatistics,
    temperatureHotspots,
  } = useStore();

  // Use createFireLayers function for advanced fire visualization
  const layers = useMemo(() => {
    return createFireLayers({
      layerMode,
      data: filteredPoints,
      fireStatistics,
      temperatureHotspots,
    });
  }, [layerMode, filteredPoints, fireStatistics, temperatureHotspots]);

  const handleViewStateChange = ({ viewState }: { viewState: unknown }) => {
    actions.setView(viewState as Partial<ViewState>);
  };

  // Determine map provider and configuration
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const useMapbox = !!mapboxToken;

  // DeckGL expects a PickingInfo signature -> TooltipContent
  const deckTooltip = (info: PickingInfo) => {
    return getFireTooltip({ object: (info.object as any) ?? null });
  };

  return (
    <div className="relative w-full h-full">
      <DeckGL
        initialViewState={view}
        controller={true}
        layers={layers}
        onViewStateChange={handleViewStateChange}
        getTooltip={deckTooltip}
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
