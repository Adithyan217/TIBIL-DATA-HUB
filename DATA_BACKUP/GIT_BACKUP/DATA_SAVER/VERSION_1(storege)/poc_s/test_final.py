from datetime import datetime

def generate_upsert_queries(schema, data, table_name, metric):
    queries = []

    # Prepare columns and values for the daily table
    columns = list(schema.keys())
    values = [f"'{value}'" if schema[col] == 'string' or schema[col] == 'date' else str(value)
              for col, value in zip(columns, data)]

    week = month = year = None

    if "date" in schema.values():
        date_col_index = list(schema.values()).index("date")
        date_value = data[date_col_index]
        date_obj = datetime.strptime(date_value, "%Y-%m-%d")

        week = date_obj.isocalendar()[1]
        month = date_obj.month
        year = date_obj.year

        # Add extra columns for week, month, and year to the list of columns and values
        columns += ['week', 'month', 'year']
        values += [str(week), str(month), str(year)]

    # Convert columns and values to strings for SQL query
    columns_str = ", ".join(columns)
    values_str = ", ".join(values)

    # Daily table query with dynamic ON CONFLICT clause
    conflict_columns_daily = [col for col in columns if col not in ['week', 'month', 'year']]
    daily_upsert_query = f"""
    INSERT INTO {table_name}_daily ({columns_str}, {metric})
    VALUES ({values_str}, 1)
    ON CONFLICT ({', '.join(conflict_columns_daily)})
    DO UPDATE SET {metric} = {table_name}_daily.{metric} + 1;
    """
    queries.append(daily_upsert_query)

    # Weekly table query with dynamic ON CONFLICT clause
    conflict_columns_weekly = [col for col in columns if col not in ['date,month,year']]  # Exclude date column
    weekly_upsert_query = f"""
    INSERT INTO {table_name}_weekly ({', '.join(conflict_columns_weekly)} month, year, {metric})
    VALUES ({', '.join(values[:-3])}, {week}, {month}, {year}, 1)
    ON CONFLICT ({', '.join(conflict_columns_weekly)})
    DO UPDATE SET {metric} = {table_name}_weekly.{metric} + 1;
    """
    queries.append(weekly_upsert_query)

    # Monthly table query with dynamic ON CONFLICT clause
    conflict_columns_monthly = [col for col in columns if col not in ['date,week,year']]  # Exclude date column
    monthly_upsert_query = f"""
    INSERT INTO {table_name}_monthly ({', '.join(conflict_columns_monthly)} year, {metric})
    VALUES ({', '.join(values[:-3])}, {month}, {year}, 1)
    ON CONFLICT ({', '.join(conflict_columns_monthly)})
    DO UPDATE SET {metric} = {table_name}_monthly.{metric} + 1;
    """
    queries.append(monthly_upsert_query)

    # Yearly table query with dynamic ON CONFLICT clause
    conflict_columns_yearly = [col for col in columns if col not in ['date,month,week']]  # Exclude date column
    yearly_upsert_query = f"""
    INSERT INTO {table_name}_yearly ({', '.join(conflict_columns_yearly)}, {metric})
    VALUES ({', '.join(values[:-3])}, {year}, 1)
    ON CONFLICT ({', '.join(conflict_columns_yearly)})
    DO UPDATE SET {metric} = {table_name}_yearly.{metric} + 1;
    """
    queries.append(yearly_upsert_query)

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
            formatted_date = datetime.strptime(user_date, "%Y-%m-%d")  # Validate the date
            data.append(user_date)  # Add the date directly
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
