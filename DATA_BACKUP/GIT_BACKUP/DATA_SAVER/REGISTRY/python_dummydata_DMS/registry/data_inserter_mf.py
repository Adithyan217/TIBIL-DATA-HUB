import psycopg2
from faker import Faker

def insert_devices(num_rows):
    # Database connection setup
    conn = psycopg2.connect(
        dbname="dms-db",
        user="postgres",
        password="tibil2024",
        host="dms-db.c1asoyckgmlk.ap-south-1.rds.amazonaws.com",
        port="5432"
    )
    cursor = conn.cursor()

    # Data generation setup
    fake = Faker()
    mfnames = set()

    # Insert rows
    for i in range(num_rows):
        # Generate a unique device name
        mfname = 'mf_'+''+str(i)
        mfnames.add(mfname)
        mfaddr=fake.address()
        mfinfo='{"name": "john", "phno": "+123456789012", "email": "abc@gmail.com"}'

        # Insert query
        query = """
        INSERT INTO registry.mf (mfname, mfaddr, mfinfo,mfevt, eid, eby)
        VALUES (%s, %s, %s, %s, %s, %s);
        """
        cursor.execute(query, (mfname, mfaddr, mfinfo, 'MF_ONBOARDED', 1, 1))

    # Commit and close
    conn.commit()
    cursor.close()
    conn.close()

insert_devices(20)  # Inserts 100 rows into the table
