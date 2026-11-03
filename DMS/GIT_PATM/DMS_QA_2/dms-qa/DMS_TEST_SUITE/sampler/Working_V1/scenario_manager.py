import pandas as pd
from TestScript.test_cases import test_api_cases, context

# Load scenarios
# df_tests = pd.read_csv("../TestData/test_cases.csv")
# df_scenarios = pd.read_csv("../TestData/scenario.csv")

df_tests = pd.read_csv("TestData/test_cases.csv")
df_scenarios = pd.read_csv("TestData/scenario.csv")

def scenario_manager():
    overall_success = True
    df_scenarios_unique = df_scenarios['SID'].unique()  # Unique scenario IDs

    for scenario_id in df_scenarios_unique:
        # Select test cases for the current scenario
        scenario_cases = df_scenarios[df_scenarios['SID'] == scenario_id]  #looping each row in that id
        test_cases = df_tests.merge(scenario_cases[['TID', 'Order']], left_on='Test ID', right_on='TID', how='inner') #merging scenario tid with test id

        test_cases = test_cases.sort_values(by='Order')

        print(f"Executing Scenario ID: {scenario_id}")
        # print(f"Test cases for scenario {scenario_id}:\n", test_cases[['Test ID', 'Order']])

        scenario_success = True

        for index, test_case_row in test_cases.iterrows():
            try:
                test_api_cases(context, index, test_case_row)
                print(f"Test Case {test_case_row['Test ID']} success!")

            except AssertionError:
                scenario_success = False
                print(f"Test Case {test_case_row['Test ID']} failed!")

        if not scenario_success:
            overall_success = False

        print(f"Scenario {scenario_id} execution SUCCESS" if overall_success else "Scenario execution FAILED")
    # return overall_success

if __name__ == "__main__":
    scenario_manager()

