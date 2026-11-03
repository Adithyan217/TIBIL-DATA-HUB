import psycopg2
from faker import Faker

def store_queries_to_file(num_rows):
    filename = 'VERSION_1(storege)/python_dummydata_DMS/datastore/queries.txt'



    with open(filename, 'w') as f:
        query_base = """
        INSERT INTO registry.upermissions (username)
        VALUES
        """
        values_list = []

        for i in range(num_rows):

            
            values_list.append(f"()")

        query_values = ",\n".join(values_list)

        final_query = query_base + query_values + ";"

        f.write(final_query + "\n")

store_queries_to_file(100)  
