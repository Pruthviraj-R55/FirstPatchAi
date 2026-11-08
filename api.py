"""FastAPI application for FirstPatch AI.

Exposes a safe endpoint `POST /api/analyze` for selected-file understanding and
optional issue investigation using the existing validation and OpenRouter analyzer modules.
"""

from __future__ import annotations

import asyncio
import logging
import os
import time
import uuid
from pathlib import Path
from typing import Any
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from firstpatch.analyzer import (
    AnalyzerAPIError,
    AnalyzerConfigurationError,
    AnalyzerError,
    AnalyzerOutputError,
    AnalyzerTimeoutError,
    _extract_http_status_code,
    AnalyzerValidationError,
    analyze_issue,
)
from firstpatch.files import (
    MAX_ANALYSIS_SOURCE_BYTES,
    MAX_COMBINED_SIZE_BYTES,
    MAX_FILE_SIZE_BYTES,
    MAX_ISSUE_DESCRIPTION_BYTES,
    MAX_FILE_COUNT,
    ALLOWED_EXTENSIONS_DISPLAY,
    FileValidationError,
    process_uploaded_files,
)

logger = logging.getLogger("firstpatch.api")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

app = FastAPI(
    title="FirstPatch AI API",
    description="Selected-file code understanding and optional issue investigation using OpenRouter.",
    version="1.0.0",
)

MAX_REQUEST_BODY_BYTES = MAX_COMBINED_SIZE_BYTES + 1_048_576  # Allow bounded multipart and issue-field overhead.


class RequestBodyTooLarge(Exception):
    """Internal signal used to stop parsing an oversized multipart request."""


class MultipartBodyLimitMiddleware:
    """Bound request bytes before FastAPI/Starlette parses multipart uploads."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or scope["method"] != "POST" or scope["path"] != "/api/analyze":
            await self.app(scope, receive, send)
            return

        headers = {key.lower(): value for key, value in scope.get("headers", [])}
        content_length = headers.get(b"content-length")
        if content_length:
            try:
                if int(content_length) > MAX_REQUEST_BODY_BYTES:
                    response = JSONResponse(
                        status_code=413,
                        content={"detail": f"Analysis request exceeds the {MAX_REQUEST_BODY_BYTES:,}-byte request-body safety limit."},
                    )
                    await response(scope, receive, send)
                    return
            except ValueError:
                pass

        received = 0

        async def bounded_receive():
            nonlocal received
            message = await receive()
            if message["type"] == "http.request":
                received += len(message.get("body", b""))
                if received > MAX_REQUEST_BODY_BYTES:
                    raise RequestBodyTooLarge()
            return message

        try:
            await self.app(scope, bounded_receive, send)
        except RequestBodyTooLarge:
            response = JSONResponse(
                status_code=413,
                content={"detail": f"Analysis request exceeds the {MAX_REQUEST_BODY_BYTES:,}-byte request-body safety limit."},
            )
            await response(scope, receive, send)


app.add_middleware(MultipartBodyLimitMiddleware)

# In the default single-origin deployment the frontend and API share an origin,
# so the browser does not need CORS. For split hosting, set CORS_ORIGINS to a
# comma-separated list of exact frontend origins.
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["POST", "OPTIONS", "GET"],
    allow_headers=["*"],
)


class InMemoryUploadedFile:
    """In-memory adapter matching the interface expected by process_uploaded_files()."""

    def __init__(self, name: str, content: bytes):
        self.name = name
        self.filename = name
        self._content = content

    def read(self) -> bytes:
        return self._content

    def getvalue(self) -> bytes:
        return self._content


CHUNK_SIZE = 16_384  # 16 KB chunks for bounded reading


def _positive_timeout_seconds(name: str, default: int) -> int:
    raw_value = os.environ.get(name, str(default)).strip()
    try:
        value = int(raw_value)
    except ValueError as exc:
        raise RuntimeError(f"{name} must be a positive integer number of seconds.") from exc
    if value < 1:
        raise RuntimeError(f"{name} must be a positive integer number of seconds.")
    return value


ANALYSIS_REQUEST_TIMEOUT_SECONDS = _positive_timeout_seconds(
    "ANALYSIS_REQUEST_TIMEOUT_SECONDS", 100
)


@app.get("/api/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint confirming API service readiness."""
    return {"status": "ok", "service": "FirstPatch AI API"}


@app.get("/api/config")
async def public_config() -> dict[str, Any]:
    """Expose non-secret upload and analysis constraints for frontend validation."""
    return {
        "max_file_size_bytes": MAX_FILE_SIZE_BYTES,
        "max_combined_upload_size_bytes": MAX_COMBINED_SIZE_BYTES,
        "max_analysis_source_bytes": MAX_ANALYSIS_SOURCE_BYTES,
        "max_issue_description_bytes": MAX_ISSUE_DESCRIPTION_BYTES,
        "max_files": MAX_FILE_COUNT,
        "allowed_extensions": sorted(ext.lstrip(".") for ext in ALLOWED_EXTENSIONS_DISPLAY.split(", ")),
    }


