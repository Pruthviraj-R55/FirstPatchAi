import streamlit as st

from firstpatch.analyzer import AnalyzerError, analyze_issue
from firstpatch.files import FileValidationError, process_uploaded_files

# Configure the Streamlit page
st.set_page_config(
    page_title="FirstPatch AI",
    page_icon="🛠️",
    layout="wide"
)

# Header and introductory text
st.title("🛠️ FirstPatch AI")
st.write(
    "Welcome to FirstPatch AI! This tool helps beginners understand open-source issues, "
    "explore relevant codebase context, and prepare their first contributions with confidence."
)

st.markdown("---")

# Main Input Section
st.subheader("1. GitHub Issue Description")
issue_description = st.text_area(
    label="Paste the issue description, bug report, or feature request here:",
    placeholder="Example: Fix TypeError when parsing null configuration values in config_loader...",
    height=200
)

st.subheader("2. Codebase Files")
st.write("Upload the relevant repository or code files to provide context for the issue:")

uploaded_files = st.file_uploader(
    label="Choose repository files",
    type=["py", "js", "ts", "java", "c", "cpp", "md", "txt", "json", "yml", "yaml", "toml"],
    accept_multiple_files=True
)

if uploaded_files:
    st.info(f"📁 {len(uploaded_files)} file(s) selected for analysis.")

st.markdown("---")

# Action Section
if st.button("Analyze Issue", type="primary"):
    cleaned_issue = issue_description.strip()
    if not cleaned_issue:
        st.warning("Please provide a GitHub issue description before analyzing.")
    else:
        try:
            # Validate and extract uploaded files in-memory
            files_map = process_uploaded_files(uploaded_files)

            if not files_map:
                st.info("ℹ️ No codebase files uploaded. Performing issue-only analysis.")

            with st.spinner("Analyzing issue and codebase context with Gemma..."):
                analysis = analyze_issue(
                    issue_description=cleaned_issue,
                    files=files_map,
                )

            st.success("Analysis complete!")
            st.markdown("---")

            st.subheader("3. Analysis Results")

            # 1. Issue Summary
            st.markdown("#### 📋 Issue Summary")
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

        except FileValidationError as fve:
            st.error(f"File validation error: {fve}")
        except AnalyzerError as ae:
            st.error(f"Analysis error: {ae}")
        except Exception as exc:
            st.error(f"An unexpected error occurred: {exc}")
