import psycopg2
import random
import string
from datetime import datetime, timedelta

# Database connection parameters
db_config = {
    "dbname": "DMS",
    "user": "postgres",
    "password": "tibil123",
    "host": "localhost",
    "port": "5432"
}

# Helper function to generate random strings
def random_string(length=8):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

# Function to insert rows into each table
def insert_rows():
    try:
        # Connect to PostgreSQL
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()
        
        # Example data for events
        vevts = ['VPA_GENERATED', 'VPA_DEACTIVATED']
        mfevts = ['MF_ONBOARDED', 'MF_DEACTIVATED']
        devts = ['DEVICE_ONBOARDED', 'DEVICE_DEACTIVATED']
        bevts = ['BANK_ONBOARDED', 'BANK_DEACTIVATED']
        brevts = ['BRANCH_ONBOARDED', 'BRANCH_DEACTIVATED']
        frevts = ['FIRMWARE_CREATED', 'FIRMWARE_DELETED']
        mdevts = ['MODEL_CREATED', 'MODEL_DELETED']
        sbevts = ['VPA_DEVICE_BOUND', 'VPA_DEVICE_UNBOUND', 'ALLOCATED_TO_MERCHANT', 'REALLOCATED_TO_MERCHANT']
        tevts = ['CREATED', 'UPDATED', 'DELETED']
        
        # Insert into banks table
        for i in range(50):
            cursor.execute("""
                INSERT INTO dmsr.banks (bcode, bname, bevt, eid, isd, eat, eby)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (random_string(5), f"Bank_{i}", random.choice(bevts), random.randint(1, 100), 
                  random.choice([True, False]), datetime.now() - timedelta(days=random.randint(0, 100)), random.randint(1, 100)))
        
        # Insert into vpa table
        for i in range(50):
            cursor.execute("""
                INSERT INTO dmsr.vpa (vpa, bid, vevt, eid, eat, eby, isd)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (f"vpa_{random_string(6)}", random.randint(1, 50), random.choice(vevts), random.randint(1, 100), 
                  datetime.now() - timedelta(days=random.randint(0, 100)), random.randint(1, 100), random.choice([True, False])))

        # Insert into mf table
        for i in range(50):
            cursor.execute("""
                INSERT INTO dmsr.mf (mfname, mfevt, eid, eat, eby, isd)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (f"MF_{i}", random.choice(mfevts), random.randint(1, 100), datetime.now() - timedelta(days=random.randint(0, 100)), 
                  random.randint(1, 100), random.choice([True, False])))

        # Insert into firmware table
        for i in range(50):
            cursor.execute("""
                INSERT INTO dmsr.firmware (mfid, fdesc, frevt, eid, isd, eat, eby)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (random.randint(1, 50), {'version': f"1.{i}"}, random.choice(frevts), random.randint(1, 100), 
                  random.choice([True, False]), datetime.now() - timedelta(days=random.randint(0, 100)), random.randint(1, 100)))

        # Insert into model table
        for i in range(50):
            cursor.execute("""
                INSERT INTO dmsr.model (mfid, fid, eid, mdesc, mevt, isd, eat, eby)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (random.randint(1, 50), random.randint(1, 50), random.randint(1, 100), f"Model_{i}", 
                  random.choice(mdevts), random.choice([True, False]), datetime.now() - timedelta(days=random.randint(0, 100)), random.randint(1, 100)))
        
        # Insert into devices table
        for i in range(50):
            cursor.execute("""
                INSERT INTO dmsr.devices (dname, mfid, fid, mdid, devt, eid, isd, eat, eby)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (f"Device_{i}", random.randint(1, 50), random.randint(1, 50), random.randint(1, 50), 
                  random.choice(devts), random.randint(1, 100), random.choice([True, False]), 
                  datetime.now() - timedelta(days=random.randint(0, 100)), random.randint(1, 100)))

        # Insert into branches table
        for i in range(50):
            cursor.execute("""
                INSERT INTO dmsr.branches (brname, braddr, bid, brevt, eid, isd, eat, eby)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (f"Branch_{i}", f"Address_{i}", random.randint(1, 50), random.choice(brevts), 
                  random.randint(1, 100), random.choice([True, False]), 
                  datetime.now() - timedelta(days=random.randint(0, 100)), random.randint(1, 100)))

        # Insert into merchants table
        for i in range(50):
            cursor.execute("""
                INSERT INTO dmsr.merchants (mid, msid, mname, minfo, mevt, eid, brid, isd, eat, eby)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (random.randint(1, 100), random.randint(1, 50), f"Merchant_{i}", {'info': f"Details_{i}"}, 
                  random.choice(mevts), random.randint(1, 100), random.randint(1, 50), random.choice([True, False]), 
                  datetime.now() - timedelta(days=random.randint(0, 100)), random.randint(1, 100)))

        # Insert into sb table
        for i in range(50):
            cursor.execute("""
                INSERT INTO dmsr.sb (vid, mid, did, bid, brid, sbevt, eid, isd, eat, eby)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (random.randint(1, 50), random.randint(1, 50), random.randint(1, 50), 
                  random.randint(1, 50), random.randint(1, 50), random.choice(sbevts), random.randint(1, 100), 
                  random.choice([True, False]), datetime.now() - timedelta(days=random.randint(0, 100)), random.randint(1, 100)))

        # Commit transactions
        conn.commit()
        print("50 rows inserted into each table successfully.")
    
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

        

if __name__ == "__main__":
    insert_rows()

