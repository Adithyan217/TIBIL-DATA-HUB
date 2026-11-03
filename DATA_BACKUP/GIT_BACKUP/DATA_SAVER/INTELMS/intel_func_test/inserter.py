import psycopg2
from faker import Faker
import random
from datetime import datetime, timedelta

def insert_data(num_devices):
    # Database connection setup
    conn = psycopg2.connect(
        dbname="uatDMSdb",
        user="uat_dms",
        password="UATdmsdb",
        host="localhost",
        port="6543"
    )
    cursor = conn.cursor()
    for device_index in range(1,num_devices+1):
        imei = f'tester_imei{device_index+100}'

        for day_offset in range(30):  # From today to 29 days ago
            date = datetime.now() - timedelta(days=day_offset)
            cat = date # Store only the date part in `cat`

            for i in range(25):  # 25 rows per day
                rrn = f'RRN_{device_index+100}_{day_offset}_{i}'
                txnamt = random.randint(10, 5000)
                status = 'RECEIVED_ACK_FROM_DEVICE'
                ack_status = 'success'

                query = """
                INSERT INTO registry.plog (rrn, imei, txnamt, cat, status, ack_status)
                VALUES (%s, %s, %s, %s, %s, %s);
                """
                cursor.execute(query, (rrn, imei, txnamt, cat, status, ack_status))

            print(f"Inserted 25 logs for device {imei} on date {cat.strftime('%Y-%m-%d')}")


    conn.commit()
    cursor.close()
    conn.close()

insert_data(100)
