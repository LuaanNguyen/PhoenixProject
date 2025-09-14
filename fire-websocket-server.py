#!/usr/bin/env python3
"""
Arduino Fire Sensor Network WebSocket Server
--------------------------------------------
Streams real-time fire simulation data from Arduino sensor network
to the frontend for visualization and analysis.

Features:
- 4,096 virtual Arduino sensors (64x64 grid)
- Real-time fire spread analysis
- Temperature and PM2.5 data streaming
- Fire progression playback controls
- Emergency alert system
"""

import asyncio
import websockets
import json
import threading
import time
from datetime import datetime
from backend.firesimheadless import FireSimData

class FireWebSocketServer:
    def __init__(self):
        print("🔥 Initializing Arduino Fire Sensor Network...")
        self.sim_data = None
        self.current_step = 0
        self.max_steps = 0
        self.clients = set()
        self.is_playing = False
        self.playback_speed = 1.0  # 1.0 = normal speed
        self.simulation_thread = None
        self.is_simulation_running = False
        
        # Initialize simulation in background
        self.initialize_simulation()
    
    def initialize_simulation(self):
        """Initialize fire simulation data"""
        print("🌲 Running fire simulation across Eldorado National Forest...")
        print("📡 Deploying 4,096 virtual Arduino sensors...")
        
        self.sim_data = FireSimData()
        self.sim_data.run()
        self.max_steps = len(self.sim_data.grids)
        
        print(f"✅ Simulation complete! {self.max_steps} steps generated")
        print(f"🔥 Fire spread across {self.sim_data.get_fire_progression_data()['simulation_area_km2']:.1f} km²")
        print(f"📊 {len(self.sim_data.sensors)} Arduino sensors deployed")
    
    async def register_client(self, websocket):
        """Register new WebSocket client"""
        self.clients.add(websocket)
        print(f"📱 Client connected. Total clients: {len(self.clients)}")
        
        # Send initial data to new client
        await self.send_initial_data(websocket)
    
    async def unregister_client(self, websocket):
        """Unregister WebSocket client"""
        self.clients.discard(websocket)
        print(f"📱 Client disconnected. Total clients: {len(self.clients)}")
    
    async def send_initial_data(self, websocket):
        """Send initial simulation data to client"""
        if not self.sim_data:
            return
        
        # Send simulation metadata
        progression_data = self.sim_data.get_fire_progression_data()
        initial_message = {
            'type': 'simulation_init',
            'data': {
                'total_steps': progression_data['total_steps'],
                'sensor_count': progression_data['sensor_count'],
                'grid_size': progression_data['grid_size'],
                'simulation_area_km2': progression_data['simulation_area_km2'],
                'base_coordinates': progression_data['base_coordinates'],
                'current_step': self.current_step,
                'is_playing': self.is_playing,
                'playback_speed': self.playback_speed
            }
        }
        
        await websocket.send(json.dumps(initial_message))
        
        # Send current sensor data
        await self.broadcast_current_data([websocket])
    
    async def handle_message(self, websocket, message):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(message)
            message_type = data.get('type')
            
            if message_type == 'play':
                await self.start_playback()
            elif message_type == 'pause':
                await self.pause_playback()
            elif message_type == 'reset':
                await self.reset_simulation()
            elif message_type == 'set_step':
                step = data.get('step', 0)
                await self.set_step(step)
            elif message_type == 'set_speed':
                speed = data.get('speed', 1.0)
                await self.set_playback_speed(speed)
            elif message_type == 'get_hotspots':
                await self.send_hotspots(websocket)
            
        except json.JSONDecodeError:
            print(f"❌ Invalid JSON message: {message}")
    
    async def start_playback(self):
        """Start fire simulation playback"""
        if not self.is_playing and self.current_step < self.max_steps:
            self.is_playing = True
            print(f"▶️ Starting fire simulation playback at step {self.current_step}")
            
            # Start playback loop
            asyncio.create_task(self.playback_loop())
            
            # Notify clients
            await self.broadcast_control_state()
    
    async def pause_playback(self):
        """Pause fire simulation playback"""
        self.is_playing = False
        print(f"⏸️ Pausing fire simulation at step {self.current_step}")
        await self.broadcast_control_state()
    
    async def reset_simulation(self):
        """Reset simulation to beginning"""
        self.is_playing = False
        self.current_step = 0
        print("🔄 Resetting fire simulation to beginning")
        await self.broadcast_control_state()
        await self.broadcast_current_data()
    
    async def set_step(self, step):
        """Jump to specific simulation step"""
        if 0 <= step < self.max_steps:
            self.current_step = step
            print(f"⏭️ Jumping to step {step}")
            await self.broadcast_control_state()
            await self.broadcast_current_data()
    
    async def set_playback_speed(self, speed):
        """Set playback speed multiplier"""
        self.playback_speed = max(0.1, min(5.0, speed))  # Clamp between 0.1x and 5x
        print(f"⚡ Setting playback speed to {self.playback_speed}x")
        await self.broadcast_control_state()
    
    async def playback_loop(self):
        """Main playback loop for fire simulation"""
        while self.is_playing and self.current_step < self.max_steps:
            # Broadcast current data
            await self.broadcast_current_data()
            
            # Advance to next step
            self.current_step += 1
            
            # Check if we've reached the end
            if self.current_step >= self.max_steps:
                self.is_playing = False
                print("🏁 Fire simulation playback completed")
                await self.broadcast_control_state()
                break
            
            # Wait based on playback speed
            delay = 2.0 / self.playback_speed  # Base 2 second delay
            await asyncio.sleep(delay)
    
    async def broadcast_current_data(self, target_clients=None):
        """Broadcast current fire sensor data to clients"""
        if not self.sim_data or not self.clients:
            return
        
        clients = target_clients or self.clients
        if not clients:
            return
        
        try:
            # Get sensor data for current step
            sensor_data = self.sim_data.get_sensor_data_for_step(self.current_step)
            spread_data = self.sim_data.spread_history[self.current_step] if self.current_step < len(self.sim_data.spread_history) else {}
            
            message = {
                'type': 'sensor_batch',
                'timestamp': datetime.now().isoformat(),
                'step': self.current_step,
                'sensors': sensor_data,
                'spread_analysis': spread_data,
                'statistics': {
                    'active_sensors': len(sensor_data),
                    'total_sensors': len(self.sim_data.sensors),
                    'max_temperature': spread_data.get('max_temperature', 20),
                    'avg_temperature': spread_data.get('avg_temperature', 20),
                    'affected_area_m2': spread_data.get('total_affected_area', 0),
                    'spread_rate_m2_per_step': spread_data.get('spread_rate', 0),
                    'fire_center': spread_data.get('fire_center', [32, 32])
                }
            }
            
            # Broadcast to all clients
            websockets.broadcast(clients, json.dumps(message))
            
        except Exception as e:
            print(f"❌ Error broadcasting data: {e}")
    
    async def broadcast_control_state(self):
        """Broadcast playback control state to clients"""
        if not self.clients:
            return
        
        message = {
            'type': 'control_state',
            'data': {
                'current_step': self.current_step,
                'max_steps': self.max_steps,
                'is_playing': self.is_playing,
                'playback_speed': self.playback_speed
            }
        }
        
        websockets.broadcast(self.clients, json.dumps(message))
    
    async def send_hotspots(self, websocket):
        """Send current fire hotspots to specific client"""
        if not self.sim_data or self.current_step >= len(self.sim_data.spread_history):
            return
        
        spread_data = self.sim_data.spread_history[self.current_step]
        hotspots = spread_data.get('hotspots', [])
        
        message = {
            'type': 'hotspots',
            'data': hotspots
        }
        
        await websocket.send(json.dumps(message))

async def handle_client(websocket):
    """Handle WebSocket client connection"""
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
    """Start the fire sensor WebSocket server"""
    print("🚀 Starting Arduino Fire Sensor Network WebSocket Server")
    print("🌐 Server will be available at ws://localhost:8765")
    
    # Create server instance
    server_instance = FireWebSocketServer()
    
    # Create WebSocket server with newer API
    async def websocket_handler(websocket):
        websocket.server_instance = server_instance
        await handle_client(websocket)
    
    start_server = websockets.serve(
        websocket_handler,
        "localhost",
        8765,
        ping_interval=20,
        ping_timeout=10
    )
    
    websocket_server = await start_server
    
    print("✅ Arduino Fire Sensor Network is online!")
    print("📡 Broadcasting fire data from 4,096 sensors")
    print("🔥 Real-time fire spread analysis active")
    print("\nPress Ctrl+C to stop the server")
    
    # Keep server running
    await websocket_server.wait_closed()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n🛑 Shutting down Arduino Fire Sensor Network")
        print("👋 Goodbye!")
