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
    brnames = set()
    bid_list = [111481]


    # Insert rows
    for i in range(num_rows):
        # Generate a unique device name
        brname = 'branch_'+str(i+40)
        brnames.add(brname)
        braddr=fake.address()
        brinfo='{"name": "john", "phno": "+123456789012", "email": "abc@gmail.com"}'

        # Select random values for mfid, fid, and mdid
        bid = fake.random.choice(bid_list)

        # Insert query
        query = """
        INSERT INTO registry.branches (brname, braddr, brinfo,bid,brevt, eid, eby)
        VALUES (%s, %s, %s, %s, %s, %s,%s);
        """
        cursor.execute(query, (brname, braddr, brinfo,bid, 'BRANCH_ONBOARDED', 1, 1))

    # Commit and close
    conn.commit()
    cursor.close()
    conn.close()

insert_devices(20)  # Inserts 100 rows into the table
