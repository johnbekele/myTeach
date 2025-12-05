"""
Test case validation logic
"""
from typing import Dict, List, Any
from app.models.exercise import TestCase, TestResult, ExecutionResult


def validate_test_cases(
    execution_result: ExecutionResult,
    test_cases: List[TestCase],
    language: str
) -> List[TestResult]:
    """
    Validate execution results against test cases

    Args:
        execution_result: Result from sandbox execution
        test_cases: List of test cases to validate
        language: Programming language

    Returns:
        List of test results
    """
    results = []

    # If execution failed, all tests fail
    if execution_result.exit_code != 0:
        for test_case in test_cases:
            results.append(TestResult(
                test_id=test_case.test_id,
                passed=False,
                error_message=f"Execution failed: {execution_result.stderr}"
            ))
        return results

    # Validate each test case
    for test_case in test_cases:
        result = validate_single_test(
            execution_result,
            test_case,
            language
        )
        results.append(result)

    return results


def validate_single_test(
    execution_result: ExecutionResult,
    test_case: TestCase,
    language: str
) -> TestResult:
    """Validate a single test case"""

    try:
        # Check expected output
        expected_stdout = test_case.expected_output.get("stdout", "")
        actual_stdout = execution_result.stdout

        # Simple string comparison
        if expected_stdout:
            if actual_stdout.strip() == expected_stdout.strip():
                return TestResult(
                    test_id=test_case.test_id,
                    passed=True,
                    actual_output={"stdout": actual_stdout}
                )
            else:
                return TestResult(
                    test_id=test_case.test_id,
                    passed=False,
                    actual_output={"stdout": actual_stdout},
                    error_message=f"Expected: '{expected_stdout}', Got: '{actual_stdout}'"
                )

        # If no specific output expected, check exit code
        if execution_result.exit_code == 0:
            return TestResult(
                test_id=test_case.test_id,
                passed=True,
                actual_output={"stdout": actual_stdout}
            )
        else:
            return TestResult(
                test_id=test_case.test_id,
                passed=False,
                actual_output={"stdout": actual_stdout},
                error_message="Non-zero exit code"
            )

    except Exception as e:
        return TestResult(
            test_id=test_case.test_id,
            passed=False,
            error_message=f"Validation error: {str(e)}"
        )


def calculate_score(test_results: List[TestResult]) -> int:
    """
    Calculate score based on test results

    Args:
        test_results: List of test results

    Returns:
        Score out of 100
    """
    if not test_results:
        return 0

    passed = sum(1 for r in test_results if r.passed)
    total = len(test_results)

    return int((passed / total) * 100)
