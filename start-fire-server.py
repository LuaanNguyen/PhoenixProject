#!/usr/bin/env python3
"""
Start the Arduino Fire Sensor Network WebSocket Server
"""
import sys
import os
import subprocess

def main():
    print("🚀 Starting Arduino Fire Sensor Network")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not os.path.exists('fire-websocket-server.py'):
        print("❌ Error: fire-websocket-server.py not found!")
        print("Please run this script from the FlamDirect root directory.")
        sys.exit(1)
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("❌ Error: Python 3.8+ required")
        print(f"Current version: {sys.version}")
        sys.exit(1)
    
    # Install required packages
    print("📦 Installing required packages...")
    required_packages = [
        'websockets',
        'numpy',
        'asyncio'
    ]
    
    for package in required_packages:
        try:
            __import__(package)
            print(f"✅ {package} already installed")
        except ImportError:
            print(f"📥 Installing {package}...")
            subprocess.run([sys.executable, '-m', 'pip', 'install', package], 
                          check=True, capture_output=True)
            print(f"✅ {package} installed successfully")
    
    print("\n🔥 Starting Fire Sensor Network Server...")
    print("🌐 Server will be available at ws://localhost:8765")
    print("📡 4,096 Arduino sensors will be deployed")
    print("\nPress Ctrl+C to stop the server\n")
    
    # Start the server
    try:
        subprocess.run([sys.executable, 'fire-websocket-server.py'], check=True)
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"❌ Server error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
