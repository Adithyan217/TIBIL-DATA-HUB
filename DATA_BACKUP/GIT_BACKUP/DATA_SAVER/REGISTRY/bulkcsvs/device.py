import csv
import random

def create_device_csv(filename, num_rows):
    with open(filename, mode='w', newline='') as file:
        writer = csv.writer(file)

        # Write header
        writer.writerow(['row_1', 'mf_id', 'model_id', 'firmware_id', 'dname', 'imei', 'vpa_id'])

        # Write rows
        for i in range(1, num_rows + 1):
            mf_id = 'mf_1'
            model_id = 'model_1'
            firmware_id = 'firmware_1'
            dname = f'tester_device{i +40}'
            imei = f'tester_imei{ i+40}'
            # merchant_id = f'merchant_{i}'
            vpa_id = f'tester_vpa{i}@bank{i +40}'

            writer.writerow([i, mf_id, model_id, firmware_id, dname, imei, vpa_id])

# Example usage:
create_device_csv('REGISTRY/bulkcsvs/device.csv', 10)
