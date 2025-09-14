import { Layer } from "@deck.gl/core";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import { SensorPoint } from "../(types)/sensor";
import { getColorRange } from "../(lib)/color";

// Local helper types to avoid using `any`
type Hotspot = {
  sensor_id: string;
  lat: number;
  lon: number;
  temperature: number;
  state: number;
  risk_level: string;
};

interface TooltipObject {
  id?: string;
  temperature?: number;
  pm25?: number;
  lat?: number;
  lon?: number;
  state?: number;
  risk_level?: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "EXTREME" | string;
  wind_speed?: number;
  battery_level?: number;
  sensor_id?: string;
}

interface FireLayersConfig {
  layerMode: "heatmap" | "scatter";
  data: SensorPoint[];
  fireStatistics: {
    activeSensors: number;
    totalSensors: number;
    maxTemperature: number;
    avgTemperature: number;
    affectedAreaM2: number;
    spreadRateM2PerStep: number;
    fireCenter: [number, number];
  };
  temperatureHotspots: Array<{
    sensor_id: string;
    lat: number;
    lon: number;
    temperature: number;
    state: number;
    risk_level: string;
  }>;
}

export function createFireLayers({
  layerMode,
  data,
  fireStatistics,
  temperatureHotspots,
}: FireLayersConfig): Layer[] {
  // Fire state colors
  const FIRE_STATE_COLORS: Record<number, [number, number, number]> = {
    0: [139, 69, 19], // EMPTY - Brown
    1: [34, 139, 34], // VEGETATION - Forest Green
    2: [255, 69, 0], // BURNING - Orange Red
    3: [47, 79, 79], // ASH - Dark Slate Gray
  };

  // Risk level colors
  const RISK_COLORS: Record<string, [number, number, number]> = {
    LOW: [132, 153, 79], // Green
    MODERATE: [255, 231, 151], // Yellow
    HIGH: [252, 181, 59], // Orange
    CRITICAL: [180, 82, 83], // Red
    EXTREME: [139, 0, 0], // Dark Red
  };

  const layerList: Layer[] = [];

  if (data.length === 0) return layerList;

  if (layerMode === "heatmap") {
    // Temperature heatmap layer
    layerList.push(
      new HeatmapLayer({
        id: "fire-temperature-heatmap",
        data,
        getPosition: (d: SensorPoint) => [d.lon, d.lat],
        getWeight: (d: SensorPoint) => Math.max(d.temperature || 20, 20) - 20, // Use temperature above ambient
        radiusPixels: 60,
        intensity: 2,
        threshold: 0.03,
        colorRange: [
          [0, 100, 255], // Cold - Blue
          [0, 255, 255], // Cool - Cyan
          [0, 255, 0], // Moderate - Green
          [255, 255, 0], // Warm - Yellow
          [255, 165, 0], // Hot - Orange
          [255, 0, 0], // Very Hot - Red
          [139, 0, 0], // Extreme - Dark Red
        ],
        pickable: true,
      })
    );

    // PM2.5 overlay for air quality
    layerList.push(
      new HeatmapLayer({
        id: "fire-pm25-heatmap",
        data,
        getPosition: (d: SensorPoint) => [d.lon, d.lat],
        getWeight: (d: SensorPoint) => d.pm25,
        radiusPixels: 40,
        intensity: 1,
        threshold: 0.05,
        colorRange: getColorRange() as [number, number, number][],
        opacity: 0.6,
        pickable: true,
      })
    );
  } else {
    // Scatter plot with fire state visualization
    layerList.push(
      new ScatterplotLayer({
        id: "arduino-sensors",
        data,
        getPosition: (d: SensorPoint) => [d.lon, d.lat],
        getRadius: (d: SensorPoint) => {
          // Size based on temperature
          const temp = d.temperature || 20;
          if (temp > 200) return 25; // Large for burning
          if (temp > 100) return 20; // Medium for high heat
          if (temp > 50) return 15; // Small for warm
          return 10; // Minimum for ambient
        },
        getFillColor: (d: SensorPoint): [number, number, number] => {
          // Color based on fire state if available, otherwise temperature
          if (d.state !== undefined) {
            return (
              FIRE_STATE_COLORS[d.state as keyof typeof FIRE_STATE_COLORS] || [
                100, 100, 100,
              ]
            );
          }

          // Fallback to temperature-based coloring
          const temp = d.temperature || 20;
          if (temp > 300) return [139, 0, 0]; // Dark red - extreme
          if (temp > 200) return [255, 0, 0]; // Red - burning
          if (temp > 100) return [255, 165, 0]; // Orange - high
          if (temp > 50) return [255, 255, 0]; // Yellow - warm
          if (temp > 30) return [0, 255, 0]; // Green - normal
          return [0, 100, 255]; // Blue - cool
        },
        getLineColor: (d: SensorPoint): [number, number, number] => {
          // Border color based on risk level
          if (d.risk_level) {
            return (
              RISK_COLORS[d.risk_level as keyof typeof RISK_COLORS] || [
                100, 100, 100,
              ]
            );
          }
          return [255, 255, 255]; // White border
        },
        lineWidthMinPixels: 2,
        stroked: true,
        filled: true,
        pickable: true,
        updateTriggers: {
          getFillColor: [data],
          getRadius: [data],
          getLineColor: [data],
        },
      })
    );

    // Temperature labels for critical sensors
    const criticalSensors = data.filter((d) => (d.temperature || 20) > 100);
    if (criticalSensors.length > 0) {
      layerList.push(
        new TextLayer({
          id: "temperature-labels",
          data: criticalSensors,
          getPosition: (d: SensorPoint) => [d.lon, d.lat],
          getText: (d: SensorPoint) => `${Math.round(d.temperature || 20)}°C`,
          getSize: 12,
          getColor: [255, 255, 255, 200],
          getAngle: 0,
          getTextAnchor: "middle",
          getAlignmentBaseline: "center",
          fontFamily: "Arial, sans-serif",
          fontWeight: "bold",
          background: true,
          getBackgroundColor: [0, 0, 0, 100],
          pickable: false,
        })
      );
    }
  }

  // Fire center indicator
  if (fireStatistics.fireCenter && fireStatistics.fireCenter.length === 2) {
    const [centerI, centerJ] = fireStatistics.fireCenter;
    // Convert grid coordinates to lat/lon (approximate)
    const centerLat = 38.7891 + (centerI * 30) / 111000;
    const centerLon = -120.4234 + (centerJ * 30) / 111000;

    layerList.push(
      new ScatterplotLayer({
        id: "fire-center",
        data: [{ position: [centerLon, centerLat] }],
        getPosition: (d: { position: [number, number] }) => d.position,
        getRadius: 100,
        getFillColor: [255, 0, 0, 100],
        getLineColor: [255, 255, 255, 200],
        lineWidthMinPixels: 3,
        stroked: true,
        filled: true,
        pickable: false,
      })
    );
  }

  // Critical hotspots overlay
  if (temperatureHotspots.length > 0) {
    layerList.push(
      new ScatterplotLayer({
        id: "critical-hotspots",
        data: temperatureHotspots.slice(0, 10), // Top 10 hotspots
        getPosition: (d: Hotspot) => [d.lon, d.lat],
        getRadius: 50,
        getFillColor: [255, 0, 0, 150],
        getLineColor: [255, 255, 0, 200],
        lineWidthMinPixels: 2,
        stroked: true,
        filled: true,
        pickable: true,
        radiusScale: 1,
        radiusMinPixels: 20,
        radiusMaxPixels: 80,
      })
    );

    // Hotspot labels
    layerList.push(
      new TextLayer({
        id: "hotspot-labels",
        data: temperatureHotspots.slice(0, 5), // Top 5 labels
        getPosition: (d: Hotspot) => [d.lon, d.lat],
        getText: (d: Hotspot) => `🔥 ${Math.round(d.temperature)}°C`,
        getSize: 14,
        getColor: [255, 255, 255, 255],
        getAngle: 0,
        getTextAnchor: "middle",
        getAlignmentBaseline: "center",
        fontFamily: "Arial, sans-serif",
        fontWeight: "bold",
        background: true,
        getBackgroundColor: [255, 0, 0, 150],
        pickable: false,
      })
    );
  }

  return layerList;
}

