import sys
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
from PyQt5.QtWidgets import QApplication, QWidget, QVBoxLayout, QPushButton, QHBoxLayout, QLabel
from PyQt5.QtGui import QPainter, QColor, QFont
from PyQt5.QtCore import QTimer
import threading
"""
Wildfire Cellular Automata Model
--------------------------------
- Each cell represents a 30x30 meter patch of land.
- Cells can be empty, vegetated, burning, or ash.
- Fire spreads based on wind, slope, and fuel type.
- Elevation is modeled as a diagonal valley.
- Wind changes smoothly over time and space.
- Visualization overlays fire state, elevation (blue), and wind vectors.
"""

# --- Model Parameters ---
size = 48             # Grid size (size x size)
ignite_prob = 0.3       # Base probability a neighbor ignites (used if not using ignite_prob_f)
burn_time = 5         # Steps a cell burns before turning to ash
steps = 200              # Total simulation steps

# --- Cell States ---
EMPTY = 0    # Unburnable (empty)
VEG = 1      # Vegetation (can burn)
BURNING = 2  # Burning
ASH = 3      # Burned out

# --- Initialize Grid and Maps ---
grid = np.full((size, size), VEG, dtype=int)      # All vegetation
burn_timer = np.zeros((size, size), dtype=int)    # Burn timers
elevation = np.zeros((size, size), dtype=int)     # Elevation map (meters)
                     # Fuel type map (0-10, higher = more fuel)
wind_speed = np.zeros((size, size, 2), dtype=float)  # Wind vector field (speed, direction)
base_wind = 10.0

def fuel_type_gen(): 
    """
    Generates a fuel type map with random patches of varying fuel levels.
    Fuel type ranges from 0 (no fuel) to 10 (high fuel).
    Returns:
        fuel_type: np.ndarray of shape (size, size)
    """
    np.random.seed()  # For reproducibility
    fuel_type = np.zeros((size, size), dtype=int)
    for i in range(size):
        for j in range(size):
            # Randomly assign fuel types with some spatial correlation
            if np.random.rand() < 0.1:
                fuel_type[i, j] = 0  # Empty patch
            else:
                fuel_type[i, j] = np.clip(int(np.random.normal(5, 2)), 1, 10)
    return fuel_type

fuel_type = fuel_type_gen()  
def ignite_prob_f(row_c_i, col_c_i, row_c_f, col_c_f,
                  elevation_map, wind_vector, fuel_type):
    """
    Calculate probability of fire spreading from (row_c_i, col_c_i) to (row_c_f, col_c_f)
    based on slope, wind, and fuel type.
    """
    # Constants for influence
    a_s = 0.088 # slope effect
    c_1 = 0.0045
    c_2 = 0.191
    base_p = 0.7

    # Slope calculation (rise/run between cells)
    slope_angle = np.arctan(
        abs(elevation_map[row_c_f][col_c_f] - elevation_map[row_c_i][col_c_i]) / (size * np.sqrt(2))
    )
    p_slope = np.exp(a_s * slope_angle)

    # Wind calculation (directional effect)
    wind_dir = wind_vector[row_c_f][col_c_f][1]
    cell_dir = np.arctan2((row_c_f-row_c_i), (col_c_f-col_c_i))
    wind_angle = wind_dir - cell_dir
    wind_speed_val = wind_vector[row_c_f][col_c_f][0]
    p_wind = np.exp(c_1 * wind_speed_val) * np.exp(c_2 * wind_speed_val * (np.cos(wind_angle) - 1))

    # Fuel calculation (normalized)
    p_fuel = fuel_type[row_c_f][col_c_f] / 10.0

    # Combined probability
    return base_p * p_slope * p_wind * p_fuel

def elevation_gen(elevation):
    """
    Procedurally generates a diagonal valley across the grid.
    The valley is lowest along the diagonal and rises away from it.
    Elevation is in meters.
    """
    valley_depth = 150    # meters below the base
    base_elev = 100      # meters
    valley_width = size / 4  # controls valley spread

    for i in range(size):
        for j in range(size):
            # Distance from diagonal (i == j)
            dist = abs(i - j) / valley_width
            # Valley profile: exponential rise away from diagonal
            elevation[i, j] = base_elev - valley_depth * np.exp(-dist**2)

 
