import argparse
import pandas as pd


def check_scenario_status(csv_file):

    # Read the CSV file
    df = pd.read_csv(csv_file)

    # Extract scenario IDs from the "Test Case" column using regex.
    # For example, from "test_api_cases[S1 - T1]", it extracts "S1"
    df["Scenario"] = df["Test Case"].str.extract(r"\[(S\d+)\s*-")

    # Group by scenario and determine the overall status
    scenario_status = {}
    for scenario, group in df.groupby("Scenario"):
        # If any test case for the scenario is FAILED, mark the scenario as FAILED.
        if "FAILED" in group["Status"].values:
            scenario_status[scenario] = "FAILED"
        else:
            scenario_status[scenario] = "PASSED"

    return scenario_status


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Check scenario status from a test report CSV.")
    parser.add_argument(
        "--csv_path",
        type=str,
        required=True,
        help="Path to the CSV test report file."
    )
    args = parser.parse_args()

    results = check_scenario_status(args.csv_path)
    for scenario, status in results.items():
        print(f"Scenario {scenario}: {status}")
