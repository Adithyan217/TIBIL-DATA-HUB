from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import base64

# Hardcoded secret key and IV (same as in your Node.js example)
# SECRET_KEY = b'x1c7w3aql2mj8d9e5ruq4htfksnvy62b'  # 32 bytes for AES-256
# INIT_VECTOR = b'9fhq7x3lzn0vpbwy'                 # 16 bytes IV

SECRET_KEY = b'k92ldahavl97s428vxri7x89seoy79sm'
INIT_VECTOR = b'7dzhcnrb0016hmj3'


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

print(sym_decryptor("VSpDMfG0C2X+skaWwlAIMtNDFl4/Jt3ipYfMemlMk1fS7OBEHC51fCJr+8ieAgh9y4iUQ9LqdD5SSCN1x2kUONFW+GpI1lD5JZ1owwQh2gUUVbLqbw=="))
