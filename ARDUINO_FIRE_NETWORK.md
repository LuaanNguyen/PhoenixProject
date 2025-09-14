# 🔥 Arduino Fire Sensor Network - FlamDirect

A real-time wildfire monitoring system using 4,096 virtual Arduino temperature sensors deployed across Eldorado National Forest.

## 🌟 Features

### 🔥 **Fire Simulation Engine**

- **64x64 grid** = 4,096 Arduino sensors covering 3.7 km²
- **Real-time fire physics** with wind, slope, and fuel modeling
- **Temperature tracking** from 20°C to 800°C+
- **Fire spread analysis** with rate and direction calculation
- **300 simulation steps** for comprehensive fire progression

### 📡 **Arduino Sensor Network**

- **Virtual Arduino sensors** with temperature, PM2.5, wind, and battery data
- **Fire state detection**: Empty, Vegetation, Burning, Ash
- **Risk level assessment**: LOW → MODERATE → HIGH → CRITICAL → EXTREME
- **Real-time data streaming** via WebSocket

### 🗺️ **Advanced Visualization**

- **Temperature heatmaps** showing fire intensity
- **Fire state visualization** with color-coded sensors
- **Critical hotspot detection** and alerting
- **Fire center tracking** and spread vectors
- **Interactive tooltips** with detailed sensor data

### ⚡ **Real-time Controls**

- **Play/Pause/Reset** fire simulation
- **Speed control** (0.5x to 5x playback)
- **Step-by-step** progression
- **Jump to specific** simulation steps

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Python dependencies
pip install websockets numpy asyncio

# Node.js dependencies (frontend)
cd frontend
npm install
```

### 2. Start the Arduino Fire Sensor Network

```bash
# Start the fire simulation server
python start-fire-server.py

# Or run directly
python fire-websocket-server.py
```

### 3. Start the Frontend

```bash
cd frontend
npm run dev
```

### 4. Open the Application

Visit `http://localhost:3000` to see the Arduino Fire Sensor Network in action!

## 🔧 Technical Architecture

### Backend Components

#### `backend/firesimheadless.py`

- **Fire simulation engine** with cellular automata
- **Arduino sensor network generation** (4,096 sensors)
- **Temperature calculation** with heat diffusion
- **Fire spread metrics** and hotspot detection

#### `fire-websocket-server.py`

- **WebSocket server** for real-time data streaming
- **Simulation playback controls** (play/pause/speed)
- **Client connection management**
- **Data broadcasting** to frontend

### Frontend Components

#### `app/(components)/FireLayers.tsx`

- **Advanced deck.gl layers** for fire visualization
- **Temperature heatmaps** and scatter plots
- **Fire state coloring** and risk level indicators
- **Interactive tooltips** with sensor details

#### `app/(components)/Sidebar.tsx`

- **Fire simulation controls** (play/pause/reset)
- **Real-time fire analytics** (spread rate, affected area)
- **Critical fire zones** with hotspot listing
- **Arduino sensor statistics**

#### `app/(lib)/store.ts`

- **Fire simulation state management**
- **WebSocket message handling**
- **Real-time data processing**
- **UI state synchronization**

## 📊 Data Flow

```
Arduino Sensors (Virtual) → Fire Simulation Engine → WebSocket Server → Frontend
     ↓                           ↓                        ↓              ↓
Temperature Data         Fire Physics Model      Real-time Streaming   Visualization
Wind/Battery Info        Spread Calculation      Message Broadcasting  User Controls
Fire State Detection     Hotspot Analysis        Client Management     Analytics Display
```

## 🔥 Fire Simulation Details

### Fire States

- **🌿 VEGETATION** (1): Normal forest vegetation
- **🔥 BURNING** (2): Active fire spreading
- **🌫️ ASH** (3): Burned out areas
- **⬜ EMPTY** (0): Non-flammable areas

### Risk Levels

- **🟢 LOW** (20-30°C): Normal conditions
- **🟡 MODERATE** (30-60°C): Elevated temperature
- **🟠 HIGH** (60-100°C): Fire risk
- **🔴 CRITICAL** (100-300°C): Immediate danger
- **⚫ EXTREME** (300°C+): Active burning

