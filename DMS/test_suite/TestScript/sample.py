from Resuable.api_requests import make_request



response = make_request("https://sandbox.dms.pocketatm.in:8441/registry/banks/ping", "GET")

print(response)