from datetime import datetime

def generate_upsert_queries(schema, data, table_name, metric):
    queries = []

    # Prepare the columns and corresponding values based on user input
    columns = ", ".join(schema.keys())
    values = ", ".join([f"'{value}'" if schema[col] == 'string' or schema[col] == 'date' else str(value) 
                        for col, value in zip(schema.keys(), data)])

    # Generate the UPSERT query
    upsert_query = f"""
    INSERT INTO {table_name} ({columns}, {metric})
    VALUES ({values}, 1) 
    ON CONFLICT ({', '.join(schema.keys())}) 
    DO UPDATE SET {metric} = {table_name}.{metric} + 1;
    """

    queries.append(upsert_query)
    return queries

# Define the schema by taking input from the user
schema = {}
num_columns = int(input("Enter the number of columns in the schema: "))

# Collect schema definition (column names and types)
for _ in range(num_columns):
    column_name = input("Enter column name: ")
    column_type = input("Enter column type (e.g., int, date, string): ")
    schema[column_name] = column_type

# Collect the metric column name
metric = input("Enter the metric column name: ")

# Collect data for each column
data = []
for col, col_type in schema.items():
    if col_type == "date":
        # If the column is of type 'date', prompt for date input in DD-MM-YYYY format
        user_date = input(f'Enter value for date column "{col}" (DD-MM-YYYY): ')
        
        # Convert the DD-MM-YYYY input to YYYY-MM-DD for SQL
        try:
            formatted_date = datetime.strptime(user_date, "%d-%m-%Y").strftime("%Y-%m-%d")
            data.append(formatted_date)
        except ValueError:
            print("Invalid date format. Please enter the date in DD-MM-YYYY format.")
            continue
    else:
        # For non-date columns, collect the input as normal
        value = input(f'Enter value for column "{col}": ')
        data.append(value)

# Prompt user for the table name
table_name = input("Enter the base table name: ")

# Generate the UPSERT queries
upsert_queries = generate_upsert_queries(schema, data, table_name, metric)

# Output the queries
for query in upsert_queries:
    print(query)
