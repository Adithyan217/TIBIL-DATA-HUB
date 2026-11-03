import psycopg2
from faker import Faker

def store_queries_to_file(num_rows):
    filename = 'REGISTRY/python_dummydata_DMS/datastore/queries.txt'

    # Data generation setup
    fake = Faker()
    bid_list = [1]

    with open(filename, 'w') as f:
        query_base = """
        INSERT INTO registry.branches (brid,brname, brinfo, braddr,bid, brevt, eid, eby)
        VALUES
        """
        values_list = []

        for i in range(num_rows):
            brid = i + 900001
            bid = 900001
            brname = 'tester_branch' + str(i + 1)
            brinfo = '{"name": "suresh", "phno": "+123456789012", "email": "abc@gmail.com"}'
            braddr = 'Banglore'
            
            values_list.append(f"({brid},'{brname}', '{brinfo}', '{braddr}',{bid}, 'BRANCH_ONBOARDED', 1, 1)")

        query_values = ",\n".join(values_list)

        final_query = query_base + query_values + ";"

        f.write(final_query + "\n")

store_queries_to_file(10)  