// Custom tooltip for fire data
export function getFireTooltip({ object }: { object: TooltipObject | null }) {
  if (!object) return null;

  // Handle different layer types
  if (
    object.temperature !== undefined ||
    object.pm25 !== undefined ||
    object.id
  ) {
    const fireStateNames = {
      0: "Empty",
      1: "Vegetation",
      2: "🔥 BURNING",
      3: "Ash",
    };

    return {
      html: `
        <div style="background: rgba(0,0,0,0.8); color: white; padding: 12px; border-radius: 8px; font-size: 12px;">
          <div style="font-weight: bold; margin-bottom: 8px;">Arduino Sensor ${
            object.id
          }</div>
          <div><strong>Temperature:</strong> ${Math.round(
            object.temperature || 20
          )}°C</div>
           <div><strong>PM2.5:</strong> ${(object.pm25 || 0).toFixed(
             1
           )} μg/m³</div>
          ${
            object.state !== undefined
              ? `<div><strong>State:</strong> ${
                  fireStateNames[object.state as keyof typeof fireStateNames] ||
                  "Unknown"
                }</div>`
              : ""
          }
          ${
            object.risk_level
              ? `<div><strong>Risk:</strong> <span style="color: ${
                  object.risk_level === "EXTREME"
                    ? "#FF0000"
                    : object.risk_level === "CRITICAL"
                    ? "#FF4500"
                    : object.risk_level === "HIGH"
                    ? "#FFA500"
                    : object.risk_level === "MODERATE"
                    ? "#FFFF00"
                    : "#00FF00"
                }">${object.risk_level}</span></div>`
              : ""
          }
           ${
             object.wind_speed !== undefined
               ? `<div><strong>Wind:</strong> ${(
                   object.wind_speed || 0
                 ).toFixed(1)} m/s</div>`
               : ""
           }
           ${
             object.battery_level !== undefined
               ? `<div><strong>Battery:</strong> ${Math.round(
                   object.battery_level || 0
                 )}%</div>`
               : ""
           }
          <div style="font-size: 10px; color: #ccc; margin-top: 4px;">
            Lat: ${(object.lat || 0).toFixed(6)}, Lon: ${(
        object.lon || 0
      ).toFixed(6)}
          </div>
        </div>
      `,
      style: {
        backgroundColor: "transparent",
        fontSize: "12px",
      },
    };
  }

  // Handle hotspot objects
  if (object.sensor_id) {
    return {
      html: `
        <div style="background: rgba(255,0,0,0.9); color: white; padding: 10px; border-radius: 6px; font-size: 12px;">
          <div style="font-weight: bold;">🔥 CRITICAL HOTSPOT</div>
          <div>Sensor: ${object.sensor_id || "Unknown"}</div>
          <div>Temperature: ${Math.round(object.temperature || 20)}°C</div>
          <div>Risk: ${object.risk_level || "Unknown"}</div>
        </div>
      `,
      style: {
        backgroundColor: "transparent",
        fontSize: "12px",
      },
    };
  }

  return null;
}
