"""One-request live OpenRouter smoke check for FirstPatch AI.

Run directly with: python test_call.py
The API key is read by the backend analyzer from OPENROUTER_API_KEY and is never printed.
This script makes one free-model request and is not part of the automated test suite.
"""

if __name__ == "__main__":
    import sys

    from firstpatch.analyzer import AnalyzerError, analyze_issue

    try:
        result = analyze_issue(
            issue_description="",
            files={"smoke_example.py": "def add(left, right):\n    return left + right\n"},
        )
    except AnalyzerError as exc:
        print(f"OpenRouter smoke check failed: {exc}")
        sys.exit(1)

    required_fields = {
        "issue_summary", "relevant_files", "contribution_plan", "suggested_tests", "uncertainties"
    }
    missing = required_fields.difference(result)
    if missing:
        print("OpenRouter returned an incomplete analysis response.")
        sys.exit(1)
    print("OpenRouter smoke check succeeded; all five analysis fields are present.")
