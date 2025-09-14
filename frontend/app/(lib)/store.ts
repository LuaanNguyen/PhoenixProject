import { create } from "zustand";
import {
  SensorPoint,
  LayerMode,
  ViewState,
  DEFAULT_VIEW,
  FireMessage,
  FireSpread,
} from "../(types)/sensor";
import { WSClient, createWSClient, ConnectionStatus } from "./ws";
import { simulateSmoke } from "./sim";

interface StoreState {
  // Data
  points: SensorPoint[];
  maxPoints: number;

  // WebSocket
  wsClient: WSClient | null;
  wsStatus: ConnectionStatus;
  live: boolean;

  // UI State
  layerMode: LayerMode;
  timeWindowMin: number;
  view: ViewState;

  // Simulation
  simulationCancel: (() => void) | null;

  // Fire Simulation Data
  fireSimulation: {
    isInitialized: boolean;
    totalSteps: number;
    currentStep: number;
    maxSteps: number;
    isPlaying: boolean;
    playbackSpeed: number;
    sensorCount: number;
    gridSize: number;
    simulationAreaKm2: number;
    baseCoordinates: { lat: number; lon: number };
  };

  // Fire Spread Analysis
  fireSpread: FireSpread | null;
  fireStatistics: {
    activeSensors: number;
    totalSensors: number;
    maxTemperature: number;
    avgTemperature: number;
    affectedAreaM2: number;
    spreadRateM2PerStep: number;
    fireCenter: [number, number];
  };

  // Computed
  filteredPoints: SensorPoint[];
  hotspots: SensorPoint[];
  temperatureHotspots: Array<{
    sensor_id: string;
    lat: number;
    lon: number;
    temperature: number;
    state: number;
    risk_level: string;
  }>;

  // Actions
  actions: {
    // Data management
    addPoints: (newPoints: SensorPoint[]) => void;
    addPoint: (point: SensorPoint) => void;
    clearData: () => void;
    updateFilteredPoints: () => void;

    // WebSocket
    startLive: () => void;
    stopLive: () => void;

    // UI controls
    setLayerMode: (mode: LayerMode) => void;
    setTimeWindow: (minutes: number) => void;
    setView: (view: Partial<ViewState>) => void;
    recenter: () => void;

    // Fire Simulation Controls
    playFireSimulation: () => void;
    pauseFireSimulation: () => void;
    resetFireSimulation: () => void;
    setFireStep: (step: number) => void;
    setPlaybackSpeed: (speed: number) => void;

    // Legacy Simulation
    simulateSmoke: () => void;
    stopSimulation: () => void;

    // Fire Data Processing
    handleFireMessage: (message: FireMessage) => void;
  };
}

