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
    dnames = set()
    mfid_list = [20]
    fid_list = [60]
    mdid_list = [34]

    # Insert rows
    for i in range(num_rows):
        # Generate a unique device name
        dname = 'device_'+''+str(i)
        dnames.add(dname)
        did = i+1
        
        # Select random values for mfid, fid, and mdid
        mfid = fake.random.choice(mfid_list)
        fid = fake.random.choice(fid_list)
        mdid = fake.random.choice(mdid_list)

        # Insert query
        query = """
        INSERT INTO registry.devices (did,dname, mfid, fid, mdid, devt, eid, eby)
        VALUES (%s,%s, %s, %s, %s, %s, %s, %s);
        """
        cursor.execute(query, (did,dname, mfid, fid, mdid, 'DEVICE_ONBOARDED', 1, 1))

    # Commit and close
    conn.commit()
    cursor.close()
    conn.close()

insert_devices(200)  # Inserts 100 rows into the table
