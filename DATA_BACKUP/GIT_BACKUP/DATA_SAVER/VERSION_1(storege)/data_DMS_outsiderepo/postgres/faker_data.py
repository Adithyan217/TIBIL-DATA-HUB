from faker import Faker
import random
import psycopg2
from psycopg2.extras import Json

# Initialize Faker and Database connection
fake = Faker()
conn = psycopg2.connect(
    dbname="PG_DMS",
    user="postgres",
    password="tibil123",
    host="localhost",
    port="5432"
)
conn.autocommit = False  # Use transaction management

# Helper function to fetch IDs from a table
def fetch_ids_from_table(table_name, id_column):
    with conn.cursor() as cur:
        cur.execute(f"SELECT {id_column} FROM {table_name};")
        return [row[0] for row in cur.fetchall()]

# Helper function to reset uniqueness after 1000 entries
def reset_uniqueness(i, interval=1000):
    if i > 0 and i % interval == 0:
        fake.unique.clear()

# Insert into banks
def insert_banks(n=10):
    bank_ids = []
    with conn.cursor() as cur:
        for i in range(n):
            reset_uniqueness(i)
            data = (
                fake.unique.bban(),
                fake.company(),
                random.choice(['BANK_ONBOARDED', 'BANK_DEACTIVATED']),
                fake.random_int(min=100, max=99999),
                False,
                fake.random_int(min=100, max=99999)
            )
            cur.execute("""
                INSERT INTO dmsr.banks (bcode, bname, bevt, eid, isd, eby) 
                VALUES (%s, %s, %s, %s, %s, %s) RETURNING bid;
            """, data)
            bank_ids.append(cur.fetchone()[0])
    return bank_ids

# Insert into vpa, depending on banks
def insert_vpa(bank_ids, n=10):
    vpa_ids = []
    with conn.cursor() as cur:
        for i in range(n):
            reset_uniqueness(i)
            data = (
                fake.unique.email(),
                random.choice(bank_ids),
                random.choice(['VPA_GENERATED', 'VPA_DEACTIVATED']),
                fake.random_int(min=100, max=99999),
                fake.random_int(min=100, max=99999),
                False
            )
            cur.execute("""
                INSERT INTO dmsr.vpa (vpa, bid, vevt, eid, eby, isd) 
                VALUES (%s, %s, %s, %s, %s, %s) RETURNING vid;
            """, data)
            vpa_ids.append(cur.fetchone()[0])
    return vpa_ids

# Insert into mf (independent table)
def insert_mf(n=10):
    mf_ids = []
    with conn.cursor() as cur:
        for i in range(n):
            reset_uniqueness(i)
            data = (
                fake.unique.company_suffix(),
                random.choice(['MF_ONBOARDED', 'MF_DEACTIVATED']),
                fake.random_int(min=100, max=99999),
                fake.random_int(min=100, max=99999),
                False
            )
            cur.execute("""
                INSERT INTO dmsr.mf (mfname, mfevt, eid, eby, isd) 
                VALUES (%s, %s, %s, %s, %s) RETURNING mfid;
            """, data)
            mf_ids.append(cur.fetchone()[0])
    return mf_ids

# Insert into firmware, depending on mf
def insert_firmware(mf_ids, n=10):
    firmware_ids = []
    with conn.cursor() as cur:
        for i in range(n):
            reset_uniqueness(i)
            data = (
                random.choice(mf_ids),
                Json({"version": fake.random_element(elements=["1.0", "1.1", "2.0"])}),
                random.choice(['FIRMWARE_CREATED', 'FIRMWARE_DELETED']),
                fake.random_int(min=100, max=99999),
                fake.random_int(min=100, max=99999),
                False
            )
            cur.execute("""
                INSERT INTO dmsr.firmware (mfid, fdesc, frevt, eid, eby, isd) 
                VALUES (%s, %s, %s, %s, %s, %s) RETURNING fid;
            """, data)
            firmware_ids.append(cur.fetchone()[0])
    return firmware_ids

# Insert into model, depending on mf and firmware
def insert_model(mf_ids, firmware_ids, n=10):
    model_ids = []
    with conn.cursor() as cur:
        for i in range(n):
            reset_uniqueness(i)
            data = (
                random.choice(mf_ids),
                random.choice(firmware_ids),
                fake.random_int(min=100, max=99999),
                fake.catch_phrase(),
                random.choice(['MODEL_CREATED', 'MODEL_DELETED']),
                False,
                fake.random_int(min=100, max=99999)
            )
            cur.execute("""
                INSERT INTO dmsr.model (mfid, fid, eid, mdesc, mevt, isd, eby) 
                VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING mdid;
            """, data)
            model_ids.append(cur.fetchone()[0])
    return model_ids

