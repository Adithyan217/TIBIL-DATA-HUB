import psycopg2
from faker import Faker

def store_temp_recon_csv_queries(num_rows):
    filename = 'REGISTRY/python_dummydata_DMS/datastore/queries.txt'

    fake = Faker()

    with open(filename, 'w') as f:
        query_base = """
        INSERT INTO registry.temp_recon_csv (merchant_name, mobile_no, device_serial_number, acc_no)
        VALUES
        """
        
        values_list = []

        for i in range(num_rows):
            merchant_name = "merchant_" + str(i + 1)
            mobile_no = fake.msisdn()[:10]  # 10-digit mobile number
            device_serial_number = "device_" + str(i + 1)
            acc_no = f"AC{fake.random_number(digits=10, fix_len=True)}"
            
            values_list.append(f"('{merchant_name}', '{mobile_no}', '{device_serial_number}', '{acc_no}')")
        
        query_values = ",\n".join(values_list)
        final_query = query_base + query_values + ";"

        f.write(final_query + "\n")

    print(f"✅ Generated {num_rows} insert queries and saved to: {filename}")


# Example usage:
store_temp_recon_csv_queries(1000)
