import os
import base64

def read_files_in_loop():
    directory_path = os.path.join(os.path.dirname(__file__), "iot_core")

    try:
        # Read all file names inside the directory
        files = os.listdir(directory_path)

        # Loop through each file
        for file in files:
            file_path = os.path.join(directory_path, file)

            try:
                # Read the file content
                with open(file_path, "r", encoding="utf-8") as f:
                    file_content = f.read()

                # Convert to Base64
                base64_content = base64.b64encode(file_content.encode()).decode()

                # Write Base64 to a new file
                output_file = os.path.join(directory_path, f"{file}.base64")
                with open(output_file, "w", encoding="utf-8") as f:
                    f.write(base64_content)

                print(f"File: {file} -> Base64: {base64_content}")

            except Exception as file_error:
                print(f"Error reading file {file}: {file_error}")

    except Exception as dir_error:
        print(f"Error reading directory: {dir_error}")


# Call the function
read_files_in_loop()
