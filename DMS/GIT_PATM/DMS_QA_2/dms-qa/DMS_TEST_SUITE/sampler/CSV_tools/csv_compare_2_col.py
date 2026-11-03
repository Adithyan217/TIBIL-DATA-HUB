import pandas as pd

def find_mismatched_combinations(csv1, col1a, col1b, csv2, col2a, col2b, value_type='str'):
    df1 = pd.read_csv(csv1)
    df2 = pd.read_csv(csv2)

    # Type conversion
    if value_type == 'int':
        df1[col1a] = pd.to_numeric(df1[col1a], errors='coerce')
        df1[col1b] = pd.to_numeric(df1[col1b], errors='coerce')
        df2[col2a] = pd.to_numeric(df2[col2a], errors='coerce')
        df2[col2b] = pd.to_numeric(df2[col2b], errors='coerce')
    else:
        df1[col1a] = df1[col1a].astype(str).str.strip()
        df1[col1b] = df1[col1b].astype(str).str.strip()
        df2[col2a] = df2[col2a].astype(str).str.strip()
        df2[col2b] = df2[col2b].astype(str).str.strip()

    # Drop missing or empty rows
    df1 = df1.dropna(subset=[col1a, col1b])
    df2 = df2.dropna(subset=[col2a, col2b])

    if value_type != 'int':
        df1 = df1[(df1[col1a] != '') & (df1[col1b] != '')]
        df2 = df2[(df2[col2a] != '') & (df2[col2b] != '')]

    # Create tuple sets
    set1 = set(zip(df1[col1a], df1[col1b]))
    set2 = set(zip(df2[col2a], df2[col2b]))

    # Compare sets
    only_in_csv1 = set1 - set2
    only_in_csv2 = set2 - set1

    # Convert back to DataFrames for export
    df_only_in_csv1 = pd.DataFrame(list(only_in_csv1), columns=[col1a, col1b])
    df_only_in_csv2 = pd.DataFrame(list(only_in_csv2), columns=[col2a, col2b])

    df_only_in_csv1.to_csv("only_in_csv1.csv", index=False)
    df_only_in_csv2.to_csv("only_in_csv2.csv", index=False)

    if only_in_csv1:
        print(f"❌ {len(only_in_csv1)} combinations in CSV1 are missing in CSV2 → saved to only_in_csv1.csv")
    if only_in_csv2:
        print(f"❌ {len(only_in_csv2)} combinations in CSV2 are missing in CSV1 → saved to only_in_csv2.csv")
    if not only_in_csv1 and not only_in_csv2:
        print("✅ All combinations match between CSV1 and CSV2.")

    return {
        'only_in_csv1': only_in_csv1,
        'only_in_csv2': only_in_csv2
    }

find_mismatched_combinations(
    '/home/adithyan/Downloads/Device_mer_prod.csv', 'mname', 'dname',
    '/home/adithyan/Downloads/Device.csv', 'NAME', 'DEVICE_SERIAL_NUMBER',
    value_type='str'
)
