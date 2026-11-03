import psycopg2
from faker import Faker

def store_queries_to_file(num_rows):
    filename = '/home/adithyan/adithyan/DATA_BACKUP/GIT_BACKUP/DATA_SAVER/python_dummydata_DMS/datastore/queries.txt'

    # Data generation setup
    fake = Faker()
    mnames = set()
    bid_list = [1]

    with open(filename, 'w') as f:
        query_base = """
        INSERT INTO registry.merchants (mpid, mname, minfo, msid, bid, brid, mevt, eid, eby)
        VALUES
        """
        values_list = []

        for i in range(num_rows):

            final_query = "data"

        f.write(final_query + "\n")

store_queries_to_file(100000)  
