import json
import psycopg2
from psycopg2 import extras
import time
import psutil  # Import psutil for memory usage tracking

# Function to track memory usage
def get_memory_usage():
    process = psutil.Process()  # Get the current process
    return process.memory_info().rss  # Return memory usage in bytes

def transform_json_to_table(json_data):
    bank_names = []
    bank_addrs = []
    binfo_list = []
    event_bys = []
    eids = []
    
    event_data = json_data.get("eobj", {})
    event_by = event_data.get("event_by")
    eid = json_data.get("eid")
    
    for edetail in event_data.get("edetails", []):
        bank_names.append(edetail.get("bank_name", None))
        bank_addrs.append(edetail.get("baddr", None))
        binfo_list.append(json.dumps(edetail.get("binfo", {})))  
        event_bys.append(event_by)
        eids.append(eid)
    row_id=[i for i in range (1,len(bank_names)+1)]
    return row_id,bank_names, bank_addrs, binfo_list, event_bys, eids

def call_postgresql_function_and_get_result(row_id, bank_names, bank_addrs, binfo_list, event_bys, eids):
    conn = psycopg2.connect(
        dbname="PG_DMS",
        user="postgres",
        password="tibil123",
        host="localhost",
        port="5432"
    )
    cursor = conn.cursor()

    try:
        query = """
            SELECT * FROM dmsr.bank_iterator(
                %s::INTEGER[],
                %s::TEXT[], 
                %s::TEXT[], 
                %s::JSONB[], 
                %s::INTEGER[], 
                %s::INTEGER[]
            )
        """
        cursor.execute(query, (
            row_id,
            bank_names,  
            bank_addrs,  
            binfo_list,  
            event_bys,   
            eids         
        ))

        result = cursor.fetchone()[0]
        return result
    
    except Exception as e:
        print(f"Error: {e}")
        return "failed"
    finally:
        conn.commit()
        cursor.close()
        conn.close()

# Measure memory usage and time for processing
start_time = time.time()
start_mem = get_memory_usage()  # Start memory tracking

input_data = {
    "aid": 3,
    "alid": 28,
    "eid": 28,
    "ecode": "BANK_ONBOARDED",
    "eobj": {
        "event": "BANK_ONBOARDED",
        "event_by": 1,
        "edetails": [
            {
                "bank_name": "testsbi1",
                "baddr": "1st Main Road",
                "binfo": {
                    "name": "sbi",
                    "designation": "manager",
                    "phno": "+919876543211",
                    "email": "xyz@gmail.com"
                }
            },
            {
                "bank_name": "testsbi2",
                "baddr": "1st Main Road",
                "binfo": {
                    "name": "aaa",
                    "designation": "manager",
                    "phno": "+919876543211",
                    "email": "xyz@gmail.com"
                }
            }
        ]
    }
}

# Transform the JSON data
bank_names, bank_addrs, binfo_list, event_bys, eids = transform_json_to_table(input_data)

# Measure the time and memory used during transformation
transformation_time = time.time() - start_time  # Time taken for transformation
transformation_mem = get_memory_usage() - start_mem  # Memory used during transformation

# Print the results of the transformation
print(f"Transformation time: {transformation_time:.4f} seconds")
print(f"Transformation memory usage: {transformation_mem / (1024 ** 2):.4f} MB")  # Convert bytes to MB

# Print the transformed data
print(bank_names, bank_addrs, binfo_list, event_bys, eids)

# Call PostgreSQL function and get result
result = call_postgresql_function_and_get_result(bank_names, bank_addrs, binfo_list, event_bys, eids)

# Measure the time and memory used during the database function call
db_function_time = time.time() - (start_time + transformation_time)  # Time for function call
db_function_mem = get_memory_usage() - (start_mem + transformation_mem)  # Memory used for function call

# Print the results of the database function call
print(f"Database function call time: {db_function_time:.4f} seconds")
print(f"Database function call memory usage: {db_function_mem / (1024 ** 2):.4f} MB")  # Convert bytes to MB

# Print the final result
print(result)




# import json
# import psycopg2
# from psycopg2 import extras

# def transform_json_to_table(json_data):
#     bank_names = []
#     bank_addrs = []
#     binfo_list = []
#     event_bys = []
#     eids = []
    
#     event_data = json_data.get("eobj", {})
#     event_by = event_data.get("event_by")
#     eid = json_data.get("eid")
    
#     for edetail in event_data.get("edetails", []):
#         bank_names.append(edetail.get("bank_name", None))
#         bank_addrs.append(edetail.get("baddr", None))
#         binfo_list.append(json.dumps(edetail.get("binfo", {})))  
#         event_bys.append(event_by)
#         eids.append(eid)
    
