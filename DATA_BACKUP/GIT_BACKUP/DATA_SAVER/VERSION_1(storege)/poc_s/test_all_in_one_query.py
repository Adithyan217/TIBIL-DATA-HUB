from datetime import datetime

# Function to generate individual UPSERT query for any time frame (daily, weekly, monthly, yearly)
def generate_timeframe_upsert_query(columns, values, table_name, metric, timeframe, conflict_columns):
    columns_str = ", ".join(columns)
    values_str = ", ".join(values)

    return f"""
    INSERT INTO {table_name}_{timeframe} ({columns_str}, {metric})
    VALUES ({values_str}, 1)
    ON CONFLICT ({', '.join(conflict_columns)})
    DO UPDATE SET {metric} = {table_name}_{timeframe}.{metric} + 1;
    """

# Function to handle all timeframes
def generate_upsert_queries(schema, data, table_name, metric):
    queries = []
    
    columns = list(schema.keys())
    values = [f"'{value}'" if schema[col] == 'string' or schema[col] == 'date' else str(value)
              for col, value in zip(columns, data)]

    # Check if there's a date column in the schema
    if "date" in schema.values():
        date_col_index = list(schema.values()).index("date")
        date_value = data[date_col_index]
        date_obj = datetime.strptime(date_value, "%Y-%m-%d")

        # Extract week, month, and year from the date
        week = date_obj.isocalendar()[1]
        month = date_obj.month
        year = date_obj.year

        # Add week, month, and year for all queries
        columns += ['week', 'month', 'year']
        values += [str(week), str(month), str(year)]

    # Generate the daily query (which includes the date)
    conflict_columns_daily = [col for col in columns if col not in ['week', 'month', 'year']]
    queries.append(generate_timeframe_upsert_query(columns, values, table_name, metric, "daily", conflict_columns_daily))

    # For weekly, monthly, yearly, exclude the 'date' column
    columns_without_date = [col for col in columns if col != 'date']
    values_without_date = [value for idx, value in enumerate(values) if columns[idx] != 'date']

    # Weekly query
    conflict_columns_weekly = [col for col in columns_without_date if col not in ['month', 'year']]
    queries.append(generate_timeframe_upsert_query(columns_without_date[:-3] + ['week', 'month', 'year'], values_without_date[:-3] + [str(week), str(month), str(year)], table_name, metric, "weekly", conflict_columns_weekly))

    # Monthly query
    conflict_columns_monthly = [col for col in columns_without_date if col not in ['week', 'year']]
    queries.append(generate_timeframe_upsert_query(columns_without_date[:-3] + ['month', 'year'], values_without_date[:-3] + [str(month), str(year)], table_name, metric, "monthly", conflict_columns_monthly))

    # Yearly query
    conflict_columns_yearly = [col for col in columns_without_date if col not in ['week', 'month']]
    queries.append(generate_timeframe_upsert_query(columns_without_date[:-3] + ['year'], values_without_date[:-3] + [str(year)], table_name, metric, "yearly", conflict_columns_yearly))

    return queries

# Get user input for schema
schema = {}
num_columns = int(input("Enter the number of columns in the schema: "))

for _ in range(num_columns):
    column_name = input("Enter column name: ")
    column_type = input("Enter column type (e.g., int, date, string): ")
    schema[column_name] = column_type

metric = input("Enter the metric column name: ")

data = []
for col, col_type in schema.items():
    if col_type == "date":
        user_date = input(f'Enter value for date column "{col}" (DD-MM-YYYY): ')
        try:
            formatted_date = datetime.strptime(user_date, "%d-%m-%Y").strftime("%Y-%m-%d")
            data.append(formatted_date)
        except ValueError:
            print("Invalid date format. Please enter the date in DD-MM-YYYY format.")
            continue
    else:
        value = input(f'Enter value for column "{col}": ')
        data.append(value)

table_name = input("Enter the base table name: ")

# Generate the UPSERT queries
upsert_queries = generate_upsert_queries(schema, data, table_name, metric)

