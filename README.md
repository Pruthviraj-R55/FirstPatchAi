# FirstPatch AI

**An AI-powered open-source contribution onboarding assistant for beginners.**

FirstPatch AI helps developers understand open-source issues, identify relevant codebase context, and plan their first contributions with confidence.

By analyzing an issue description alongside user-supplied repository files, FirstPatch AI generates a structured contribution roadmap containing an issue summary, relevant files, actionable implementation steps, suggested tests, and important uncertainties or assumptions.

The project includes a Streamlit application for interactive analysis and offline demonstration, alongside a React + TypeScript frontend backed by a FastAPI REST API.

## What It Does

### Capabilities

- **Issue Analysis:** Explains problem statements and bug reports in beginner-friendly language.
- **Relevant File Identification:** Identifies potentially relevant files from user-supplied source code and explains their relevance.
- **Actionable Contribution Planning:** Breaks a problem into manageable implementation steps.
- **Test Suggestions:** Recommends unit tests, edge cases, and expected behaviors to verify.
- **Uncertainty Reporting:** Highlights assumptions, missing context, and questions that may require further investigation.
- **Structured AI Responses:** Uses JSON output configuration and strict application-level validation to maintain a consistent five-section response.
- **Prompt Injection Awareness:** Treats issue descriptions and uploaded file contents as untrusted input, with instructions designed to reduce the risk of following malicious embedded directions.
- **Safe In-Memory File Processing:** Validates and decodes supported text files in memory without executing uploaded code or writing uploaded contents to disk.
- **Offline Demo Mode:** Provides a fixed sample analysis without API credentials or network access.
- **Multiple Interfaces:** Supports both a Streamlit interface and a React + TypeScript workspace using FastAPI.

### Current Limitations

- **Read-Only and Advisory:** FirstPatch AI does not implement fixes, execute uploaded code, run the analyzed repository's tests, or create pull requests automatically.
- **User-Supplied Context:** Relevant-file identification is limited to the files provided; the application does not automatically inspect an entire GitHub repository.
- **Upload Constraints:** Supports 12 text file extensions and a maximum combined upload size of 200 KB (204,800 bytes).
- **Model Dependent:** Live analysis requires a valid Google Gen AI API key and a supported model identifier.
- **Output Validation:** Responses that do not meet the required schema are rejected rather than silently converted into valid-looking results.
- **Local Development:** The documented setup runs the application locally; a public cloud deployment is not provided by this guide.

## File Upload Constraints

FirstPatch AI validates uploaded files before processing their contents.

- **Supported extensions:** `.py`, `.js`, `.ts`, `.java`, `.c`, `.cpp`, `.md`, `.txt`, `.json`, `.yml`, `.yaml`, `.toml` (case-insensitive).
- **Combined size limit:** 200 KB (204,800 bytes), calculated from the actual uploaded file bytes.
- **Encoding:** Valid UTF-8 text only.
- **Empty files:** Rejected.
- **Duplicate filenames:** Rejected.
- **Unsupported extensions:** Rejected.
- **Execution and storage:** Uploaded files are processed in memory; their contents are not executed, imported, or written to disk by the file-processing workflow.

These restrictions reduce risk but do not make arbitrary uploaded content inherently trustworthy.

## Modes of Operation

### 1. Streamlit Demo Mode — Offline Sample

The Streamlit application includes a **Demo mode (offline sample)** option.

- Runs without API credentials or external model requests.
- Displays a fixed, realistic five-section example analysis referencing [`samples/username_validator.py`](samples/username_validator.py).
- Clearly distinguishes sample output from live model-generated results.
- Does not analyze arbitrary uploaded files while using the fixed sample demonstration.

Demo mode is useful for exploring the interface without consuming model API quota.

### 2. Live AI Analysis

With demo mode disabled, the application uses the official `google-genai` SDK to request analysis from the configured Google AI model.

- Accepts an issue description and optional uploaded source files.
- Supports issue-only analysis when no files are supplied, where permitted by the interface.
- Uses structured-output configuration to request a JSON object matching the expected response schema.
- Validates the model response before returning the analysis.
- Reports errors when the upstream request fails or the returned content does not satisfy the expected format.

AI-generated suggestions are advisory and should be reviewed before implementation.

### 3. React + FastAPI Workspace

The React frontend provides a workspace for submitting issues, uploading files, and viewing the generated analysis.

The FastAPI backend handles request validation, invokes the analyzer, and returns structured results to the frontend.

## Analysis Response Structure

A successful analysis contains five sections:

| Field | Description |
|---|---|
| `issue_summary` | A concise explanation of the reported issue |
| `relevant_files` | Candidate filenames and reasons they may be relevant |
| `contribution_plan` | Actionable steps for investigating and addressing the issue |
| `suggested_tests` | Recommended tests and edge cases |
| `uncertainties` | Assumptions, missing context, and unresolved questions |

The application validates the response structure and field types. A successful HTTP response from the model provider does not, by itself, guarantee a valid application-level result.

## Tech Stack

| Component | Technology |
|---|---|
| Language | Python |
| AI integration | Google Gen AI SDK (`google-genai`) |
| AI model | Configurable through `GEMINI_MODEL` |
| Backend | FastAPI, Uvicorn |
| Frontend | React, TypeScript, Vite |
| Alternative interface | Streamlit |
| Automated testing | pytest |

