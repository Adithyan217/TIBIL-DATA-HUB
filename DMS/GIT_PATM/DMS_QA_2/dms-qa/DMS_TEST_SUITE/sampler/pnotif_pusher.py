import json
import base64
import requests
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend

# AES-GCM key and IV (must be correct length: key 16/24/32 bytes, IV 12 bytes)
SECRET_KEY = b'k92ldahavl97s428vxri7x89seoy79sm'
INIT_VECTOR = b'7dzhcnrb0016hmj3'

API_URL = "https://sandbox.dms.pocketatm.in:8441/drouter/pnotif"

# Common headers
HEADERS = {
    "did": "device_p_test",
    "ifsc": "ABC1234",  # replace with your value
    "Content-Type": "application/json"
}

def sym_encryptor(data: str) -> str:
    encryptor = Cipher(
        algorithms.AES(SECRET_KEY),
        modes.GCM(INIT_VECTOR),
        backend=default_backend()
    ).encryptor()

    data_bytes = data.encode('utf-8')
    ciphertext = encryptor.update(data_bytes) + encryptor.finalize()
    auth_tag = encryptor.tag

    encrypted_data = ciphertext + auth_tag
    encrypted_base64 = base64.b64encode(encrypted_data).decode('utf-8')
    return encrypted_base64

def run_loop(start_ref: int, count: int):
    for i in range(count):
        req_no = start_ref + i
        req_ref_no_str = f"TEST{req_no}"

        # Create JSON payload
        payload_dict = {
            "timeStamp": 20250213100600,
            "vpa": "9763180546@janabank",
            "accountNo": "11111111111",
            "reqRefNo": "TEST"+req_ref_no_str,
            "mobile": "8606096204",
            "deviceId": "device_p_test",
            "txnAmt": "1000"
        }

        payload_json = json.dumps(payload_dict)
        encrypted_str = sym_encryptor(payload_json)

        # Send API request with headers
        try:
            resp = requests.post(
                API_URL,
                headers=HEADERS,
                json={"data": encrypted_str},
                verify=False
            )
            print(f"[{req_ref_no_str}] Status: {resp.status_code}, Response: {resp.text}")
        except Exception as e:
            print(f"[{req_ref_no_str}] Error sending request: {e}")

# Example: start from TEST1234567 and run 5 times
run_loop(start_ref=4234567, count=10)
