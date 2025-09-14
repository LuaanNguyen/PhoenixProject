import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from pyserial_from_arduino import * 


def generate_temp_reading (file_name):
    record_data(100, file_name)
    temp_panda = pd.read_csv(file_name)
    return temp_panda

def generate_graph (data_frame):
    data = data_frame.to_numpy()
    time_d = data[:, 0]
    delta_time = time_d - time_d[0]
    c_temp = data[:, 1]
    f_temp = data[:, 2]

    plt.plot(delta_time, c_temp)
    plt.plot(delta_time, f_temp)

    plt.grid(True)
    plt.title("Temperature(deg) over Time(ms)")
    plt.legend(["Temperature (C)", "Temperature (F)"])
    plt.xlabel("Time (ms)")
    plt.ylabel("Temperature (deg)")
    plt.savefig("im_one.png")
    plt.show()

def burn_indicator (threshold, data_frame):
    """
    Return first time index in which temperature
    goes over the non-burning threshold. Return None
    if no burning occured
    """
    numpy_data = data_frame.to_numpy()
    
    c_temp = numpy_data[:,1]
    index = -1

    for i in range(len(c_temp)):
        if c_temp[i] >= threshold:
            index = i
            break
    
    return numpy_data[:,0][index] if index!= -1 else None
    



# data_frame = generate_temp_reading("data_3.csv")
data_frame= pd.read_csv("data_3.csv")
generate_graph(data_frame)
print(burn_indicator(32, data_frame))




