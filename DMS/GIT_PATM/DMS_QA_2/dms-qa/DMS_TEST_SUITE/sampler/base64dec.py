import os
import base64

def decode_files_in_loop():
    directory_path = os.path.join(os.path.dirname(__file__), "iot_core")

    try:
        # Read all file names inside the directory
        files = os.listdir(directory_path)

        # Loop through each file
        for file in files:
            # Only process files ending with .base64
            if not file.endswith(".base64"):
                continue

            file_path = os.path.join(directory_path, file)

            try:
                # Read the Base64 content
                with open(file_path, "r", encoding="utf-8") as f:
                    base64_content = f.read()

                # Convert back from Base64
                decoded_content = base64.b64decode(base64_content).decode()

                # Write decoded content to new file (remove .base64 extension)
                original_file = os.path.join(directory_path, file.replace(".base64", ""))
                with open(original_file, "w", encoding="utf-8") as f:
                    f.write(decoded_content)

                print(f"File: {file} -> Decoded back to: {original_file}")

            except Exception as file_error:
                print(f"Error decoding file {file}: {file_error}")

    except Exception as dir_error:
        print(f"Error reading directory: {dir_error}")


# Call the function
decode_files_in_loop()
