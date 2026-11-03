import pytest

def pytest_addoption(parser):
    parser.addoption("--csv", action="store", default="TestData/test_data2.csv", help="Path to test cases CSV file")

@pytest.fixture
def csv_file(request):
    return request.config.getoption("--csv")
