import os
import psycopg2
from faker import Faker

def store_queries_to_file(num_rows):
    filename = '/home/adithyan/adithyan/DATA_BACKUP/GIT_BACKUP/DATA_SAVER/REGISTRY/python_dummydata_DMS/datastore/queries.txt'

    fake = Faker()
    bid_list = [1]

    with open(filename, 'w') as f:
        query_base = """
        INSERT INTO registry.vpa (vid,vpa, bid,did, vevt, eid, eby)
        VALUES
        """
        
        values_list = []

        for i in range(num_rows):
            vid=i+1
            vpa = 'vpa@aqz' + str(i + 1)
            bid = 1
            did = i+1
            values_list.append(f"({vid},'{vpa}', {bid}, {did},'VPA_ONBOARDED', 1, 1)")

        query_values = ",\n".join(values_list)
        final_query = query_base + query_values + ";"

        f.write(final_query + "\n")

store_queries_to_file(1000)
