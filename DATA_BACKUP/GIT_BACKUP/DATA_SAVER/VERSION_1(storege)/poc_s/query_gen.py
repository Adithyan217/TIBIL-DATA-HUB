import json

def generate_update_query(table_name, schema_json, data):
    schema = json.loads(schema_json)
    columns = list(schema.keys())[:3]
    metric = schema["metric"]
    metric_type = schema["metric_type"]
    
    query = f"UPDATE {table_name} SET {metric} = {metric} + 1"
    
    conditions = []
    for i, column in enumerate(columns):
        if isinstance(data[i], str):
            conditions.append(f"{column} = '{data[i]}'")
        else:
            conditions.append(f"{column} = {data[i]}")
    
    where_clause = " AND ".join(conditions)
    query += f" WHERE {where_clause};"
    
    return query

table_name = "users"
schema_json = '''
{
    "divice_id": "INTEGER",
    "branch_id": "INTEGER",
    "merchant_id": "INTEGER",
    "time":"DATE",
    "metric": "Count",
    "metric_type": "COUNT"
}
'''

data = [1, 222, 30]

query = generate_update_query(table_name, schema_json, data)
print(query)
