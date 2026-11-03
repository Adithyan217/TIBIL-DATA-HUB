def generate_upsert_queries(schema, data, table_name, metric):
    # base_where_clause = ' AND '.join([f"{key} = {value}" for key, value in zip(schema.keys(),data)])

    # time_conditions = {
    #     'daily': "dates = CURRENT_DATE",
    #     'weekly': "dates >= DATE_TRUNC('week', CURRENT_DATE)",
    #     'monthly': "dates >= DATE_TRUNC('month', CURRENT_DATE)"
    # }

    queries = []

    # for time_interval, time_condition in time_conditions.items():
        # interval_table_name = f"{table_name}_{time_interval}"
    columns = ", ".join(schema.keys()) + ", dates"
    values = ", ".join([str(value) for value in data]) + ", CURRENT_DATE"

    upsert_query = f"""
    INSERT INTO {table_name} ({columns}, {metric})
    VALUES ({values}, 1) 
    ON CONFLICT ({', '.join(schema.keys())}) 
    DO UPDATE SET {metric} = {table_name}.{metric} + 1
    ;
    """

    queries.append(upsert_query)

    return queries

schema = {}
num_columns = int(input("Enter the number of columns in the schema: "))

for _ in range(num_columns):
    column_name = input("Enter column name: ")
    column_type = input("Enter column type (e.g., int, date, string): ")
    schema[column_name] = column_type

metric = input("Enter the metric column name: ")

data = [input(f'Enter value for column "{col}": ') for col in schema.keys()]

table_name = input("Enter the base table name: ")

upsert_queries = generate_upsert_queries(schema, data, table_name, metric)

for query in upsert_queries:
    print(query)

from datetime import datetime

# Input a particular date in day-month-year format (dd-mm-yyyy)
date_string =input("enter the date")  # Example date in day-month-year

# Convert the string into a date object
given_date = datetime.strptime(date_string, "%d-%m-%Y").date()

# Get the week number
week_number = given_date.isocalendar()[1]

print(f"The week number for {given_date} is: {week_number}")