@app.post("/api/analyze")
async def analyze_endpoint(
    issue_description: str = Form(default=""),
    files: list[UploadFile] = File(default=[]),
) -> dict[str, Any]:
    """Analyze uploaded source files and optional issue context.

    Args:
        issue_description: Optional problem description or bug report.
        files: Zero or more candidate source code files.

    Returns:
        JSON response with five contribution fields and additive code-understanding fields:
        - issue_summary
        - relevant_files
        - contribution_plan
        - suggested_tests
        - uncertainties
        - project_overview
        - file_explanations
        - potential_issues
        - missing_context
    """
    cleaned_issue = issue_description.strip()
    if len(cleaned_issue.encode("utf-8")) > MAX_ISSUE_DESCRIPTION_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=f"Issue description exceeds the {MAX_ISSUE_DESCRIPTION_BYTES:,}-byte limit. Shorten the description and retry.",
        )
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Upload at least one source file. An issue description is optional.",
        )
    if len(files) > MAX_FILE_COUNT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A maximum of {MAX_FILE_COUNT} files may be uploaded per analysis.",
        )

    adapted_files: list[InMemoryUploadedFile] = []
    cumulative_bytes = 0

    try:
        try:
            # Bounded streaming read: reject each file and the request total before joining or decoding.
            for upload in files:
                filename = upload.filename or "unnamed_file"
                file_chunks: list[bytes] = []
                file_bytes = 0

                while True:
                    chunk = await upload.read(CHUNK_SIZE)
                    if not chunk:
                        break
                    file_bytes += len(chunk)
                    cumulative_bytes += len(chunk)
                    if file_bytes > MAX_FILE_SIZE_BYTES:
                        raise HTTPException(
                            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                            detail=f"File '{filename}' exceeds the individual file limit of {MAX_FILE_SIZE_BYTES:,} bytes ({MAX_FILE_SIZE_BYTES // 1024} KiB).",
                        )
                    if cumulative_bytes > MAX_COMBINED_SIZE_BYTES:
                        raise HTTPException(
                            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                            detail=f"Combined upload exceeds the {MAX_COMBINED_SIZE_BYTES:,}-byte limit ({MAX_COMBINED_SIZE_BYTES // (1024 * 1024)} MiB).",
                        )
                    file_chunks.append(chunk)

                file_content = b"".join(file_chunks)
                adapted_files.append(InMemoryUploadedFile(name=filename, content=file_content))

            # Step 1: Process and validate uploaded files in-memory using existing logic
            files_map = process_uploaded_files(adapted_files)
        finally:
            # Ensure underlying file descriptors are closed safely
            for upload in files:
                try:
                    await upload.close()
                except Exception:
                    pass
    except FileValidationError as fve:
        logger.warning("File validation failed: %s", fve)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File validation error: {fve}",
        ) from fve

    source_bytes = sum(len(content.encode("utf-8")) for content in files_map.values())
    if source_bytes > MAX_ANALYSIS_SOURCE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=(
                f"The selected files total {source_bytes:,} bytes, which exceeds the current model analysis context budget "
                f"of {MAX_ANALYSIS_SOURCE_BYTES:,} source bytes. Files are never truncated; remove files or choose a smaller subset."
            ),
        )

    # Log request metadata only (never log file contents or secrets)
    request_id = uuid.uuid4().hex
    analysis_started = time.monotonic()
    logger.info(
        "Processing analysis request request_id=%s issue_length=%d file_count=%d timeout_seconds=%d",
        request_id,
        len(cleaned_issue),
        len(files_map),
        ANALYSIS_REQUEST_TIMEOUT_SECONDS,
    )

    # Step 2: Run synchronous analyzer in a threadpool to prevent blocking the event loop
    try:
        raw_analysis = await asyncio.wait_for(
            asyncio.to_thread(
                analyze_issue,
                issue_description=cleaned_issue,
                files=files_map,
                request_id=request_id,
            ),
            timeout=ANALYSIS_REQUEST_TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError as exc:
        duration_ms = round((time.monotonic() - analysis_started) * 1000)
        logger.error(
            "Analysis timed out request_id=%s duration_ms=%d timeout_seconds=%d",
            request_id,
            duration_ms,
            ANALYSIS_REQUEST_TIMEOUT_SECONDS,
        )
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Analysis timed out while waiting for the upstream model. Please retry.",
        ) from exc
    except AnalyzerTimeoutError as exc:
        duration_ms = round((time.monotonic() - analysis_started) * 1000)
        logger.error("Analysis upstream timeout request_id=%s duration_ms=%d", request_id, duration_ms)
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="The upstream model request timed out. Please retry.",
        ) from exc
    except AnalyzerValidationError as ave:
        logger.warning(
            "Analysis failed request_id=%s duration_ms=%d category=validation",
            request_id,
            round((time.monotonic() - analysis_started) * 1000),
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ave),
        ) from ave
    except AnalyzerConfigurationError as ace:
        logger.error(
            "Analysis failed request_id=%s duration_ms=%d category=configuration",
            request_id,
            round((time.monotonic() - analysis_started) * 1000),
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Analyzer service is unavailable due to missing server configuration.",
        ) from ace
    except AnalyzerOutputError as aoe:
        logger.error(
            "Analysis failed request_id=%s duration_ms=%d category=invalid_output",
            request_id,
            round((time.monotonic() - analysis_started) * 1000),
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Upstream model output was malformed or failed validation.",
        ) from aoe
    except AnalyzerAPIError as aae:
        upstream_status = aae.status_code or _extract_http_status_code(aae)
        logger.error(
            "Analysis failed request_id=%s duration_ms=%d category=%s status_code=%s error_type=%s retryable=%s",
            request_id,
            round((time.monotonic() - analysis_started) * 1000),
            aae.category,
            upstream_status or "none",
            type(aae).__name__,
            aae.retryable,
        )
        if aae.category == "quota_exhausted":
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="The OpenRouter free-model quota may be exhausted. Check the account's free usage limits; no paid model fallback is used.",
            ) from aae
        if aae.category == "rate_limited":
            headers = {"Retry-After": str(aae.retry_after_seconds)} if aae.retry_after_seconds else None
            retry_detail = (
                f"Retry after approximately {aae.retry_after_seconds} seconds."
                if aae.retry_after_seconds else "Wait briefly before trying again."
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"OpenRouter is temporarily rate-limiting requests. {retry_detail}",
                headers=headers,
            ) from aae
        if aae.category == "authentication" or upstream_status in {401, 403}:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="The analyzer could not authenticate with OpenRouter. Check the server-side API key and account access.",
            ) from aae
        if aae.category == "network":
            network_headers = {"X-Analysis-Retryable": "true"} if aae.retryable else {}
            if aae.retry_after_seconds:
                network_headers["Retry-After"] = str(aae.retry_after_seconds)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="The analyzer could not reach OpenRouter. Check server network connectivity, then retry.",
                headers=network_headers or None,
            ) from aae
        if upstream_status == 400 or aae.category == "invalid_request":
            detail = (
                "OpenRouter rejected the analysis request. Check the configured free model and request compatibility."
            )
        else:
            detail = "OpenRouter could not complete the analysis because of an upstream service error. Retry later if the issue is temporary."
        retry_headers = {"X-Analysis-Retryable": "true"} if aae.retryable else {}
        if aae.retry_after_seconds:
            retry_headers["Retry-After"] = str(aae.retry_after_seconds)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=detail,
            headers=retry_headers or None,
        ) from aae
    except AnalyzerError as ae:
        logger.error(
            "Analysis failed request_id=%s duration_ms=%d category=analyzer",
            request_id,
            round((time.monotonic() - analysis_started) * 1000),
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while analyzing the issue.",
        ) from ae
    except Exception as exc:
        logger.error(
            "Analysis failed request_id=%s duration_ms=%d category=internal error_type=%s",
            request_id,
            round((time.monotonic() - analysis_started) * 1000),
            type(exc).__name__,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected internal server error occurred.",
        ) from exc

    # Step 3: Enforce public response contract (exclude internal metadata like unknown_files_removed)
    logger.info(
        "Analysis completed request_id=%s duration_ms=%d",
        request_id,
        round((time.monotonic() - analysis_started) * 1000),
    )
    return {
        "issue_summary": raw_analysis.get("issue_summary", ""),
        "relevant_files": raw_analysis.get("relevant_files", []),
        "contribution_plan": raw_analysis.get("contribution_plan", []),
        "suggested_tests": raw_analysis.get("suggested_tests", []),
        "uncertainties": raw_analysis.get("uncertainties", []),
        "project_overview": raw_analysis.get("project_overview", ""),
        "file_explanations": raw_analysis.get("file_explanations", []),
        "potential_issues": raw_analysis.get("potential_issues", []),
        "missing_context": raw_analysis.get("missing_context", []),
    }


