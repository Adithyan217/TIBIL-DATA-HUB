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
    fnames = set()
    mfid_list = [20]

    # Insert rows
    for i in range(num_rows):
        # Generate a unique device name
        fname = 'firmware_'+str(i)
        fnames.add(fname)
        
        # Select random values for mfid, fid, and mdid
        mfid = fake.random.choice(mfid_list)


        # Insert query
        query = """
        INSERT INTO registry.firmware (fname, mfid, frevt, eid, eby)
        VALUES (%s, %s, %s, %s, %s);
        """
        cursor.execute(query, (fname, mfid, 'FIRMWARE_ONBOARDED', 1, 1))

    # Commit and close
    conn.commit()
    cursor.close()
    conn.close()

insert_devices(20)  # Inserts 100 rows into the table
