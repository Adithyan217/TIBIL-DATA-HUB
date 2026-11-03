import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables from .env file
# load_dotenv("../Config/.env")
load_dotenv("Config/.env")

BASE_URL = os.getenv("BASE_URL")
USER_NAME = os.getenv("USER_NAME")
USER_PASS = os.getenv("USER_PASS")


def get_token(context):
    """Fetch the Bearer token dynamically using username and password."""
    url = BASE_URL + "/user/session"

    payload = {
        "username": USER_NAME,
        "password": USER_PASS
    }

    headers = {
        "Content-Type": "application/json"
    }

    response = requests.post(url, headers=headers, json=payload)

    if response.status_code == 200:
        if context == "bearer_token":
            response_json = response.json()
            return response_json["data"]["access_token"]  # Extract the token from response
    else:
        raise Exception(f"Failed to fetch token: {response.status_code} {response.text}")