# Insert into devices, depending on mf, firmware, and model
def insert_devices(mf_ids, firmware_ids, model_ids, n=10):
    device_ids = []
    with conn.cursor() as cur:
        for i in range(n):
            reset_uniqueness(i)
            data = (
                fake.uuid4(),
                random.choice(mf_ids),
                random.choice(firmware_ids),
                random.choice(model_ids),
                random.choice(['DEVICE_ONBOARDED', 'DEVICE_DEACTIVATED']),
                fake.random_int(min=100, max=9999),
                False,
                fake.random_int(min=100, max=9999)
            )
            cur.execute("""
                INSERT INTO dmsr.devices (dname, mfid, fid, mdid, devt, eid, isd, eby) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING did;
            """, data)
            device_ids.append(cur.fetchone()[0])
    return device_ids

# Insert into branches, depending on banks
def insert_branches(bank_ids, n=10):
    branch_ids = []
    with conn.cursor() as cur:
        for i in range(n):
            reset_uniqueness(i)
            data = (
                fake.company(),
                fake.address(),
                random.choice(bank_ids),
                random.choice(['BRANCH_ONBOARDED', 'BRANCH_DEACTIVATED']),
                fake.random_int(min=100, max=99999),
                False,
                fake.random_int(min=100, max=99999)
            )
            cur.execute("""
                INSERT INTO dmsr.branches (brname, braddr, bid, brevt, eid, isd, eby) 
                VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING brid;
            """, data)
            branch_ids.append(cur.fetchone()[0])
    return branch_ids

# Insert into merchants, depending on branches
def insert_merchants(branch_ids, n=10):
    merchant_ids = []
    with conn.cursor() as cur:
        for i in range(n):
            reset_uniqueness(i)
            data = (
                fake.random_int(min=1000, max=9999),
                fake.random_int(min=1000, max=9999),
                fake.company(),
                Json({"info": fake.sentence()}),
                random.choice(['MERCHANT_ONBOARDED', 'MERCHANT_DEACTIVATED']),
                fake.random_int(min=100, max=99999),
                random.choice(branch_ids),
                False,
                fake.random_int(min=100, max=99999)
            )
            cur.execute("""
                INSERT INTO dmsr.merchants (mid, msid, mname, minfo, mevt, eid, brid, isd, eby) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING mpid;
            """, data)
            merchant_ids.append(cur.fetchone()[0])
    return merchant_ids

# Insert into sb, depending on vpa, merchants, devices, banks, and branches
def insert_sb(vpa_ids, merchant_ids, device_ids, bank_ids, branch_ids, n=10):
    with conn.cursor() as cur:
        for i in range(n):
            reset_uniqueness(i)
            data = (
                random.choice(vpa_ids),
                random.choice(merchant_ids),
                random.choice(device_ids),
                random.choice(bank_ids),
                random.choice(branch_ids),
                random.choice(['VPA_DEVICE_BOUND', 'DEVICE_RETURNED', 'ISSUE_REPORTED']),
                fake.random_int(min=100, max=99999),
                False,
                fake.random_int(min=100, max=99999)
            )
            cur.execute("""
                INSERT INTO dmsr.sb (vid, mid, did, bid, brid, sbevt, eid, isd, eby) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
            """, data)

# Run all insertions
try:
    bank_ids = insert_banks()
    vpa_ids = insert_vpa(bank_ids)
    mf_ids = insert_mf()
    firmware_ids = insert_firmware(mf_ids)
    model_ids = insert_model(mf_ids, firmware_ids)
    device_ids = insert_devices(mf_ids, firmware_ids, model_ids)
    branch_ids = insert_branches(bank_ids)
    merchant_ids = insert_merchants(branch_ids)
    insert_sb(vpa_ids, merchant_ids, device_ids, bank_ids, branch_ids)
    conn.commit()  # Commit all transactions
except Exception as e:
    conn.rollback()  # Rollback on error
    print(f"Error occurred: {e}")
finally:
    conn.close()





























# from faker import Faker
# import random
# import psycopg2
# from psycopg2.extras import Json

