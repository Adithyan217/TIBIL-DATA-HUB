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
    vpas = set()
    bid_list = [44926]
# 44925
# 44926

    # Insert rows
    for i in range(num_rows):
        # Generate a unique device name
        vpa = 'vpa@aqz'+str(i+10)
        vpas.add(vpa)
        
        # Select random values for mfid, fid, and mdid
        bid = fake.random.choice(bid_list)
      

        # Insert query
        query = """
        INSERT INTO registry.vpa (vpa, bid, vevt, eid, eby)
        VALUES (%s, %s, %s, %s, %s);
        """
        cursor.execute(query, (vpa,bid ,'VPA_ONBOARDED', 1, 1))

    # Commit and close
    conn.commit()
    cursor.close()
    conn.close()

insert_devices(10)  # Inserts 100 rows into the table
