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
    bnames = set()

    # Insert rows
    for i in range(num_rows):
        # Generate a unique device name
        bname = 'bank_'+''+str(i)
        bnames.add(bname)
        baddr=fake.address()
        binfo='{"name": "john", "phno": "+123456789012", "email": "abc@gmail.com"}'

        # Insert query
        query = """
        INSERT INTO registry.banks (bname, baddr, binfo,bevt, eid, eby)
        VALUES (%s, %s, %s, %s, %s, %s);
        """
        cursor.execute(query, (bname, baddr, binfo, 'BANK_ONBOARDED', 1, 1))

    # Commit and close
    conn.commit()
    cursor.close()
    conn.close()

insert_devices(20)  # Inserts 100 rows into the table
