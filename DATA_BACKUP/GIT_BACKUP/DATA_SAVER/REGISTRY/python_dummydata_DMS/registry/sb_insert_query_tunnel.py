import psycopg2
from faker import Faker

def store_queries_to_file(num_rows):
    filename = '/home/adithyan/adithyan/DATA_BACKUP/GIT_BACKUP/DATA_SAVER/python_dummydata_DMS/datastore/queries.txt'

    fake = Faker()

    with open(filename, 'w') as f:
        for i in range(num_rows):
            did = i + 1
            vid = i + 1
            bid = 1
            brid = 1
            query = f"""
            UPDATE registry.sb 
            SET vid = {vid}, bid = {bid}, brid = {brid}, sbevt = 'ALLOCATED_TO_BRANCH'
            WHERE did = {did};
            """
            f.write(query + "\n")

store_queries_to_file(50)