# The production image copies the Vite build here. Keeping the frontend optional
# lets the API remain easy to run independently during local development/tests.
FRONTEND_DIST = Path(os.getenv("FRONTEND_DIST", Path(__file__).parent / "frontend" / "dist"))
if (FRONTEND_DIST / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")


@app.get("/{frontend_path:path}", include_in_schema=False)
async def frontend_entry(frontend_path: str):
    """Serve the Vite app and support client-side routes in production."""
    if frontend_path == "api" or frontend_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="Not found")
    index_file = FRONTEND_DIST / "index.html"
    if not index_file.is_file():
        raise HTTPException(status_code=404, detail="Not found")

    requested_file = (FRONTEND_DIST / frontend_path).resolve()
    if requested_file != FRONTEND_DIST.resolve() and FRONTEND_DIST.resolve() not in requested_file.parents:
        raise HTTPException(status_code=404, detail="Not found")
    if requested_file.is_file():
        return FileResponse(requested_file)
    return FileResponse(index_file)


@app.get("/", include_in_schema=False)
async def frontend_root():
    """Serve the Vite app at the root in production."""
    index_file = FRONTEND_DIST / "index.html"
    if index_file.is_file():
        return FileResponse(index_file)
    return {"service": "FirstPatch AI API", "docs": "/docs", "health": "/api/health"}
