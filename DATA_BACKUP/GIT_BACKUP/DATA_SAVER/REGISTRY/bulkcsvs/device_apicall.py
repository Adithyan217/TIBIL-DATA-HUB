import requests
import json

def send_bulk_onboard_payload(api_url):
    total_devices = 1000
    devices_per_batch = 10
    total_batches = total_devices // devices_per_batch  # 100
    event_by = "ea67335e-b58f-4001-a2fa-0cd2319b3715"

    device_counter = 2001

    for bank_num in range(1, 11):  # tester_bank1 to tester_bank10
        for branch_num in range(1, 11):  # tester_branch1 to tester_branch100
            edetails = []
            for i in range(devices_per_batch):
                edetails.append({
                    "row_id": device_counter,
                    "bank_id": f"tester_bank{bank_num}",
                    "branch_id": f"tester_branch{(bank_num - 1) * 10 + branch_num}",
                    "onboard_status": "Allocated to Branch",
                    "mf_id": "mf_1",
                    "model_id": "model_1",
                    "firmware_id": "firmware_1",
                    "dname": f"tester_device{device_counter}",
                    "imei": f"tester_imei{device_counter}",
                    "vpa_id": f"tester_vpa{device_counter}@bank"
                })
                device_counter += 1

            payload = {
                "eid": 99999,
                "event": "ONBOARD_DEVICE",
                "event_by": event_by,
                "edetails": edetails
            }
            bearer_token ="eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJBRWFPNWFLYkk1TWdUSHlQUXJVMGRfNWJ6Z3hyQ09WNndRM2t5OVVqN3ZjIn0.eyJleHAiOjE3NDY3ODYxMjYsImlhdCI6MTc0NjY5OTcyNiwianRpIjoiOTUyOTQ4MzYtZDllZC00NTEwLTljNzctZmY4NDk4YzA3NjFhIiwiaXNzIjoiaHR0cHM6Ly9zYW5kYm94LmRtcy5wb2NrZXRhdG0uaW46ODQ0MS9yZWFsbXMvdWF0LWRtcyIsImF1ZCI6WyJpbnRlbC1tcyIsInJlZ2lzdHJ5LW1zIiwid29ya2Zsb3ctbXMiLCJhY2NvdW50Il0sInN1YiI6IjA1ZDY5ODg1LTllOWQtNDhlOC04NjczLTNiYTRkMTFmYmYyMCIsInR5cCI6IkJlYXJlciIsImF6cCI6InVzZXItbXMiLCJzaWQiOiJmOWM4MDdkNi00ODNmLTQzMzgtODJkOC03ZTkwODAzNGI2ZjQiLCJhY3IiOiIxIiwiYWxsb3dlZC1vcmlnaW5zIjpbIi8qIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJvZmZsaW5lX2FjY2VzcyIsInVtYV9hdXRob3JpemF0aW9uIiwiZGVmYXVsdC1yb2xlcy11YXQtZG1zIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsiaW50ZWwtbXMiOnsicm9sZXMiOlsiRE1TIEFkbWluIl19LCJ1c2VyLW1zIjp7InJvbGVzIjpbIkRNUyBBZG1pbiJdfSwicmVnaXN0cnktbXMiOnsicm9sZXMiOlsiRE1TIEFkbWluIl19LCJ3b3JrZmxvdy1tcyI6eyJyb2xlcyI6WyJETVMgQWRtaW4iXX0sImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoicHJvZmlsZSBlbWFpbCIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYW1lIjoidmludXRhIGgiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJ2aW51dGEuaGVnZGVAdGliaWxzb2x1dGlvbnMuY29tIiwiZ2l2ZW5fbmFtZSI6InZpbnV0YSIsImZhbWlseV9uYW1lIjoiaCIsImVtYWlsIjoidmludXRhLmhlZ2RlQHRpYmlsc29sdXRpb25zLmNvbSJ9.X6EdKjJV35fpoSj6LbEexgZWkWFGOuF4SSPmDZCEYH0mHmpQKKgMx4OeNsYpqi2HXIZzs5FLV2mnQvijwfEjhmfM5br8GgwzvYzKsqG7avcO6heeRXw7HFa7h10OoP-g4CtrXXELPAJQJ8W9MY3znsbPGUkU-zbRW7urGWBT7grHfScpkBa-yeeFyHSPAt_EPEr35yxMXTa-eyWYYAEKwblZFbk16e3V2dmUpMSyOAzlx2PMddFJ44ta2xFHKiGmRmmLqcCgZEOU7rFkYdYG2QsnNYugWYeZojwHavKy8C-yEkhK-NjDc4AwoZjXENFSD2drv-a2IjgdEaBHUi5JVA"

            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {bearer_token}'
            }
            response = requests.post(api_url, data=json.dumps(payload), headers=headers)

            print(f"[Devices {device_counter - 10} to {device_counter - 1}] sent to tester_bank{bank_num} / tester_branch{(bank_num - 1) * 10 + branch_num}")
            print("Status Code:", response.status_code)
            if response.status_code != 200:
                print("Error Response:", response.text)

# Example usage:
# Replace with your actual API endpoint
send_bulk_onboard_payload("http://localhost:3007/registry/devices")


