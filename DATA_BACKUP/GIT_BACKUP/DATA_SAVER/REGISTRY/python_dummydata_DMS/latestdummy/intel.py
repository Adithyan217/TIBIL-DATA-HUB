def generate_sql_query(n: int) -> None:
    """
    Generates a SQL query to call intel.mi_onboard_bank with n JSON entries.
    Writes the query to call_mi_onboard_bank.sql.
    
    Args:
        n (int): Number of rows to include.
    """
    function_name = "intel.mi_onboard_bank"
    output_file = "/home/adithyan/adithyan/DATA_BACKUP/GIT_BACKUP/DATA_SAVER/REGISTRY/python_dummydata_DMS/latestdummy/data.txt"

    entries = [f"'{{\"row_id\": {i}, \"bid\": {i}}}'::json" for i in range(1, n + 1)]
    array_content = ",\n        ".join(entries)

    sql_query = f"""SELECT * FROM {function_name}(
    ARRAY[
        {array_content}
    ]
);"""

    with open(output_file, "w") as f:
        f.write(sql_query)

    print(f"SQL query for {n} rows saved to {output_file}")


# 🔁 Example usage:
generate_sql_query(2000)
