import psycopg2
from faker import Faker

def store_queries_to_file(num_rows):
    filename = 'VERSION_1(storege)/python_dummydata_DMS/datastore/queries.txt'


    fake = Faker()
    mfid_list = [1]
    fid_list = [1]
    mdid_list = [1]

    with open(filename, 'w') as f:
        query_base = """
        INSERT INTO registry.devices (did,dname,imei, mfid, fid, mdid, devt, eid, eby)
        VALUES
        """
        
        values_list = []

        for i in range(num_rows):
            did=i+1
            dname = 'device_' + str(i+1)
            imei = '123' + str(i+1)
            mfid = fake.random.choice(mfid_list)
            fid = fake.random.choice(fid_list)
            mdid = fake.random.choice(mdid_list)
            values_list.append(f"({did},'{dname}','{imei}', {mfid}, {fid}, {mdid}, 'DEVICE_ONBOARDED', 1, 1)")

        query_values = ",\n".join(values_list)
        final_query = query_base + query_values + ";"

        f.write(final_query + "\n")

store_queries_to_file(100)