export const useStore = create<StoreState>((set, get) => {
  const updateFilteredPoints = () => {
    const { points, timeWindowMin } = get();
    const cutoffTime = Date.now() - timeWindowMin * 60 * 1000;

    // Optimized filtering - use single pass
    const filtered = [];
    const hotspotCandidates = [];

    for (const point of points) {
      if (point.ts >= cutoffTime) {
        filtered.push(point);
        if (point.pm25 && point.pm25 > 10) {
          // Only consider significant PM2.5 values
          hotspotCandidates.push(point);
        }
      }
    }

    // Get top 5 hotspots - only sort candidates, not all points
    const hotspots = hotspotCandidates
      .sort((a, b) => b.pm25 - a.pm25)
      .slice(0, 5);

    set({ filteredPoints: filtered, hotspots });
  };

  const addPointsToBuffer = (newPoints: SensorPoint[]) => {
    const { points, maxPoints } = get();

    // Optimized deduplication - use Map for faster lookups
    const pointMap = new Map<string, SensorPoint>();

    // Add existing points to map
    for (const point of points) {
      pointMap.set(point.id, point);
    }

    // Add/update with new points (keeping latest timestamp)
    for (const point of newPoints) {
      const existing = pointMap.get(point.id);
      if (!existing || point.ts > existing.ts) {
        pointMap.set(point.id, point);
      }
    }

    // Convert to array and limit size (avoid expensive sort if possible)
    const allPoints = Array.from(pointMap.values());
    const finalPoints =
      allPoints.length > maxPoints
        ? allPoints.sort((a, b) => b.ts - a.ts).slice(0, maxPoints)
        : allPoints;

    set({ points: finalPoints });
    updateFilteredPoints();
  };

  return {
    // Initial state
    points: [],
    maxPoints: 3000, // Increased for natural Arduino sensor network (82+ sensors)
    wsClient: null,
    wsStatus: "disconnected",
    live: false,
    layerMode: "heatmap",
    timeWindowMin: 10,
    view: DEFAULT_VIEW,
    simulationCancel: null,
    filteredPoints: [],
    hotspots: [],
    temperatureHotspots: [],

    // Fire simulation state
    fireSimulation: {
      isInitialized: false,
      totalSteps: 0,
      currentStep: 0,
      maxSteps: 0,
      isPlaying: false,
      playbackSpeed: 1.0,
      sensorCount: 0,
      gridSize: 64,
      simulationAreaKm2: 0,
      baseCoordinates: { lat: 38.7891, lon: -120.4234 },
    },

    fireSpread: null,
    fireStatistics: {
      activeSensors: 0,
      totalSensors: 0,
      maxTemperature: 20,
      avgTemperature: 20,
      affectedAreaM2: 0,
      spreadRateM2PerStep: 0,
      fireCenter: [32, 32],
    },

    actions: {
      addPoints: (newPoints) => {
        addPointsToBuffer(newPoints);
      },

      addPoint: (point) => {
        addPointsToBuffer([point]);
      },

      clearData: () => {
        set({ points: [], filteredPoints: [], hotspots: [] });
      },

      updateFilteredPoints,

      startLive: () => {
        const { wsClient } = get();
        if (wsClient) {
          wsClient.connect();
          set({ live: true });
        } else {
          // Create WebSocket client for fire simulation
          const client = createWSClient(
            (message) => {
              get().actions.handleFireMessage(message);
            },
            (status) => {
              set({ wsStatus: status });
            },
            (error) => {
              console.error("WebSocket error:", error);
            }
          );

          client.connect();
          set({ wsClient: client, live: true });
        }
      },

      stopLive: () => {
        const { wsClient } = get();
        if (wsClient) {
          wsClient.disconnect();
        }
        set({ live: false });
      },

      setLayerMode: (mode) => {
        set({ layerMode: mode });
      },

      setTimeWindow: (minutes) => {
        set({ timeWindowMin: minutes });
        updateFilteredPoints();
      },

      setView: (newView) => {
        set((state) => ({
          view: { ...state.view, ...newView },
        }));
      },

      recenter: () => {
        set({ view: DEFAULT_VIEW });
      },

      simulateSmoke: () => {
        const { simulationCancel, view } = get();

        // Cancel existing simulation
        if (simulationCancel) {
          simulationCancel();
        }

        // Start new simulation at current map center
        const cancel = simulateSmoke(
          [view.longitude, view.latitude],
          { min: 50, max: 200 },
          30000,
          50,
          0.1,
          (point) => {
            get().actions.addPoint(point);
          }
        );

        set({ simulationCancel: cancel });
      },

      stopSimulation: () => {
        const { simulationCancel } = get();
        if (simulationCancel) {
          simulationCancel();
          set({ simulationCancel: null });
        }
      },

      // Fire simulation controls
      playFireSimulation: () => {
        const { wsClient } = get();
        if (wsClient && wsClient.ws?.readyState === WebSocket.OPEN) {
          wsClient.ws.send(JSON.stringify({ type: "play" }));
        }
      },

      pauseFireSimulation: () => {
        const { wsClient } = get();
        if (wsClient && wsClient.ws?.readyState === WebSocket.OPEN) {
          wsClient.ws.send(JSON.stringify({ type: "pause" }));
        }
      },

      resetFireSimulation: () => {
        const { wsClient } = get();
        if (wsClient && wsClient.ws?.readyState === WebSocket.OPEN) {
          wsClient.ws.send(JSON.stringify({ type: "reset" }));
        }
      },

      setFireStep: (step: number) => {
        const { wsClient } = get();
        if (wsClient && wsClient.ws?.readyState === WebSocket.OPEN) {
          wsClient.ws.send(JSON.stringify({ type: "set_step", step }));
        }
      },

      setPlaybackSpeed: (speed: number) => {
        const { wsClient } = get();
        if (wsClient && wsClient.ws?.readyState === WebSocket.OPEN) {
          wsClient.ws.send(JSON.stringify({ type: "set_speed", speed }));
        }
      },

      // Fire message handling
      handleFireMessage: (message: FireMessage) => {
        if (
          message.type === "sensor_batch" &&
          "sensors" in message &&
          !("step" in message)
        ) {
          // Handle simple fire system messages
          get().actions.addPoints(message.sensors);
        } else if (message.type === "simulation_init") {
          set({
            fireSimulation: {
              isInitialized: true,
              totalSteps: message.data.total_steps,
              currentStep: message.data.current_step,
              maxSteps: message.data.total_steps,
              isPlaying: message.data.is_playing,
              playbackSpeed: message.data.playback_speed,
              sensorCount: message.data.sensor_count,
              gridSize: message.data.grid_size,
              simulationAreaKm2: message.data.simulation_area_km2,
              baseCoordinates: message.data.base_coordinates,
            },
          });
        } else if (message.type === "sensor_batch") {
          // Update sensor data
          get().actions.addPoints(message.sensors);

          // Update fire spread analysis
          set({
            fireSpread: message.spread_analysis,
            fireStatistics: message.statistics,
            temperatureHotspots: message.spread_analysis.hotspots,
          });

          // Update current step
          set((state) => ({
            fireSimulation: {
              ...state.fireSimulation,
              currentStep: message.step,
            },
          }));
        } else if (message.type === "control_state") {
          set((state) => ({
            fireSimulation: {
              ...state.fireSimulation,
              currentStep: message.data.current_step,
              maxSteps: message.data.max_steps,
              isPlaying: message.data.is_playing,
              playbackSpeed: message.data.playback_speed,
            },
          }));
        } else if (message.type === "hotspots") {
          set({ temperatureHotspots: message.data });
        }
      },
    },
  };
});