## Getting Started — Windows PowerShell

### Prerequisites

Install the following:

- Python 3.10 or newer, compatible with the project's dependencies
- Node.js and npm (for the React frontend)
- Windows PowerShell
- A Google AI Studio API key for live analysis

Git is recommended for version control.

### 1. Create a Python Virtual Environment

Run these commands from the project root:

```powershell
python -m venv .venv
```

Activate the environment:

```powershell
.\.venv\Scripts\Activate.ps1
```

If PowerShell restricts script activation, you can run the virtual environment's Python executable directly for subsequent commands.

### 2. Install Python Dependencies

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

### 3. Configure Environment Variables

Live model analysis requires `GEMINI_API_KEY` and `GEMINI_MODEL` in the PowerShell session that runs the backend or Streamlit application.

#### A. Set the API Key Securely

Create or obtain an API key through [Google AI Studio](https://aistudio.google.com/apikey).

Enter the following command:

```powershell
$key = Read-Host "Enter Gemini API key" -AsSecureString
```

When prompted, paste the key and press Enter. The characters should remain hidden.

Then assign the key to the environment variable:

```powershell
$env:GEMINI_API_KEY = [System.Net.NetworkCredential]::new("", $key).Password
Remove-Variable key
```

The key is held in the current PowerShell session's environment; these commands do not write it to a project file.

#### B. Set the Model Identifier

```powershell
$env:GEMINI_MODEL = "gemma-4-26b-a4b-it"
```

This model identifier has been tested during development. Availability and supported structured-output features may vary by provider and model.

#### C. Verify the Configuration

Check the key without displaying it:

```powershell
if ($env:GEMINI_API_KEY) {
    "API key is set"
} else {
    "API key is missing"
}
```

Check the configured model:

```powershell
$env:GEMINI_MODEL
```

These environment variables are specific to the current terminal session. Configure them separately in any new terminal that runs live analysis.

**Security:** Never commit API keys, include them in source code, or share them in screenshots, logs, or public repositories. Keep `.env` files and credentials out of version control.

### 4. Run the React + FastAPI Application

This is the recommended workflow for the React workspace.

#### Terminal 1 — Start the Backend

From the project root, in the terminal where the environment variables are configured:

```powershell
.\.venv\Scripts\python.exe -m uvicorn api:app --reload --port 8000
```

The backend should be available at:

- **API base URL:** `http://127.0.0.1:8000`
- **Health endpoint:** `http://127.0.0.1:8000/api/health`
- **Interactive API documentation:** `http://127.0.0.1:8000/docs`

A health check can be performed from another PowerShell terminal:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/health
```

A healthy service reports `status: ok`.

Keep this terminal open while using the frontend.

#### Terminal 2 — Start the Frontend

Open another terminal in the project root:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, normally:

`http://localhost:5173/`

Keep the frontend terminal running as well.

### 5. Run the Streamlit Application

To use the alternative Streamlit interface, open a terminal in the project root.

For live analysis, configure the required environment variables in that terminal first.

Run:

```powershell
.\.venv\Scripts\python.exe -m streamlit run app.py
```

Open the local URL printed by Streamlit, normally:

`http://localhost:8501/`

The Streamlit demo mode can be used without configuring an API key.

## API Reference

### Health Check

`GET /api/health`

Checks whether the FastAPI service is responding.

### Analyze an Issue

`POST /api/analyze`

Accepts multipart form data containing:

- `issue_description` — the issue description to analyze.
- `files` — optional uploaded source files, subject to the application's validation rules.

A successful response contains the five analysis fields documented above.

For the exact request schema, response structure, and available API documentation, visit `http://localhost:8000/docs` while the backend is running.

## Running Automated Tests

Run the complete test suite from the project root:

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

For detailed per-test output:

```powershell
.\.venv\Scripts\python.exe -m pytest -v
```

The automated tests cover the application's file-processing, analyzer-validation, and API behavior. Tests using mocked model responses should run without API credentials or live network requests.

## Project Structure

```text
FirstPatchAi/
├── .env.example
├── .gitignore
├── LICENSE
├── README.md
├── app.py
├── api.py
├── requirements.txt
├── firstpatch/
│   ├── __init__.py
│   ├── analyzer.py
│   └── files.py
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
├── samples/
│   ├── .gitkeep
│   └── username_validator.py
└── tests/
    ├── .gitkeep
    ├── test_analyzer.py
    ├── test_files.py
    └── ...
```

- `api.py` — FastAPI application and REST endpoints.
- `app.py` — Streamlit interface and offline demonstration.
- `firstpatch/analyzer.py` — prompt construction, Google Gen AI integration, and structured response validation.
- `firstpatch/files.py` — in-memory file validation and decoding.
- `frontend/` — React and TypeScript workspace.
- `samples/` — example source files.
- `tests/` — automated tests.

The tree above is illustrative; the actual repository may contain additional files.

## Contributing

Contributions, bug reports, and suggestions are welcome.

1. Identify a reproducible issue or a focused improvement.
2. Describe the expected behavior.
3. Add or update tests where appropriate.
4. Run the relevant automated tests.
5. Submit a pull request with a clear explanation of the change.

Please do not include credentials, access tokens, or sensitive repository contents in commits.

## License

See [`LICENSE`](LICENSE) for the project's license and terms.

---

**FirstPatch AI — Understand the issue. Find the code. Plan the contribution.**