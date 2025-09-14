import numpy as np

"""
Wildfire Cellular Automata Model (Headless)
-------------------------------------------
- Each cell represents a 30x30 meter patch of land.
- Cells can be empty, vegetated, burning, or ash.
- Fire spreads based on wind, slope, and fuel type.
- Elevation is modeled as a diagonal valley.
- Wind changes smoothly over time and space.
- All simulation data is stored for later access.
"""

# --- Model Parameters ---
size = 64
ignite_prob = 0.3
burn_time = 5
steps = 200
n_updates = 16

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

# Usage:
# sim_data = FireSimData()
# sim_data.run()
# Access sim_data.grids, sim_data.burn_timers, sim_data.wind_fields, sim_data.temperatures for results