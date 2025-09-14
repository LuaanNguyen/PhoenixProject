# Phoenix Project

Live Arduino wildfire sensor network with real‑time map, AI decisions, and analytics.

![FlamDirect Map Screenshot](screenshot-placeholder.png)

### Stacks

- **Frontend**: NextJS (App Router), React, TypeScript, Tailwind
- **Mapping**: deck.gl, react-map-gl, MapLibre GL JS
- **State Management/ Validation**: Zustand, Zod
- **Visualization**: D3-scale, Recharts
- **WebSocket**: Native WebSocket API with custom client
- **Backend (simulation):** Python (asyncio, websockets, random, math, datetime/time)
- **Build/Tooling/Infra:** Turbopack, ESLint/TS configs, Vercel (deploy)

### Installation

1. **Frontend**:

   ```bash
   cd FlamDirect/frontend
   npm install
   npm run dev
   ```

2. **Environment variables** (optional):

   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your Mapbox token if desired
   ```

3. **WebSocket server** (in a separate terminal):

   ```bash
   node ../ws-mock.mjs
   ```

4. **Open your browser** to [http://localhost:3000](http://localhost:3000)

## WebSocket Server

The app connects to a WebSocket server for live data. Use the included mock server for testing:

```bash
node ws-mock.mjs
```

The mock server:

- Runs on `ws://localhost:8787/ws`
- Simulates 15 sensors in NorCal foothills
- Sends batch updates and individual sensor deltas
- Occasionally simulates fire events with rising PM2.5 levels
- Provides realistic sensor progression with random walk

### WebSocket Message Format

```typescript
// Batch update
{
  type: "batch",
  points: [
    {
      id: "sensor_001",
      lat: 38.7,
      lon: -121.3,
      pm25: 45.2,        // μg/m³
      humidity: 55.0,    // %
      tempC: 24.5,       // °C
      ts: 1699123456789  // epoch ms
    }
  ]
}

// Individual sensor update
{
  type: "delta",
  point: { /* SensorPoint */ }
}
```

## Map Configuration

### Mapbox (Optional)

Set `NEXT_PUBLIC_MAPBOX_TOKEN` in `.env.local` for Mapbox tiles:

```bash
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

### MapLibre (Default)

Without a Mapbox token, the app uses MapLibre with OpenStreetMap tiles (no token required).

## EPA PM2.5 AQI Bands

| Range (μg/m³) | Category                       | Color  | Description                                   |
| ------------- | ------------------------------ | ------ | --------------------------------------------- |
| 0 - 12.0      | Good                           | Green  | Air quality is satisfactory                   |
| 12.1 - 35.4   | Moderate                       | Yellow | Acceptable for most people                    |
| 35.5 - 55.4   | Unhealthy for Sensitive Groups | Orange | Sensitive individuals may experience problems |
| 55.5 - 150.4  | Unhealthy                      | Red    | Everyone may experience problems              |
| 150.5 - 250.4 | Very Unhealthy                 | Purple | Health alert: serious health effects          |
| 250.5+        | Hazardous                      | Maroon | Emergency conditions                          |

---

**Built with ❤️ for HackMIT 2025**