#     return bank_names, bank_addrs, binfo_list, event_bys, eids

# def call_postgresql_function_and_get_result(bank_names, bank_addrs, binfo_list, event_bys, eids):
#     conn = psycopg2.connect(
#         dbname="PG_DMS",
#         user="postgres",
#         password="tibil123",
#         host="localhost",
#         port="5432"
#     )
#     cursor = conn.cursor()

#     try:
#         query = """
#             SELECT dmsr.bank_processor(
#                 %s::TEXT[], 
#                 %s::TEXT[], 
#                 %s::JSONB[], 
#                 %s::INTEGER[], 
#                 %s::INTEGER[]
#             )
#         """
#         cursor.execute(query, (
#             bank_names,  
#             bank_addrs,  
#             binfo_list,  
#             event_bys,   
#             eids         
            
#         ))

#         result = cursor.fetchone()[0]
#         return result
    
#     except Exception as e:
#         print(f"Error: {e}")
#         return "failed"
#     finally:
#         conn.commit()
#         cursor.close()
#         conn.close()

# input_data = {
#     "aid": 3,
#     "alid": 28,
#     "eid": 28,
#     "ecode": "BANK_ONBOARDED",
#     "eobj": {
#         "event": "BANK_ONBOARDED",
#         "event_by": 1,
#         "edetails": [
#             {
#                 "bank_name": "testsbi1",
#                 "baddr": "1st Main Road",
#                 "binfo": {
#                     "name": "sbi",
#                     "designation": "manager",
#                     "phno": "+919876543211",
#                     "email": "xyz@gmail.com"
#                 }
#             },
#             {
#                 "bank_name": "testsbi2",
#                 "baddr": "1st Main Road",
#                 "binfo": {
#                     "name": "aaa",
#                     "designation": "manager",
#                     "phno": "+919876543211",
#                     "email": "xyz@gmail.com"
#                 }
#             }
#         ]
#     }
# }

# bank_names, bank_addrs, binfo_list, event_bys, eids = transform_json_to_table(input_data)

# print(bank_names, bank_addrs, binfo_list, event_bys, eids)

# result = call_postgresql_function_and_get_result(bank_names, bank_addrs, binfo_list, event_bys, eids)
# print(result)



# import json
# import pandas as pd
# import json
# import psycopg2
# import pandas as pd
# import time

# def transform_json_to_table(json_data):

#     table_data = []
    
#     event_data = json_data.get("eobj", {})
#     event_by = event_data.get("event_by")
#     eid = json_data.get("eid")
    
#     for edetail in event_data.get("edetails", []):
#         row = []
#         # table_data.append('ARRAY')
#         row.append(edetail.get("bank_name", None))
#         row.append(edetail.get("baddr", None))
#         row.append(json.dumps(edetail.get("binfo", {})))  
#         row.append(event_by)
#         row.append(eid)
#         table_data.append(row)
    
#     return table_data

# def call_postgresql_function_and_get_result(table_data):
#     conn = psycopg2.connect(
#         dbname="PG_DMS",
#         user="postgres",
#         password="tibil123",
#         host="localhost",
#         port="5432"
#     )
#     cursor = conn.cursor()

#     try:
#         for row in table_data:
#             cursor.execute(
#                 "SELECT dmsr.bank_processor(%s, %s, %s, %s, %s)", 
#                 (row[0], row[1], row[2], row[3], row[4])
#             )
#             result = cursor.fetchone()[0] 
        
    
#     except Exception as e:
#         print(f"Error: {e}")
#         return "failed"
#     finally:
#         conn.commit() 
#         cursor.close()
#         conn.close()

# input_data = {
#     "aid": 3,
#     "alid": 28,
#     "eid": 28,
#     "ecode": "BANK_ONBOARDED",
#     "eobj": {
#         "event": "BANK_ONBOARDED",
#         "event_by": 1,
#         "edetails": [
#             {
#                 "bank_name": "sbi",
#                 "baddr": "1st Main Road",
#                 "binfo": {
#                     "name": "sbi",
#                     "designation": "manager",
#                     "phno": "+919876543211",
#                     "email": "xyz@gmail.com"
#                 }
#             },
#             {
#                 "bank_name": "SBI@",
#                 "baddr": "1st Main Road",
#                 "binfo": {
#                     "name": "aaa",
#                     "designation": "manager",
#                     "phno": "+919876543211",
#                     "email": "xyz@gmail.com"
#                 }
#             }
#         ]
#     }
# }

# table_data =transform_json_to_table(input_data)
# print(table_data)


