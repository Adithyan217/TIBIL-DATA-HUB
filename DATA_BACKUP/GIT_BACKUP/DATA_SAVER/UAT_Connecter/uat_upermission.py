import requests
import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv
import os

# Load env variables
load_dotenv()

# Configuration
API_1_URL = os.getenv("API_1_URL")
BEARER_TOKEN = os.getenv("API_TOKEN")

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
    "database": os.getenv("DB_NAME", "mydb"),
    "user": os.getenv("DB_USER", "myuser"),
    "password": os.getenv("DB_PASSWORD", "mypassword")
}

HEADERS = {
    "Authorization": f"Bearer {BEARER_TOKEN}",
    "Content-Type": "application/json"
}


def fetch_user_info(email):
    try:
        response = requests.post(API_1_URL, headers=HEADERS, json={"email": email})
        response.raise_for_status()
        payload = response.json()
        print(f"User Info for {email}:", payload)

        if payload.get("code") != 2000 or not payload.get("data"):
            return None, None, None

        user_data = payload["data"][0]
        fname = user_data.get("firstName")
        lname = user_data.get("lastName")
        role = user_data.get("role")

        return fname, lname, role
    except Exception as e:
        print(f"Failed to fetch info for {email}: {e}")
        return None, None, None


def update_user_in_db(email, fname, lname, role):
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()

        # Update 1: workflow
        cur.execute("""
            UPDATE workflow.upermissions
            SET fname = %s,
                lname = %s
            WHERE username = %s
        """, (fname, lname, email))

        # Update 2: intel
        cur.execute("""
            UPDATE intel.upermissions
            SET fname = %s,
                lname = %s,
                urole = %s
            WHERE username = %s
        """, (fname, lname, role, email))

        # Update 3: registry
        cur.execute("""
            UPDATE registry.upermissions
            SET fname = %s,
                lname = %s,
                urole = %s
            WHERE username = %s
        """, (fname, lname, role, email))

        conn.commit()
        print(f"Updated user: {email}")

    except Exception as e:
        print(f"Database error for {email}: {e}")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


def get_all_usernames():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        cur.execute("SELECT DISTINCT username FROM registry.upermissions")
        usernames = [row[0] for row in cur.fetchall()]
        return usernames
    except Exception as e:
        print("Error fetching usernames from DB:", e)
        return []
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


def main():
    usernames = get_all_usernames()
    print(f"Found {len(usernames)} usernames to process.")

    for email in usernames:
        fname, lname, role = fetch_user_info(email)
        if fname and lname and role:
            update_user_in_db(email, fname, lname, role)
        else:
            print(f"Skipping update for {email} due to missing data.")


if __name__ == "__main__":
    main()



# conn = psycopg2.connect(**DB_CONFIG)
# cur = conn.cursor()
# cur.execute("SELECT DISTINCT username FROM registry.upermissions")
# usernames = [row[0] for row in cur.fetchall()]
# print(usernames) 