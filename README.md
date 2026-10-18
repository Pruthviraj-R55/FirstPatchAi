# FirstPatch AI

FirstPatch AI is an intelligent assistant designed to help beginners understand open-source issues, navigate codebases, and prepare their first pull requests with confidence.

---

## Getting Started

### 1. Prerequisites
- Python 3.10+ installed

### 2. Set Up a Virtual Environment (Recommended)
In PowerShell:
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 3. Install Dependencies
```powershell
pip install -r requirements.txt
```

### 4. Run the Streamlit Application
```powershell
streamlit run app.py
```

---

## Project Structure

```
FirstPatchAi/
├── .env.example        # Environment variable template
├── .gitignore          # Files and folders ignored by git
├── app.py              # Streamlit web application interface
├── firstpatch/         # Core application package
│   └── __init__.py
├── requirements.txt    # Project dependencies
├── samples/            # Sample files for testing
│   └── .gitkeep
└── tests/              # Test suite
    └── .gitkeep
```

---

## Status
- **Step 1 completed**: Initial project structure and minimal Streamlit UI shell created.
- AI analysis and codebase processing will be introduced in subsequent steps.
