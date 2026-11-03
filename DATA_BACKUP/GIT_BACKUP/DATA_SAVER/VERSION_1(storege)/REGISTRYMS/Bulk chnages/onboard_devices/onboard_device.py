def generate_sql_query(count):
    sql_query = "EXPLAIN ANALYZE\nSELECT * FROM registry.onboard_device(\n"
    
    # Static parameters
    sql_query += "    'allocated',\n"
    sql_query += "    'allocate_to_merchant',\n"
    
    # Generate the required arrays dynamically
    sql_query += f"    ARRAY[{', '.join(map(str, range(1, count + 1)))}]::INT[],\n"
    sql_query += f"    ARRAY[{', '.join([repr('mf_1') for _ in range(count)])}]::TEXT[],\n"
    sql_query += f"    ARRAY[{', '.join([repr(f'device_{i}') for i in range(1, count + 1)])}]::TEXT[],\n"
    sql_query += f"    ARRAY[{', '.join([repr('model_1') for _ in range(count)])}]::TEXT[],\n"
    sql_query += f"    ARRAY[{', '.join([repr('firmware_1') for _ in range(count)])}]::TEXT[],\n"
    sql_query += f"    ARRAY[{', '.join([repr(f'123456789abc{i}') for i in range(1, count + 1)])}]::TEXT[],\n"
    sql_query += f"    ARRAY[{', '.join([repr(f'vpa@aqz{i}') for i in range(1, count + 1)])}]::TEXT[],\n"
    sql_query += f"    ARRAY[{', '.join([repr('bank_1') for _ in range(count)])}]::TEXT[],\n"
    sql_query += f"    ARRAY[{', '.join([repr('branch_1') for _ in range(count)])}]::TEXT[],\n"
    sql_query += f"    ARRAY[{', '.join([repr(f'merchant_{i}') for i in range(1, count + 1)])}]::TEXT[],\n"
    sql_query += f"    ARRAY[{', '.join([repr('abc') for _ in range(count)])}]::TEXT[],\n"
    sql_query += f"    ARRAY[{', '.join(['1111' for _ in range(count)])}]::INT[]\n"
    sql_query += ");\n"

    return sql_query

# Example usage:
sql_query = generate_sql_query(100)
# print(sql_query)

# Save to file
with open("/home/adithyan/adithyan/DATA_BACKUP/GIT_BACKUP/DATA_SAVER/Bulk chnages/onboard_devices/output_data/data", "w") as file:
    file.write(sql_query)
