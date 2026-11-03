from faker import Faker
import json
import random

fake = Faker()

def generate_bank_data(num_items):
    num='{num}'
    row_id = [i for i in range (1,num_items+1)]
    bank_names = [f"Bank_{i}${num}" for i in range(1, num_items + 1)]
    
    addresses = ["1st Main Road", "2nd Main Road"]
    address_array = [random.choice(addresses) for _ in range(num_items)]
    
    ids_array_1 = [random.choice([1, 2]) for _ in range(num_items)]
    ids_array_2 = [random.choice([28, 29]) for _ in range(num_items)]
    
    bank_info_array = [
        json.dumps({
            "name": name,
            "designation": fake.job(),
            "phno": fake.phone_number(),
            "email": fake.email()
        })
        for name in bank_names
    ]
    
    print("SELECT * FROM dmsr.bank_iterator(")
    print("    ARRAY[{}],".format(", ".join(str(id) for id in row_id)))
    print("    ARRAY[{}],".format(", ".join(f"'{name}'" for name in bank_names)))
    print("    ARRAY[{}],".format(", ".join(f"'{address}'" for address in address_array)))
    print("    ARRAY[{}]::jsonb[],".format(", ".join(f"'{info}'" for info in bank_info_array)))
    print("    ARRAY[{}],".format(", ".join(str(id) for id in ids_array_1)))
    print("    ARRAY[{}]".format(", ".join(str(id) for id in ids_array_2)))
    print(");")

generate_bank_data(num_items=100)
