import base64

def encode_to_base64(input_string: str) -> str:
    """
    Takes a string and returns its Base64 encoded version.
    """
    try:
        base64_content = base64.b64encode(input_string.encode("utf-8")).decode("utf-8")
        print(f"Base64: {base64_content}")
        return base64_content
    except Exception as e:
        print(f"Error encoding string: {e}")
        return ""


# Example usage
if __name__ == "__main__":
    sample_text = """-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg2pQt77ET7d4D4vBG
h09jejq/bMYV4dbYAYbI5otAW3uhRANCAART877iGoadYkcLfcOeYTY5sNLxiOGH
ezKK8fIavBBZhcBz982cvnirIr8gwzlqCR/x413y4qBrvCiG2+o48JFW
-----END PRIVATE KEY-----
"""
    encoded = encode_to_base64(sample_text)
