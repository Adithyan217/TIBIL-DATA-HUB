import os
import requests
import json
from dotenv import load_dotenv

from Utilities import bearer

# Load environment variables from .env file
# load_dotenv("Config/.env")
load_dotenv("../Config/.env")

BASE_URL = os.getenv("BASE_URL")
USER_NAME = os.getenv("USER_NAME")
USER_PASS = os.getenv("USER_PASS")
print(USER_NAME)
BEARER_TOKEN = bearer.get_token("bearer_token")

def get_user_details(value):
    """Fetch the Bearer token dynamically using username and password."""
    url = BASE_URL + "/user/details/get"

    payload = {
        "username": USER_NAME
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {BEARER_TOKEN}"
    }

    response = requests.post(url, headers=headers, json=payload)
    print(response)
    if response.status_code == 200:
        if value == "user_id":
            response_json = response.json()
            print(response_json)
            return response_json["data"][0]["id"]  # Extract the token from response
    else:
        raise Exception(f"Failed to fetch token: {response.status_code} {response.text}")


print(get_user_details("user_id"))