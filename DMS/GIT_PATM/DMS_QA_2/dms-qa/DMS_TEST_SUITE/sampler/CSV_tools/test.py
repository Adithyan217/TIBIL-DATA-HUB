import pandas as pd

def find_missing_in_csv2(csv1, col1, csv2, col2, output_csv="missing_in_csv2.csv"):
    df1 = pd.read_csv(csv1)
    df2 = pd.read_csv(csv2)

    # Normalize by stripping and lowering case
    set1 = set(df1[col1].astype(str).str.strip().str.lower())
    set2 = set(df2[col2].astype(str).str.strip().str.lower())

    missing = sorted(set1 - set2)

    # Save to CSV
    pd.DataFrame(missing, columns=[f"missing_{col1}_from_{csv2}"]).to_csv(output_csv, index=False)
    print(f"Missing values written to: {output_csv}")


find_missing_in_csv2(    '/home/adithyan/Downloads/Device.csv', 'NAME',
    '/home/adithyan/Downloads/Device_mer_prod.csv', 'mname')
