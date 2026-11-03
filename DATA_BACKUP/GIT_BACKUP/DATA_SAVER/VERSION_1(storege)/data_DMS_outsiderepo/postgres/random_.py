# import psycopg2
# import random
# from psycopg2 import sql
# from datetime import datetime

# # Database connection configuration
# db_config = {
#     "dbname": "DMS",
#     "user": "postgres",
#     "password": "tibil123",
#     "host": "localhost",
#     "port": "5432"
# }

# # Connect to the PostgreSQL database
# try:
#     conn = psycopg2.connect(**db_config)
#     conn.autocommit = True
#     cursor = conn.cursor()
#     print("Database connection established.")
# except Exception as e:
#     print(f"Error connecting to the database: {e}")
#     exit()

# # Random data generation functions for various types of columns
# def random_enum(enum_type):
#     enums = {
#         'dmsr.vevts': ['VPA_GENERATED', 'VPA_DEACTIVATED'],
#         'dmsr.mfevts': ['MF_ONBOARDED', 'MF_DEACTIVATED'],
#         'dmsr.devts': ['DEVICE_ONBOARDED', 'DEVICE_DEACTIVATED'],
#         'dmsr.mevts': ['MERCHANT_ONBOARDED', 'MERCHANT_DEACTIVATED'],
#         'dmsr.bevts': ['BANK_ONBOARDED', 'BANK_DEACTIVATED'],
#         'dmsr.brevts': ['BRANCH_ONBOARDED', 'BRANCH_DEACTIVATED'],
#         'dmsr.frevts': ['FIRMWARE_CREATED', 'FIRMWARE_DELETED'],
#         'dmsr.mdevts': ['MODEL_CREATED', 'MODEL_DELETED'],
#         'dmsr.sbevts': [
#             'VPA_DEVICE_BOUND', 'VPA_DEVICE_UNBOUND', 'ALLOCATED_TO_MERCHANT',
#             'REALLOCATED_TO_MERCHANT', 'ALLOCATED_TO_BRANCH', 'REALLOCATED_TO_BRANCH',
#             'ALLOCATED_TO_BANK', 'REALLOCATED_TO_BANK', 'DELIVERY_INITIATED',
#             'DELIVERY_ACKNOWLEDGED', 'DEVICE_RETURNED', 'ISSUE_REPORTED'
#         ],
#         'dmsr.tevts': ['CREATED', 'UPDATED', 'DELETED']
#     }
#     return random.choice(enums[enum_type])

# # Insert sample data for banks, mf, and vpa tables
# def insert_banks():
#     for _ in range(100):
#         query = sql.SQL("INSERT INTO dmsr.banks (bcode, bname, bevt, eid, isd, eby) VALUES (%s, %s, %s, %s, %s, %s)")
#         data = (f"B{random.randint(100, 999)}", f"Bank_{random.randint(100, 999)}", random_enum('dmsr.bevts'), random.randint(1, 10), False, random.randint(1, 100))
#         cursor.execute(query, data)

# def insert_vpa():
#     for _ in range(100):
#         query = sql.SQL("INSERT INTO dmsr.vpa (vpa, bid, vevt, eid, eby, isd) VALUES (%s, %s, %s, %s, %s, %s)")
#         data = (f"vpa{random.randint(1000, 9999)}@example.com", random.randint(1, 10), random_enum('dmsr.vevts'), random.randint(1, 10), random.randint(1, 100), False)
#         cursor.execute(query, data)

# def insert_mf():
#     for _ in range(100):
#         query = sql.SQL("INSERT INTO dmsr.mf (mfname, mfevt, eid, eby, isd) VALUES (%s, %s, %s, %s, %s)")
#         data = (f"MF_{random.randint(1000, 9999)}", random_enum('dmsr.mfevts'), random.randint(1, 10), random.randint(1, 100), False)
#         cursor.execute(query, data)

# # Insert sample data for remaining tables
# def insert_firmware():
#     for _ in range(100):
#         query = sql.SQL("INSERT INTO dmsr.firmware (mfid, fdesc, frevt, eid, eby, isd) VALUES (%s, %s, %s, %s, %s, %s)")
#         data = (random.randint(1, 10), '{"version": "1.0.0"}', random_enum('dmsr.frevts'), random.randint(1, 10), random.randint(1, 100), False)
#         cursor.execute(query, data)

# # def insert_model():
# #     for _ in range(100):
# #         query = sql.SQL("INSERT INTO dmsr.model (mfid, fid, eid, mdesc, mevt, eby, isd) VALUES (%s, %s, %s, %s, %s, %s, %s)")
# #         data = (random.randint(1, 10), random.randint(1, 10), random.randint(1, 10), f"Model_{random.randint(100, 999)}", random_enum('dmsr.mevts'), random.randint(1, 100), False)
# #         cursor.execute(query, data)

