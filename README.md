# FirstPatch AI

**An AI-powered open-source contribution onboarding assistant for beginners.**

FirstPatch AI helps developers understand open-source issues, identify relevant codebase context, and plan their first contributions with confidence. By analyzing an issue description alongside user-supplied repository files, FirstPatch AI generates a structured contribution roadmap containing an issue summary, relevant files, actionable implementation steps, suggested tests, and important uncertainties or assumptions.

![FirstPatch AI Main Interface](0-interface.png)

The project includes a Streamlit application for interactive analysis and offline demonstration, alongside a React + TypeScript frontend backed by a FastAPI REST API.

---

## What It Does

### Capabilities
* **Issue Analysis:** Explains problem statements and bug reports in beginner-friendly language.
* **Relevant File Identification:** Identifies potentially relevant files from user-supplied source code and explains their relevance.
* **Actionable Contribution Planning:** Breaks a problem into manageable implementation steps.
* **Test Suggestions:** Recommends unit tests, edge cases, and expected behaviors to verify.
* **Uncertainty Reporting:** Highlights assumptions, missing context, and questions that may require further investigation.
* **Structured AI Responses:** Uses JSON output configuration and strict application-level validation to maintain a consistent five-section response.
* **Prompt Injection Awareness:** Treats issue descriptions and uploaded file contents as untrusted input, with instructions designed to reduce the risk of following malicious embedded directions.
* **Safe In-Memory File Processing:** Validates and decodes supported text files in memory without executing uploaded code or writing uploaded contents to disk.
* **Offline Demo Mode:** Provides a fixed sample analysis without API credentials or network access.
* **Multiple Interfaces:** Supports both a Streamlit interface and a React + TypeScript workspace using FastAPI.

### Current Limitations
* **Read-Only and Advisory:** FirstPatch AI does not implement fixes, execute uploaded code, run the analyzed repository's tests, or create pull requests automatically.
* **User-Supplied Context:** Relevant-file identification is limited to the files provided; the application does not automatically inspect an entire GitHub repository.
* **Upload Constraints:** Supports 12 text file extensions and a maximum combined upload size of 200 KB (204,800 bytes).
* **Model Dependent:** Live analysis requires a valid Google Gen AI API key and a supported model identifier.
* **Output Validation:** Responses that do not meet the required schema are rejected rather than silently converted into valid-looking results.
* **Local Development:** The documented setup runs the application locally; a public cloud deployment is not provided by this guide.

---

## File Upload Constraints

FirstPatch AI validates uploaded files before processing their contents.

* **Supported extensions:** `.py`, `.js`, `.ts`, `.java`, `.c`, `.cpp`, `.md`, `.txt`, `.json`, `.yml`, `.yaml`, `.toml` (case-insensitive).
* **Combined size limit:** 200 KB (204,800 bytes), calculated from the actual uploaded file bytes.
* **Encoding:** Valid UTF-8 text only.
* **Empty files:** Rejected.
* **Duplicate filenames:** Rejected.
* **Unsupported extensions:** Rejected.
* **Execution and storage:** Uploaded files are processed in memory; their contents are not executed, imported, or written to disk by the file-processing workflow.

![File Upload Interface & Constraints](4-file-upload.png)

*These restrictions reduce risk but do not make arbitrary uploaded content inherently trustworthy.*

---

## Modes of Operation

### 1. Streamlit Demo Mode — Offline Sample
The Streamlit application includes a **Demo mode (offline sample)** option.
* Runs without API credentials or external model requests.
* Displays a fixed, realistic five-section example analysis referencing [`samples/username_validator.py`](samples/username_validator.py).
* Clearly distinguishes sample output from live model-generated results.
* Does not analyze arbitrary uploaded files while using the fixed sample demonstration.

*Demo mode is useful for exploring the interface without consuming model API quota.*

### 2. Live AI Analysis
With demo mode disabled, the application uses the official `google-genai` SDK to request analysis from the configured Google AI model.

![Live AI Analysis Execution](2-working.png)

* Accepts an issue description and optional uploaded source files.
* Supports issue-only analysis when no files are supplied, where permitted by the interface.
* Uses structured-output configuration to request a JSON object matching the expected response schema.
* Validates the model response before returning the analysis.
* Reports errors when the upstream request fails or the returned content does not satisfy the expected format.

