import { SensorPoint } from "../(types)/sensor";

/**
 * Generate random coordinates around a center point
 */
function randomCoordinate(center: number, radiusDegrees: number): number {
  return center + (Math.random() - 0.5) * radiusDegrees * 2;
}

/**
 * Generate a unique sensor ID
 */
function generateSensorId(): string {
  return `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Simulate smoke spread by generating sensor points with increasing PM2.5 values
 */
export function simulateSmoke(
  centerLonLat: [number, number],
  intensity: { min: number; max: number } = { min: 50, max: 200 },
  durationMs = 30000,
  count = 50,
  radiusDegrees = 0.1,
  onPoint?: (point: SensorPoint) => void
): () => void {
  const [centerLon, centerLat] = centerLonLat;
  const startTime = Date.now();
  const sensors: Array<{
    id: string;
    lat: number;
    lon: number;
    basePM25: number;
  }> = [];

  // Pre-generate sensor locations
  for (let i = 0; i < count; i++) {
    sensors.push({
      id: generateSensorId(),
      lat: randomCoordinate(centerLat, radiusDegrees),
      lon: randomCoordinate(centerLon, radiusDegrees),
      basePM25: Math.random() * 20 + 10, // Base level 10-30 μg/m³
    });
  }

  let cancelled = false;

  const simulate = () => {
    if (cancelled) return;

    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / durationMs, 1);

    // Use easing function for more realistic smoke spread
    // const easedProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic

    sensors.forEach((sensor, index) => {
      // Stagger the onset for more realistic spread
      const sensorDelay = (index / sensors.length) * 0.3; // 30% of duration
      const adjustedProgress = Math.max(
        0,
        (progress - sensorDelay) / (1 - sensorDelay)
      );

      if (adjustedProgress <= 0) return;

      // Calculate PM2.5 with some randomness
      const targetIncrease =
        intensity.min + (intensity.max - intensity.min) * adjustedProgress;
      const randomFactor = 0.8 + Math.random() * 0.4; // ±20% variation
      const currentPM25 = sensor.basePM25 + targetIncrease * randomFactor;

      const tempVal = 20 + Math.random() * 15; // 20-35°C

      const point: SensorPoint = {
        id: sensor.id,
        lat: sensor.lat,
        lon: sensor.lon,
        pm25: Math.round(currentPM25 * 10) / 10, // Round to 1 decimal
        humidity: 45 + Math.random() * 20, // 45-65%
        tempC: tempVal,
        temperature: tempVal,
        ts: Date.now(),
      };

      onPoint?.(point);
    });

    if (progress < 1) {
      setTimeout(simulate, 500); // Update every 500ms
    }
  };

  // Start simulation
  simulate();

  // Return cancellation function
  return () => {
    cancelled = true;
  };
}

/**
 * Generate random sensor data for testing
 */
export function generateRandomSensorBatch(
  count = 20,
  bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number } = {
    minLat: 37.5,
    maxLat: 39.5,
    minLon: -122.5,
    maxLon: -120.5,
  }
): SensorPoint[] {
  const points: SensorPoint[] = [];

  for (let i = 0; i < count; i++) {
    const tempVal = 15 + Math.random() * 20; // 15-35°C
    points.push({
      id: `sensor_${i.toString().padStart(3, "0")}`,
      lat: bounds.minLat + Math.random() * (bounds.maxLat - bounds.minLat),
      lon: bounds.minLon + Math.random() * (bounds.maxLon - bounds.minLon),
      pm25: Math.random() * 150, // 0-150 μg/m³
      humidity: 30 + Math.random() * 40, // 30-70%
      tempC: tempVal, // 15-35°C
      temperature: tempVal,
      ts: Date.now() - Math.random() * 3600000, // Within last hour
    });
  }

  return points;
}
