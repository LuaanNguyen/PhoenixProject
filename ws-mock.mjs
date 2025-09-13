#!/usr/bin/env node

import { WebSocketServer } from "ws";

const PORT = 8787;

// Simulate sensor locations in Eldorado National Forest, CA
const SENSOR_LOCATIONS = [
  { id: "eldorado_01", lat: 38.82, lon: -120.35, name: "Crystal Basin" },
  {
    id: "eldorado_02",
    lat: 38.75,
    lon: -120.45,
    name: "Desolation Wilderness",
  },
  { id: "eldorado_03", lat: 38.88, lon: -120.28, name: "Lake Tahoe Basin" },
  { id: "eldorado_04", lat: 38.71, lon: -120.52, name: "American River" },
  { id: "eldorado_05", lat: 38.93, lon: -120.41, name: "Granite Chief" },
  { id: "eldorado_06", lat: 38.67, lon: -120.38, name: "Silver Fork" },
  { id: "eldorado_07", lat: 38.85, lon: -120.48, name: "Hell Hole Reservoir" },
  { id: "eldorado_08", lat: 38.78, lon: -120.32, name: "Echo Lake" },
];

// Track sensor states for realistic progression
const sensorStates = new Map();

function initializeSensorStates() {
  SENSOR_LOCATIONS.forEach((location) => {
    sensorStates.set(location.id, {
      ...location,
      basePM25: 10 + Math.random() * 20, // Base level 10-30
      trend: (Math.random() - 0.5) * 0.5, // Trend factor
      lastUpdate: Date.now(),
    });
  });
}

function generateSensorReading(sensorId) {
  const state = sensorStates.get(sensorId);
  if (!state) return null;

  const now = Date.now();
  const timeDelta = (now - state.lastUpdate) / 1000; // seconds

  // Add some random walk behavior
  const randomChange = (Math.random() - 0.5) * 2; // ±1 μg/m³
  const trendChange = state.trend * timeDelta * 0.1;

  // Update base level with bounds
  state.basePM25 = Math.max(
    5,
    Math.min(200, state.basePM25 + randomChange + trendChange)
  );
  state.lastUpdate = now;

  // Add some noise
  const currentPM25 = Math.max(0, state.basePM25 + (Math.random() - 0.5) * 5);

  return {
    id: sensorId,
    lat: state.lat,
    lon: state.lon,
    pm25: Math.round(currentPM25 * 10) / 10,
    humidity: 40 + Math.random() * 30, // 40-70%
    tempC: 18 + Math.random() * 12, // 18-30°C
    ts: now,
  };
}

function generateBatch(count = 5) {
  const sensors = Array.from(sensorStates.keys());
  const selectedSensors = sensors
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(count, sensors.length));

  const points = selectedSensors.map(generateSensorReading).filter(Boolean);

  return {
    type: "batch",
    points,
  };
}

function generateDelta() {
  const sensors = Array.from(sensorStates.keys());
  const randomSensor = sensors[Math.floor(Math.random() * sensors.length)];
  const point = generateSensorReading(randomSensor);

  return point
    ? {
        type: "delta",
        point,
      }
    : null;
}

function simulateFireEvent() {
  console.log("🔥 Simulating fire event - increasing PM2.5 levels");

  // Pick a random sensor as the fire origin
  const sensors = Array.from(sensorStates.keys());
  const originSensor = sensors[Math.floor(Math.random() * sensors.length)];
  const originState = sensorStates.get(originSensor);

  // Increase PM2.5 for nearby sensors
  sensorStates.forEach((state, id) => {
    const distance = Math.sqrt(
      Math.pow(state.lat - originState.lat, 2) +
        Math.pow(state.lon - originState.lon, 2)
    );

    // Sensors within 0.2 degrees (~22km) are affected
    if (distance < 0.2) {
      const intensity = Math.max(0.1, 1 - distance / 0.2); // Closer = more affected
      state.basePM25 += 50 * intensity; // Add 50+ μg/m³ based on proximity
      state.trend = Math.max(state.trend, 0.5 * intensity); // Positive trend
    }
  });
}

// Initialize WebSocket server
const wss = new WebSocketServer({ port: PORT });

console.log(`🚀 WebSocket mock server started on ws://localhost:${PORT}/ws`);
console.log("📡 Simulating wildfire sensor data...");

// Initialize sensor states
initializeSensorStates();

wss.on("connection", (ws, req) => {
  console.log(`📱 Client connected from ${req.socket.remoteAddress}`);

  // Send initial batch
  const initialBatch = generateBatch(8);
  ws.send(JSON.stringify(initialBatch));
  console.log(
    `📦 Sent initial batch with ${initialBatch.points.length} sensors`
  );

  // Send periodic updates
  const updateInterval = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      // 70% chance of delta, 30% chance of batch
      const message = Math.random() < 0.7 ? generateDelta() : generateBatch(3);

      if (message) {
        ws.send(JSON.stringify(message));

        if (message.type === "delta") {
          console.log(
            `📊 Sent delta: ${message.point.id} = ${message.point.pm25.toFixed(
              1
            )} μg/m³`
          );
        } else {
          console.log(`📦 Sent batch with ${message.points.length} sensors`);
        }
      }
    }
  }, 5000); // Update every 5 seconds for better performance

  // Simulate fire events occasionally
  const fireInterval = setInterval(() => {
    if (Math.random() < 0.1) {
      // 10% chance every 30 seconds
      simulateFireEvent();
    }
  }, 30000);

  ws.on("close", () => {
    console.log("📱 Client disconnected");
    clearInterval(updateInterval);
    clearInterval(fireInterval);
  });

  ws.on("error", (error) => {
    console.error("❌ WebSocket error:", error);
    clearInterval(updateInterval);
    clearInterval(fireInterval);
  });
});

wss.on("error", (error) => {
  console.error("❌ Server error:", error);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down WebSocket server...");
  wss.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

// Add some helpful logs
setInterval(() => {
  const avgPM25 =
    Array.from(sensorStates.values()).reduce(
      (sum, state) => sum + state.basePM25,
      0
    ) / sensorStates.size;

  console.log(
    `📈 Average PM2.5: ${avgPM25.toFixed(1)} μg/m³ | Active connections: ${
      wss.clients.size
    }`
  );
}, 10000); // Every 10 seconds
