from datetime import datetime, timedelta
import random

def generate_insert_sql(start_device, end_device, output_file):
    values = []
    for device_index in range(start_device, end_device + 1):
        imei = f'tester_imei{device_index}'
        for day_offset in range(30):
            cat = (datetime.now() - timedelta(days=day_offset)).strftime('%Y-%m-%d 00:00:00')
            for i in range(25):
                rrn = f'RRN_{device_index}_{day_offset}_{i}'
                txnamt = random.randint(10, 5000)
                status = 'RECEIVED_ACK_FROM_DEVICE'
                ack_status = 'success'
                values.append(f"('{rrn}', '{imei}', {txnamt}, '{cat}', '{status}', '{ack_status}')")

    sql_prefix = "INSERT INTO registry.plog (rrn, imei, txnamt, cat, status, ack_status) VALUES\n"
    sql_body = ",\n".join(values) + ";"
    with open(output_file, "w") as f:
        f.write(sql_prefix + sql_body)

    print(f"✅ Saved SQL insert for IMEI {start_device} to {end_device} → {output_file}")

# Example: Generate first chunk (IMEI 101 to 400)
generate_insert_sql(2001, 2200, "INTELMS/intel_func_test/insert_chunk_1.sql")
generate_insert_sql(2201, 2400, "INTELMS/intel_func_test/insert_chunk_2.sql")
generate_insert_sql(2401, 2600, "INTELMS/intel_func_test/insert_chunk_3.sql")
generate_insert_sql(2601, 2800, "INTELMS/intel_func_test/insert_chunk_4.sql")
generate_insert_sql(2801, 3000, "INTELMS/intel_func_test/insert_chunk_5.sql")
