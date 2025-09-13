import { create } from "zustand";
import {
  SensorPoint,
  LayerMode,
  ViewState,
  DEFAULT_VIEW,
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

  // Computed
  filteredPoints: SensorPoint[];
  hotspots: SensorPoint[];

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

    // Simulation
    simulateSmoke: () => void;
    stopSimulation: () => void;
  };
}

export const useStore = create<StoreState>((set, get) => {
  const updateFilteredPoints = () => {
    const { points, timeWindowMin } = get();
    const cutoffTime = Date.now() - timeWindowMin * 60 * 1000;
    const filtered = points.filter((p) => p.ts >= cutoffTime);

    // Get top 5 hotspots
    const hotspots = [...filtered].sort((a, b) => b.pm25 - a.pm25).slice(0, 5);

    set({ filteredPoints: filtered, hotspots });
  };

  const addPointsToBuffer = (newPoints: SensorPoint[]) => {
    const { points, maxPoints } = get();
    const allPoints = [...points, ...newPoints];

    // Remove duplicates by ID, keeping the latest timestamp
    const uniquePoints = new Map<string, SensorPoint>();
    allPoints.forEach((point) => {
      const existing = uniquePoints.get(point.id);
      if (!existing || point.ts > existing.ts) {
        uniquePoints.set(point.id, point);
      }
    });

    // Convert back to array and sort by timestamp
    const sortedPoints = Array.from(uniquePoints.values()).sort(
      (a, b) => b.ts - a.ts
    );

    // Keep only the most recent points
    const trimmedPoints = sortedPoints.slice(0, maxPoints);

    set({ points: trimmedPoints });
    updateFilteredPoints();
  };

  return {
    // Initial state
    points: [],
    maxPoints: 1000, // Reduced for better performance
    wsClient: null,
    wsStatus: "disconnected",
    live: false,
    layerMode: "heatmap",
    timeWindowMin: 10,
    view: DEFAULT_VIEW,
    simulationCancel: null,
    filteredPoints: [],
    hotspots: [],

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
          // Create WebSocket client
          const client = createWSClient(
            (message) => {
              if (message.type === "batch") {
                get().actions.addPoints(message.points);
              } else if (message.type === "delta") {
                get().actions.addPoint(message.point);
              }
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
    },
  };
});
