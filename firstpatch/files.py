"""Safe file processing utilities for FirstPatch AI.

Provides reusable functions to validate, read, and decode uploaded text files
in-memory without disk writes or code execution.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Iterable

# Maximum total upload size in bytes (200 KB = 200 * 1024)
MAX_COMBINED_SIZE_BYTES: int = 204_800

# Allowed file extensions for issue context
ALLOWED_EXTENSIONS: frozenset[str] = frozenset(
    {
        ".py",
        ".js",
        ".ts",
        ".java",
        ".c",
        ".cpp",
        ".md",
        ".txt",
        ".json",
        ".yml",
        ".yaml",
        ".toml",
    }
)

ALLOWED_EXTENSIONS_DISPLAY: str = ", ".join(sorted(ALLOWED_EXTENSIONS))


class FileValidationError(ValueError):
    """Raised when an uploaded file fails validation."""


def get_file_name(file: Any) -> str:
    """Extract and validate the filename from an uploaded file object.

    Args:
        file: An uploaded file object (e.g. Streamlit UploadedFile or fake).

    Returns:
        The validated filename string.

    Raises:
        FileValidationError: If the file object does not expose a valid filename.
    """
    if file is None:
        raise FileValidationError("File object cannot be None.")

    name = getattr(file, "name", None)
    if name is None:
        name = getattr(file, "filename", None)

    if not isinstance(name, str) or not name.strip():
        raise FileValidationError(
            f"Uploaded file object {file!r} does not expose a valid 'name' or 'filename' attribute."
        )

    return name.strip()


def validate_extension(filename: str) -> str:
    """Validate that the filename has a supported extension.

    Extensions are compared case-insensitively.

    Args:
        filename: Name of the file including its extension.

    Returns:
        The normalized lowercase extension (e.g. '.py').

    Raises:
        FileValidationError: If the file has no extension or an unsupported extension.
    """
    if not isinstance(filename, str) or not filename.strip():
        raise FileValidationError("Filename must be a non-empty string.")

    ext = Path(filename.strip()).suffix.lower()

    if not ext:
        raise FileValidationError(
            f"File '{filename}' has no extension. "
            f"Allowed extensions: {ALLOWED_EXTENSIONS_DISPLAY}."
        )

    if ext not in ALLOWED_EXTENSIONS:
        raise FileValidationError(
            f"File '{filename}' has an unsupported extension '{ext}'. "
            f"Allowed extensions: {ALLOWED_EXTENSIONS_DISPLAY}."
        )

    return ext


def read_file_bytes(file: Any) -> bytes:
    """Read raw binary content from an uploaded file into memory.

    Accepts Streamlit UploadedFile or file-like objects exposing either
    a callable .getvalue() or .read() method. Content is never written to disk.

    Args:
        file: An uploaded file object.

    Returns:
        The file content as raw bytes.

    Raises:
        FileValidationError: If the file object lacks a byte-reading method
            or if reading fails to return bytes.
    """
    if file is None:
        raise FileValidationError("File object cannot be None.")

    name = getattr(file, "name", None) or getattr(file, "filename", "unnamed file")

    if hasattr(file, "getvalue") and callable(file.getvalue):
        data = file.getvalue()
    elif hasattr(file, "read") and callable(file.read):
        data = file.read()
    else:
        raise FileValidationError(
            f"File '{name}' does not expose a supported byte-reading method (.getvalue() or .read())."
        )

    if not isinstance(data, (bytes, bytearray)):
        raise FileValidationError(
            f"File '{name}' did not return binary data (expected bytes, got {type(data).__name__})."
        )

    # If the file object supports seek, reset stream pointer for polite caller reuse
    if hasattr(file, "seek") and callable(file.seek):
        try:
            file.seek(0)
        except Exception:
            pass

    return bytes(data)


def decode_file_bytes(content_bytes: bytes, filename: str = "uploaded file") -> str:
    """Safely decode raw bytes as UTF-8 text without code execution.

    Args:
        content_bytes: Raw binary data.
        filename: Filename used for informative error reporting.

    Returns:
        The decoded text string.

    Raises:
        FileValidationError: If content cannot be decoded using UTF-8.
    """
    try:
        return content_bytes.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise FileValidationError(
            f"File '{filename}' contains invalid text encoding. "
            f"Only valid UTF-8 text files are supported."
        ) from exc


def process_uploaded_files(files: Iterable[Any] | None) -> dict[str, str]:
    """Validate, read, and decode uploaded text files into an in-memory mapping.

    Performs validation in strict stages:
    1. Validates input collection (rejects invalid input types, handles empty/None).
    2. Validates filenames and extensions BEFORE reading content.
    3. Detects duplicate filenames to prevent silent overwrites.
    4. Reads raw bytes into memory and rejects empty (0-byte) files.
    5. Calculates combined upload size from actual bytes and enforces the 200 KB limit.
    6. Safely decodes UTF-8 text without executing any code.

    Args:
        files: Iterable of Streamlit-style uploaded file objects, or None.

    Returns:
        A dictionary mapping validated filenames to their decoded text content.

    Raises:
        FileValidationError: If any validation rule is violated.
    """
    if files is None:
        return {}

    if isinstance(files, (str, bytes)):
        raise FileValidationError(
            "Expected an iterable of file objects, got string or bytes."
        )

    try:
        file_list = list(files)
    except TypeError:
        raise FileValidationError(
            f"Expected an iterable collection of file objects, got {type(files).__name__}."
        )

    if not file_list:
        return {}

    # Stage 1: Validate file objects, filenames, duplicate detection, and extensions BEFORE reading bytes
    validated_files: list[tuple[str, Any]] = []
    seen_names: set[str] = set()

    for index, file_obj in enumerate(file_list):
        if file_obj is None:
            raise FileValidationError(f"File item at index {index} is None.")

        filename = get_file_name(file_obj)

        if filename in seen_names:
            raise FileValidationError(
                f"Duplicate filename detected: '{filename}'. "
                f"Each uploaded file must have a unique filename."
            )
        seen_names.add(filename)

        # Validate extension before any content is read
        validate_extension(filename)

        validated_files.append((filename, file_obj))

    # Stage 2: Read bytes in memory, check empty files, calculate cumulative size, decode UTF-8
    total_bytes = 0
    results: dict[str, str] = {}

    for filename, file_obj in validated_files:
        raw_bytes = read_file_bytes(file_obj)

        if len(raw_bytes) == 0:
            raise FileValidationError(
                f"File '{filename}' is empty (0 bytes). Empty files cannot be processed."
            )

        total_bytes += len(raw_bytes)
        if total_bytes > MAX_COMBINED_SIZE_BYTES:
            raise FileValidationError(
                f"Combined upload size ({total_bytes:,} bytes) exceeds "
                f"the maximum limit of {MAX_COMBINED_SIZE_BYTES:,} bytes (200 KB)."
            )

        # Safely decode UTF-8 without executing code
        text_content = decode_file_bytes(raw_bytes, filename=filename)
        results[filename] = text_content

    return results
