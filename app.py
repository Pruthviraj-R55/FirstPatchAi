import streamlit as st

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
    if not issue_description.strip():
        st.warning("Please provide a GitHub issue description before analyzing.")
    else:
        st.info(
            "ℹ️ **Analysis Placeholder:** Issue analysis and AI-powered recommendations "
            "will be implemented in a later step. No AI model or API has been called yet."
        )
