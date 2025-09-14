#!/usr/bin/env python3
"""
Test the Arduino Fire Sensor Network System
"""
import asyncio
import websockets
import json
import sys
from backend.firesimheadless import FireSimData

async def test_websocket_client():
    """Test WebSocket client connection"""
    try:
        async with websockets.connect("ws://localhost:8765") as websocket:
            print("✅ Connected to Arduino Fire Sensor Network")
            
            # Wait for initial data
            message = await websocket.recv()
            data = json.loads(message)
            print(f"📡 Received: {data['type']}")
            
            if data['type'] == 'simulation_init':
                print(f"🔥 {data['data']['sensor_count']} Arduino sensors deployed")
                print(f"🌲 Covering {data['data']['simulation_area_km2']:.1f} km²")
            
            # Test control command
            await websocket.send(json.dumps({"type": "play"}))
            print("▶️ Sent play command")
            
            # Wait for sensor data
            message = await websocket.recv()
            data = json.loads(message)
            if data['type'] == 'sensor_batch':
                print(f"🔥 Received fire data: {len(data['sensors'])} active sensors")
                print(f"🌡️ Max temperature: {data['statistics']['max_temperature']:.1f}°C")
            
            print("✅ WebSocket communication successful!")
            
    except Exception as e:
        print(f"❌ WebSocket test failed: {e}")
        return False
    
    return True

def test_fire_simulation():
    """Test fire simulation backend"""
    try:
        print("🔥 Testing Arduino Fire Sensor Network backend...")
        sim = FireSimData()
        print(f"✅ Generated {len(sim.sensors)} Arduino sensors")
        
        sim.run()
        print(f"✅ Fire simulation complete: {len(sim.grids)} steps")
        
        # Test sensor data extraction
        sensor_data = sim.get_sensor_data_for_step(50)
        print(f"📡 Step 50: {len(sensor_data)} active sensors")
        
        # Test progression data
        progression = sim.get_fire_progression_data()
        print(f"🌲 Total area: {progression['simulation_area_km2']:.1f} km²")
        
        return True
        
    except Exception as e:
        print(f"❌ Fire simulation test failed: {e}")
        return False

async def main():
    """Run comprehensive system test"""
    print("🚀 Testing Arduino Fire Sensor Network System")
    print("=" * 50)
    
    # Test 1: Fire simulation backend
    print("\n1. Testing Fire Simulation Backend...")
    backend_ok = test_fire_simulation()
    
    if not backend_ok:
        print("❌ Backend test failed - stopping")
        sys.exit(1)
    
    # Test 2: WebSocket server (if running)
    print("\n2. Testing WebSocket Connection...")
    try:
        websocket_ok = await asyncio.wait_for(test_websocket_client(), timeout=10.0)
    except asyncio.TimeoutError:
        print("⚠️ WebSocket server not running - start with: python fire-websocket-server.py")
        websocket_ok = False
    
    # Results
    print("\n" + "=" * 50)
    print("🎯 TEST RESULTS:")
    print(f"🔥 Fire Simulation Backend: {'✅ PASS' if backend_ok else '❌ FAIL'}")
    print(f"📡 WebSocket Communication: {'✅ PASS' if websocket_ok else '⚠️ SKIP'}")
    
    if backend_ok:
        print("\n🎉 Arduino Fire Sensor Network is ready!")
        print("🚀 To start the full system:")
        print("   1. python fire-websocket-server.py")
        print("   2. cd frontend && npm run dev")
        print("   3. Open http://localhost:3000")
    else:
        print("\n❌ System has issues - check the errors above")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
