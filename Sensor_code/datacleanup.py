import csv

def clean_csv(input_file, output_file, tol=0.5):
    cleaned_rows = []
    force_300 = False  # once triggered, all temps = 300C
    last_celsius = None

    with open(input_file, "r", newline="") as f:
        reader = csv.reader(f, delimiter=",")
        header = next(reader, None)  # read header
        if header is None:
            raise ValueError("Input CSV is empty.")

        for row in reader:
            try:
                if len(row) != 3:
                    continue

                time_ms = int(row[0].strip())
                celsius = float(row[1].strip())
                fahrenheit = float(row[2].strip())

                # If we've already hit failure state -> force 300C
                if force_300:
                    cleaned_rows.append([time_ms, 300.0, 572.0])
                    continue

                # Check for error code
                if celsius == -1000 or fahrenheit == -1000:
                    # Trigger 300C mode if previous valid reading was >120C
                    if last_celsius is not None and last_celsius > 120:
                        force_300 = True
                    # Skip this error row itself
                    continue

                # Normal row: validate Fahrenheit
                expected_f = celsius * 9 / 5 + 32
                if abs(fahrenheit - expected_f) <= tol:
                    cleaned_rows.append([time_ms, celsius, fahrenheit])
                else:
                    cleaned_rows.append([time_ms, celsius, round(expected_f, 2)])

                # Update last good Celsius
                last_celsius = celsius

            except Exception:
                continue

    # Write cleaned file
    with open(output_file, "w", newline="") as f:
        writer = csv.writer(f, delimiter=",")
        writer.writerow(["Time (ms)", "Temperature (C)", "Fahrenheit (F)"])
        writer.writerows(cleaned_rows)

    print(f"Cleaned data written to {output_file}")
