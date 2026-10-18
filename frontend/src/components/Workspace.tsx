import React, { useRef, useState } from 'react';
import type { AnalysisResult } from '../types/api';
import '../styles/Workspace.css';

// Supported extensions must match what the backend file processor accepts
const SUPPORTED_EXTENSIONS = new Set([
  '.py', '.js', '.ts', '.java', '.c', '.cpp',
  '.md', '.txt', '.json', '.yml', '.yaml', '.toml',
]);
const MAX_COMBINED_BYTES = 204_800; // 200 KB, mirroring the backend limit
const API_ENDPOINT = 'http://localhost:8000/api/analyze';

// --- Types ---

type RequestState = 'idle' | 'loading' | 'success' | 'error';

interface WorkspaceProps {
  onAnalysisComplete: (result: AnalysisResult) => void;
}

// --- Helpers ---

function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.slice(lastDot).toLowerCase();
}

function validateFiles(files: File[]): string | null {
  const seen = new Set<string>();
  let totalBytes = 0;

  for (const file of files) {
    // Duplicate filename check
    if (seen.has(file.name)) {
      return `Duplicate filename: "${file.name}". Each uploaded file must have a unique name.`;
    }
    seen.add(file.name);

    // Extension check
    const ext = getExtension(file.name);
    if (!SUPPORTED_EXTENSIONS.has(ext)) {
      return `Unsupported file type: "${file.name}". Supported extensions: ${[...SUPPORTED_EXTENSIONS].join(', ')}.`;
    }

    // Empty file check
    if (file.size === 0) {
      return `"${file.name}" is empty. Empty files cannot be analyzed.`;
    }

    // Combined size check
    totalBytes += file.size;
    if (totalBytes > MAX_COMBINED_BYTES) {
      return `Combined file size (${(totalBytes / 1024).toFixed(1)} KB) exceeds the 200 KB limit.`;
    }
  }

  return null;
}

// --- Component ---

