#!/usr/bin/env python3
"""
Simple Arduino Fire Detection System
- 65 Arduino sensors spread across ~10km forest area
- Dense Forest (N), Medium Forest (E), Sparse Forest (S), Ridgeline (W), Valley (Center)
- Minimum 500m spacing between sensors to prevent overlap
- Click to start fire anywhere on map
- Watch sensors detect fire as it spreads realistically
- Real emergency response simulation with elevation & battery modeling
"""

import asyncio
import websockets
import random
import json
import math
import time
from datetime import datetime

# Arduino sensor network naturally distributed in forest area (~80 sensors)
FOREST_SENSORS = []

# Define forest zones with much wider spacing - spread across ~10km forest area
forest_zones = [
    # Dense forest core (higher sensor density) - North
    {'center_lat': 38.8100, 'center_lon': -120.4000, 'radius': 0.025, 'sensor_count': 20, 'zone': 'dense_forest'},
    # Medium density forest (medium sensor density) - East
    {'center_lat': 38.7900, 'center_lon': -120.3700, 'radius': 0.030, 'sensor_count': 15, 'zone': 'medium_forest'},
    # Sparse forest edges (lower sensor density) - South
    {'center_lat': 38.7600, 'center_lon': -120.4200, 'radius': 0.035, 'sensor_count': 12, 'zone': 'sparse_forest'},
    # Ridgeline sensors (strategic placement) - West
    {'center_lat': 38.7900, 'center_lon': -120.4800, 'radius': 0.028, 'sensor_count': 10, 'zone': 'ridgeline'},
    # Valley sensors (water sources) - Center
    {'center_lat': 38.7900, 'center_lon': -120.4240, 'radius': 0.020, 'sensor_count': 8, 'zone': 'valley'},
]