# Output the queries
for query in upsert_queries:
    print(query)






# from datetime import datetime

# # Function to generate individual UPSERT query for any time frame (daily, weekly, monthly, yearly)
# def generate_timeframe_upsert_query(columns, values, table_name, metric, timeframe, conflict_columns):
#     columns_str = ", ".join(columns)
#     values_str = ", ".join(values)

#     return f"""
#     INSERT INTO {table_name}_{timeframe} ({columns_str}, {metric})
#     VALUES ({values_str}, 1)
#     ON CONFLICT ({', '.join(conflict_columns)})
#     DO UPDATE SET {metric} = {table_name}_{timeframe}.{metric} + 1;
#     """

# # Function to handle all timeframes
# def generate_upsert_queries(schema, data, table_name, metric):
#     queries = []
    
#     columns = list(schema.keys())
#     values = [f"'{value}'" if schema[col] == 'string' or schema[col] == 'date' else str(value)
#               for col, value in zip(columns, data)]

#     # Check if there's a date column in the schema
#     if "date" in schema.values():
#         date_col_index = list(schema.values()).index("date")
#         date_value = data[date_col_index]
#         date_obj = datetime.strptime(date_value, "%Y-%m-%d")

#         # Extract week, month, and year from the date
#         week = date_obj.isocalendar()[1]
#         month = date_obj.month
#         year = date_obj.year

#         # Add week, month, and year for all queries
#         # columns += ['week', 'month', 'year']
#         # values += [str(week), str(month), str(year)]

#     # Generate the daily query (which includes the date)
#     conflict_columns_daily = [col for col in columns]
#     queries.append(generate_timeframe_upsert_query(columns + ['week', 'month', 'year'] , values + [str(week), str(month), str(year)] , table_name, metric, "daily", conflict_columns_daily))

#     # For weekly, monthly, yearly, exclude the 'date' column
#     columns_without_date = [col for col in columns if col != 'date']
#     values_without_date = [value for idx, value in enumerate(values) if columns[idx] != 'date']

#     # Weekly query
#     conflict_columns_weekly = [col for col in columns_without_date]+['week']
#     queries.append(generate_timeframe_upsert_query(columns_without_date + ['week', 'month', 'year'], values_without_date + [str(week), str(month), str(year)], table_name, metric, "weekly", conflict_columns_weekly))

#     # Monthly query
#     conflict_columns_monthly = [col for col in columns_without_date]+['month']
#     queries.append(generate_timeframe_upsert_query(columns_without_date + ['month', 'year'], values_without_date + [str(month), str(year)], table_name, metric, "monthly", conflict_columns_monthly))

#     # Yearly query
#     conflict_columns_yearly = [col for col in columns_without_date]+['year']
#     queries.append(generate_timeframe_upsert_query(columns_without_date + ['year'], values_without_date+ [str(year)], table_name, metric, "yearly", conflict_columns_yearly))

#     return queries

# # Get user input for schema
# schema = {}
# num_columns = int(input("Enter the number of columns in the schema: "))

# for _ in range(num_columns):
#     column_name = input("Enter column name: ")
#     column_type = input("Enter column type (e.g., int, date, string): ")
#     schema[column_name] = column_type

# metric = input("Enter the metric column name: ")

# data = []
# for col, col_type in schema.items():
#     if col_type == "date":
#         user_date = input(f'Enter value for date column "{col}" (DD-MM-YYYY): ')
#         try:
#             formatted_date = datetime.strptime(user_date, "%d-%m-%Y").strftime("%Y-%m-%d")
#             data.append(formatted_date)
#         except ValueError:
#             print("Invalid date format. Please enter the date in DD-MM-YYYY format.")
#             continue
#     else:
#         value = input(f'Enter value for column "{col}": ')
#         data.append(value)

# table_name = input("Enter the base table name: ")

# # Generate the UPSERT queries
# upsert_queries = generate_upsert_queries(schema, data, table_name, metric)

# # Output the queries
# for query in upsert_queries:
#     print(query)