# # Initialize Faker and Database connection
# fake = Faker()
# conn = psycopg2.connect(
#     dbname="PG_DMS",
#     user="postgres",
#     password="tibil123",
#     host="localhost",
#     port="5432"
# )
# conn.autocommit = False  # Use transaction management

# # Helper function to fetch IDs from a table
# def fetch_ids_from_table(table_name, id_column):
#     with conn.cursor() as cur:
#         cur.execute(f"SELECT {id_column} FROM {table_name};")
#         return [row[0] for row in cur.fetchall()]

# # Insert into banks
# def insert_banks(n=10):
#     bank_ids = []
#     with conn.cursor() as cur:
#         for _ in range(n):
#             data = (
#                 fake.unique.bban.set_max(10000)(),
#                 fake.company(),
#                 random.choice(['BANK_ONBOARDED', 'BANK_DEACTIVATED']),
#                 fake.random_int(min=100, max=99999),
#                 False,
#                 fake.random_int(min=100, max=99999)
#             )
#             cur.execute("""
#                 INSERT INTO dmsr.banks (bcode, bname, bevt, eid, isd, eby) 
#                 VALUES (%s, %s, %s, %s, %s, %s) RETURNING bid;
#             """, data)
#             bank_ids.append(cur.fetchone()[0])
#     return bank_ids

# # Insert into vpa, depending on banks
# def insert_vpa(bank_ids, n=10):
#     vpa_ids = []
#     with conn.cursor() as cur:
#         for _ in range(n):
#             data = (
#                 fake.unique.email.set_max(10000)(),
#                 random.choice(bank_ids),
#                 random.choice(['VPA_GENERATED', 'VPA_DEACTIVATED']),
#                 fake.random_int(min=100, max=99999),
#                 fake.random_int(min=100, max=99999),
#                 False
#             )
#             cur.execute("""
#                 INSERT INTO dmsr.vpa (vpa, bid, vevt, eid, eby, isd) 
#                 VALUES (%s, %s, %s, %s, %s, %s) RETURNING vid;
#             """, data)
#             vpa_ids.append(cur.fetchone()[0])
#     return vpa_ids

# # Insert into mf (independent table)
# def insert_mf(n=10):
#     mf_ids = []
#     with conn.cursor() as cur:
#         for _ in range(n):
#             data = (
#                 fake.unique.company_suffix.set_max(10000)(),
#                 random.choice(['MF_ONBOARDED', 'MF_DEACTIVATED']),
#                 fake.random_int(min=100, max=99999),
#                 fake.random_int(min=100, max=99999),
#                 False
#             )
#             cur.execute("""
#                 INSERT INTO dmsr.mf (mfname, mfevt, eid, eby, isd) 
#                 VALUES (%s, %s, %s, %s, %s) RETURNING mfid;
#             """, data)
#             mf_ids.append(cur.fetchone()[0])
#     return mf_ids

# # Insert into firmware, depending on mf
# def insert_firmware(mf_ids, n=10):
#     firmware_ids = []
#     with conn.cursor() as cur:
#         for _ in range(n):
#             data = (
#                 random.choice(mf_ids),
#                 Json({"version": fake.random_element(elements=["1.0", "1.1", "2.0"])}),
#                 random.choice(['FIRMWARE_CREATED', 'FIRMWARE_DELETED']),
#                 fake.random_int(min=100, max=99999),
#                 fake.random_int(min=100, max=99999),
#                 False
#             )
#             cur.execute("""
#                 INSERT INTO dmsr.firmware (mfid, fdesc, frevt, eid, eby, isd) 
#                 VALUES (%s, %s, %s, %s, %s, %s) RETURNING fid;
#             """, data)
#             firmware_ids.append(cur.fetchone()[0])
#     return firmware_ids

# # Insert into model, depending on mf and firmware
# def insert_model(mf_ids, firmware_ids, n=10):
#     model_ids = []
#     with conn.cursor() as cur:
#         for _ in range(n):
#             data = (
#                 random.choice(mf_ids),
#                 random.choice(firmware_ids),
#                 fake.random_int(min=100, max=99999),
#                 fake.catch_phrase(),
#                 random.choice(['MODEL_CREATED', 'MODEL_DELETED']),
#                 False,
#                 fake.random_int(min=100, max=99999)
#             )
#             cur.execute("""
#                 INSERT INTO dmsr.model (mfid, fid, eid, mdesc, mevt, isd, eby) 
#                 VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING mdid;
#             """, data)
#             model_ids.append(cur.fetchone()[0])
#     return model_ids

