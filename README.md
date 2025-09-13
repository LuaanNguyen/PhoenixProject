# 🔥 FlamDirect Map

An interactive web application that visualizes wildfire "pinecone" sensors on a 2D/3D map with live updates and comprehensive controls. Built for HackMIT demo.

![FlamDirect Map Screenshot](screenshot-placeholder.png)

## 🌟 Features

### Interactive Map Visualization

- **Live heatmap** showing PM2.5 concentration with customizable color schemes
- **3D hexagon columns** with elevation based on sensor readings
- **Scatter plot overlay** with AQI-colored sensor points
- **Text labels** for significant hotspots
- **2D/3D view toggle** with smooth pitch transitions

### Real-time Data

- **WebSocket client** for live sensor updates
- **Ring buffer** maintains last N minutes of data
- **Batch and delta updates** for efficient data streaming
- **Automatic reconnection** with exponential backoff

### Interactive Controls

- Layer mode toggle (Heatmap ↔ 3D Hexagons)
- Scatter points on/off
- 2D/3D view switch
- Time window slider (5-60 minutes)
- Dynamic radius/elevation scaling
- Color scheme selector (Turbo, Magma, Viridis)
- Live data play/pause
- Map recenter to default view
- Smoke simulation
- Data clearing

### Data Visualization

- **EPA AQI Legend** with color-coded PM2.5 bands
- **Top Hotspots Panel** with sensor details and sparklines
- **Real-time statistics** (sensor count, max/median PM2.5)
- **Interactive tooltips** with sensor details

### Simulation

- **"Simulate Smoke" feature** creates realistic wildfire progression
- Gradual PM2.5 increase over 30 seconds
- Multiple sensors affected in a geographic cluster
- Visual transition from normal to hazardous levels

## 🛠 Tech Stack

- **Frontend**: Next.js 15+ (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Mapping**: deck.gl, react-map-gl, MapLibre GL JS
- **State Management**: Zustand
- **Data Validation**: Zod
- **Visualization**: D3-scale, Recharts
- **WebSocket**: Native WebSocket API with custom client

## 📁 Project Structure

```
frontend/
├── app/
│   ├── (components)/
│   │   ├── SmartConeMap.tsx      # Main map with deck.gl layers
│   │   ├── ControlsPanel.tsx     # Control panel with toggles/sliders
│   │   ├── Legend.tsx            # EPA AQI legend
│   │   └── HotspotsPanel.tsx     # Top sensors with sparklines
│   ├── (lib)/
│   │   ├── store.ts              # Zustand state management
│   │   ├── ws.ts                 # WebSocket client
│   │   ├── aqi.ts                # EPA AQI utilities
│   │   ├── color.ts              # D3 color schemes
│   │   └── sim.ts                # Smoke simulation
│   ├── (types)/
│   │   └── sensor.ts             # TypeScript types & schemas
│   ├── globals.css               # Global styles
│   └── page.tsx                  # Main application page
├── .env.local.example            # Environment variables template
└── package.json
ws-mock.mjs                       # WebSocket mock server
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

1. **Clone and navigate to the project**:

   ```bash
   cd FlamDirect/frontend
   npm install
   ```

2. **Set up environment variables** (optional):

   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your Mapbox token if desired
   ```

3. **Start the development server**:

   ```bash
   npm run dev
   ```

4. **Start the WebSocket mock server** (in a separate terminal):

   ```bash
   node ../ws-mock.mjs
   ```

5. **Open your browser** to [http://localhost:3000](http://localhost:3000)

## 🔌 WebSocket Server

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

## 🗺 Map Configuration

### Mapbox (Optional)

Set `NEXT_PUBLIC_MAPBOX_TOKEN` in `.env.local` for Mapbox tiles:

```bash
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

### MapLibre (Default)

Without a Mapbox token, the app uses MapLibre with OpenStreetMap tiles (no token required).

### Custom WebSocket URL

```bash
NEXT_PUBLIC_WS_URL=ws://your-server.com/ws
```

## 📊 EPA PM2.5 AQI Bands

| Range (μg/m³) | Category                       | Color  | Description                                   |
| ------------- | ------------------------------ | ------ | --------------------------------------------- |
| 0 - 12.0      | Good                           | Green  | Air quality is satisfactory                   |
| 12.1 - 35.4   | Moderate                       | Yellow | Acceptable for most people                    |
| 35.5 - 55.4   | Unhealthy for Sensitive Groups | Orange | Sensitive individuals may experience problems |
| 55.5 - 150.4  | Unhealthy                      | Red    | Everyone may experience problems              |
| 150.5 - 250.4 | Very Unhealthy                 | Purple | Health alert: serious health effects          |
| 250.5+        | Hazardous                      | Maroon | Emergency conditions                          |

## 🎮 Usage Guide

### Basic Navigation

- **Pan**: Click and drag the map
- **Zoom**: Mouse wheel or pinch gesture
- **Rotate**: Right-click and drag (3D mode)
- **Tilt**: Shift + click and drag

### Controls Panel

- **Layer Mode**: Switch between heatmap and 3D hexagon visualization
- **Scatter Points**: Toggle sensor point overlay
- **3D View**: Switch between 2D (pitch 0°) and 3D (pitch 45°) views
- **Time Window**: Filter data to last 5-60 minutes
- **Radius/Elevation**: Adjust visual intensity
- **Color Scheme**: Choose from Turbo, Magma, or Viridis palettes

### Live Data

- **Start Live**: Connect to WebSocket and receive real-time updates
- **Pause Live**: Disconnect from WebSocket but keep current data
- **Simulate Smoke**: Generate a realistic wildfire scenario
- **Clear Data**: Remove all sensor data from the map

### Hotspots Panel

- Shows top 5 sensors by PM2.5 level
- Includes 60-second sparkline charts
- Click any sensor to center the map on its location

## 🔥 Smoke Simulation

The "Simulate Smoke" feature creates a realistic wildfire scenario:

1. **Initiation**: Selects current map center as fire origin
2. **Spread**: Generates 50 sensors in a 0.1° radius (~11km)
3. **Progression**: PM2.5 levels rise from 50-200 μg/m³ over 30 seconds
4. **Visual Effect**: Watch the heatmap intensify and scatter points turn red/purple
5. **Staggered Onset**: Sensors activate with realistic time delays

## 🚀 Performance Optimizations

- **Memoized layer data** prevents unnecessary re-renders
- **Ring buffer** limits memory usage to last N minutes
- **Throttled updates** at 5-10 fps for smooth animation
- **Instanced rendering** via deck.gl for efficient GPU usage
- **Dynamic imports** for code splitting

## 🎯 Acceptance Criteria

✅ App runs with `npm run dev`  
✅ Smoke simulation shows convincing heatmap intensification  
✅ Layer toggles work instantly  
✅ 2D/3D switch adjusts map pitch  
✅ Time window filters older data  
✅ Recenter flies to default bounds  
✅ Legend reflects current AQI bands  
✅ Hotspots panel shows real-time data  
✅ WebSocket reconnection with toast notifications  
✅ Graceful MapLibre fallback without Mapbox token

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Mapbox/MapLibre** for mapping infrastructure
- **deck.gl** for high-performance data visualization
- **EPA** for AQI standards and color guidelines
- **OpenStreetMap** contributors for map tiles
- **HackMIT** for the inspiration and opportunity

---

**Built with ❤️ for HackMIT 2024**
