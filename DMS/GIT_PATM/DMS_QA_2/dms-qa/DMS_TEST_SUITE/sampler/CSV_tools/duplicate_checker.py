import pandas as pd

def analyze_column_duplicates(csv_path, column_name):
    """
    Analyzes a CSV column for duplicates and reports detailed stats.

    Args:
        csv_path (str): Path to the CSV file.
        column_name (str): Column to analyze.

    Returns:
        dict: Dictionary containing duplicates and unique value count.
    """
    df = pd.read_csv(csv_path)

    if column_name not in df.columns:
        raise ValueError(f"Column '{column_name}' not found in {csv_path}")

    value_counts = df[column_name].value_counts(dropna=True)
    duplicates = value_counts[value_counts > 1]

    total_unique = df[column_name].nunique(dropna=True)

    if not duplicates.empty:
        print(f"\n🔁 Duplicates in column '{column_name}':")
        for value, count in duplicates.items():
            print(f"- {value}: {count} times")
    else:
        print(f"\n✅ No duplicates found in column '{column_name}'.")

    print(f"\n🔢 Total unique values in column '{column_name}': {total_unique}")

    return {
        "duplicates": duplicates.to_dict(),
        "unique_count": total_unique
    }


print(analyze_column_duplicates('/home/adithyan/Downloads/Device.csv', 'NAME'))