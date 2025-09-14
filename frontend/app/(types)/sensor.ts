import { z } from "zod";

// Arduino sensor data point with fire detection
export const SensorPointSchema = z.object({
  id: z.string(),
  lat: z.number(),
  lon: z.number(),
  pm25: z.number(), // μg/m³ (converted from temperature)
  temperature: z.number(), // °C (actual sensor reading)
  humidity: z.number().optional(), // %
  tempC: z.number().optional(), // °C (legacy)
  ts: z.number(), // epoch ms
  state: z.number().optional(), // Fire state: 0=Empty, 1=Vegetation, 2=Burning, 3=Ash
  wind_speed: z.number().optional(), // m/s
  wind_direction: z.number().optional(), // radians
  battery_level: z.number().optional(), // %
  risk_level: z.string().optional(), // LOW, MODERATE, HIGH, CRITICAL, EXTREME
});

export type SensorPoint = z.infer<typeof SensorPointSchema>;

// Fire spread analysis data
export const FireSpreadSchema = z.object({
  step: z.number(),
  burning_cells: z.number(),
  ash_cells: z.number(),
  total_affected_area: z.number(), // m²
  spread_rate: z.number(), // m²/step
  fire_center: z.array(z.number()), // [i, j] grid coordinates
  max_temperature: z.number(), // °C
  avg_temperature: z.number(), // °C
  hotspots: z.array(
    z.object({
      sensor_id: z.string(),
      lat: z.number(),
      lon: z.number(),
      temperature: z.number(),
      state: z.number(),
      risk_level: z.string(),
    })
  ),
  wind_direction: z.number(),
  wind_speed: z.number(),
});

export type FireSpread = z.infer<typeof FireSpreadSchema>;

// WebSocket message types
export const SensorBatchSchema = z.object({
  type: z.literal("sensor_batch"),
  timestamp: z.string(),
  step: z.number(),
  sensors: z.array(SensorPointSchema),
  spread_analysis: FireSpreadSchema,
  statistics: z.object({
    active_sensors: z.number(),
    total_sensors: z.number(),
    max_temperature: z.number(),
    avg_temperature: z.number(),
    affected_area_m2: z.number(),
    spread_rate_m2_per_step: z.number(),
    fire_center: z.array(z.number()),
  }),
});

export const SimulationInitSchema = z.object({
  type: z.literal("simulation_init"),
  data: z.object({
    total_steps: z.number(),
    sensor_count: z.number(),
    grid_size: z.number(),
    simulation_area_km2: z.number(),
    base_coordinates: z.object({
      lat: z.number(),
      lon: z.number(),
    }),
    current_step: z.number(),
    is_playing: z.boolean(),
    playback_speed: z.number(),
  }),
});

export const ControlStateSchema = z.object({
  type: z.literal("control_state"),
  data: z.object({
    current_step: z.number(),
    max_steps: z.number(),
    is_playing: z.boolean(),
    playback_speed: z.number(),
  }),
});

export const HotspotsSchema = z.object({
  type: z.literal("hotspots"),
  data: z.array(
    z.object({
      sensor_id: z.string(),
      lat: z.number(),
      lon: z.number(),
      temperature: z.number(),
      state: z.number(),
      risk_level: z.string(),
    })
  ),
});

// Simple fire system message schema
export const SimpleFireBatchSchema = z.object({
  type: z.literal("sensor_batch"),
  sensors: z.array(SensorPointSchema),
  fire_summary: z
    .object({
      active_fires: z.number(),
      sensors_detecting_fire: z.number(),
      sensors_elevated_temp: z.number(),
      total_sensors: z.number(),
      max_temperature: z.number(),
      affected_area_m2: z.number(),
    })
    .optional(),
  timestamp: z.string(),
});

export const FireMessageSchema = z.union([
  SensorBatchSchema,
  SimulationInitSchema,
  ControlStateSchema,
  HotspotsSchema,
  SimpleFireBatchSchema,
]);

export type SensorBatch = z.infer<typeof SensorBatchSchema>;
export type SimpleFireBatch = z.infer<typeof SimpleFireBatchSchema>;
export type SimulationInit = z.infer<typeof SimulationInitSchema>;
export type ControlState = z.infer<typeof ControlStateSchema>;
export type Hotspots = z.infer<typeof HotspotsSchema>;
export type FireMessage = z.infer<typeof FireMessageSchema>;

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
