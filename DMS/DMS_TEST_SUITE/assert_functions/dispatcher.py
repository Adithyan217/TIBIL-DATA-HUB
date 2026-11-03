import importlib

def perform_assertion(assertion_path, response, expected_response, expected_status,request):
    print(assertion_path)
    module_name, function_name = assertion_path.rsplit(".", 1)  # Splits at the last dot
    try:
        # Dynamically import the module
        module = importlib.import_module("assert_functions."+module_name)

        # Retrieve the assertion function from the module
        assertion_function = getattr(module, function_name)
    except (ModuleNotFoundError, AttributeError, ValueError) as e:
        raise ImportError(f"Could not load assertion function '{function_name}' from module '{module_name}'. Error: {e}")

    # Call the dynamically imported assertion function
    assertion_function(response, expected_response, expected_status,request)




# import importlib
#
#
# def perform_assertion(assertion_type, response, expected_response, expected_status):
#     # Construct the module and function names dynamically.
#     module_name = f"assert_functions.{assertion_type}"
#     function_name = f"assert_{assertion_type}"
#
#     try:
#         # Dynamically import the module
#         module = importlib.import_module(module_name)
#         # Retrieve the assertion function from the module
#         assertion_function = getattr(module, function_name)
#     except (ModuleNotFoundError, AttributeError) as e:
#         raise ImportError(
#             f"Could not load assertion function '{function_name}' from module '{module_name}'. Error: {e}")
#
#     # Call the dynamically imported assertion function.
#     assertion_function(response, expected_response, expected_status)
