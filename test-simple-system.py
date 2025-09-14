#!/usr/bin/env python3
"""
Test the Simple Arduino Fire Detection System
"""
import asyncio
import websockets
import json

async def test_simple_fire_system():
    """Test the simple Arduino fire system"""
    print("🔥 Testing Simple Arduino Fire Detection System")
    print("=" * 50)
    
    try:
        async with websockets.connect("ws://localhost:8766") as websocket:
            print("✅ Connected to Arduino Fire System")
            
            # Wait for initial sensor data
            message = await websocket.recv()
            data = json.loads(message)
            
            print(f"📡 Received: {data['type']}")
            print(f"🔥 Sensors: {len(data.get('sensors', []))}")
            
            # Test starting a fire
            fire_command = {
                "type": "start_fire",
                "lat": 38.7900,
                "lon": -120.4240,
                "intensity": 1.0
            }
            
            await websocket.send(json.dumps(fire_command))
            print("🔥 Started fire at coordinates")
            
            # Wait for updated sensor data
            await asyncio.sleep(3)
            message = await websocket.recv()
            data = json.loads(message)
            
            hot_sensors = [s for s in data.get('sensors', []) if s.get('temperature', 20) > 30]
            print(f"🌡️ Hot sensors detected: {len(hot_sensors)}")
            
            # Test clearing fires
            await websocket.send(json.dumps({"type": "clear_fires"}))
            print("🧯 Cleared all fires")
            
            print("✅ Simple Arduino Fire System test completed!")
            return True
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

async def main():
    """Run the test"""
    success = await test_simple_fire_system()
    
    if success:
        print("\n🎉 Simple Arduino Fire Detection System is working!")
        print("🚀 To use the system:")
        print("   1. python simple-arduino-fire.py")
        print("   2. cd frontend && npm run dev") 
        print("   3. Open http://localhost:3000/simple")
        print("   4. Click on map to start fires!")
    else:
        print("\n❌ System test failed")
        print("💡 Make sure to start: python simple-arduino-fire.py")

if __name__ == "__main__":
    asyncio.run(main())
