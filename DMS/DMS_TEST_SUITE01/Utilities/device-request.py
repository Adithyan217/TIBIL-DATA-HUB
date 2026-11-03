import os
import requests
import json
from dotenv import load_dotenv
from numpy.distutils.conv_template import header

from Utilities import bearer

load_dotenv("/home/adithyan/PycharmProjects/PythonProject/Config/.env")

BASE_URL = os.getenv("BASE_URL")
BEARER_TOKEN = bearer.get_token("bearer_token")

def device_request(eid):
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {BEARER_TOKEN}"}

    wfevents_get_payload = {

    }




    wfhandler_status_payload = {
        "aid" :
    }

    hstatus= requests.post(url= BASE_URL + "/requests/wfhandler/status/get", headers=headers, json=wfhandler_status_payload)
