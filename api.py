"""FastAPI application for FirstPatch AI.

Exposes a safe, minimal endpoint `POST /api/analyze` that reuses the existing
file processing and Gemma analyzer modules without modifying them or exposing secrets.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from firstpatch.analyzer import (
    AnalyzerAPIError,
    AnalyzerConfigurationError,
    AnalyzerError,
    AnalyzerOutputError,
    AnalyzerValidationError,
    analyze_issue,
)
from firstpatch.files import (
    MAX_COMBINED_SIZE_BYTES,
    FileValidationError,
    process_uploaded_files,
)

logger = logging.getLogger("firstpatch.api")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

app = FastAPI(
    title="FirstPatch AI API",
    description="Minimal REST API exposing safe issue analysis powered by Google Gemma.",
    version="1.0.0",
)

# CORS: Restricted strictly to local React development server origins
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
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


@app.get("/api/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint confirming API service readiness."""
    return {"status": "ok", "service": "FirstPatch AI API"}


@app.post("/api/analyze")
async def analyze_endpoint(
    issue_description: str = Form(default=""),
    files: list[UploadFile] = File(default=[]),
) -> dict[str, Any]:
    """Analyze a GitHub issue description and optional source files.

    Args:
        issue_description: Problem description or bug report.
        files: Zero or more candidate source code files.

    Returns:
        JSON response with the 5 required fields:
        - issue_summary
        - relevant_files
        - contribution_plan
        - suggested_tests
        - uncertainties
    """
    cleaned_issue = issue_description.strip()
    if not cleaned_issue:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Issue description must be a non-empty string.",
        )

    adapted_files: list[InMemoryUploadedFile] = []
    cumulative_bytes = 0

    try:
        try:
            # Bounded streaming read: halt immediately if cumulative upload size exceeds 200 KB
            for upload in files:
                filename = upload.filename or "unnamed_file"
                file_chunks: list[bytes] = []

                while True:
                    chunk = await upload.read(CHUNK_SIZE)
                    if not chunk:
                        break
                    cumulative_bytes += len(chunk)
                    if cumulative_bytes > MAX_COMBINED_SIZE_BYTES:
                        raise FileValidationError(
                            f"Combined upload size ({cumulative_bytes:,} bytes) exceeds "
                            f"the maximum allowed limit of {MAX_COMBINED_SIZE_BYTES:,} bytes (200 KB)."
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

    # Log request metadata only (never log file contents or secrets)
    logger.info(
        "Processing analysis request: issue_length=%d, file_count=%d",
        len(cleaned_issue),
        len(files_map),
    )

    # Step 2: Run synchronous analyzer in a threadpool to prevent blocking the event loop
    try:
        raw_analysis = await asyncio.to_thread(
            analyze_issue,
            issue_description=cleaned_issue,
            files=files_map,
        )
    except AnalyzerValidationError as ave:
        logger.warning("Analyzer validation error: %s", ave)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ave),
        ) from ave
    except AnalyzerConfigurationError as ace:
        logger.error("Analyzer configuration missing or incomplete: %s", ace)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Analyzer service is unavailable due to missing server configuration.",
        ) from ace
    except AnalyzerOutputError as aoe:
        logger.error("Analyzer returned invalid model output: %s", aoe)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Upstream model output was malformed or failed validation.",
        ) from aoe
    except AnalyzerAPIError as aae:
        logger.error("Upstream model API call failed: %s", aae)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Upstream AI model request failed. Please check network connectivity or quota.",
        ) from aae
    except AnalyzerError as ae:
        logger.error("General analyzer error: %s", ae)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while analyzing the issue.",
        ) from ae
    except Exception as exc:
        logger.exception("Unexpected error during analysis")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected internal server error occurred.",
        ) from exc

    # Step 3: Enforce public response contract (exclude internal metadata like unknown_files_removed)
    return {
        "issue_summary": raw_analysis.get("issue_summary", ""),
        "relevant_files": raw_analysis.get("relevant_files", []),
        "contribution_plan": raw_analysis.get("contribution_plan", []),
        "suggested_tests": raw_analysis.get("suggested_tests", []),
        "uncertainties": raw_analysis.get("uncertainties", []),
    }
