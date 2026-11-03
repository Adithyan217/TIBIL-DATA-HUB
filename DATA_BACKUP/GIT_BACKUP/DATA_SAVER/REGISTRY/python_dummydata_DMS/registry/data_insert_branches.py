import psycopg2
from faker import Faker

def insert_devices(num_rows):
    # Database connection setup
    conn = psycopg2.connect(
        dbname="sandboxdmsdb",
        user="postgres",
        password="tibil123",
        host="localhost",
        port="5432"
    )
    cursor = conn.cursor()

    # Data generation setup
    fake = Faker()
    # brnames = set()


    # Insert rows
    for i in range(num_rows):
        # Generate a unique device name
        brid = i + 90090 +1
        brname = 'tester_branch'+str(i+90+1)
        # brnames.add(brname)
        braddr=fake.address()
        brinfo='{"name": "john", "phno": "+123456789012", "email": "abc@gmail.com"}'

        # Select random values for mfid, fid, and mdid
        bid = 90010

        # Insert query
        query = """
        INSERT INTO registry.branches (brid,brname, braddr, brinfo,bid,brevt, eid, eby)
        VALUES (%s, %s, %s, %s, %s, %s,%s, %s);
        """
        cursor.execute(query, (brid,brname, braddr, brinfo,bid, 'BRANCH_ONBOARDED', 99999, 'tester'))

    # Commit and close
    conn.commit()
    cursor.close()
    conn.close()

insert_devices(10)  # Inserts 100 rows into the table
