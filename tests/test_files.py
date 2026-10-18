"""Automated unit tests for FirstPatch AI uploaded-file processing.

Uses in-memory fake uploaded-file objects and does not require the Streamlit
server or any API keys.
"""

import io
import pytest

from firstpatch.files import (
    ALLOWED_EXTENSIONS,
    MAX_COMBINED_SIZE_BYTES,
    FileValidationError,
    decode_file_bytes,
    get_file_name,
    process_uploaded_files,
    read_file_bytes,
    validate_extension,
)


class FakeUploadedFile:
    """In-memory fake of a Streamlit UploadedFile object."""

    def __init__(self, name: str, content: bytes | str):
        self.name = name
        if isinstance(content, str):
            self._bytes = content.encode("utf-8")
        else:
            self._bytes = bytes(content)

    def read(self) -> bytes:
        return self._bytes

    def getvalue(self) -> bytes:
        return self._bytes


class FakeUploadedFileFilenameAttr:
    """Fake uploaded file exposing .filename instead of .name and only .read()."""

    def __init__(self, filename: str, content: bytes | str):
        self.filename = filename
        if isinstance(content, str):
            self._bytes = content.encode("utf-8")
        else:
            self._bytes = bytes(content)

    def read(self) -> bytes:
        return self._bytes


# 1. Valid supported text files
def test_valid_supported_text_files():
    """Verify that multiple valid files across supported languages are processed."""
    files = [
        FakeUploadedFile("main.py", "def add(a, b):\n    return a + b\n"),
        FakeUploadedFile("index.ts", "export const message: string = 'hello';"),
        FakeUploadedFile("config.json", '{"debug": true, "version": 1}'),
        FakeUploadedFile("README.md", "# Project Documentation\n\nAll good."),
    ]

    result = process_uploaded_files(files)

    assert isinstance(result, dict)
    assert len(result) == 4
    assert result["main.py"] == "def add(a, b):\n    return a + b\n"
    assert result["index.ts"] == "export const message: string = 'hello';"
    assert result["config.json"] == '{"debug": true, "version": 1}'
    assert result["README.md"] == "# Project Documentation\n\nAll good."


def test_all_allowed_extensions_individually():
    """Verify that every single extension in ALLOWED_EXTENSIONS is accepted."""
    for ext in ALLOWED_EXTENSIONS:
        filename = f"sample{ext}"
        content = f"Sample content for {ext}"
        result = process_uploaded_files([FakeUploadedFile(filename, content)])
        assert filename in result
        assert result[filename] == content


def test_case_insensitive_extensions():
    """Verify extensions are validated case-insensitively (e.g. .PY, .JSON)."""
    files = [
        FakeUploadedFile("TEST.PY", "print('uppercase extension')"),
        FakeUploadedFile("SETTINGS.JSON", '{"key": "val"}'),
    ]
    result = process_uploaded_files(files)
    assert "TEST.PY" in result
    assert "SETTINGS.JSON" in result


# 2. Unsupported file extensions
def test_unsupported_file_extensions():
    """Verify rejection of files with unsupported extensions."""
    invalid_files = [
        FakeUploadedFile("malicious.exe", b"binary executable content"),
        FakeUploadedFile("archive.zip", b"zip archive content"),
        FakeUploadedFile("image.png", b"\x89PNG\r\n\x1a\n"),
        FakeUploadedFile("script.sh", "echo 'bash script'"),
    ]

    for file_obj in invalid_files:
        with pytest.raises(FileValidationError) as exc_info:
            process_uploaded_files([file_obj])
        assert "unsupported extension" in str(exc_info.value).lower()


def test_files_without_extension():
    """Verify rejection of files that lack an extension."""
    files = [FakeUploadedFile("Makefile", "all:\n\tgcc main.c")]
    with pytest.raises(FileValidationError) as exc_info:
        process_uploaded_files(files)
    assert "no extension" in str(exc_info.value).lower()


def test_extension_validated_before_reading():
    """Verify extensions are validated before reading bytes.

    If an invalid file extension is passed, read() should never be called.
    """
    class ExplodingFile:
        name = "bad_file.bin"

        def read(self):
            raise AssertionError("read() should not be called when extension is invalid!")

        def getvalue(self):
            raise AssertionError("getvalue() should not be called when extension is invalid!")

    with pytest.raises(FileValidationError) as exc_info:
        process_uploaded_files([ExplodingFile()])
    assert "unsupported extension" in str(exc_info.value).lower()


# 3. Empty files
def test_empty_files_rejected():
    """Verify that empty (0-byte) files are rejected with a clear error."""
    files = [FakeUploadedFile("empty.py", b"")]
    with pytest.raises(FileValidationError) as exc_info:
        process_uploaded_files(files)
    assert "empty" in str(exc_info.value).lower()
    assert "empty.py" in str(exc_info.value)


def test_empty_file_in_mixed_upload():
    """Verify that an empty file among valid files halts processing safely."""
    files = [
        FakeUploadedFile("valid.py", "x = 1"),
        FakeUploadedFile("zero_length.md", b""),
    ]
    with pytest.raises(FileValidationError) as exc_info:
        process_uploaded_files(files)
    assert "zero_length.md" in str(exc_info.value)
    assert "empty" in str(exc_info.value).lower()


# 4. Invalid UTF-8 content
def test_invalid_utf8_content():
    """Verify that non-UTF-8 content triggers a clear validation error."""
    invalid_bytes = b"\xff\xfe\x00\x00\x80\x81\x82"
    files = [FakeUploadedFile("bad_encoding.txt", invalid_bytes)]

    with pytest.raises(FileValidationError) as exc_info:
        process_uploaded_files(files)

    assert "invalid text encoding" in str(exc_info.value).lower() or "utf-8" in str(exc_info.value).lower()
    assert "bad_encoding.txt" in str(exc_info.value)


