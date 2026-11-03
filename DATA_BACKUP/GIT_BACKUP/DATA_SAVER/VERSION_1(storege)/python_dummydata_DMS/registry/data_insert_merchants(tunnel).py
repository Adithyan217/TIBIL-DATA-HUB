import psycopg2
from faker import Faker

def store_queries_to_file(num_rows):
    filename = 'VERSION_1(storege)/python_dummydata_DMS/datastore/queries.txt'

    # Data generation setup
    fake = Faker()
    mnames = set()
    bid_list = [1]

    with open(filename, 'w') as f:
        query_base = """
        INSERT INTO registry.merchants (mpid,mname, minfo, msid, bid, brid, mevt, eid, eby)
        VALUES
        """
        values_list = []

        for i in range(num_rows):
            mid= i +31
            mname = 'merchant_' + str(i + 31)
            mnames.add(mname)
            minfo = '{"accNo": 12345678 , "phno": "+123456789012", "accHolderName": "abc@gm"}'
            msid = fake.random.randint(100, 9999)
            brid = 12
            bid = 2
            
            values_list.append(f"({mid},'{mname}', '{minfo}', {msid}, {bid}, {brid}, 'MERCHANT_ONBOARDED', 1, 1)")

        query_values = ",\n".join(values_list)

        final_query = query_base + query_values + ";"

        f.write(final_query + "\n")

store_queries_to_file(10)  
