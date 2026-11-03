from faker import Faker
import random

def store_queries_to_file(num_rows):
    filename = 'queries.txt'

    fake = Faker()
    rrn_set = set()

    with open(filename, 'w') as f:
        query_base = """
        INSERT INTO registry.plog (rrn, imei, txnamt, status)
        VALUES
        """
        values_list = []

        for i in range(num_rows):
            # Generate unique RRN
            rrn = rrn = f"RRN{i+4000001}"
            # Generate dummy IMEI
            imei = 'tester_imei1'

            # Generate random transaction amount
            txnamt = random.randint(10, 5000)

            # Constant status
            status = 'RECEIVED_ACK_FROM_DEVICE'

            values_list.append(f"('{rrn}', '{imei}', {txnamt}, '{status}')")

        query_values = ",\n".join(values_list)
        final_query = query_base + query_values + ";"

        f.write(final_query + "\n")

# Generate 10 rows
store_queries_to_file(200000)