# 5. Combined uploads below the size limit
def test_combined_uploads_below_size_limit():
    """Verify multiple files under the 200 KB limit process successfully."""
    # 50 KB + 50 KB = 100 KB (well below 204,800 bytes)
    chunk = "a" * (50 * 1024)
    files = [
        FakeUploadedFile("file1.txt", chunk),
        FakeUploadedFile("file2.txt", chunk),
    ]

    result = process_uploaded_files(files)
    assert len(result) == 2
    assert len(result["file1.txt"]) == 50 * 1024
    assert len(result["file2.txt"]) == 50 * 1024


def test_exact_limit_boundary():
    """Verify that an upload with combined size exactly equal to 204,800 bytes succeeds."""
    exact_content = b"x" * MAX_COMBINED_SIZE_BYTES
    files = [FakeUploadedFile("boundary.txt", exact_content)]

    result = process_uploaded_files(files)
    assert "boundary.txt" in result
    assert len(result["boundary.txt"]) == MAX_COMBINED_SIZE_BYTES


# 6. Combined uploads exceeding 200 KB
def test_single_file_exceeding_size_limit():
    """Verify that a single file exceeding 204,800 bytes is rejected."""
    oversized_content = b"x" * (MAX_COMBINED_SIZE_BYTES + 1)
    files = [FakeUploadedFile("oversized.py", oversized_content)]

    with pytest.raises(FileValidationError) as exc_info:
        process_uploaded_files(files)

    assert "exceeds" in str(exc_info.value).lower()
    assert "200 kb" in str(exc_info.value).lower()


def test_combined_multiple_files_exceeding_size_limit():
    """Verify that multiple files whose sum exceeds 204,800 bytes are rejected."""
    # 110 KB + 110 KB = 220 KB (> 200 KB)
    chunk = b"x" * (110 * 1024)
    files = [
        FakeUploadedFile("part1.py", chunk),
        FakeUploadedFile("part2.py", chunk),
    ]

    with pytest.raises(FileValidationError) as exc_info:
        process_uploaded_files(files)

    assert "exceeds" in str(exc_info.value).lower()


# 7. Duplicate filenames
def test_duplicate_filenames_rejected():
    """Verify duplicate filenames are rejected rather than overwritten."""
    files = [
        FakeUploadedFile("service.py", "def service_one(): pass"),
        FakeUploadedFile("service.py", "def service_two(): pass"),
    ]

    with pytest.raises(FileValidationError) as exc_info:
        process_uploaded_files(files)

    assert "duplicate filename" in str(exc_info.value).lower()
    assert "service.py" in str(exc_info.value)


# 8. An empty upload list
def test_empty_upload_list():
    """Verify that passing an empty list returns an empty mapping without errors."""
    result = process_uploaded_files([])
    assert result == {}


def test_none_upload_input():
    """Verify that passing None returns an empty mapping without errors."""
    result = process_uploaded_files(None)
    assert result == {}


def test_invalid_input_types():
    """Verify that non-collection inputs or invalid types raise FileValidationError."""
    with pytest.raises(FileValidationError):
        process_uploaded_files("not a list")  # type: ignore[arg-type]

    with pytest.raises(FileValidationError):
        process_uploaded_files(12345)  # type: ignore[arg-type]

    with pytest.raises(FileValidationError):
        process_uploaded_files([None])  # list containing None


# 9. Content that resembles code is returned as text and never executed
def test_code_content_is_returned_as_text_and_never_executed():
    """Verify code containing potentially dangerous constructs is purely passive text."""
    side_effect_tracker = {"executed": False}

    malicious_code = (
        "import sys\n"
        "# If executed, this would crash or fail\n"
        "raise RuntimeError('Code execution was triggered!')\n"
    )

    files = [FakeUploadedFile("exploit.py", malicious_code)]

    # This call must NOT execute the code, so no RuntimeError is raised
    result = process_uploaded_files(files)

    assert "exploit.py" in result
    assert result["exploit.py"] == malicious_code
    assert side_effect_tracker["executed"] is False


# Additional unit tests for individual public functions
def test_get_file_name_helper():
    """Test get_file_name handles name, filename, and invalid inputs."""
    assert get_file_name(FakeUploadedFile("test.py", "x = 1")) == "test.py"
    assert get_file_name(FakeUploadedFileFilenameAttr("test2.js", "let y = 2;")) == "test2.js"

    with pytest.raises(FileValidationError):
        get_file_name(None)

    class NoNameObj:
        pass

    with pytest.raises(FileValidationError):
        get_file_name(NoNameObj())


def test_validate_extension_helper():
    """Test validate_extension standalone helper."""
    assert validate_extension("test.py") == ".py"
    assert validate_extension("path/to/FILE.YAML") == ".yaml"

    with pytest.raises(FileValidationError):
        validate_extension("invalid.pdf")

    with pytest.raises(FileValidationError):
        validate_extension("")


def test_read_file_bytes_helper():
    """Test read_file_bytes standalone helper."""
    fake = FakeUploadedFile("sample.py", b"hello world")
    assert read_file_bytes(fake) == b"hello world"

    class BadFileObj:
        name = "bad.py"

    with pytest.raises(FileValidationError):
        read_file_bytes(BadFileObj())


def test_decode_file_bytes_helper():
    """Test decode_file_bytes standalone helper."""
    assert decode_file_bytes(b"hello world", "test.txt") == "hello world"

    with pytest.raises(FileValidationError):
        decode_file_bytes(b"\x80\x81", "test.txt")
