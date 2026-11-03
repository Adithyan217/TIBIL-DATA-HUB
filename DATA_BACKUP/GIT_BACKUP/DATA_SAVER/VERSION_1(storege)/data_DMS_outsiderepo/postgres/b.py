import psycopg2

def truncate_tables():
    try:
        conn = psycopg2.connect(
    dbname = "DMS",
    user = "postgres",
    password= "tibil123",
    host= "localhost",
    port= "5432"
)
        cur = conn.cursor()

        # Disable foreign key checks to avoid constraint violations
        cur.execute("SET session_replication_role = 'replica';")

        # Truncate the tables
        cur.execute("TRUNCATE TABLE vpa, firmware, banks, mf, model RESTART IDENTITY CASCADE;")

        # Re-enable foreign key checks
        cur.execute("SET session_replication_role = 'origin';")

        conn.commit()

        print("Tables truncated successfully.")

    except Exception as e:
        print(f"Error truncating tables: {e}")
    finally:
        if conn:
            cur.close()
            conn.close()

# Call the function
truncate_tables()
