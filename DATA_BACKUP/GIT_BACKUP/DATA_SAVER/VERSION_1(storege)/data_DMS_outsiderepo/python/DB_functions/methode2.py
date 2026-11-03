import psycopg2
import json

def convert_json_to_dataframe(json_data):

    event_by = int(json_data["eobj"]["event_by"])  
    edetails = json_data["eobj"]["edetails"]
    data = []
    
    for bank in edetails:
        bank_name = bank["bank_name"]
        baddr = bank["baddr"]
        binfo = json.dumps(bank["binfo"])  
        data.append([bank_name, baddr, binfo, int(json_data["eid"]), event_by])  
    
    return data

def call_postgres_function(data):

    conn = psycopg2.connect(
        dbname="PG_DMS",
        user="postgres",
        password="tibil123",
        host="localhost",
        port="5432"
    )
    cursor = conn.cursor()

    try:

        query = "SELECT bank_processor(%s);"
        

        cursor.execute(query, (data,))  # Data needs to be a tuple

        conn.commit()
        
        print("Data passed to the PostgreSQL function successfully.")

    except Exception as e:
        print(f"Error occurred: {e}")
    
    finally:
        cursor.close()
        conn.close()

json_input = {
    "aid": 3,
    "alid": 28,
    "eid": 28,
    "ecode": "BANK_ONBOARDED",
    "eobj": {
        "event": "BANK_ONBOARDED",
        "event_by": 1,
        "edetails": [
            {
                "bank_name": "123sbi",
                "baddr": "1st Main Road",
                "binfo": {
                    "name": "sbi",
                    "designation": "manager",
                    "phno": "+919876543211",
                    "email": "xyz@gmail.com"
                }
            },
            {
                "bank_name": "123SBI@",
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

data = convert_json_to_dataframe(json_input)

call_postgres_function(data)