# def insert_devices():
#     for _ in range(100):
#         query = sql.SQL("INSERT INTO dmsr.devices (dname, mfid, fid, mdid, devt, eid, eby, isd) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)")
#         data = (f"Device_{random.randint(100, 999)}", random.randint(1, 10), random.randint(1, 10), random.randint(1, 10), random_enum('dmsr.devts'), random.randint(1, 10), random.randint(1, 100), False)
#         cursor.execute(query, data)

# # def insert_branches():
# #     for _ in range(100):
# #         query = sql.SQL("INSERT INTO dmsr.branches (brname, braddr, bid, brevt, eid, eby, isd) VALUES (%s, %s, %s, %s, %s, %s, %s)")
# #         data = (f"Branch_{random.randint(100, 999)}", f"Address_{random.randint(1, 100)}", random.randint(1, 10), random_enum('dmsr.brevts'), random.randint(1, 10), random.randint(1, 100), False)
# #         cursor.execute(query, data)
# #
# # def insert_merchants():
# #     for _ in range(100):
# #         query = sql.SQL("INSERT INTO dmsr.merchants (mid, msid, mname, minfo, mevt, eid, brid, eby, isd) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)")
# #         data = (random.randint(1, 1000), random.randint(1, 100), f"Merchant_{random.randint(100, 999)}", '{"info": "sample"}', random_enum('dmsr.mevts'), random.randint(1, 10), random.randint(1, 10), random.randint(1, 100), False)
# #         cursor.execute(query, data)

# def insert_sb():
#     for _ in range(100):
#         query = sql.SQL("INSERT INTO dmsr.sb (vid, mid, did, bid, brid, sbevt, eid, eby, isd) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)")
#         data = (random.randint(1, 10), random.randint(1, 10), random.randint(1, 10), random.randint(1, 10), random.randint(1, 10), random_enum('dmsr.sbevts'), random.randint(1, 10), random.randint(1, 100), False)
#         cursor.execute(query, data)


# def fetch_valid_ids():
#     ids = {}
#     try:
#         # Fetch bank IDs for branches and merchants
#         cursor.execute("SELECT bid FROM dmsr.banks")
#         ids['bank_ids'] = [row[0] for row in cursor.fetchall()]

#         # Fetch firmware IDs for model table
#         cursor.execute("SELECT fid FROM dmsr.firmware")
#         ids['firmware_ids'] = [row[0] for row in cursor.fetchall()]

#         # Fetch manufacturer IDs for firmware and model tables
#         cursor.execute("SELECT mfid FROM dmsr.mf")
#         ids['manufacturer_ids'] = [row[0] for row in cursor.fetchall()]

#         # Fetch branch IDs for merchants
#         cursor.execute("SELECT brid FROM dmsr.branches")
#         ids['branch_ids'] = [row[0] for row in cursor.fetchall()]

#         print("Fetched valid foreign key IDs.")
#     except Exception as e:
#         print(f"Error fetching foreign key IDs: {e}")
#     return ids


# # Insert sample data for the tables
# def insert_branches(bank_ids):
#     for _ in range(100):
#         query = sql.SQL(
#             "INSERT INTO dmsr.branches (brname, braddr, bid, brevt, eid, eby, isd) VALUES (%s, %s, %s, %s, %s, %s, %s)")
#         data = (
#             f"Branch_{random.randint(100, 999)}",
#             f"Address_{random.randint(1, 100)}",
#             random.choice(bank_ids),
#             random_enum('dmsr.brevts'),
#             random.randint(1, 10),
#             random.randint(1, 100),
#             False
#         )
#         cursor.execute(query, data)


# def insert_merchants(branch_ids):
#     for _ in range(100):
#         query = sql.SQL(
#             "INSERT INTO dmsr.merchants (mid, msid, mname, minfo, mevt, eid, brid, eby, isd) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)")
#         data = (
#             random.randint(1, 1000),
#             random.randint(1, 100),
#             f"Merchant_{random.randint(100, 999)}",
#             '{"info": "sample"}',
#             random_enum('dmsr.mevts'),
#             random.randint(1, 10),
#             random.choice(branch_ids),
#             random.randint(1, 100),
#             False
#         )
#         cursor.execute(query, data)


