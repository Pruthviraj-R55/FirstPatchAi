import streamlit as st

from firstpatch.analyzer import AnalyzerError, analyze_issue
from firstpatch.files import (
    MAX_COMBINED_SIZE_BYTES,
    MAX_FILE_COUNT,
    FileValidationError,
    process_uploaded_files,
)

# Fixed offline demo sample data referencing username_validator.py
SAMPLE_DEMO_ANALYSIS = {
    "issue_summary": (
        "The `validate_username` function in `username_validator.py` only checks that the username "
        "is not `None` (raising a `ValueError`). It lacks validation for non-string types, empty or "
        "whitespace-only strings, length limits, and disallowed characters."
    ),
    "relevant_files": [
        {
            "filename": "username_validator.py",
            "reason": (
                "Contains the `validate_username` function where input validation logic and "
                "exception handling must be enhanced."
            ),
        }
    ],
    "contribution_plan": [
        "Review project requirements to confirm username length limits and accepted character rules.",
        "Add type checking to verify `username` is an instance of `str`.",
        "Reject empty strings and whitespace-only inputs.",
        "Enforce length boundaries (e.g., 3 to 30 characters).",
        "Validate allowed characters (e.g., alphanumeric, underscores, hyphens).",
        "Update the test suite to verify valid inputs and cover all rejected edge cases.",
    ],
    "suggested_tests": [
        "Test `validate_username(None)` raises `ValueError`.",
        "Test non-string inputs (integers, lists, booleans) raise TypeError or ValueError.",
        "Test empty string `''` and whitespace-only `'   '` are rejected.",
        "Test usernames under the minimum length (e.g., 1-2 characters) and over maximum length.",
        "Test valid usernames containing permitted characters return `True`.",
    ],
    "uncertainties": [
        "Exact minimum and maximum username lengths are not defined in the issue description.",
        "Unclear whether usernames should be normalized (e.g., converted to lowercase).",
    ],
}

# Configure the Streamlit page
st.set_page_config(
    page_title="FirstPatch AI",
    page_icon="🛠️",
    layout="wide"
)

# Header and introductory text
st.title("🛠️ FirstPatch AI")
st.write(
    "Understand unfamiliar code, discover potential problems, and find a starting point. "
    "Upload selected source files with or without an issue description. Files are analyzed as text and never executed."
)

st.markdown("---")

# Demo mode toggle
demo_mode = st.checkbox(
    "Demo mode (offline sample)",
    value=False,
    help="Runs a fixed offline sample analysis using username_validator.py without calling the AI API or requiring credentials."
)

if demo_mode:
    st.info(
        "ℹ️ **Demo mode active:** When you click Analyze, a fixed offline sample analysis for "
        "`username_validator.py` will be displayed. This mode does not call the live API, "
        "does not require an API key, and does not analyze arbitrary uploaded files."
    )

st.markdown("---")

# Main Input Section
st.subheader("1. Source Files")
st.write(
    f"Upload the files you want explained. You do not need to know what is wrong first. "
    f"Up to {MAX_FILE_COUNT} files and {MAX_COMBINED_SIZE_BYTES // 1024} KB combined. "
    "Analysis is limited to these files. At least one file is required."
)

uploaded_files = st.file_uploader(
    label="Choose source files",
    type=["py", "js", "ts", "java", "c", "cpp", "md", "txt", "json", "yml", "yaml", "toml"],
    accept_multiple_files=True,
)

if uploaded_files:
    st.info(f"📁 {len(uploaded_files)} file(s) selected for analysis.")

st.subheader("2. Additional Issue Context (Optional)")
issue_description = st.text_area(
    label="Describe a problem (optional):",
    placeholder="Optional: what happened, what did you expect, and how can it be reproduced?",
    height=160,
)

st.markdown("---")