# # Insert into devices, depending on mf, firmware, and model
# def insert_devices(mf_ids, firmware_ids, model_ids, n=10):
#     device_ids = []
#     with conn.cursor() as cur:
#         for _ in range(n):
#             data = (
#                 fake.unique.uuid4.set_max(10000)(),
#                 random.choice(mf_ids),
#                 random.choice(firmware_ids),
#                 random.choice(model_ids),
#                 random.choice(['DEVICE_ONBOARDED', 'DEVICE_DEACTIVATED']),
#                 fake.random_int(min=100, max=9999),
#                 False,
#                 fake.random_int(min=100, max=9999)
#             )
#             cur.execute("""
#                 INSERT INTO dmsr.devices (dname, mfid, fid, mdid, devt, eid, isd, eby) 
#                 VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING did;
#             """, data)
#             device_ids.append(cur.fetchone()[0])
#     return device_ids

# # Insert into branches, depending on banks
# def insert_branches(bank_ids, n=10):
#     branch_ids = []
#     with conn.cursor() as cur:
#         for _ in range(n):
#             data = (
#                 fake.company(),
#                 fake.address(),
#                 random.choice(bank_ids),
#                 random.choice(['BRANCH_ONBOARDED', 'BRANCH_DEACTIVATED']),
#                 fake.random_int(min=100, max=99999),
#                 False,
#                 fake.random_int(min=100, max=99999)
#             )
#             cur.execute("""
#                 INSERT INTO dmsr.branches (brname, braddr, bid, brevt, eid, isd, eby) 
#                 VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING brid;
#             """, data)
#             branch_ids.append(cur.fetchone()[0])
#     return branch_ids

# # Insert into merchants, depending on branches
# def insert_merchants(branch_ids, n=10):
#     merchant_ids = []
#     with conn.cursor() as cur:
#         for _ in range(n):
#             data = (
#                 fake.random_int(min=1000, max=9999),
#                 fake.random_int(min=1000, max=9999),
#                 fake.company(),
#                 Json({"info": fake.sentence()}),
#                 random.choice(['MERCHANT_ONBOARDED', 'MERCHANT_DEACTIVATED']),
#                 fake.random_int(min=100, max=99999),
#                 random.choice(branch_ids),
#                 False,
#                 fake.random_int(min=100, max=99999)
#             )
#             cur.execute("""
#                 INSERT INTO dmsr.merchants (mid, msid, mname, minfo, mevt, eid, brid, isd, eby) 
#                 VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING mpid;
#             """, data)
#             merchant_ids.append(cur.fetchone()[0])
#     return merchant_ids

# # Insert into sb, depending on vpa, merchants, devices, banks, and branches
# def insert_sb(vpa_ids, merchant_ids, device_ids, bank_ids, branch_ids, n=10):
#     with conn.cursor() as cur:
#         for _ in range(n):
#             data = (
#                 random.choice(vpa_ids),
#                 random.choice(merchant_ids),
#                 random.choice(device_ids),
#                 random.choice(bank_ids),
#                 random.choice(branch_ids),
#                 random.choice(['VPA_DEVICE_BOUND', 'DEVICE_RETURNED', 'ISSUE_REPORTED']),
#                 fake.random_int(min=100, max=99999),
#                 False,
#                 fake.random_int(min=100, max=99999)
#             )
#             cur.execute("""
#                 INSERT INTO dmsr.sb (vid, mid, did, bid, brid, sbevt, eid, isd, eby) 
#                 VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
#             """, data)

# try:
#     # Insert data in correct order
#     bank_ids = insert_banks(n=10)
#     vpa_ids = insert_vpa(bank_ids, n=10)
#     mf_ids = insert_mf(n=10)
#     firmware_ids = insert_firmware(mf_ids, n=10)
#     model_ids = insert_model(mf_ids, firmware_ids, n=10)
#     device_ids = insert_devices(mf_ids, firmware_ids, model_ids, n=10)
#     branch_ids = insert_branches(bank_ids, n=10)
#     merchant_ids = insert_merchants(branch_ids, n=10)
#     insert_sb(vpa_ids, merchant_ids, device_ids, bank_ids, branch_ids, n=10)
    
#     conn.commit()  # Commit all transactions if everything is successful
#     print("Data inserted successfully.")
# except Exception as e:
#     conn.rollback()  # Rollback if there's an error
#     print(f"Error: {e}")
# finally:
#     conn.close()  # Close the database connection
