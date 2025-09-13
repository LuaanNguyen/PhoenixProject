import { z } from "zod";

// Core sensor data point
export const SensorPointSchema = z.object({
  id: z.string(),
  lat: z.number(),
  lon: z.number(),
  pm25: z.number(), // μg/m³
  humidity: z.number().optional(), // %
  tempC: z.number().optional(), // °C
  ts: z.number(), // epoch ms
});

export type SensorPoint = z.infer<typeof SensorPointSchema>;

// WebSocket message types
export const SensorBatchSchema = z.object({
  type: z.literal("batch"),
  points: z.array(SensorPointSchema),
});

export const SensorDeltaSchema = z.object({
  type: z.literal("delta"),
  point: SensorPointSchema,
});

export const SensorMessageSchema = z.union([
  SensorBatchSchema,
  SensorDeltaSchema,
]);

export type SensorBatch = z.infer<typeof SensorBatchSchema>;
export type SensorDelta = z.infer<typeof SensorDeltaSchema>;
export type SensorMessage = z.infer<typeof SensorMessageSchema>;

// UI types
export type LayerMode = "heatmap" | "scatter";

export interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

// AQI categories for PM2.5 (μg/m³)
export interface AQIBand {
  min: number;
  max: number;
  label: string;
  color: string;
  description: string;
}

// Default view for Eldorado National Forest, CA
export const DEFAULT_VIEW: ViewState = {
  longitude: -120.4,
  latitude: 38.8,
  zoom: 11,
  pitch: 50,
  bearing: -15,
};
