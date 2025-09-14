import serial
import serial.tools.list_ports as stl
import time
import csv

ports = stl.comports() #declaring all ports available in arduino
serialInst = serial.Serial() #declaring a blank serial instance

# # port_list = []
# # for oneport in ports:
# #     port_list.append(str(oneport))
# #     print(oneport)

# # serialInst.baudrate = 9600
# # serialInst.port = "/dev/cu.usbmodemDC5475C3BB742"
# # serialInst.open()

# f = open("data.csv", "w", newline = "")
# f.truncate()

# serialCom = serial.Serial("/dev/cu.usbmodemDC5475C3BB742", 9600)

# #reset the arduino
# serialCom.setDTR(False)
# time.sleep(1)
# serialCom.flushInput()
# serialCom.setDTR(True)

# def C_to_F(temperature):
#     return temperature * 9/5 + 32
# #measurement loop
# kmax = 100
# for k in range(kmax):
#     writer = csv.writer(f, delimiter = ",")
#     if k == 0 :
#         writer.writerow(["Temperature (C)", "Fahrenheit (F)"])
#     try:
#         #read lines from the serial port
#         s_bytes = serialCom.readline()
#         #decode binary
#         decode_bytes = s_bytes.decode("utf-8").strip("\r\n")
#         values = [float(decode_bytes[21:26]), round(C_to_F(
#             float(decode_bytes[21:26])), 2)]
#         print(values)
#         writer.writerow(values)

    
#     except:
#         raise ValueError

#Function to start measurement

def record_data (data_points, file_name):
    ports = stl.comports() #declaring all ports available in arduino
    for oneport in ports:
        print(oneport)

    f = open(file_name, "w", newline = "")
    f.truncate()

    serialCom = serial.Serial("/dev/cu.usbmodemDC5475C3BB742", 9600)

    #reset the arduino
    serialCom.setDTR(False)
    time.sleep(1)
    serialCom.flushInput()
    serialCom.setDTR(True)

    #measurement loop
    for k in range(data_points):
        writer = csv.writer(f, delimiter = ",")
        if k == 0 :
            writer.writerow(["Time (ms)","Temperature (C)", "Fahrenheit (F)"])
        try:
            #read lines from the serial port
            s_bytes = serialCom.readline()
            #decode binary
            decode_bytes = s_bytes.decode("utf-8").strip("\r\n")
            parts = decode_bytes.split(' - ')
            print(parts)
            time_ms = int(parts[0].split(': ')[1].replace(' ms', ''))
            celsius = float(parts[1].split(': ')[1])
            fahrenheit = float(parts[2].split(': ')[1])
            values = [time_ms, celsius, fahrenheit]
            print(values)
            writer.writerow(values)

        except:
            raise ValueError


# record_data (100, 'data_2.csv')



