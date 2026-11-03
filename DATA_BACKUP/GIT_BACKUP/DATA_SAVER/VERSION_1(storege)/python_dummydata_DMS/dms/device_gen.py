import psycopg2
from faker import Faker

def store_queries_to_file(num_rows):
    filename = '/home/adithyan/adithyan/DATA_BACKUP/GIT_BACKUP/DATA_SAVER/python_dummydata_DMS/datastore/drouterdevice.txt'

    with open(filename, 'w') as f:
        query_base = """
        INSERT INTO registry.sbroutes (rid, did)
        VALUES
        """
        values_list = []

        for i in range(num_rows):
            did = i + 200001
            rid = 1
            
            values_list.append(f"({rid}, {did})")

        query_values = ",\n".join(values_list)

        final_query = query_base + query_values + ";"

        f.write(final_query + "\n")

store_queries_to_file(100000)  
