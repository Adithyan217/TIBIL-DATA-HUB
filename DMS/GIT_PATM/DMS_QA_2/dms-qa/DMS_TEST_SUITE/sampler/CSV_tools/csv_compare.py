import pandas as pd

def check_values_exist(csv1, column1, csv2, column2, value_type='int'):
    df1 = pd.read_csv(csv1)
    df2 = pd.read_csv(csv2)

    if value_type == 'int':
        # Convert values to integers, ignore non-numeric
        values_1 = pd.to_numeric(df1[column1], errors='coerce').dropna().astype(int)
        values_2 = pd.to_numeric(df2[column2], errors='coerce').dropna().astype(int)
    else:
        # Convert values to string, strip whitespace, and ignore empty strings
        values_1 = df1[column1].dropna().astype(str).str.strip()
        values_1 = values_1[values_1 != '']

        values_2 = df2[column2].dropna().astype(str).str.strip()
        values_2 = values_2[values_2 != '']

    set_1 = set(values_1)
    set_2 = set(values_2)

    print(set_1)
    print(set_2)
    missing_values = set_1 - set_2

    non_missing = set_1 - missing_values

    if not missing_values:
        print("✅ All values from CSV1 exist in CSV2.")
        return True
    else:
        print("❌ The following values from CSV1 are missing in CSV2:")
        print(missing_values)
        print("non missingh",non_missing)
        return False


# import pandas as pd
# from numpy.ma.core import count
#
#
# def check_values_exist(csv1, column1, csv2, column2):
#     df1 = pd.read_csv(csv1)
#     df2 = pd.read_csv(csv2)
#
#     values_1 = set(df1[column1].dropna())
#     values_1 = {val for val in values_1 if str(val).strip() != ''}
#
#     values_2 = set(df2[column2].dropna())
#     values_2 = {val for val in values_2 if str(val).strip() != ''}
#
#     missing_values = values_1 - values_2
#     print("values from csv 1",values_1)
#     print("values from csv 2",values_2)
#
#     if not missing_values:
#         print("All pass")
#         return True
#     else:
#         print("The following values from CSV1 are missing in CSV2:")
#         print(missing_values)
#         # print(count())
#         return False


check_values_exist(
                   '/home/adithyan/Downloads/Device.csv', 'NAME','/home/adithyan/Downloads/Device_mer_prod.csv',
                   'mname')


