"""Automated tests for FirstPatch AI FastAPI backend (api.py).

Uses FastAPI TestClient and mocked analyzer functions.
Never calls the live Gemini API or consumes API credits.
"""

from __future__ import annotations

import io
import logging
from typing import Any
import pytest
from fastapi.testclient import TestClient

import api
from api import app
from firstpatch.analyzer import (
    AnalyzerAPIError,
    AnalyzerConfigurationError,
    AnalyzerOutputError,
    AnalyzerValidationError,
)

client = TestClient(app)


def fake_successful_analysis(
    issue_description: str,
    files: dict[str, str] | None = None,
    **kwargs: Any,
) -> dict[str, Any]:
    """Mock implementation of analyze_issue returning standard valid output."""
    files_map = files or {}
    rel_files = []
    for fname in files_map.keys():
        rel_files.append({"filename": fname, "reason": "Relevant source file."})

    return {
        "issue_summary": f"Summary for: {issue_description[:30]}",
        "relevant_files": rel_files,
        "contribution_plan": [
            "Reproduce the problem with a test.",
            "Implement fix in source code.",
            "Verify all tests pass.",
        ],
        "suggested_tests": [
            "Test valid inputs.",
            "Test boundary and error edge cases.",
        ],
        "uncertainties": [
            "Assumes default environment configuration.",
        ],
        "unknown_files_removed": ["fabricated_internal.py"],  # Internal metadata to test stripping
    }


# Health check
def test_health_check_endpoint():
    """Verify health check returns 200 OK."""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


# 1. Valid issue-only request returns all five required fields
def test_valid_issue_only_analysis(monkeypatch: pytest.MonkeyPatch):
    """Verify successful analysis when no files are uploaded."""
    monkeypatch.setattr(api, "analyze_issue", fake_successful_analysis)

    response = client.post(
        "/api/analyze",
        data={"issue_description": "Fix IndexError when list is empty in parser."},
    )

    assert response.status_code == 200
    data = response.json()

    # Must contain the 5 required fields
    assert "issue_summary" in data
    assert "relevant_files" in data
    assert "contribution_plan" in data
    assert "suggested_tests" in data
    assert "uncertainties" in data

    # Internal metadata must NOT be leaked
    assert "unknown_files_removed" not in data

    assert data["relevant_files"] == []
    assert len(data["contribution_plan"]) == 3
    assert len(data["suggested_tests"]) == 2


# 2. Valid request with source files calls existing file processor and analyzer
def test_valid_analysis_with_source_files(monkeypatch: pytest.MonkeyPatch):
    """Verify successful analysis with uploaded source files."""
    recorded_calls: list[dict[str, Any]] = []

    def spy_analyze(issue_description: str, files: dict[str, str] | None = None, **kwargs: Any):
        recorded_calls.append({"issue": issue_description, "files": files})
        return fake_successful_analysis(issue_description, files)

    monkeypatch.setattr(api, "analyze_issue", spy_analyze)

    file_payload = [
        ("files", ("main.py", b"def run(): return 42\n", "text/x-python")),
        ("files", ("config.json", b'{"port": 8080}', "application/json")),
    ]

    response = client.post(
        "/api/analyze",
        data={"issue_description": "Upgrade server configuration."},
        files=file_payload,
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["relevant_files"]) == 2

    # Verify existing backend logic was invoked with correct decoded text
    assert len(recorded_calls) == 1
    assert "main.py" in recorded_calls[0]["files"]
    assert recorded_calls[0]["files"]["main.py"] == "def run(): return 42\n"
    assert "config.json" in recorded_calls[0]["files"]


# 3. Missing or blank issue description is rejected
@pytest.mark.parametrize("blank_desc", ["", "   ", "\n\t"])
def test_blank_issue_description_rejected(blank_desc: str):
    """Verify that empty or whitespace-only issue descriptions return 400 Bad Request."""
    response = client.post(
        "/api/analyze",
        data={"issue_description": blank_desc},
    )
    assert response.status_code == 400
    assert "issue description" in response.json()["detail"].lower()


