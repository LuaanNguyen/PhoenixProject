import { AQIBand } from "../(types)/sensor";

// Simplified AQI bands for PM2.5 (μg/m³) with custom palette
export const AQI_BANDS: AQIBand[] = [
  {
    min: 0,
    max: 35,
    label: "Good",
    color: "#84994F",
    description: "Air quality is satisfactory",
  },
  {
    min: 35.1,
    max: 75,
    label: "Moderate",
    color: "#FFE797",
    description: "Acceptable for most people",
  },
  {
    min: 75.1,
    max: 150,
    label: "Unhealthy",
    color: "#FCB53B",
    description: "Everyone may experience problems",
  },
  {
    min: 150.1,
    max: Infinity,
    label: "Hazardous",
    color: "#B45253",
    description: "Emergency conditions",
  },
];

/**
 * Get AQI band for a given PM2.5 value
 */
export function getAQIBand(pm25: number): AQIBand {
  return (
    AQI_BANDS.find((band) => pm25 >= band.min && pm25 <= band.max) ||
    AQI_BANDS[0]
  );
}

/**
 * Get AQI color for a given PM2.5 value
 */
export function getAQIColor(pm25: number): string {
  return getAQIBand(pm25).color;
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
 * Get AQI index (0-5) for a given PM2.5 value
 */
export function getAQIIndex(pm25: number): number {
  return AQI_BANDS.findIndex((band) => pm25 >= band.min && pm25 <= band.max);
}