# def insert_model(manufacturer_ids, firmware_ids):
#     for _ in range(100):
#         query = sql.SQL(
#             "INSERT INTO dmsr.model (mfid, fid, eid, mdesc, mevt, eby, isd) VALUES (%s, %s, %s, %s, %s, %s, %s)")
#         data = (
#             random.choice(manufacturer_ids),
#             random.choice(firmware_ids),
#             random.randint(1, 10),
#             f"Model_{random.randint(100, 999)}",
#             random_enum('dmsr.mdevts'),
#             random.randint(1, 100),
#             False
#         )
#         cursor.execute(query, data)


# # Run the insertion process
# try:
#     valid_ids = fetch_valid_ids()

#     # Insert into tables with foreign key dependencies
#     insert_branches(valid_ids['bank_ids'])
#     insert_merchants(valid_ids['branch_ids'])
#     insert_model(valid_ids['manufacturer_ids'], valid_ids['firmware_ids'])

#     print("Data insertion for branches, merchants, and model completed.")
# except Exception as e:
#     print(f"Error inserting data: {e}")

# # Execute insert functions
# try:
#     insert_banks()
#     insert_vpa()
#     insert_mf()
#     insert_firmware()
#     insert_model()
#     insert_devices()
#     insert_branches()
#     insert_merchants()
#     insert_sb()
#     print("Data insertion completed.")
# except Exception as e:
#     print(f"Error inserting data: {e}")


# # Close the database connection
# cursor.close()
# conn.close()
# print("Database connection closed.")




import psycopg2
import random
from psycopg2 import sql
from datetime import datetime

# Database connection configuration
db_config = {
    "dbname": "DMS",
    "user": "postgres",
    "password": "tibil123",
    "host": "localhost",
    "port": "5432"
}

# Connect to the PostgreSQL database
try:
    conn = psycopg2.connect(**db_config)
    conn.autocommit = True
    cursor = conn.cursor()
    print("Database connection established.")
except Exception as e:
    print(f"Error connecting to the database: {e}")
    exit()


# Random data generation functions for various types of columns
def random_enum(enum_type):
    enums = {
        'dmsr.vevts': ['VPA_GENERATED', 'VPA_DEACTIVATED'],
        'dmsr.mfevts': ['MF_ONBOARDED', 'MF_DEACTIVATED'],
        'dmsr.devts': ['DEVICE_ONBOARDED', 'DEVICE_DEACTIVATED'],
        'dmsr.mevts': ['MERCHANT_ONBOARDED', 'MERCHANT_DEACTIVATED'],
        'dmsr.bevts': ['BANK_ONBOARDED', 'BANK_DEACTIVATED'],
        'dmsr.brevts': ['BRANCH_ONBOARDED', 'BRANCH_DEACTIVATED'],
        'dmsr.frevts': ['FIRMWARE_CREATED', 'FIRMWARE_DELETED'],
        'dmsr.mdevts': ['MODEL_CREATED', 'MODEL_DELETED'],
        'dmsr.sbevts': [
            'VPA_DEVICE_BOUND', 'VPA_DEVICE_UNBOUND', 'ALLOCATED_TO_MERCHANT',
            'REALLOCATED_TO_MERCHANT', 'ALLOCATED_TO_BRANCH', 'REALLOCATED_TO_BRANCH',
            'ALLOCATED_TO_BANK', 'REALLOCATED_TO_BANK', 'DELIVERY_INITIATED',
            'DELIVERY_ACKNOWLEDGED', 'DEVICE_RETURNED', 'ISSUE_REPORTED'
        ],
        'dmsr.tevts': ['CREATED', 'UPDATED', 'DELETED']
    }
    return random.choice(enums[enum_type])


# Insert sample data for various tables
def insert_banks():
    for _ in range(100):
        query = sql.SQL("INSERT INTO dmsr.banks (bcode, bname, bevt, eid, isd, eby) VALUES (%s, %s, %s, %s, %s, %s)")
        data = (f"B{random.randint(100, 999)}", f"Bank_{random.randint(100, 999)}", random_enum('dmsr.bevts'),
                random.randint(1, 10), False, random.randint(1, 100))
        cursor.execute(query, data)


def insert_vpa():
    for _ in range(100):
        query = sql.SQL("INSERT INTO dmsr.vpa (vpa, bid, vevt, eid, eby, isd) VALUES (%s, %s, %s, %s, %s, %s)")
        data = (f"vpa{random.randint(1000, 9999)}@example.com", random.randint(1, 10), random_enum('dmsr.vevts'),
                random.randint(1, 10), random.randint(1, 100), False)
        cursor.execute(query, data)


