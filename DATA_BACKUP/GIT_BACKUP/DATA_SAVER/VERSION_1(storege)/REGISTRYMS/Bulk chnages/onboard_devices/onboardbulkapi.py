import json

def generate_device_json(num_devices: int):
    base_data = {
        "event": "ONBOARD_DEVICE",
        "event_by": "ea67335e-b58f-4001-a2fa-0cd2319b3715",
        "edetails": []
    }
    
    for i in range(1, num_devices + 1):
        device_data = {
            "row_id": i,
            "bank_id": "bank_1",
            "branch_id": "branch_1",
            "onboard_status": "Allocated to Merchant",
            "mf_id": "mf_1",
            "model_id": "model_1",
            "firmware_id": "firmware_1",
            "dname": f"device_{i}",
            "imei": str(1232 + i),
            "vpa_id": f"vpa@abc{i}",
            "merchant_id": f"merchant_{i}"
        }
        base_data["edetails"].append(device_data)
    
    return base_data

def save_json_to_file(num_devices: int, file_path: str):
    data = generate_device_json(num_devices)
    with open(file_path, "w") as f:
        json.dump(data, f, indent=4)

if __name__ == "__main__":
    num_devices = 100  # Set the number of devices here
    file_path = "VERSION_1(storege)/REGISTRYMS/Bulk chnages/onboard_devices/output_data/data2.json"  # Set the file path here
    save_json_to_file(num_devices, file_path)
    print(f"JSON data saved to {file_path}")
