import os
import psycopg2
from faker import Faker

def store_update_queries_to_file(num_rows):
    filename = '/home/aditya/adithyan/TIBIL_GIT/DATA_SAVER/python_dummydata_DMS/datastore/queries.txt'


    fake = Faker()

    with open(filename, 'w') as f:
        # Loop to generate the update queries
        for i in range(num_rows):
            vid = i +1
            mid = i +1
            brid = 1
            bid = 1
            did = i +1

            # Directly format the values into the query string
            query = f"""
            UPDATE registry.sb
            SET mid = {mid}, brid = {brid}, bid = {bid} , vid = {vid}, sbevt = 'ALLOCATED_TO_BRANCH'
            WHERE did = {did};
            """
            f.write(query + "\n")

store_update_queries_to_file(50000)
