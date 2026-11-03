import pandas as pd
import os


def split_csv_by_branch_id(spliter_column,input_csv_path, output_dir="output_csvs"):
    # Create output directory if it doesn't exist

    # Read the CSV file
    df = pd.read_csv(input_csv_path)

    # Group by 'branch_id'
    if spliter_column not in df.columns:
        print(f"ERROR :: INVALID_COLUMN - {spliter_column} column does not exist in the CSV")
    else:
        os.makedirs(output_dir, exist_ok=True)

        grouped = df.groupby(spliter_column)

        # Write each group to a separate CSV
        i=0
        for branch_id, group_df in grouped:
            i=i+1
            output_filename = f"branch_{branch_id}.csv"
            output_path = os.path.join(output_dir, output_filename)
            group_df.to_csv(output_path, index=False)

            print(f"Saved{i}: {output_path}")




split_csv_by_branch_id('branch_id', '/home/adithyan/Downloads/dms_prod_branch_devices.csv', 'splitted_csvs2')