# Action Section
if st.button("Understand Selected Code", type="primary"):
    cleaned_issue = issue_description.strip()
    if not demo_mode and not uploaded_files:
        st.warning("Upload at least one source file to begin analysis. The issue description is optional.")
    else:
        try:
            if demo_mode:
                # Fixed offline sample workflow: no API calls, no credential requirements
                analysis = SAMPLE_DEMO_ANALYSIS
            else:
                # Live model workflow: validate files in-memory and call configured free provider model
                if len(uploaded_files or []) > MAX_FILE_COUNT:
                    raise FileValidationError(
                        f"Choose no more than {MAX_FILE_COUNT} files per analysis."
                    )
                files_map = process_uploaded_files(uploaded_files)

                with st.spinner("Explaining selected files and checking for potential problems..."):
                    analysis = analyze_issue(
                        issue_description=cleaned_issue,
                        files=files_map,
                    )

                st.success("Analysis complete!")

            st.markdown("---")

            st.subheader("3. Analysis Results")

            if demo_mode:
                st.warning(
                    "⚠️ **Sample output, not generated by the live model.** "
                    "This is a fixed offline demonstration referencing `username_validator.py`."
                )

            if analysis.get("project_overview"):
                st.markdown("#### Project Understanding · Selected Files")
                st.write(analysis["project_overview"])

            file_explanations = analysis.get("file_explanations", [])
            if file_explanations:
                st.markdown("#### File Explanations")
                for explanation in file_explanations:
                    with st.expander(explanation["filename"], expanded=True):
                        st.write(explanation["purpose"])
                        if explanation["important_elements"]:
                            st.markdown("**Important functions, classes, or logic**")
                            for element in explanation["important_elements"]:
                                st.markdown(f"- {element}")
                        st.markdown(f"**Relationship:** {explanation['relationships']}")

            potential_issues = analysis.get("potential_issues", [])
            st.markdown("#### Potential Problems to Inspect")
            if potential_issues:
                for finding in potential_issues:
                    label = "Observed behavior" if finding["assessment"] == "observed" else "Inferred risk"
                    filename = f" · `{finding['filename']}`" if finding["filename"] else ""
                    st.markdown(f"**{label}{filename} · {finding['location']} — {finding['title']}**")
                    st.write(f"Evidence: {finding['evidence']}")
                    st.write(f"Why it matters: {finding['why_it_matters']}")
            else:
                st.write("No specific potential problem was identified in the supplied files. This does not prove the code is defect-free.")

            # 1. Summary: issue-focused when supplied, code-focused otherwise
            st.markdown("#### 📋 Analysis Summary")
            st.write(analysis.get("issue_summary", ""))

            # 2. Relevant Files
            st.markdown("#### 📁 Relevant Files")
            relevant_files = analysis.get("relevant_files", [])
            if relevant_files:
                for file_info in relevant_files:
                    filename = file_info.get("filename", "")
                    reason = file_info.get("reason", "")
                    st.markdown(f"- **`{filename}`**: {reason}")
            else:
                st.write("No uploaded files were identified as directly relevant.")

            # 3. Contribution Plan
            st.markdown("#### 🎯 Contribution Plan")
            contribution_plan = analysis.get("contribution_plan", [])
            if contribution_plan:
                for idx, step in enumerate(contribution_plan, start=1):
                    st.markdown(f"{idx}. {step}")
            else:
                st.write("No contribution steps provided.")

            # 4. Suggested Tests
            st.markdown("#### 🧪 Suggested Tests & Edge Cases")
            suggested_tests = analysis.get("suggested_tests", [])
            if suggested_tests:
                for test_item in suggested_tests:
                    st.markdown(f"- {test_item}")
            else:
                st.write("No suggested tests provided.")

            # 5. Uncertainties & Assumptions
            st.markdown("#### ⚠️ Uncertainties & Limitations")
            uncertainties = analysis.get("uncertainties", [])
            if uncertainties:
                for item in uncertainties:
                    st.markdown(f"- {item}")
            else:
                st.write("No uncertainties noted.")

            missing_context = analysis.get("missing_context", [])
            st.markdown("#### Context That Could Clarify the Analysis")
            if missing_context:
                for item in missing_context:
                    st.markdown(f"- {item}")
            else:
                st.write("No additional context was requested. Verify findings against the rest of the repository and its runtime behavior.")

        except FileValidationError as fve:
            st.error(f"File validation error: {fve}")
        except AnalyzerError as ae:
            st.error(f"Analysis error: {ae}")
        except Exception:
            st.error(
                "An unexpected error occurred. Please try again. "
                "If the problem persists, check the terminal logs."
            )