### Simulation Parameters

- **Grid Size**: 64x64 cells (4,096 sensors)
- **Cell Size**: 30x30 meters each
- **Total Area**: 3.7 km² (Eldorado National Forest)
- **Simulation Steps**: 300 (representing ~10 hours)
- **Update Frequency**: 2-5 seconds per step

## 🌐 WebSocket API

### Connection

```javascript
ws://localhost:8765
```

### Message Types

#### Simulation Initialization

```json
{
  "type": "simulation_init",
  "data": {
    "total_steps": 300,
    "sensor_count": 4096,
    "grid_size": 64,
    "simulation_area_km2": 3.7,
    "base_coordinates": { "lat": 38.7891, "lon": -120.4234 }
  }
}
```

#### Sensor Data Batch

```json
{
  "type": "sensor_batch",
  "step": 150,
  "sensors": [
    {
      "id": "ARDUINO_32_32",
      "lat": 38.7891,
      "lon": -120.4234,
      "temperature": 45.2,
      "pm25": 12.5,
      "state": 1,
      "risk_level": "MODERATE",
      "battery_level": 87
    }
  ],
  "spread_analysis": {
    "burning_cells": 25,
    "total_affected_area": 22500,
    "spread_rate": 1800,
    "max_temperature": 650.5
  }
}
```

#### Control Commands

```json
{"type": "play"}
{"type": "pause"}
{"type": "reset"}
{"type": "set_step", "step": 150}
{"type": "set_speed", "speed": 2.0}
```

## 🎯 Use Cases

### 🚨 **Emergency Response**

- **Real-time fire detection** from Arduino sensors
- **Hotspot identification** for rapid response
- **Evacuation zone planning** based on spread prediction
- **Resource allocation** for firefighting efforts

### 📈 **Research & Analysis**

- **Fire behavior modeling** with environmental factors
- **Spread pattern analysis** for forest management
- **Sensor network optimization** studies
- **Climate change impact** assessment

### 🎓 **Education & Training**

- **Wildfire simulation** for training programs
- **Arduino sensor network** demonstrations
- **Real-time data visualization** examples
- **Emergency response** scenario planning

## 🔧 Configuration

### Environment Variables

```bash
# Frontend
NEXT_PUBLIC_WS_URL=ws://localhost:8765

# Backend
FIRE_SIMULATION_STEPS=300
ARDUINO_SENSOR_COUNT=4096
UPDATE_INTERVAL_MS=2000
```

### Simulation Parameters

```python
# In backend/firesimheadless.py
size = 64              # Grid size (64x64 = 4,096 sensors)
steps = 300            # Simulation duration
CELL_SIZE_METERS = 30  # Each cell represents 30x30m
BASE_LAT = 38.7891     # Eldorado National Forest
BASE_LON = -120.4234
```

## 🚀 Deployment

### Production Setup

1. **Server**: Deploy WebSocket server on cloud instance
2. **Frontend**: Build and deploy Next.js application
3. **Scaling**: Use load balancer for multiple WebSocket connections
4. **Monitoring**: Add logging and metrics collection

### Docker Support (Future)

```dockerfile
# Dockerfile for fire simulation server
FROM python:3.9-slim
COPY . /app
WORKDIR /app
RUN pip install -r requirements.txt
EXPOSE 8765
CMD ["python", "fire-websocket-server.py"]
```

## 📝 License

MIT License - Feel free to use this Arduino Fire Sensor Network for research, education, and emergency response applications.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/arduino-enhancement`)
3. Commit changes (`git commit -am 'Add new sensor feature'`)
4. Push to branch (`git push origin feature/arduino-enhancement`)
5. Create Pull Request

## 📞 Support

For questions about the Arduino Fire Sensor Network:

- 🔥 **Fire Simulation**: Check `backend/firesimheadless.py`
- 🌐 **WebSocket Issues**: Review `fire-websocket-server.py`
- 🗺️ **Visualization Problems**: Examine `app/(components)/FireLayers.tsx`
- 📱 **Frontend Issues**: Look at `app/(lib)/store.ts`

---

**🔥 FlamDirect Arduino Fire Sensor Network - Protecting forests with real-time wildfire monitoring! 🌲**
