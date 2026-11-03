import pandas as pd

def enrich_merchants_with_branch_bank(csv_1, csv_2, output_path='merged_output.csv'):
    df1 = pd.read_csv(csv_1)
    df2 = pd.read_csv(csv_2)

    final_df = df1.merge(
        df2[['mname', 'bank_id', 'branch_id']],
        left_on='merchant_id',
        right_on='mname',
        how='left'
    )

    # Drop duplicate join column if needed
    final_df.drop(columns=['mname'], inplace=True)

    # Save to CSV
    final_df.to_csv(output_path, index=False)


enrich_merchants_with_branch_bank('/home/adithyan/Downloads/dms_prod_merchant_devices.csv','/home/adithyan/Downloads/dms_prod_janamerchants.csv')