def wind_field(wind_speed, step, prev_base=None):
    """
    Generates a wind field that smoothly changes over time and space.
    wind_speed: previous wind field (for continuity)
    step: current simulation step
    prev_base: previous base wind vector (for continuity)
    Returns: new wind field, new base wind vector
    """
    if prev_base is None:
        prev_base = np.array([base_wind, 0.2])
    # Base wind direction changes smoothly
    base = np.array([
        1.0 + 1.2 * np.sin(step / 20.0) + 0.7 * np.cos(step / 35.0),
        0.2 + 1.0 * np.cos(step / 25.0) + 0.5 * np.sin(step / 15.0)
    ])
    # Small random fluctuation for local variation
    fluctuation = (np.random.randn(size, size, 2) * 0.15)
    # Global drift for overall field coherence
    drift = 1.0 * np.sin(step / 7.0)
    wind = np.zeros_like(wind_speed, dtype=float)
    wind[..., 0] = base[0] + drift + fluctuation[..., 0]  # speed
    wind[..., 1] = base[1] + drift + fluctuation[..., 1]  # direction
    return wind, base

# Set some cells as EMPTY (unburnable) at the border
grid[0, :] = EMPTY
grid[-1, :] = EMPTY
grid[:, 0] = EMPTY
grid[:, -1] = EMPTY

# Generate elevation valley
elevation_gen(elevation)

# Ignite center cell
center = size // 2
grid[center, center] = BURNING
burn_timer[center, center] = burn_time
def calculate_temperature(grid, burn_timer, step):
    """
    Calculate temperature distribution based on fire state
    
    Args:
    grid: Current grid state
    burn_timer: Burn timer for each cell
    step: Current simulation step
    
    Returns:
    temperature: 2D temperature array in Celsius
    """
    temperature = np.full((size, size), 20.0, dtype=float)  # Ambient temperature 20°C
    
    for i in range(size):
        for j in range(size):
            if grid[i, j] == BURNING:
                # Peak temperature based on burn stage (hottest when newly ignited)
                burn_progress = (burn_time - burn_timer[i, j]) / burn_time
                peak_temp = 800 - (burn_progress * 300)  # 800°C peak, decreasing to 500°C
                temperature[i, j] = peak_temp
                
                # Heat diffusion to neighboring cells
                for di in range(-3, 4):
                    for dj in range(-3, 4):
                        ni, nj = i + di, j + dj
                        if 0 <= ni < size and 0 <= nj < size and (di != 0 or dj != 0):
                            distance = np.sqrt(di*di + dj*dj)
                            heat_transfer = peak_temp * np.exp(-distance * 0.6)
                            temperature[ni, nj] = max(temperature[ni, nj], 
                                                    20 + heat_transfer * 0.4)
            
            elif grid[i, j] == ASH:
                # Cooling ash temperature - slower cooling for realism
                cooling_rate = 0.97
                ash_temp = 400 * (cooling_rate ** step)  # Exponential cooling
                temperature[i, j] = max(20, ash_temp)
    
    return temperature