sensor_id = 1
MIN_DISTANCE = 0.005  # Minimum ~500m between sensors to prevent overlap

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate approximate distance between two points"""
    return math.sqrt((lat2 - lat1)**2 + (lon2 - lon1)**2)

def is_too_close(new_lat, new_lon, existing_sensors, min_dist):
    """Check if new sensor is too close to existing ones"""
    for sensor in existing_sensors:
        if calculate_distance(new_lat, new_lon, sensor['lat'], sensor['lon']) < min_dist:
            return True
    return False

for zone in forest_zones:
    for i in range(zone['sensor_count']):
        # Try to place sensor with minimum distance enforcement
        attempts = 0
        max_attempts = 50
        
        while attempts < max_attempts:
            # Use polar coordinates for natural distribution
            angle = random.uniform(0, 2 * math.pi)
            # Use square root for more uniform distribution
            distance = zone['radius'] * math.sqrt(random.uniform(0.2, 1.0))  # Start further from center
            
            lat = zone['center_lat'] + distance * math.cos(angle)
            lon = zone['center_lon'] + distance * math.sin(angle)
            
            # Check if this position is far enough from existing sensors
            if not is_too_close(lat, lon, FOREST_SENSORS, MIN_DISTANCE):
                break
            
            attempts += 1
        
        # If we couldn't find a good spot, use the last attempt anyway
        if attempts >= max_attempts:
            print(f"Warning: Sensor {sensor_id} may be close to others")
        
        # Add elevation-based variation (higher elevation = cooler)
        elevation_factor = random.uniform(-1, 1)  # Simulated elevation difference
        base_temp = 20 + elevation_factor * 3 + random.uniform(-2, 2)
        
        # Different battery levels based on accessibility
        if zone['zone'] == 'ridgeline':
            battery_range = (70, 90)  # Harder to maintain
        elif zone['zone'] == 'valley':
            battery_range = (85, 100)  # Easier access
        else:
            battery_range = (75, 95)  # Normal access
            
        sensor = {
            'id': f'ARDUINO_{sensor_id:03d}_{zone["zone"].upper()}',
            'lat': lat,
            'lon': lon,
            'temperature': max(15, min(25, base_temp)),  # Keep realistic range
            'battery': random.randint(battery_range[0], battery_range[1]),
            'status': 'normal',
            'fire_detected': False,
            'zone': zone['zone'],
            'elevation': 1200 + elevation_factor * 200,  # Simulated elevation in meters
        }
        FOREST_SENSORS.append(sensor)
        sensor_id += 1

class SimpleFireSystem:
    def __init__(self):
        self.sensors = FOREST_SENSORS.copy()
        self.active_fires = []  # List of fire locations
        self.clients = set()
        
    def start_fire(self, lat, lon, intensity=1.0):
        """Start a fire at specific coordinates"""
        fire = {
            'lat': lat,
            'lon': lon,
            'intensity': intensity,
            'start_time': time.time(),
            'radius': 0.001  # Start small, grows over time
        }
        self.active_fires.append(fire)
        print(f"🔥 Fire started at {lat:.4f}, {lon:.4f}")
        
    def update_fire_spread(self):
        """Update fire spread and sensor detection"""
        current_time = time.time()
        
        for fire in self.active_fires:
            # Fire grows over time
            age = current_time - fire['start_time']
            fire['radius'] = 0.001 + (age * 0.0005)  # Grows ~50m per minute
            
            # Check which sensors detect this fire
            for sensor in self.sensors:
                distance = self.calculate_distance(
                    fire['lat'], fire['lon'],
                    sensor['lat'], sensor['lon']
                )
                
                if distance <= fire['radius']:
                    # Sensor detects fire!
                    sensor['temperature'] = min(200, 50 + (fire['intensity'] * 100))
                    sensor['status'] = 'fire_detected'
                    sensor['fire_detected'] = True
                elif distance <= fire['radius'] * 2:
                    # Sensor detects heat from nearby fire
                    heat_factor = 1 - (distance / (fire['radius'] * 2))
                    sensor['temperature'] = 20 + (heat_factor * 30)
                    sensor['status'] = 'elevated_temp'
                else:
                    # Normal temperature
                    if not sensor['fire_detected']:
                        sensor['temperature'] = 20 + (sensor['lat'] - 38.7891) * 10
                        sensor['status'] = 'normal'
    
    def calculate_distance(self, lat1, lon1, lat2, lon2):
        """Calculate distance between two coordinates"""
        return math.sqrt((lat2 - lat1)**2 + (lon2 - lon1)**2)
    
    def get_sensor_data(self):
        """Get current sensor readings for frontend"""
        sensor_data = []
        for sensor in self.sensors:
            # Convert to PM2.5 equivalent for visualization
            pm25 = max(0, (sensor['temperature'] - 20) * 2)
            
            sensor_reading = {
                'id': sensor['id'],
                'lat': sensor['lat'],
                'lon': sensor['lon'],
                'temperature': sensor['temperature'],
                'pm25': pm25,
                'battery_level': sensor['battery'],
                'status': sensor['status'],
                'fire_detected': sensor['fire_detected'],
                'timestamp': datetime.now().isoformat(),
                'ts': int(time.time() * 1000)
            }
            sensor_data.append(sensor_reading)
        
        return sensor_data
    
    def get_fire_summary(self):
        """Get summary of active fires and affected sensors"""
        affected_sensors = [s for s in self.sensors if s['fire_detected']]
        elevated_sensors = [s for s in self.sensors if s['status'] == 'elevated_temp']
        
        return {
            'active_fires': len(self.active_fires),
            'sensors_detecting_fire': len(affected_sensors),
            'sensors_elevated_temp': len(elevated_sensors),
            'total_sensors': len(self.sensors),
            'max_temperature': max([s['temperature'] for s in self.sensors]),
            'affected_area_m2': len(affected_sensors) * 10000  # ~100m radius per sensor
        }

class SimpleFireWebSocket:
    def __init__(self):
        self.fire_system = SimpleFireSystem()
        self.clients = set()
        
    async def register_client(self, websocket):
        self.clients.add(websocket)
        print(f"📱 Client connected. Total: {len(self.clients)}")
        
        # Send initial sensor data
        await self.send_sensor_data([websocket])
        
    async def unregister_client(self, websocket):
        self.clients.discard(websocket)
        print(f"📱 Client disconnected. Total: {len(self.clients)}")
    
    async def handle_message(self, websocket, message):
        """Handle commands from frontend"""
        try:
            data = json.loads(message)
            
            if data['type'] == 'start_fire':
                lat = data.get('lat', 38.7900)
                lon = data.get('lon', -120.4240)
                intensity = data.get('intensity', 1.0)
                self.fire_system.start_fire(lat, lon, intensity)
                
            elif data['type'] == 'clear_fires':
                self.fire_system.active_fires = []
                # Reset all sensors
                for sensor in self.fire_system.sensors:
                    sensor['fire_detected'] = False
                    sensor['status'] = 'normal'
                    sensor['temperature'] = 20 + (sensor['lat'] - 38.7891) * 10
                
        except json.JSONDecodeError:
            print(f"❌ Invalid message: {message}")
    
    async def send_sensor_data(self, target_clients=None):
        """Send current sensor data to clients"""
        clients = target_clients or self.clients
        if not clients:
            return
            
        sensor_data = self.fire_system.get_sensor_data()
        fire_summary = self.fire_system.get_fire_summary()
        
        message = {
            'type': 'sensor_batch',
            'sensors': sensor_data,
            'fire_summary': fire_summary,
            'timestamp': datetime.now().isoformat()
        }
        
        websockets.broadcast(clients, json.dumps(message))
    
    async def update_loop(self):
        """Main update loop"""
        while True:
            self.fire_system.update_fire_spread()
            await self.send_sensor_data()
            await asyncio.sleep(2)  # Update every 2 seconds

async def handle_client(websocket):
    server = websocket.server_instance
    await server.register_client(websocket)
    
    try:
        async for message in websocket:
            await server.handle_message(websocket, message)
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        await server.unregister_client(websocket)

async def main():
    print("🚀 Starting Simple Arduino Fire Detection System")
    print(f"🌲 {len(FOREST_SENSORS)} Arduino sensors spread across ~10km forest area")
    print("🌲 Zones: Dense Forest (N), Medium Forest (E), Sparse Forest (S), Ridgeline (W), Valley (Center)")
    print("📏 Minimum 500m spacing between sensors to prevent overlap")
    print("🔥 Click on map to start fires and watch sensors detect them!")
    print("🌐 WebSocket server: ws://localhost:8766")
    
    server_instance = SimpleFireWebSocket()
    
    async def websocket_handler(websocket):
        websocket.server_instance = server_instance
        await handle_client(websocket)
    
    # Start WebSocket server
    start_server = websockets.serve(websocket_handler, "localhost", 8766)
    websocket_server = await start_server
    
    print("✅ Arduino Fire Detection System online!")
    print("📡 25 sensors monitoring forest temperature")
    print("🎮 Frontend: Click map to start fires")
    
    # Start update loop
    await server_instance.update_loop()

if __name__ == "__main__":
    asyncio.run(main())
