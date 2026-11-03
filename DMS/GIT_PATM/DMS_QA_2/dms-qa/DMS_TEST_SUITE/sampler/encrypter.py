from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import base64

# Hardcoded secret key and IV (same as in your decryptor)
SECRET_KEY =   # 32 bytes for AES-256
INIT_VECTOR =             # 16 bytes IV


def sym_encryptor(data: str) -> str:
    # Create encryptor
    encryptor = Cipher(
        algorithms.AES(SECRET_KEY),
        modes.GCM(INIT_VECTOR),
        backend=default_backend()
    ).encryptor()

    # Encrypt the data
    data_bytes = data.encode('utf-8')
    ciphertext = encryptor.update(data_bytes) + encryptor.finalize()
    auth_tag = encryptor.tag

    # Combine ciphertext + auth_tag like in Node.js
    encrypted_data = ciphertext + auth_tag
    encrypted_base64 = base64.b64encode(encrypted_data).decode('utf-8')

    return encrypted_base64


print(sym_encryptor("""{"timeStamp":20250328010005,"vpa":"jana2502367007@janabank","accountNo":"1234567890987654","reqRefNo":"IBL433cda00e68a4b3d9c361914ffa5acda","mobile":"8606096204","deviceId":"device_1","txnAmt":"50"}"""))