def insert_mf():
    for _ in range(100):
        query = sql.SQL("INSERT INTO dmsr.mf (mfname, mfevt, eid, eby, isd) VALUES (%s, %s, %s, %s, %s)")
        data = (
        f"MF_{random.randint(1000, 9999)}", random_enum('dmsr.mfevts'), random.randint(1, 10), random.randint(1, 100),
        False)
        cursor.execute(query, data)


def insert_firmware():
    for _ in range(100):
        query = sql.SQL("INSERT INTO dmsr.firmware (mfid, fdesc, frevt, eid, eby, isd) VALUES (%s, %s, %s, %s, %s, %s)")
        data = (random.randint(1, 10), '{"version": "1.0.0"}', random_enum('dmsr.frevts'), random.randint(1, 10),
                random.randint(1, 100), False)
        cursor.execute(query, data)


def insert_devices():
    for _ in range(100):
        query = sql.SQL(
            "INSERT INTO dmsr.devices (dname, mfid, fid, mdid, devt, eid, eby, isd) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)")
        data = (
        f"Device_{random.randint(100, 999)}", random.randint(1, 10), random.randint(1, 10), random.randint(1, 10),
        random_enum('dmsr.devts'), random.randint(1, 10), random.randint(1, 100), False)
        cursor.execute(query, data)


def insert_sb():
    for _ in range(100):
        query = sql.SQL(
            "INSERT INTO dmsr.sb (vid, mid, did, bid, brid, sbevt, eid, eby, isd) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)")
        data = (random.randint(1, 10), random.randint(1, 10), random.randint(1, 10), random.randint(1, 10),
                random.randint(1, 10), random_enum('dmsr.sbevts'), random.randint(1, 10), random.randint(1, 100), False)
        cursor.execute(query, data)


# Helper function to fetch valid foreign key IDs
def fetch_valid_ids():
    ids = {}
    try:
        cursor.execute("SELECT bid FROM dmsr.banks")
        ids['bank_ids'] = [row[0] for row in cursor.fetchall()]

        cursor.execute("SELECT fid FROM dmsr.firmware")
        ids['firmware_ids'] = [row[0] for row in cursor.fetchall()]

        cursor.execute("SELECT mfid FROM dmsr.mf")
        ids['manufacturer_ids'] = [row[0] for row in cursor.fetchall()]

        cursor.execute("SELECT brid FROM dmsr.branches")
        ids['branch_ids'] = [row[0] for row in cursor.fetchall()]

        print("Fetched valid foreign key IDs.")
    except Exception as e:
        print(f"Error fetching foreign key IDs: {e}")
    return ids


# Insert data for tables with foreign key dependencies
def insert_branches(bank_ids):
    for _ in range(100):
        query = sql.SQL(
            "INSERT INTO dmsr.branches (brname, braddr, bid, brevt, eid, eby, isd) VALUES (%s, %s, %s, %s, %s, %s, %s)")
        data = (f"Branch_{random.randint(100, 999)}", f"Address_{random.randint(1, 100)}", random.choice(bank_ids),
                random_enum('dmsr.brevts'), random.randint(1, 10), random.randint(1, 100), False)
        cursor.execute(query, data)


def insert_merchants(branch_ids):
    for _ in range(100):
        query = sql.SQL(
            "INSERT INTO dmsr.merchants (mid, msid, mname, minfo, mevt, eid, brid, eby, isd) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)")
        data = (
        random.randint(1, 1000), random.randint(1, 100), f"Merchant_{random.randint(100, 999)}", '{"info": "sample"}',
        random_enum('dmsr.mevts'), random.randint(1, 10), random.choice(branch_ids), random.randint(1, 100), False)
        cursor.execute(query, data)


def insert_model(manufacturer_ids, firmware_ids):
    for _ in range(100):
        query = sql.SQL(
            "INSERT INTO dmsr.model (mfid, fid, eid, mdesc, mevt, eby, isd) VALUES (%s, %s, %s, %s, %s, %s, %s)")
        data = (random.choice(manufacturer_ids), random.choice(firmware_ids), random.randint(1, 10),
                f"Model_{random.randint(100, 999)}", random_enum('dmsr.mdevts'), random.randint(1, 100), False)
        cursor.execute(query, data)


# Execute data insertion
try:
    valid_ids = fetch_valid_ids()

    insert_banks()
    insert_vpa()
    insert_mf()
    insert_firmware()
    insert_branches(valid_ids['bank_ids'])
    insert_merchants(valid_ids['branch_ids'])
    insert_model(valid_ids['manufacturer_ids'], valid_ids['firmware_ids'])
    insert_devices()
    insert_sb()

    print("Data insertion completed successfully.")
except Exception as e:
    print(f"Error inserting data: {e}")
finally:
    cursor.close()
    conn.close()
    print("Database connection closed.")