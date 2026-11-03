import csv

def extract_column_values(csv_file_path, column_name):
    values = []
    with open(csv_file_path, mode='r', newline='', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            values.append(row[column_name])
    return values


file_path = '/home/adithyan/Downloads/missing devices - from registry.csv'
column = 'dname'
id_values = extract_column_values(file_path, column)
print(id_values)