def test_missing_issue_description_field():
    """Verify that requests missing the issue_description field return 400 Bad Request."""
    response = client.post("/api/analyze", data={})
    assert response.status_code == 400


# 4. Unsupported file extension is rejected
def test_unsupported_file_extension_rejected(monkeypatch: pytest.MonkeyPatch):
    """Verify that files with unsupported extensions return 400 Bad Request."""
    monkeypatch.setattr(api, "analyze_issue", fake_successful_analysis)

    response = client.post(
        "/api/analyze",
        data={"issue_description": "Check binary execution."},
        files=[("files", ("script.exe", b"binary data", "application/octet-stream"))],
    )
    assert response.status_code == 400
    assert "unsupported extension" in response.json()["detail"].lower()


# 5. Empty file is rejected
def test_empty_file_rejected(monkeypatch: pytest.MonkeyPatch):
    """Verify that 0-byte uploaded files return 400 Bad Request."""
    monkeypatch.setattr(api, "analyze_issue", fake_successful_analysis)

    response = client.post(
        "/api/analyze",
        data={"issue_description": "Bug report with empty file."},
        files=[("files", ("empty.py", b"", "text/x-python"))],
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


# 6. Invalid UTF-8 file is rejected
def test_invalid_utf8_file_rejected(monkeypatch: pytest.MonkeyPatch):
    """Verify that non-UTF-8 uploaded files return 400 Bad Request."""
    monkeypatch.setattr(api, "analyze_issue", fake_successful_analysis)

    response = client.post(
        "/api/analyze",
        data={"issue_description": "Bug report with corrupted text."},
        files=[("files", ("bad.txt", b"\xff\xfe\x00\x00\x80", "text/plain"))],
    )
    assert response.status_code == 400
    assert "encoding" in response.json()["detail"].lower() or "utf-8" in response.json()["detail"].lower()


# 7. Duplicate filenames are rejected
def test_duplicate_filenames_rejected(monkeypatch: pytest.MonkeyPatch):
    """Verify that duplicate filenames across the upload batch return 400 Bad Request."""
    monkeypatch.setattr(api, "analyze_issue", fake_successful_analysis)

    file_payload = [
        ("files", ("model.py", b"class ModelA: pass\n", "text/x-python")),
        ("files", ("model.py", b"class ModelB: pass\n", "text/x-python")),
    ]

    response = client.post(
        "/api/analyze",
        data={"issue_description": "Bug report with duplicate files."},
        files=file_payload,
    )
    assert response.status_code == 400
    assert "duplicate filename" in response.json()["detail"].lower()


# 8. Combined uploads exceeding 200 KB are rejected
def test_combined_uploads_exceeding_200kb_rejected(monkeypatch: pytest.MonkeyPatch):
    """Verify that uploads exceeding the 200 KB limit return 400 Bad Request."""
    monkeypatch.setattr(api, "analyze_issue", fake_successful_analysis)

    # 204,801 bytes (1 byte over 200 KB)
    oversized = b"a" * 204_801

    response = client.post(
        "/api/analyze",
        data={"issue_description": "Bug report with oversized file."},
        files=[("files", ("large.txt", oversized, "text/plain"))],
    )
    assert response.status_code == 400
    assert "exceeds" in response.json()["detail"].lower()
    assert "200 kb" in response.json()["detail"].lower()


# 9. Analyzer configuration errors return a safe error response
def test_analyzer_configuration_error(monkeypatch: pytest.MonkeyPatch):
    """Verify that missing credentials or model return 503 Service Unavailable safely."""
    def raise_config_err(*args: Any, **kwargs: Any):
        raise AnalyzerConfigurationError("GEMINI_API_KEY environment variable is not set.")

    monkeypatch.setattr(api, "analyze_issue", raise_config_err)

    response = client.post(
        "/api/analyze",
        data={"issue_description": "Bug report."},
    )
    assert response.status_code == 503
    # Ensure sensitive environment details are not leaked
    assert "GEMINI_API_KEY" not in response.json()["detail"]
    assert "configuration" in response.json()["detail"].lower()


# 10. Upstream model errors return a safe error response
def test_upstream_model_api_error(monkeypatch: pytest.MonkeyPatch):
    """Verify that upstream API errors return 502 Bad Gateway safely."""
    def raise_api_err(*args: Any, **kwargs: Any):
        raise AnalyzerAPIError("Google API 429 Quota Exceeded.")

    monkeypatch.setattr(api, "analyze_issue", raise_api_err)

    response = client.post(
        "/api/analyze",
        data={"issue_description": "Bug report."},
    )
    assert response.status_code == 502
    assert "upstream ai model request failed" in response.json()["detail"].lower()


def test_upstream_api_error_502_sanitized_no_secret_in_logs(
    monkeypatch: pytest.MonkeyPatch, caplog
):
    """Verify the API returns sanitized 502 and logs status code without secrets."""
    secret_api_key = "sk-ant-v1fakeFAKEKEY0123456789abcdef"

    class UpstreamErr(Exception):
        code = 429

    def raise_with_chained_cause(*args: Any, **kwargs: Any):
        try:
            raise UpstreamErr("Quota exceeded for the model.")
        except UpstreamErr as upstream:
            raise AnalyzerAPIError(
                "Upstream AI API request failed with HTTP status 429: UpstreamErr"
            ) from upstream

    monkeypatch.setattr(api, "analyze_issue", raise_with_chained_cause)

    with caplog.at_level(logging.ERROR, logger="firstpatch.api"):
        response = client.post(
            "/api/analyze",
            data={"issue_description": "Bug report."},
        )

    assert response.status_code == 502
    detail = response.json()["detail"].lower()
    assert "upstream ai model request failed" in detail
    # Frontend must never see the upstream status code or secret
    assert secret_api_key not in response.text
    assert "authorization" not in response.text
    assert "429" not in response.text
    # Backend log should include the status code for diagnosis
    assert "429" in caplog.text
    # Backend log must not leak the secret or auth headers
    assert secret_api_key not in caplog.text
    assert "authorization" not in caplog.text.lower()


# 11. Unexpected exceptions do not expose tracebacks or secrets
def test_unexpected_exception_safety(monkeypatch: pytest.MonkeyPatch):
    """Verify that unexpected exceptions return 500 without leaking secrets or traces."""
    secret_internal_string = "SUPER_SECRET_TOKEN_DO_NOT_LEAK_9999"

    def raise_unexpected(*args: Any, **kwargs: Any):
        raise RuntimeError(f"Unexpected crash with {secret_internal_string}")

    monkeypatch.setattr(api, "analyze_issue", raise_unexpected)

    response = client.post(
        "/api/analyze",
        data={"issue_description": "Bug report."},
    )
    assert response.status_code == 500
    assert secret_internal_string not in response.text
    assert "Traceback" not in response.text
    assert response.json()["detail"] == "An unexpected internal server error occurred."


# 12. Invalid model output is handled safely
def test_invalid_model_output_error(monkeypatch: pytest.MonkeyPatch):
    """Verify that malformed model outputs return 502 Bad Gateway safely."""
    def raise_output_err(*args: Any, **kwargs: Any):
        raise AnalyzerOutputError("Model response was not valid JSON.")

    monkeypatch.setattr(api, "analyze_issue", raise_output_err)

    response = client.post(
        "/api/analyze",
        data={"issue_description": "Bug report."},
    )
    assert response.status_code == 502
    assert "upstream model output was malformed" in response.json()["detail"].lower()


# 13. CORS header validation
def test_cors_headers_for_allowed_origin():
    """Verify CORS preflight and request headers for local Vite origin."""
    response = client.options(
        "/api/analyze",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_cors_headers_rejected_for_disallowed_origin():
    """Verify CORS headers are not granted to arbitrary external origins."""
    response = client.options(
        "/api/analyze",
        headers={
            "Origin": "http://malicious-site.com",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert response.headers.get("access-control-allow-origin") is None
