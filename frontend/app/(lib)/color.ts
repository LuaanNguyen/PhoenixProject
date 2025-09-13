// Optimized color utilities for FlamDirect

/**
 * Custom color palette for FlamDirect
 */
const CUSTOM_COLORS = {
  low: "#84994F", // Green - Good air quality
  moderate: "#FFE797", // Light yellow - Moderate
  high: "#FCB53B", // Orange - Unhealthy
  extreme: "#B45253", // Red - Hazardous
};

/**
 * Simple color interpolation for performance
 */
const COLOR_RANGES = {
  custom: [
    [132, 153, 79], // #84994F
    [255, 231, 151], // #FFE797
    [252, 181, 59], // #FCB53B
    [180, 82, 83], // #B45253
  ],
};

/**
 * Get color range array for deck.gl layers - optimized for performance
 */
export function getColorRange(): [number, number, number][] {
  return COLOR_RANGES.custom as [number, number, number][];
}

/**
 * Get color based on PM2.5 value - optimized for performance
 */
export function getPM25Color(pm25: number): string {
  if (pm25 <= 35) return CUSTOM_COLORS.low;
  if (pm25 <= 75) return CUSTOM_COLORS.moderate;
  if (pm25 <= 150) return CUSTOM_COLORS.high;
  return CUSTOM_COLORS.extreme;
}

/**
 * Convert PM2.5 to RGB array for deck.gl - optimized
 */
export function pm25ToRGB(pm25: number): [number, number, number] {
  if (pm25 <= 35) return [132, 153, 79]; // #84994F
  if (pm25 <= 75) return [255, 231, 151]; // #FFE797
  if (pm25 <= 150) return [252, 181, 59]; // #FCB53B
  return [180, 82, 83]; // #B45253
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