*AI-generated suggestions are advisory and should be reviewed before implementation.*

### 3. React + FastAPI Workspace
The React frontend provides a workspace for submitting issues, uploading files, and viewing the generated analysis. The FastAPI backend handles request validation, invokes the analyzer, and returns structured results to the frontend.

![React Developer Workspace](3-workspace.png)

---

## Analysis Response Structure

A successful analysis contains five sections. The application validates the response structure and field types. A successful HTTP response from the model provider does not, by itself, guarantee a valid application-level result.

| Field | Description |
| :--- | :--- |
| `issue_summary` | A concise explanation of the reported issue |
| `relevant_files` | Candidate filenames and reasons they may be relevant |
| `contribution_plan` | Actionable steps for investigating and addressing the issue |
| `suggested_tests` | Recommended tests and edge cases |
| `uncertainties` | Assumptions, missing context, and unresolved questions |

### Response Previews
![Contribution Plan Output](5-contributation_plan.png)
![Suggested Tests and Uncertainties Output](6-tests.png)

---

## Tech Stack

| Component | Technology |
| :--- | :--- |
| Language | Python |
| AI integration | Google Gen AI SDK (`google-genai`) |
| AI model | Configurable through `GEMINI_MODEL` |
| Backend | FastAPI, Uvicorn |
| Frontend | React, TypeScript, Vite |
| Alternative interface | Streamlit |
| Automated testing | pytest |

---

## Getting Started — Windows PowerShell

### Prerequisites
Install the following:
* Python 3.10 or newer, compatible with the project's dependencies
* Node.js and npm (for the React frontend)
* Windows PowerShell
* A Google AI Studio API key for live analysis

*Git is recommended for version control.*

### 1. Create a Python Virtual Environment
Run these commands from the project root:
```powershell
python "-m" venv .venv
```
Activate the environment:
```powershell
.\.venv\Scripts\Activate.ps1
```
*If PowerShell restricts script activation, you can run the virtual environment's Python executable directly for subsequent commands.*

### 2. Install Python Dependencies
```powershell
.\.venv\Scripts\python.exe "-m" pip install "-r" requirements.txt
```

### 3. Configure Environment Variables
Live model analysis requires `GEMINI_API_KEY` and `GEMINI_MODEL` in the PowerShell session that runs the backend or Streamlit application.

#### A. Set the API Key Securely
Create or obtain an API key through [Google AI Studio](https://google.com). Enter the following command:
```powershell
$key = Read-Host "Enter Gemini API key" "-AsSecureString"
```
When prompted, paste the key and press Enter. The characters should remain hidden. Then assign the key to the environment variable:
```powershell
$env:GEMINI_API_KEY = [System.Net.NetworkCredential]::new("", $key).Password
Remove-Variable key
```
*The key is held in the current PowerShell session's environment; these commands do not write it to a project file.*

#### B. Set the Model Identifier
```powershell
$env:GEMINI_MODEL = "gemma-4-26b-a4b-it"
```
*This model identifier has been tested during development. Availability and supported structured-output features may vary by provider and model.*

#### C. Verify the Configuration
Check the key without displaying it:
```powershell
if ($env:GEMINI_API_KEY) { "API key is set" } else { "API key is missing" }
```
Check the configured model:
```powershell
$env:GEMINI_MODEL
```
*These environment variables are specific to the current terminal session. Configure them separately in any new terminal that runs live analysis.*

> ⚠️ **Security Warning:** Never commit API keys, include them in source code, or share them in screenshots, logs, or public repositories. Keep `.env` files and credentials out of version control.

### 4. Run the React + FastAPI Application
This is the recommended workflow for the React workspace.

#### Terminal 1 — Start the Backend
From the project root, in the terminal where the environment variables are configured:
```powershell
.\.venv\Scripts\python.exe "-m" uvicorn api:app --reload --port 8000
```
The backend should be available at:
* **API base URL:** `http://127.0.0.1:8000`
* **Health endpoint:** `http://127.0.0`
* **Interactive API documentation:** `http://127.0.0`

A health check can be performed from another PowerShell terminal:
```powershell
Invoke-RestMethod http://127.0.0
```
