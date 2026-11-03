import psycopg2
from faker import Faker

def store_queries_to_file(num_rows):
    filename = 'VERSION_1(storege)/python_dummydata_DMS/datastore/queries.txt'

    # Data generation setup
    fake = Faker()
    bid_list = [1]

    with open(filename, 'w') as f:
        query_base = """
        INSERT INTO registry.banks (bid,bname, binfo, baddr, bevt, eid, eby)
        VALUES
        """
        values_list = []

        for i in range(num_rows):
            bid = i + 1
            bname = 'bank_' + str(i + 1)
            binfo = '{"name": "suresh", "phno": "+123456789012", "email": "abc@gmail.com"}'
            baddr = 'Banglore'
            
            values_list.append(f"({bid},'{bname}', '{binfo}', '{baddr}', 'BANK_ONBOARDED', 1, 1)")

        query_values = ",\n".join(values_list)

        final_query = query_base + query_values + ";"

        f.write(final_query + "\n")

store_queries_to_file(5)  