class TemperatureHeatmapWidget(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Temperature Heatmap")
        self.cell_size = 20
        self.resize(size * self.cell_size + 200, size * self.cell_size + 100)
        self.temperature = np.full((size, size), 20.0, dtype=float)
        self.step = 0
        
        # Temperature color mapping
        self.temp_colors = self.generate_temperature_colors()
        
    def generate_temperature_colors(self):
        """Generate color mapping for temperatures"""
        colors = {}
        for temp in range(20, 901, 10):  # 20°C to 900°C
            if temp <= 50:
                # Blue to cyan (20-50°C)
                ratio = (temp - 20) / 30
                colors[temp] = QColor(int(0 * (1-ratio) + 0 * ratio), 
                                    int(0 * (1-ratio) + 255 * ratio), 
                                    int(255 * (1-ratio) + 255 * ratio))
            elif temp <= 100:
                # Cyan to green (50-100°C)
                ratio = (temp - 50) / 50
                colors[temp] = QColor(int(0 * (1-ratio) + 0 * ratio), 
                                    int(255 * (1-ratio) + 255 * ratio), 
                                    int(255 * (1-ratio) + 0 * ratio))
            elif temp <= 200:
                # Green to yellow (100-200°C)
                ratio = (temp - 100) / 100
                colors[temp] = QColor(int(0 * (1-ratio) + 255 * ratio), 
                                    255, 
                                    int(0 * (1-ratio) + 0 * ratio))
            elif temp <= 400:
                # Yellow to orange (200-400°C)
                ratio = (temp - 200) / 200
                colors[temp] = QColor(255, 
                                    int(255 * (1-ratio) + 165 * ratio), 
                                    int(0 * (1-ratio) + 0 * ratio))
            elif temp <= 600:
                # Orange to red (400-600°C)
                ratio = (temp - 400) / 200
                colors[temp] = QColor(255, 
                                    int(165 * (1-ratio) + 0 * ratio), 
                                    int(0 * (1-ratio) + 0 * ratio))
            else:
                # Red to dark red/maroon (600-900°C)
                ratio = (temp - 600) / 300
                colors[temp] = QColor(int(255 * (1-ratio) + 139 * ratio), 
                                    int(0 * (1-ratio) + 0 * ratio), 
                                    int(0 * (1-ratio) + 0 * ratio))
        return colors
    
    def get_temperature_color(self, temp):
        """Get color for a specific temperature"""
        # Round to nearest 10
        rounded_temp = int(round(temp / 10) * 10)
        rounded_temp = max(20, min(900, rounded_temp))  # Clamp to range
        return self.temp_colors.get(rounded_temp, QColor(20, 20, 20))
    
    def update_temperature(self, temperature, step):
        """Update temperature data"""
        self.temperature = temperature
        self.step = step
        self.update()
    
    def paintEvent(self, event):
        qp = QPainter(self)
        
        # Draw temperature grid
        for i in range(size):
            for j in range(size):
                temp = self.temperature[i, j]
                color = self.get_temperature_color(temp)
                qp.setBrush(color)
                qp.setPen(QColor(50, 50, 50))  # Dark border
                qp.drawRect(j * self.cell_size, i * self.cell_size, 
                           self.cell_size, self.cell_size)
                
                # Draw temperature text for every 3rd cell to avoid clutter
                if i % 3 == 0 and j % 3 == 0:
                    qp.setPen(QColor(255, 255, 255))  # White text
                    font = QFont()
                    font.setPointSize(8)
                    qp.setFont(font)
                    temp_text = f"{int(temp)}"
                    qp.drawText(j * self.cell_size + 2, i * self.cell_size + 12, temp_text)
        
        # Draw color scale legend
        legend_x = size * self.cell_size + 20
        legend_y = 50
        legend_width = 30
        legend_height = size * self.cell_size - 100
        
        qp.setPen(QColor(255, 255, 255))
        font = QFont()
        font.setPointSize(12)
        font.setBold(True)
        qp.setFont(font)
        qp.drawText(legend_x, 30, "Temperature (°C)")
        
        # Draw temperature scale
        for i in range(legend_height):
            temp = 20 + (880 * i) / legend_height  # 20°C to 900°C
            color = self.get_temperature_color(temp)
            qp.setBrush(color)
            qp.setPen(color)
            qp.drawRect(legend_x, legend_y + legend_height - i, legend_width, 2)
        
        # Draw scale labels
        qp.setPen(QColor(255, 255, 255))
        font.setPointSize(10)
        qp.setFont(font)
        scale_temps = [20, 100, 200, 300, 500, 700, 900]
        for temp in scale_temps:
            y_pos = legend_y + legend_height - int((temp - 20) * legend_height / 880)
            qp.drawText(legend_x + legend_width + 5, y_pos + 5, f"{temp}")
        
        # Draw current statistics
        max_temp = np.max(self.temperature)
        min_temp = np.min(self.temperature)
        avg_temp = np.mean(self.temperature)
        
        qp.setPen(QColor(255, 255, 255))
        font.setPointSize(11)
        qp.setFont(font)
        stats_y = legend_y + legend_height + 30
        qp.drawText(legend_x, stats_y, f"Step: {self.step}")
        qp.drawText(legend_x, stats_y + 20, f"Max: {max_temp:.1f}°C")
        qp.drawText(legend_x, stats_y + 40, f"Min: {min_temp:.1f}°C")
        qp.drawText(legend_x, stats_y + 60, f"Avg: {avg_temp:.1f}°C")

class TemperatureHeatmap:
    def __init__(self):
        self.fig, (self.ax1, self.ax2) = plt.subplots(1, 2, figsize=(16, 7))
        self.temperature_history = []
        self.im = None
        self.colorbar = None
        self.heatmap_widget = TemperatureHeatmapWidget()
        
    def update_temperature(self, temperature, step):
        """Update temperature data and plot"""
        self.temperature_history.append(temperature.copy())
        
        # Update matplotlib heatmap
        if self.im is None:
            self.im = self.ax1.imshow(temperature, cmap='hot', vmin=20, vmax=800, 
                                   interpolation='bilinear', origin='upper')
            self.colorbar = plt.colorbar(self.im, ax=self.ax1, label='Temperature (°C)')
            self.ax1.set_title('Temperature Heatmap')
            self.ax1.set_xlabel('Grid X')
            self.ax1.set_ylabel('Grid Y')
            
            # Add temperature values as text annotations
            for i in range(size):
                for j in range(size):
                    if i % 4 == 0 and j % 4 == 0:  # Show every 4th value to avoid clutter
                        text = self.ax1.text(j, i, f'{int(temperature[i, j])}',
                                           ha="center", va="center", color="white", fontsize=6)
        else:
            self.im.set_array(temperature)
            
            # Update text annotations
            for i in range(size):
                for j in range(size):
                    if i % 4 == 0 and j % 4 == 0:
                        # Find and update existing text
                        for text in self.ax1.texts:
                            if abs(text.get_position()[0] - j) < 0.5 and abs(text.get_position()[1] - i) < 0.5:
                                text.set_text(f'{int(temperature[i, j])}')
                                break
        
        self.ax1.set_title(f'Temperature Heatmap - Step {step}')
        
        # Update temperature evolution plot
        if len(self.temperature_history) > 1:
            self.ax2.clear()
            max_temps = [np.max(temp) for temp in self.temperature_history]
            mean_temps = [np.mean(temp) for temp in self.temperature_history]
            min_temps = [np.min(temp) for temp in self.temperature_history]
            
            time_steps = range(len(self.temperature_history))
            
            self.ax2.plot(time_steps, max_temps, 'r-', label='Max Temperature', linewidth=2)
            self.ax2.plot(time_steps, mean_temps, 'orange', label='Mean Temperature', linewidth=2)
            self.ax2.plot(time_steps, min_temps, 'b-', label='Min Temperature', linewidth=2)
            
            self.ax2.set_xlabel('Simulation Step')
            self.ax2.set_ylabel('Temperature (°C)')
            self.ax2.set_title('Temperature Evolution Over Time')
            self.ax2.legend()
            self.ax2.grid(True, alpha=0.3)
        
        # Update PyQt widget
        self.heatmap_widget.update_temperature(temperature, step)
        
        plt.tight_layout()
        plt.draw()
        plt.pause(0.01)
    
    def show_heatmap_widget(self):
        """Show the PyQt temperature heatmap widget"""
        self.heatmap_widget.show()
    
    def show_temperature_evolution(self):
        """Create an animated plot showing temperature evolution over time"""
        if not self.temperature_history:
            return
            
        fig, ax = plt.subplots(figsize=(12, 6))
        
        # Create time series plot of max, mean, and min temperatures
        max_temps = [np.max(temp) for temp in self.temperature_history]
        mean_temps = [np.mean(temp) for temp in self.temperature_history]
        min_temps = [np.min(temp) for temp in self.temperature_history]
        
        time_steps = range(len(self.temperature_history))
        
        ax.plot(time_steps, max_temps, 'r-', label='Max Temperature', linewidth=2)
        ax.plot(time_steps, mean_temps, 'orange', label='Mean Temperature', linewidth=2)
        ax.plot(time_steps, min_temps, 'b-', label='Min Temperature', linewidth=2)
        
        ax.set_xlabel('Simulation Step')
        ax.set_ylabel('Temperature (°C)')
        ax.set_title('Temperature Evolution Over Time')
        ax.legend()
        ax.grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.show()
        
class FireSimWidget(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Wildfire Cellular Automata with Temperature")
        self.cell_size = 15
        self.resize(size * self.cell_size, size * self.cell_size + 100)
        
        # Create layout
        layout = QVBoxLayout()
        
        # Create button layout
        button_layout = QHBoxLayout()
        
        # Button to show temperature evolution
        self.temp_evolution_btn = QPushButton("Show Temperature Evolution")
        self.temp_evolution_btn.clicked.connect(self.show_temperature_evolution)
        button_layout.addWidget(self.temp_evolution_btn)
        
        # Button to show temperature heatmap widget
        self.temp_heatmap_btn = QPushButton("Show Temperature Heatmap Window")
        self.temp_heatmap_btn.clicked.connect(self.show_heatmap_widget)
        button_layout.addWidget(self.temp_heatmap_btn)
        
        layout.addLayout(button_layout)
        
        # Add status label
        self.status_label = QLabel("Step: 0 | Burning Cells: 1 | Max Temp: 20°C")
        layout.addWidget(self.status_label)
        
        self.setLayout(layout)
        
        self.grid = grid
        self.grid_serial_time = {"1": self.grid}        #dicitonary storing the map states over unit time
        self.burn_timer = burn_timer
        self.elevation = elevation
        self.fuel_type = fuel_type
        self.wind_speed = wind_speed
        self.base = np.array([1.0, 0.2])
        self.step = 0
        
        # Initialize temperature heatmap
        self.temp_heatmap = TemperatureHeatmap()
        
        self.timer = QTimer(self)
        self.timer.timeout.connect(self.update_sim)
        self.timer.start(400)  # ms
        
        # Show temperature heatmap window
        plt.ion()  # Turn on interactive mode
        plt.show()

    def paintEvent(self, event):
        qp = QPainter(self)
        colors = {
            EMPTY: QColor(139, 69, 19),   # Brown
            VEG: QColor(34, 139, 34),     # Forest green
            BURNING: QColor(255, 69, 0),  # Orange red
            ASH: QColor(47, 79, 79)       # Dark slate gray
        }
        
        # Draw grid (offset by button height)
        y_offset = 80
        for i in range(size):
            for j in range(size):
                qp.setBrush(colors[self.grid[i, j]])
                qp.setPen(QColor(0, 0, 0))  # Black border
                qp.drawRect(j*self.cell_size, i*self.cell_size + y_offset, 
                           self.cell_size, self.cell_size)
        
        # Draw wind vectors
        qp.setPen(QColor(100, 100, 200))
        wind_scale = 4
        for i in range(0, size, 4):
            for j in range(0, size, 4):
                x = j * self.cell_size + self.cell_size // 2
                y = i * self.cell_size + self.cell_size // 2 + y_offset
                dx = int(self.wind_speed[i, j, 0] * wind_scale)
                dy = int(self.wind_speed[i, j, 1] * wind_scale)
                qp.drawLine(x, y, x + dx, y + dy)
                if dx != 0 or dy != 0:
                    qp.setPen(QColor(200, 100, 100))
                    qp.drawEllipse(x + dx - 2, y + dy - 2, 4, 4)
                    qp.setPen(QColor(100, 100, 200))

    def update_sim(self):
        if self.step >= steps:
            self.timer.stop()
            return
            
        # Update wind field
        self.wind_speed, self.base = wind_field(self.wind_speed, self.step, self.base)
        new_grid = self.grid.copy()
        new_timer = self.burn_timer.copy()
        
        for i in range(size):
            for j in range(size):
                if self.grid[i, j] == BURNING:
                    for di, dj in [(-1,0), (1,0), (0,-1), (0,1)]:
                        ni, nj = i + di, j + dj
                        if 0 <= ni < size and 0 <= nj < size:
                            if self.grid[ni, nj] == VEG:
                                # Use ignite_prob_f for ignition probability
                                prob = ignite_prob_f(i, j, ni, nj, self.elevation, 
                                                   self.wind_speed, self.fuel_type)
                                if np.random.rand() < prob:
                                    new_grid[ni, nj] = BURNING
                                    new_timer[ni, nj] = burn_time
                    new_timer[i, j] -= 1
                    if new_timer[i, j] <= 0:
                        new_grid[i, j] = ASH
        
        self.grid, self.burn_timer = new_grid, new_timer
        self.grid_serial_time[]
        
        # Calculate and update temperature
        temperature = calculate_temperature(self.grid, self.burn_timer, self.step)
        self.temp_heatmap.update_temperature(temperature, self.step)
        
        # Update status
        burning_cells = np.sum(self.grid == BURNING)
        max_temp = np.max(temperature)
        self.status_label.setText(f"Step: {self.step} | Burning Cells: {burning_cells} | Max Temp: {max_temp:.1f}°C")
        
        self.step += 1
        self.update()
    
    def show_temperature_evolution(self):
        """Show temperature evolution plot"""
        self.temp_heatmap.show_temperature_evolution()
    
    def show_heatmap_widget(self):
        """Show temperature heatmap widget"""
        self.temp_heatmap.show_heatmap_widget()

if __name__ == "__main__":
    app = QApplication(sys.argv)
    sim = FireSimWidget()
    sim.show()
    sys.exit(app.exec_())