export const Workspace: React.FC<WorkspaceProps> = ({ onAnalysisComplete }) => {
  const [issueText, setIssueText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const [requestState, setRequestState] = useState<RequestState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [clientValidationError, setClientValidationError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- File management ----

  const mergeFiles = (incoming: File[]) => {
    setSelectedFiles(prev => {
      const existingNames = new Set(prev.map(f => f.name));
      const deduped = incoming.filter(f => !existingNames.has(f.name));
      const merged = [...prev, ...deduped];
      const err = validateFiles(merged);
      setClientValidationError(err ?? '');
      return merged;
    });
  };

  const removeFile = (fileName: string) => {
    setSelectedFiles(prev => {
      const next = prev.filter(f => f.name !== fileName);
      const err = validateFiles(next);
      setClientValidationError(err ?? '');
      return next;
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      mergeFiles(Array.from(e.target.files));
      // Reset input value so the same file can be re-selected after removal
      e.target.value = '';
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      mergeFiles(Array.from(e.dataTransfer.files));
    }
  };

  // ---- Sample loading ----

  const handleLoadSample = () => {
    setIssueText(
      'Fix TypeError when validate_username() receives None or non-string input. ' +
      'Currently in username_validator.py, passing None crashes with an unhandled exception ' +
      'rather than returning False or raising a descriptive validation error.',
    );
    // Clear files — sample issue works without files attached
    setSelectedFiles([]);
    setClientValidationError('');
    setErrorMessage('');
    setRequestState('idle');
  };

  const handleClear = () => {
    setIssueText('');
    setSelectedFiles([]);
    setClientValidationError('');
    setErrorMessage('');
    setRequestState('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ---- Analysis submission ----

  const handleAnalyze = async () => {
    // Client-side validation
    if (!issueText.trim()) {
      setClientValidationError('Issue description cannot be empty.');
      return;
    }
    if (clientValidationError) return; // pre-existing file validation error

    setRequestState('loading');
    setErrorMessage('');

    const formData = new FormData();
    formData.append('issue_description', issueText.trim());
    // Append each file under the multipart field name the backend expects
    for (const file of selectedFiles) {
      formData.append('files', file);
    }

    try {
      // Do NOT set Content-Type — let the browser set it with the correct boundary
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data: AnalysisResult = await response.json();
        onAnalysisComplete(data);
        setRequestState('success');
        // Scroll the results section into view
        setTimeout(() => {
          document.getElementById('illustrative-preview')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }, 100);
      } else {
        // Parse API error detail
        let detail = `Request failed with status ${response.status}.`;
        try {
          const errBody = await response.json();
          if (typeof errBody?.detail === 'string') {
            detail = errBody.detail;
          }
        } catch {
          // ignore JSON parse failure
        }

        if (response.status === 400) {
          setErrorMessage(`Validation error: ${detail}`);
        } else if (response.status === 503) {
          setErrorMessage(
            'The analyzer service is unavailable. ' +
            'Check that the backend server is configured with a valid API key and is running.',
          );
        } else if (response.status === 502) {
          setErrorMessage(
            `AI model error: ${detail} ` +
            'Try again or check the backend terminal for details.',
          );
        } else {
          setErrorMessage(`Unexpected error (${response.status}): ${detail}`);
        }
        setRequestState('error');
      }
    } catch (networkErr) {
      setErrorMessage(
        'Could not reach the FirstPatch AI backend. ' +
        'Make sure the backend server is running: ' +
        'uvicorn api:app --reload --port 8000',
      );
      setRequestState('error');
    }
  };

  // ---- Derived state ----

  const isLoading = requestState === 'loading';
  const canAnalyze = !isLoading && !clientValidationError && issueText.trim().length > 0;

  // ---- Render ----

  return (
    <section id="workspace" className="workspace-section" aria-labelledby="workspace-heading">
      <div className="section-container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-badge">Interactive Workspace</div>
          <h2 id="workspace-heading" className="section-title">
            Analyze an Issue with Codebase Context
          </h2>
          <p className="section-description">
            Provide the problem statement and the relevant source files from the repository.
          </p>
        </div>

        {/* Data Flow Notice — accurate, not misleading */}
        <div className="prototype-notice-banner" role="status">
          <div className="notice-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </div>
          <div className="notice-content">
            <strong>Data flow:</strong> Your issue description and selected source files are sent to the FirstPatch AI backend when you click Analyze.
            The backend processes uploaded files in memory and sends the analysis input to the configured AI service.
            Uploaded files are not intentionally written to disk or executed.
            Keep your Gemini API key on the backend server only.
          </div>
        </div>

        {/* Workspace Panel */}
        <div className="workspace-card">
          {/* Toolbar */}
          <div className="workspace-toolbar">
            <div className="toolbar-title">
              <span className="dot dot-violet"></span>
              <span>Issue Context &amp; Source Inspector</span>
            </div>
            <div className="toolbar-actions">
              <button
                type="button"
                className="btn-toolbar"
                onClick={handleLoadSample}
                title="Fill with a realistic open-source bug example"
                disabled={isLoading}
              >
                <span>Load Sample Issue</span>
              </button>
              {(issueText || selectedFiles.length > 0) && (
                <button
                  type="button"
                  className="btn-toolbar text-danger"
                  onClick={handleClear}
                  disabled={isLoading}
                >
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          <div className="workspace-body">
            {/* 1. Issue Description */}
            <div className="form-group">
              <div className="label-row">
                <label htmlFor="issue-description" className="input-label">
                  1. GitHub Issue Description <span className="required">*</span>
                </label>
                <span className="character-count">{issueText.length} characters</span>
              </div>
              <textarea
                id="issue-description"
                className="issue-textarea"
                rows={7}
                placeholder="Paste the issue description, bug report, or feature request here (e.g., 'Fix TypeError when parsing null configuration values in config_loader...')"
                value={issueText}
                onChange={(e) => {
                  setIssueText(e.target.value);
                  if (clientValidationError === 'Issue description cannot be empty.') {
                    setClientValidationError('');
                  }
                }}
                disabled={isLoading}
              />
            </div>

            {/* 2. File Upload */}
            <div className="form-group">
              <div className="label-row">
                <label className="input-label">
                  2. Codebase Files <span className="label-optional">(Optional)</span>
                </label>
                <span className="file-constraints">Max 200 KB combined · 12 supported extensions</span>
              </div>

              <div
                className={`dropzone-container ${isDragging ? 'dragging' : ''}`}
                onClick={() => {
                  if (!isLoading) fileInputRef.current?.click();
                }}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                role="button"
                tabIndex={0}
                aria-label="Upload source files — click or drag and drop"
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !isLoading) {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                <input
                  type="file"
                  id="file-input"
                  ref={fileInputRef}
                  className="hidden-file-input"
                  multiple
                  onChange={handleFileSelect}
                  accept=".py,.js,.ts,.java,.c,.cpp,.md,.txt,.json,.yml,.yaml,.toml"
                  disabled={isLoading}
                  // Stop the click from bubbling back up to the container (avoids double open)
                  onClick={(e) => e.stopPropagation()}
                />

                <div className="dropzone-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>

                <div className="dropzone-text">
                  <span className="dropzone-primary">
                    {/* Span instead of label — the whole container is the click target now */}
                    <span className="file-browse-link">Browse files</span>
                    {' '}or drag &amp; drop code files here
                  </span>
                  <span className="dropzone-secondary">
                    Supported: .py, .js, .ts, .java, .c, .cpp, .md, .txt, .json, .yml, .yaml, .toml
                  </span>
                </div>
              </div>

              {/* File chips */}
              {selectedFiles.length > 0 && (
                <div className="uploaded-files-list" aria-label="Attached files list">
                  {selectedFiles.map((file) => (
                    <div key={file.name} className="file-chip">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      <span className="chip-name">{file.name}</span>
                      <span className="chip-size">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                      <button
                        type="button"
                        className="btn-remove-chip"
                        onClick={() => removeFile(file.name)}
                        aria-label={`Remove ${file.name}`}
                        disabled={isLoading}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Client-side validation error */}
              {clientValidationError && (
                <div className="validation-error" role="alert">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {clientValidationError}
                </div>
              )}
            </div>

            {/* API Error Banner */}
            {requestState === 'error' && errorMessage && (
              <div className="api-error-banner" role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/>
                  <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success acknowledgement */}
            {requestState === 'success' && (
              <div className="api-success-banner" role="status">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>Analysis complete — results are displayed below.</span>
              </div>
            )}

            {/* Action Bar */}
            <div className="workspace-footer">
              <div className="footer-status">
                <span
                  className={`status-indicator ${isLoading ? 'status-loading' : requestState === 'success' ? 'status-success' : requestState === 'error' ? 'status-error' : ''}`}
                ></span>
                <span>
                  {isLoading
                    ? 'Sending request to backend…'
                    : requestState === 'success'
                    ? 'Analysis returned successfully'
                    : requestState === 'error'
                    ? 'Request failed'
                    : 'Ready for analysis'}
                </span>
              </div>

              <button
                type="button"
                className={`btn-analyze ${isLoading ? 'btn-analyze-loading' : ''}`}
                onClick={handleAnalyze}
                disabled={!canAnalyze}
                aria-disabled={!canAnalyze}
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner" aria-hidden="true"></span>
                    <span>Analyzing Issue…</span>
                  </>
                ) : (
                  <>
                    <span>Analyze Issue</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
