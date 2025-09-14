import numpy as np
import json
import time
from datetime import datetime, timedelta

"""
Arduino Sensor Network Fire Simulation
--------------------------------------
- Each cell represents a 30x30 meter patch with an Arduino temperature sensor
- 64x64 grid = 4,096 virtual Arduino sensors across forest area
- Sensors report temperature, fire state, and environmental data
- Real-time fire spread analysis and prediction
- WebSocket integration for frontend visualization
"""

# --- Model Parameters ---
size = 64              # 64x64 grid = 4,096 Arduino sensors
ignite_prob = 0.3      # Base ignition probability
burn_time = 5          # Steps a cell burns before turning to ash
steps = 300            # Extended simulation steps for longer analysis
n_updates = 24         # More random fire ignition events

# --- Sensor Network Configuration ---
CELL_SIZE_METERS = 30  # Each cell = 30x30 meter area
BASE_LAT = 38.7891     # Eldorado National Forest base latitude
BASE_LON = -120.4234   # Eldorado National Forest base longitude

# --- Cell States ---
EMPTY = 0
VEG = 1
BURNING = 2
ASH = 3

class FireSimData:
    def __init__(self):
        self.grid = np.full((size, size), VEG, dtype=int)
        self.burn_timer = np.zeros((size, size), dtype=int)
        self.elevation = np.zeros((size, size), dtype=int)
        self.wind_speed = np.zeros((size, size, 2), dtype=float)
        self.base_wind = 10.0
        self.update_stream = np.zeros((n_updates, 3))
        self.fuel_type = self._fuel_type_gen()
        self._gen_update_stream()
        self._init_grid()
        self.grids = []
        self.burn_timers = []
        self.wind_fields = []
        self.temperatures = []
        
        # Arduino sensor network data
        self.sensors = self._generate_sensor_network()
        self.fire_events = []  # Track fire ignition events
        self.spread_history = []  # Track fire spread over time

    def _gen_update_stream(self):
        for i in range(n_updates):
            self.update_stream[i, 0] = np.random.randint(0, steps)
            self.update_stream[i, 1] = np.random.randint(0, size)
            self.update_stream[i, 2] = np.random.randint(0, size)
        self.update_stream = self.update_stream[self.update_stream[:, 0].argsort()]

    def _fuel_type_gen(self):
        np.random.seed()
        fuel_type = np.zeros((size, size), dtype=int)
        for i in range(size):
            for j in range(size):
                if np.random.rand() < 0.1:
                    fuel_type[i, j] = 0
                else:
                    fuel_type[i, j] = np.clip(int(np.random.normal(5, 2)), 1, 10)
        return fuel_type

    def _init_grid(self):
        self.grid[0, :] = EMPTY
        self.grid[-1, :] = EMPTY
        self.grid[:, 0] = EMPTY
        self.grid[:, -1] = EMPTY
        self._elevation_gen(self.elevation)
        center = size // 2
        self.grid[center, center] = BURNING
        self.burn_timer[center, center] = burn_time

    def _elevation_gen(self, elevation):
        valley_depth = 150
        base_elev = 100
        valley_width = size / 4
        for i in range(size):
            for j in range(size):
                dist = abs(i - j) / valley_width
                elevation[i, j] = base_elev - valley_depth * np.exp(-dist**2)

    def _ignite_prob_f(self, row_c_i, col_c_i, row_c_f, col_c_f, elevation_map, wind_vector, fuel_type):
        a_s = 0.088
        c_1 = 0.0045
        c_2 = 0.191
        base_p = 0.7
        slope_angle = np.arctan(
            abs(elevation_map[row_c_f][col_c_f] - elevation_map[row_c_i][col_c_i]) / (size * np.sqrt(2))
        )
        p_slope = np.exp(a_s * slope_angle)
        wind_dir = wind_vector[row_c_f][col_c_f][1]
        cell_dir = np.arctan2((row_c_f-row_c_i), (col_c_f-col_c_i))
        wind_angle = wind_dir - cell_dir
        wind_speed_val = wind_vector[row_c_f][col_c_f][0]
        p_wind = np.exp(c_1 * wind_speed_val) * np.exp(c_2 * wind_speed_val * (np.cos(wind_angle) - 1))
        p_fuel = fuel_type[row_c_f][col_c_f] / 10.0
        return base_p * p_slope * p_wind * p_fuel

    def _wind_field(self, wind_speed, step, prev_base=None):
        if prev_base is None:
            prev_base = np.array([self.base_wind, 0.2])
        base = np.array([
            1.0 + 1.2 * np.sin(step / 20.0) + 0.7 * np.cos(step / 35.0),
            0.2 + 1.0 * np.cos(step / 25.0) + 0.5 * np.sin(step / 15.0)
        ])
        fluctuation = (np.random.randn(size, size, 2) * 0.15)
        drift = 1.0 * np.sin(step / 7.0)
        wind = np.zeros_like(wind_speed, dtype=float)
        wind[..., 0] = base[0] + drift + fluctuation[..., 0]
        wind[..., 1] = base[1] + drift + fluctuation[..., 1]
        return wind, base

    def _calculate_temperature(self, grid, burn_timer, step):
        temperature = np.full((size, size), 20.0, dtype=float)
        for i in range(size):
            for j in range(size):
                if grid[i, j] == BURNING:
                    burn_progress = (burn_time - burn_timer[i, j]) / burn_time
                    peak_temp = 800 - (burn_progress * 300)
                    temperature[i, j] = peak_temp
                    for di in range(-3, 4):
                        for dj in range(-3, 4):
                            ni, nj = i + di, j + dj
                            if 0 <= ni < size and 0 <= nj < size and (di != 0 or dj != 0):
                                distance = np.sqrt(di*di + dj*dj)
                                heat_transfer = peak_temp * np.exp(-distance * 0.6)
                                temperature[ni, nj] = max(temperature[ni, nj], 20 + heat_transfer * 0.4)
                elif grid[i, j] == ASH:
                    cooling_rate = 0.97
                    ash_temp = 400 * (cooling_rate ** step)
                    temperature[i, j] = max(20, ash_temp)
        return temperature

    def run(self):
        grid_sim = self.grid.copy()
        burn_timer_sim = self.burn_timer.copy()
        wind_sim = self.wind_speed.copy()
        base = np.array([1.0, 0.2])
        ns = 0
        for step in range(steps):
            wind_sim, base = self._wind_field(wind_sim, step, base)
            new_grid = grid_sim.copy()
            new_timer = burn_timer_sim.copy()
            if ns < n_updates and step == self.update_stream[ns, 0]:
                new_grid[int(self.update_stream[ns, 1]), int(self.update_stream[ns, 2])] = BURNING
                new_timer[int(self.update_stream[ns, 1]), int(self.update_stream[ns, 2])] = burn_time
                ns += 1
            for i in range(size):
                for j in range(size):
                    if grid_sim[i, j] == BURNING:
                        for di, dj in [(-1,0), (1,0), (0,-1), (0,1)]:
                            ni, nj = i + di, j + dj
                            if 0 <= ni < size and 0 <= nj < size:
                                if grid_sim[ni, nj] == VEG:
                                    prob = self._ignite_prob_f(i, j, ni, nj, self.elevation, wind_sim, self.fuel_type)
                                    if np.random.rand() < prob:
                                        new_grid[ni, nj] = BURNING
                                        new_timer[ni, nj] = burn_time
                        new_timer[i, j] -= 1
                        if new_timer[i, j] <= 0:
                            new_grid[i, j] = ASH
            grid_sim, burn_timer_sim = new_grid, new_timer
            temp = self._calculate_temperature(grid_sim, burn_timer_sim, step)
            self.grids.append(grid_sim.copy())
            self.burn_timers.append(burn_timer_sim.copy())
            self.wind_fields.append(wind_sim.copy())
            self.temperatures.append(temp.copy())
            
            # Track fire spread metrics
            spread_data = self._calculate_spread_metrics(step, grid_sim, temp)
            self.spread_history.append(spread_data)

    def _generate_sensor_network(self):
        """Generate Arduino sensor network across the grid"""
        sensors = {}
        for i in range(size):
            for j in range(size):
                # Convert grid position to lat/lon
                lat = BASE_LAT + (i * CELL_SIZE_METERS / 111000)  # ~111km per degree
                lon = BASE_LON + (j * CELL_SIZE_METERS / 111000)
                
                sensor_id = f"ARDUINO_{i:02d}_{j:02d}"
                sensors[sensor_id] = {
                    'id': sensor_id,
                    'lat': lat,
                    'lon': lon,
                    'grid_i': i,
                    'grid_j': j,
                    'elevation': 0,  # Will be set during initialization
                    'fuel_type': 0,  # Will be set during initialization
                    'battery_level': np.random.uniform(85, 100),  # Random battery level
                    'last_maintenance': datetime.now() - timedelta(days=np.random.randint(1, 30))
                }
        return sensors

    def _calculate_spread_metrics(self, step, grid, temperature):
        """Calculate fire spread metrics for current step"""
        burning_cells = np.sum(grid == BURNING)
        ash_cells = np.sum(grid == ASH)
        total_affected = burning_cells + ash_cells
        
        # Calculate center of fire mass for direction analysis
        fire_coords = np.where(grid == BURNING)
        if len(fire_coords[0]) > 0:
            center_i = np.mean(fire_coords[0])
            center_j = np.mean(fire_coords[1])
        else:
            center_i, center_j = size//2, size//2
        
        # Calculate spread rate (area per step)
        if step > 0 and hasattr(self, 'prev_affected'):
            spread_rate = (total_affected - self.prev_affected) * CELL_SIZE_METERS * CELL_SIZE_METERS
        else:
            spread_rate = 0
        
        self.prev_affected = total_affected
        
        return {
            'step': step,
            'burning_cells': int(burning_cells),
            'ash_cells': int(ash_cells),
            'total_affected_area': int(total_affected * CELL_SIZE_METERS * CELL_SIZE_METERS),  # m²
            'spread_rate': float(spread_rate),  # m²/step
            'fire_center': [float(center_i), float(center_j)],
            'max_temperature': float(np.max(temperature)),
            'avg_temperature': float(np.mean(temperature)),
            'hotspots': self._find_hotspots(temperature, grid),
            'wind_direction': float(np.mean(self.wind_speed[:, :, 1])),
            'wind_speed': float(np.mean(self.wind_speed[:, :, 0]))
        }

    def _find_hotspots(self, temperature, grid, threshold=100):
        """Find temperature hotspots for emergency response"""
        hotspots = []
        for i in range(size):
            for j in range(size):
                if temperature[i, j] > threshold:
                    sensor_id = f"ARDUINO_{i:02d}_{j:02d}"
                    lat = BASE_LAT + (i * CELL_SIZE_METERS / 111000)
                    lon = BASE_LON + (j * CELL_SIZE_METERS / 111000)
                    
                    hotspots.append({
                        'sensor_id': sensor_id,
                        'lat': lat,
                        'lon': lon,
                        'temperature': float(temperature[i, j]),
                        'state': int(grid[i, j]),
                        'risk_level': self._calculate_risk_level(temperature[i, j])
                    })
        
        # Sort by temperature (hottest first)
        hotspots.sort(key=lambda x: x['temperature'], reverse=True)
        return hotspots[:20]  # Top 20 hotspots

    def _calculate_risk_level(self, temp):
        """Calculate fire risk level based on temperature"""
        if temp < 30:
            return "LOW"
        elif temp < 60:
            return "MODERATE" 
        elif temp < 100:
            return "HIGH"
        elif temp < 300:
            return "CRITICAL"
        else:
            return "EXTREME"

    def get_sensor_data_for_step(self, step):
        """Get Arduino sensor data for a specific simulation step"""
        if step >= len(self.grids):
            return []
        
        grid = self.grids[step]
        temperature = self.temperatures[step]
        wind_field = self.wind_fields[step]
        
        sensor_data = []
        for sensor_id, sensor in self.sensors.items():
            i, j = sensor['grid_i'], sensor['grid_j']
            
            # Convert temperature to PM2.5 equivalent for visualization
            pm25 = self._temp_to_pm25(temperature[i, j])
            
            sensor_reading = {
                'id': sensor_id,
                'lat': sensor['lat'],
                'lon': sensor['lon'],
                'temperature': float(temperature[i, j]),
                'pm25': float(pm25),
                'state': int(grid[i, j]),
                'wind_speed': float(wind_field[i, j, 0]),
                'wind_direction': float(wind_field[i, j, 1]),
                'battery_level': sensor['battery_level'],
                'timestamp': datetime.now().isoformat(),
                'ts': int(time.time() * 1000),  # For frontend compatibility
                'risk_level': self._calculate_risk_level(temperature[i, j])
            }
            
            # Only include sensors with interesting data (not all ambient temperature)
            if temperature[i, j] > 25 or grid[i, j] != VEG:
                sensor_data.append(sensor_reading)
        
        return sensor_data

    def _temp_to_pm25(self, temp):
        """Convert temperature to PM2.5 equivalent for visualization"""
        if temp <= 25:
            return 0
        elif temp <= 50:
            return (temp - 25) * 1.4  # 0-35 range (Good)
        elif temp <= 100:
            return 35 + (temp - 50) * 0.8  # 35-75 range (Moderate)
        elif temp <= 300:
            return 75 + (temp - 100) * 0.375  # 75-150 range (Unhealthy)
        else:
            return 150 + (temp - 300) * 0.1  # 150+ range (Hazardous)

    def get_fire_progression_data(self):
        """Get complete fire progression data for frontend"""
        return {
            'total_steps': len(self.grids),
            'grid_size': size,
            'cell_size_meters': CELL_SIZE_METERS,
            'base_coordinates': {'lat': BASE_LAT, 'lon': BASE_LON},
            'spread_history': self.spread_history,
            'sensor_count': len(self.sensors),
            'simulation_area_km2': (size * CELL_SIZE_METERS / 1000) ** 2
        }

# Usage:
# sim_data = FireSimData()
# sim_data.run()
# sensor_data = sim_data.get_sensor_data_for_step(100)
# progression = sim_data.get_fire_progression_data()