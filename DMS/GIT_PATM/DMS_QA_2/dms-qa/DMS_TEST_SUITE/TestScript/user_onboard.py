import requests
from Utilities.bearer import get_token
# ---------- CONFIG ----------
BASE_URL = "http://localhost:3001"        # Your API base for /user
KC_BASE_URL = "https://sandbox.dms.pocketatm.in:8441"  # Your Keycloak base URL
REALM = "uat-dms"
CLIENT_UUID = "9fa638f6-1042-405d-8fdb-d472d2b3ea4c"  # The client UUID for role mappings
CLIENT_ID = "user-ms"
CLIENT_SECRET = "UB9M0zJaQCPDI7cIzYfBEXI8nZaSuyQx"
# -----------------------------
# Input variables
USER_EMAIL = "bankrmtest7@gmail.com"
USER_NAME = USER_EMAIL  # same as email
FIRST_NAME = USER_EMAIL.split("@")[0]  # part before '@'

# Get Keycloak admin token using client_credentials
def get_access_token():
    token_url = f"{KC_BASE_URL}/realms/{REALM}/protocol/openid-connect/token"
    data = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": "client_credentials"
    }
    response = requests.post(token_url, data=data)
    response.raise_for_status()
    return response.json()["access_token"]

# 1️⃣ FIRST — User onboard API
user_api_token = get_token("bearer_token")  # Token from bearer.py

user_payload = {
    "event": "ONBOARD_USER",
    "event_by": "vinuta.hegde@tibilsolutions.com",
    "edetails": [
        {
            "user_info": {
                "username": USER_NAME,
                "fname": FIRST_NAME,
                "lname": "k",
                "email": USER_EMAIL,
                "user_org": "Tibil-Bank"
            },
            "user_role": "Bank RM",
            "user_access": [
                {
                    "banks": {
                        "allow": ["Tibil-Bank"],
                        "deny": []
                    },
                    "branches": {
                        "allow": ["branch_1"],
                        "deny": []
                    }
                }
            ]
        }
    ],
    "role": "DMS Admin",
    "userName": "vinuta.hegde@tibilsolutions.com"
}

headers_user = {
    "Authorization": f"Bearer {user_api_token}",
    "Content-Type": "application/json"
}

print("📤 Calling /user API to onboard user...")
user_response = requests.post(f"{BASE_URL}/user", json=user_payload, headers=headers_user)
user_response.raise_for_status()
user_data = user_response.json()
print("✅ User onboard API call successful.")

# Extract username (email) from response
username_email = user_data["edata"]["values"][0][0]
print(f"Onboarded username: {username_email}")

# 2️⃣ Get admin token (client_credentials)
client_token = get_access_token()

headers_admin = {
    "Authorization": f"Bearer {client_token}",
    "Content-Type": "application/json"
}

# 3️⃣ Search Keycloak for userUuid
search_url = f"{KC_BASE_URL}/admin/realms/{REALM}/users"
params = {"username": username_email}
search_resp = requests.get(search_url, headers=headers_admin, params=params)
search_resp.raise_for_status()
search_results = search_resp.json()

if not search_results:
    raise ValueError(f"No Keycloak user found for username: {username_email}")

user_uuid = search_results[0]["id"]
print(f"Keycloak user UUID: {user_uuid}")

# 4️⃣ Get role mappings
role_mapping_url = f"{KC_BASE_URL}/admin/realms/{REALM}/users/{user_uuid}/role-mappings/clients/{CLIENT_UUID}"
role_resp = requests.get(role_mapping_url, headers=headers_admin)
role_resp.raise_for_status()
role_data = role_resp.json()

# 5️⃣ Count roles and first role name
count = len(role_data) if isinstance(role_data, list) else 0
role_names = [role.get("name") for role in role_data] if isinstance(role_data, list) else []

print ("-----------------------------------------------test starts---------------------------------------")
print(f"Number of roles: {count}")
if count > 1:
    print ("-----------------------------------------------1 failed---------------------------------------")
else:
    print ("-----------------------------------------------1 passed---------------------------------------")

