import json

def generate_onboard_bank_payload(n: int, filename: str = "/home/adithyan/adithyan/DATA_BACKUP/GIT_BACKUP/DATA_SAVER/REGISTRY/python_dummydata_DMS/latestdummy/data.txt") -> None:
    """
    Generates a payload with 'n' value rows under rdetails.values,
    with fixed status = 1, msg = 'success', and summary status as [n, n, 0].
    Saves the payload to a JSON file.
    """
    payload = {
        "event": "ONBOARD_BANK_PROCESSED",
        "event_by": "456",
        "rdetails": {
            "status": [n, n, 0],  # [total, passed, failed]
            "values": [],
            "headers": ["row_id", "status", "msg", "bid", "bname"]
        }
    }

    for i in range(1, n + 1):
        row = [i, 1, "success", i, f"name_{i}"]
        payload["rdetails"]["values"].append(row)

    with open(filename, "w") as f:
        json.dump(payload, f, indent=2)

    print(f"Payload with {n} rows saved to {filename}")

# 🔁 Example usage:
generate_onboard_bank_payload(1000)
