import json
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import base64
import os
from dotenv import load_dotenv


load_dotenv("/Config/.env")

SECRET_KEY = os.environ["SECRET_KEY"].encode()
INIT_VECTOR = os.environ["INIT_VECTOR"].encode()

def sym_decryptor(data_base64: str) -> str:
    # Decode base64 encrypted string
    encrypted_data = base64.b64decode(data_base64)

    # Split ciphertext and auth tag
    auth_tag = encrypted_data[-16:]
    ciphertext = encrypted_data[:-16]

    # Decrypt using AES-GCM
    decryptor = Cipher(
        algorithms.AES(SECRET_KEY),
        modes.GCM(INIT_VECTOR, auth_tag),
        backend=default_backend()
    ).decryptor()

    decrypted_data = decryptor.update(ciphertext) + decryptor.finalize()
    return decrypted_data.decode('utf-8')



def assert_drouter_response(response):

    try:
        # Extract encrypted data from response
        encrypted_data = response.get("data")
        if not encrypted_data:
            raise AssertionError("Missing 'data' field in response")

        # 🔐 Your decryption logic goes here
        decrypted_json_str = sym_decryptor(encrypted_data)  # Replace with actual function
        decrypted_data = json.loads(decrypted_json_str)

        # Check statMsg
        stat_msg = decrypted_data.get("statMsg")
        assert stat_msg == "Successfully Received", f"Expected 'Successfully Received', got: {stat_msg}"

        print("✅ Assertion passed: statMsg is 'Successfully Received'")

    except Exception as e:
        raise AssertionError(f"❌ Assertion failed: {e}")



