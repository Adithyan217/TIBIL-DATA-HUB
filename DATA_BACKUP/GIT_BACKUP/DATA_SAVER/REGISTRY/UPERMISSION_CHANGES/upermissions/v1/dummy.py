import psycopg2
from faker import Faker

def store_queries_to_file(num_rows):
    filename = 'REGISTRY/upermissions/quries.txt'



    with open(filename, 'w') as f:
        query_base = """
        INSERT INTO registry.upermissions (username,context,context_id)
        VALUES
        """
        values_list = []

        for i in range(num_rows):
            username = 'bankadmin2@gmail.com'
            context = 'BANK'
            # context = 'BRANCH'
            # context = 'MERCHANT'

            context_id = i+1
            values_list.append(f"('{username}','{context}',{context_id})")

        query_values = ",\n".join(values_list)

        final_query = query_base + query_values + ";"

        f.write(final_query + "\n")

store_queries_to_file(1)  
