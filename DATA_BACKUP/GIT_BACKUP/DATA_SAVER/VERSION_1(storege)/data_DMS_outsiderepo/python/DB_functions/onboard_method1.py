import pandas as pd
import json
import psycopg2
import time
import psutil  # Import psutil for memory usage tracking

# Function to track memory usage
def get_memory_usage():
    process = psutil.Process()  # Get the current process
    return process.memory_info().rss  # Return memory usage in bytes

def call_postgresql_function_and_get_result(row):
    conn = psycopg2.connect(
        dbname="PG_DMS",
        user="postgres",
        password="tibil123",
        host="localhost",
        port="5432"
    )
    cursor = conn.cursor()

    try:
        bname = row['bname']
        baddr = row['baddr']
        binfo = json.dumps(row['binfo'])
        eby = row['eby']
        eid = row['eid']
        
        query = """
        SELECT dmsr.bank_validator_writer(
            %s, 
            %s, 
            %s::jsonb, 
            %s, 
            %s
        );
        """
        
        # Execute the query with parameters
        cursor.execute(query, (bname, baddr, binfo, eby, eid))
        
        result = cursor.fetchone()[0]  
        
        return "passed" if result else "failed"
    
    except Exception as e:
        print(f"Error processing bank {row['bname']}: {e}")
        return "failed"
    finally:
        conn.commit()  ########################## forgot to commit
        cursor.close()
        conn.close()

def process_and_create_dataframe(data):
    event_by = data['eobj']['event_by']
    eid = data['eid']
    edetails = data['eobj']['edetails']
    
    transformed_data = [
        {
            "bname": detail['bank_name'],
            "baddr": detail['baddr'],
            "binfo": detail['binfo'],  
            "eby": event_by,
            "eid": eid
        }
        for detail in edetails
    ]
    
    df = pd.DataFrame(transformed_data)
    df['status'] = df.apply(lambda row: call_postgresql_function_and_get_result(row), axis=1)
    
    return df

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
                "bank_name": "sbi",
                "baddr": "1st Main Road",
                "binfo": {
                    "name": "sbi",
                    "designation": "manager",
                    "phno": "+919876543211",
                    "email": "xyz@gmail.com"
                }
            },
            {
                "bank_name": "SBI@",
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



df = process_and_create_dataframe(input_data)

# Measure the time and memory used
processing_time = time.time() - start_time  # Time taken for processing
processing_mem = get_memory_usage() - start_mem  # Memory used during processing

# Print time and memory usage results
print(f"Processing time: {processing_time:.4f} seconds")
print(f"Processing memory usage: {processing_mem / (1024 ** 2):.4f} MB")  # Convert bytes to MB

# Print the resulting dataframe
print(df)













# import pandas as pd
# import json
# import psycopg2
# import pandas as pd
# import time


# def call_postgresql_function_and_get_result(row):
#     conn = psycopg2.connect(
#         dbname="PG_DMS",
#         user="postgres",
#         password="tibil123",
#         host="localhost",
#         port="5432"
#     )
#     cursor = conn.cursor()

#     try:
#         bname = row['bname']
#         baddr = row['baddr']
#         binfo = json.dumps(row['binfo'])
#         eby = row['eby']
#         eid = row['eid']
        
#         query = """
#         SELECT dmsr.bank_validator_writer(
#             %s, 
#             %s, 
#             %s::jsonb, 
#             %s, 
#             %s
#         );
#         """
        
#         # Execute the query with parameters
#         cursor.execute(query, (bname, baddr, binfo, eby, eid))
        
#         result = cursor.fetchone()[0]  
        
#         return "passed" if result else "failed"
    
#     except Exception as e:
#         print(f"Error processing bank {row['bname']}: {e}")
#         return "failed"
#     finally:
#         conn.commit() ########################## forgot to commit
#         cursor.close()
#         conn.close()

# def process_and_create_dataframe(data):
    
#     event_by = data['eobj']['event_by']
#     eid = data['eid']
#     edetails = data['eobj']['edetails']
    
#     transformed_data = [
#         {
#             "bname": detail['bank_name'],
#             "baddr": detail['baddr'],
#             "binfo": detail['binfo'],  
#             "eby": event_by,
#             "eid": eid
#         }
#         for detail in edetails
#     ]
    
#     df = pd.DataFrame(transformed_data)
#     df['status'] = df.apply(lambda row: call_postgresql_function_and_get_result(row), axis=1)
    

#     return df
        

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

# df=process_and_create_dataframe(input_data)


# print(df)
