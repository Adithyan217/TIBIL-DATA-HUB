# TAKE A MAIN COLUMN FROM CSV ONE CHECK WHAT IS TEH SECOND COLUMN FOR IT IN BOTH FILES

import pandas as pd

def compare_by_key_and_store_mismatches(csv1, key1, val1, csv2, key2, val2,
                                        mismatch_file='mismatches.csv',
                                        missing_keys_file='missing_keys.csv'):
    df1 = pd.read_csv(csv1)
    df2 = pd.read_csv(csv2)

    # Clean string values
    df1[key1] = df1[key1].astype(str).str.strip()
    df1[val1] = df1[val1].astype(str).str.strip()
    df2[key2] = df2[key2].astype(str).str.strip()
    df2[val2] = df2[val2].astype(str).str.strip()

    # Drop empty key rows
    df1 = df1[df1[key1] != '']
    df2 = df2[df2[key2] != '']

    # Create dicts: key -> value
    dict1 = dict(zip(df1[key1], df1[val1]))
    dict2 = dict(zip(df2[key2], df2[val2]))

    mismatches = []
    missing_keys = []

    for k in dict1:
        val_csv1 = dict1[k]
        val_csv2 = dict2.get(k)

        if val_csv2 is None:
            missing_keys.append({'Name': k})
        elif val_csv1 != val_csv2:
            mismatches.append({
                'Name': k,
                'csv1': val_csv1,
                'csv2': val_csv2
            })

    if mismatches:
        pd.DataFrame(mismatches).to_csv(mismatch_file, index=False)
        print(f"❌ {len(mismatches)} mismatches found — saved to {mismatch_file}")
    else:
        print("✅ No value mismatches found.")

    if missing_keys:
        pd.DataFrame(missing_keys).to_csv(missing_keys_file, index=False)
        print(f"❌ {len(missing_keys)} keys missing in CSV2 — saved to {missing_keys_file}")
    else:
        print("✅ No missing keys in CSV2.")

    return {
        'mismatches': mismatches,
        'missing_keys': missing_keys
    }

compare_by_key_and_store_mismatches(

    '/home/adithyan/Downloads/Device.csv', 'NAME', 'DEVICE_SERIAL_NUMBER',
    '/home/adithyan/Downloads/Device_mer_prod.csv', 'mname', 'dname'
)