import pandas as pd

def combine_column_to_single(csv_paths, column_name, output_path='combined_output.csv'):
    combined_values = []

    for path in csv_paths:
        df = pd.read_csv(path)
        if column_name not in df.columns:
            raise ValueError(f"Column '{column_name}' not found in {path}")
        combined_values.extend(df[column_name].dropna().tolist())  # remove NaNs just in case

    # Create a new DataFrame with one column
    combined_df = pd.DataFrame({column_name: combined_values})
    combined_df.to_csv(output_path, index=False)
    print(f"✅ Combined single-column CSV saved to {output_path}")
    return output_path


csv_files = ['/home/adithyan/Downloads/merge and check/dms_prod_branch_devices (1).csv',
             '/home/adithyan/Downloads/merge and check/dms_prod_devices_inventory_noimei.csv',
             '/home/adithyan/Downloads/merge and check/dms_prod_inventory_devices.csv',
             '/home/adithyan/Downloads/merge and check/dms_prod_merchant_devices (1).csv']
combine_column_to_single(csv_files, column_name='dname', output_path='merged_dnames.csv')
