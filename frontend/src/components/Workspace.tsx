import React, { useEffect, useRef, useState } from 'react';
import type { AnalysisResult, UploadLimits } from '../types/api';
import '../styles/Workspace.css';

// Supported extensions must match what the backend file processor accepts
// Same-origin by default so a single production deployment needs no CORS setup.
// Set VITE_API_BASE_URL only when the API is hosted on a separate origin.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');
const API_ENDPOINT = `${API_BASE_URL}/api/analyze`;
const CONFIG_ENDPOINT = `${API_BASE_URL}/api/config`;
const configuredTimeout = Number(import.meta.env.VITE_ANALYSIS_REQUEST_TIMEOUT_MS);
const ANALYSIS_TIMEOUT_MS = Number.isFinite(configuredTimeout) && configuredTimeout > 0
  ? configuredTimeout
  : 105_000;

// --- Types ---

type RequestState = 'idle' | 'loading' | 'success' | 'error';

interface WorkspaceProps {
  onAnalysisComplete: (result: AnalysisResult | null) => void;
}

// --- Helpers ---

function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.slice(lastDot).toLowerCase();
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
}

function validateFiles(files: File[], limits: UploadLimits | null): string | null {
  if (!limits) return 'Loading upload requirements…';
  if (files.length > limits.max_files) {
    return `Choose no more than ${limits.max_files} files per analysis.`;
  }
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
    if (!limits.allowed_extensions.includes(ext.slice(1))) {
      return `“${file.name}” is not a supported text source file. Accepted extensions: ${limits.allowed_extensions.map((item) => `.${item}`).join(', ')}.`;
    }

    // Empty file check
    if (file.size === 0) {
      return `"${file.name}" is empty. Empty files cannot be analyzed.`;
    }

    if (file.size > limits.max_file_size_bytes) {
      return `“${file.name}” is ${formatBytes(file.size)}; the individual file limit is ${formatBytes(limits.max_file_size_bytes)}.`;
    }

    // Combined size check
    totalBytes += file.size;
    if (totalBytes > limits.max_combined_upload_size_bytes) {
      return `Selected files total ${formatBytes(totalBytes)}, exceeding the ${formatBytes(limits.max_combined_upload_size_bytes)} upload limit.`;
    }
  }

  if (totalBytes > limits.max_analysis_source_bytes) {
    return `Selected files total ${formatBytes(totalBytes)}. The configured model context budget is ${formatBytes(limits.max_analysis_source_bytes)} of source text; remove files or choose a smaller subset. Files are never truncated.`;
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
  const [retryAllowed, setRetryAllowed] = useState(false);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(null);
  const [clientValidationError, setClientValidationError] = useState('');
  const [uploadLimits, setUploadLimits] = useState<UploadLimits | null>(null);
  const [limitsError, setLimitsError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestInFlightRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch(CONFIG_ENDPOINT, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Upload requirements are unavailable.');
        const config = await response.json() as UploadLimits;
        if (!Number.isInteger(config.max_files) || !Number.isInteger(config.max_file_size_bytes)
          || !Number.isInteger(config.max_combined_upload_size_bytes) || !Number.isInteger(config.max_analysis_source_bytes)
          || !Number.isInteger(config.max_issue_description_bytes) || !Array.isArray(config.allowed_extensions)) throw new Error('Upload requirements are invalid.');
        setUploadLimits(config);
        setLimitsError('');
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setLimitsError(error instanceof Error ? error.message : 'Upload requirements are unavailable. Refresh and try again.');
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (retryAfterSeconds === null || retryAfterSeconds <= 0) return;
    const timer = window.setTimeout(() => {
      setRetryAfterSeconds((remaining) => remaining === null ? null : Math.max(0, remaining - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [retryAfterSeconds]);

  const clearErrorOnEdit = () => {
    if (requestState === 'error') {
      setRequestState('idle');
      setErrorMessage('');
      setRetryAllowed(false);
      setRetryAfterSeconds(null);
    }
  };

  // ---- File management ----

  const mergeFiles = (incoming: File[]) => {
    clearErrorOnEdit();
    setSelectedFiles(prev => {
      const existingNames = new Set(prev.map(f => f.name));
      const deduped = incoming.filter(f => !existingNames.has(f.name));
      const merged = [...prev, ...deduped];
      const err = validateFiles(merged, uploadLimits);
      setClientValidationError(err ?? '');
      return merged;
    });
  };

  const removeFile = (fileName: string) => {
    clearErrorOnEdit();
    setSelectedFiles(prev => {
      const next = prev.filter(f => f.name !== fileName);
      const err = validateFiles(next, uploadLimits);
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
    // Keep the existing sample workflow useful now that files are required.
    setSelectedFiles([new File(
      ['def validate_username(username):\n    if username is None:\n        raise ValueError("Username cannot be None")\n    return True\n'],
      'username_validator.py',
      { type: 'text/x-python' },
    )]);
    setClientValidationError('');
    setErrorMessage('');
    setRequestState('idle');
    onAnalysisComplete(null);
  };

  const handleClear = () => {
    setIssueText('');
    setSelectedFiles([]);
    setClientValidationError('');
    setErrorMessage('');
    setRequestState('idle');
    onAnalysisComplete(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ---- Analysis submission ----

  const handleAnalyze = async () => {
    if (requestInFlightRef.current) return;
    // Client-side validation
    if (selectedFiles.length === 0) {
      setClientValidationError('Upload at least one source file to begin analysis.');
      return;
    }
    if (clientValidationError) return; // pre-existing file validation error

    requestInFlightRef.current = true;
    const controller = new AbortController();
    abortControllerRef.current = controller;
    let timedOut = false;
    let settled = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, ANALYSIS_TIMEOUT_MS);

    setRequestState('loading');
    setErrorMessage('');
    setRetryAllowed(false);
    setRetryAfterSeconds(null);
    onAnalysisComplete(null);

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
        signal: controller.signal,
      });

      if (response.ok) {
        const data: AnalysisResult = await response.json();
        settled = true;
        onAnalysisComplete(data);
        setRequestState('success');
        // Scroll the results section into view
        setTimeout(() => {
          document.getElementById('illustrative-preview')?.scrollIntoView({
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
            block: 'start',
          });
        }, 100);
      } else {
        settled = true;
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

        if (response.status === 413) {
          setErrorMessage(detail);
          setRetryAllowed(false);
        } else if (response.status === 400) {
          setErrorMessage(`Validation error: ${detail}`);
          setRetryAllowed(false);
        } else if (response.status === 503) {
          const isNetworkFailure = /could not reach openrouter|network connectivity/i.test(detail);
          setErrorMessage(isNetworkFailure
            ? 'FirstPatch AI cannot reach OpenRouter right now. Check the server network connection and retry; your files and description are still here.'
            : 'The analyzer could not authenticate with OpenRouter. The server operator should check its backend API key and account access.');
          setRetryAllowed(isNetworkFailure && response.headers.get('X-Analysis-Retryable') === 'true');
        } else if (response.status === 502) {
          if (/rejected the analysis request/i.test(detail)) {
            setErrorMessage('OpenRouter rejected this request. The server operator should check the configured free model and request.');
            setRetryAllowed(false);
          } else {
            setErrorMessage('OpenRouter could not complete the analysis because of an upstream service error. Your inputs are preserved.');
            setRetryAllowed(response.headers.get('X-Analysis-Retryable') === 'true');
          }
        } else if (response.status === 429) {
          if (/quota .* exhausted|quota.+exhausted/i.test(detail)) {
            setErrorMessage('The OpenRouter free-model quota may be exhausted. Check the account limits; this app does not fall back to a paid model.');
            setRetryAllowed(false);
          } else {
            const waitSeconds = Number(response.headers.get('Retry-After'));
            setErrorMessage(detail);
            setRetryAllowed(true);
            setRetryAfterSeconds(Number.isFinite(waitSeconds) && waitSeconds > 0 ? waitSeconds : null);
          }
        } else if (response.status === 504) {
          setErrorMessage('Analysis timed out while waiting for OpenRouter. Your issue and files are still here; please retry in a moment.');
          setRetryAllowed(true);
        } else if (response.status >= 500) {
          setErrorMessage(`FirstPatch AI returned a server error (${response.status}). Try again shortly.`);
        } else {
          setErrorMessage(`Unexpected error (${response.status}): ${detail}`);
        }
        setRequestState('error');
      }
    } catch {
      settled = true;
      if (mountedRef.current) {
        setErrorMessage(timedOut
          ? 'Analysis took too long to respond. Your issue and files are still here; please retry.'
          : 'Could not connect to FirstPatch AI. Check your connection and confirm the application server is available, then retry. Your issue and selected files are still here.');
        setRequestState('error');
        setRetryAllowed(true);
      }
    } finally {
      window.clearTimeout(timeoutId);
      requestInFlightRef.current = false;
      if (abortControllerRef.current === controller) abortControllerRef.current = null;
      if (mountedRef.current && !settled) {
        // Defensive fallback: every completed fetch path should have set a terminal state.
        setRequestState('error');
        setErrorMessage(current => current || 'Analysis ended without a response. Please retry.');
      }
    }
  };

  // ---- Derived state ----

  const isLoading = requestState === 'loading';
  const selectedTotalBytes = selectedFiles.reduce((sum, file) => sum + file.size, 0);
  const issueDescriptionBytes = new TextEncoder().encode(issueText.trim()).length;
  const issueDescriptionError = uploadLimits && issueDescriptionBytes > uploadLimits.max_issue_description_bytes
    ? `Issue description is ${formatBytes(issueDescriptionBytes)}; the limit is ${formatBytes(uploadLimits.max_issue_description_bytes)}. Shorten it to continue.`
    : '';
  const acceptedExtensions = uploadLimits?.allowed_extensions.map((extension) => `.${extension}`).join(', ') ?? '';
  const canAnalyze = !isLoading
    && Boolean(uploadLimits)
    && !clientValidationError
    && !issueDescriptionError
    && selectedFiles.length > 0
    && (requestState !== 'error' || retryAllowed)
    && !(retryAfterSeconds !== null && retryAfterSeconds > 0);

  // ---- Render ----

  return (
    <section id="workspace" className="workspace-section" aria-labelledby="workspace-heading">
      <div className="section-container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-badge">Code understanding</div>
          <h2 id="workspace-heading" className="section-title">
            Start with the code.
          </h2>
          <p className="section-description">
            Upload selected source files for an automatic explanation and potential problem review. An issue description is optional context.
          </p>
        </div>

        <details className="workflow-disclosure">
          <summary>How your issue and files are handled</summary>
          <p>When you submit, your selected files and optional issue description are sent to the FirstPatch AI backend and then to OpenRouter for analysis. Files are validated and processed in memory; they are not executed. Keep the OpenRouter API key on the backend server.</p>
        </details>

        {/* Workspace Panel */}
        <div className={`workspace-card${isLoading ? ' workspace-card-loading' : ''}`}>
          {/* Toolbar */}
          <div className="workspace-toolbar">
            <div className="toolbar-title">
              <span className="dot dot-violet"></span>
              <span>New analysis</span>
            </div>
            <div className="toolbar-actions">
              <button
                type="button"
                className="btn-toolbar"
                onClick={handleLoadSample}
                title="Fill with a sample issue and source file"
                disabled={isLoading}
              >
                <span>Load Sample</span>
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
            {/* Primary action: understand uploaded source files. */}
            <div className="form-group file-upload-group">
              <div className="label-row">
                <label className="input-label" htmlFor="file-input">
                  Source files <span className="label-optional">(Required)</span>
                </label>
                <span className="file-constraints">{uploadLimits ? `Up to ${uploadLimits.max_files} files · ${formatBytes(uploadLimits.max_file_size_bytes)} each · ${formatBytes(uploadLimits.max_combined_upload_size_bytes)} total` : 'Loading upload limits…'}</span>
              </div>
              <p id="file-upload-help" className="form-help">
                Upload the source files you want explained. You can start even when you do not know what problem to look for. Add an issue description only if you want to focus the investigation. Uploaded code is never executed.
              </p>

              <div
                className={`dropzone-container ${isDragging ? 'dragging' : ''}${limitsError ? ' is-unavailable' : ''}`}
                onClick={() => {
                  if (!isLoading && uploadLimits && !limitsError) fileInputRef.current?.click();
                }}
                onDragOver={(e) => { e.preventDefault(); if (uploadLimits && !limitsError) setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                role="button"
                tabIndex={0}
                aria-label="Upload source files — click or drag and drop"
                aria-describedby={clientValidationError ? 'file-upload-help file-validation-error' : 'file-upload-help'}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !isLoading && uploadLimits && !limitsError) {
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
                  accept={acceptedExtensions}
                  aria-describedby={clientValidationError ? 'file-upload-help file-validation-error' : 'file-upload-help'}
                  disabled={isLoading || !uploadLimits || Boolean(limitsError)}
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
                  <span className="dropzone-secondary">{uploadLimits
                    ? `${uploadLimits.max_files} files max · ${formatBytes(uploadLimits.max_file_size_bytes)} per file · ${formatBytes(uploadLimits.max_combined_upload_size_bytes)} total · ${acceptedExtensions}`
                    : 'Retrieving current server upload requirements…'}</span>
                </div>
              </div>

              {limitsError && <div className="validation-error" role="alert">{limitsError} File upload is paused until the server requirements load.</div>}

              {uploadLimits && <div className="upload-usage" role="status" aria-live="polite">
                <span><strong>{selectedFiles.length}</strong> / {uploadLimits.max_files} files selected</span>
                <span><strong>{formatBytes(selectedTotalBytes)}</strong> / {formatBytes(uploadLimits.max_combined_upload_size_bytes)} upload total</span>
                <span className={selectedTotalBytes > uploadLimits.max_analysis_source_bytes ? 'upload-usage-warning' : ''}><strong>{formatBytes(selectedTotalBytes)}</strong> / {formatBytes(uploadLimits.max_analysis_source_bytes)} model context budget</span>
              </div>}

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
                        ({formatBytes(file.size)})
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
                <div id="file-validation-error" className="validation-error" role="alert">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {clientValidationError}
                </div>
              )}
            </div>

            {/* Optional issue context */}
            <div className="form-group issue-context-group">
              <div className="label-row">
                <label htmlFor="issue-description" className="input-label">
                  Describe a problem <span className="label-optional">(Optional)</span>
                </label>
                <span className="character-count">{formatBytes(issueDescriptionBytes)} / {formatBytes(uploadLimits?.max_issue_description_bytes ?? 0)}</span>
              </div>
              <p id="issue-description-help" className="form-help">
                Have a specific issue? Add what you expected, what happened, and how to reproduce it. You can leave this blank to understand the uploaded code.
              </p>
              <textarea
                id="issue-description"
                className="issue-textarea"
                rows={5}
                placeholder="Optional: paste a bug report or describe what you want to investigate."
                value={issueText}
                aria-describedby="issue-description-help"
                onChange={(e) => {
                  setIssueText(e.target.value);
                  clearErrorOnEdit();
                }}
                disabled={isLoading}
              />
              {issueDescriptionError && <div className="validation-error" role="alert">{issueDescriptionError}</div>}
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
              {isLoading && <div className="analysis-loading-track" role="progressbar" aria-label="Analysis request in progress"><span /></div>}
              <div className="footer-status">
                <span
                  className={`status-indicator ${isLoading ? 'status-loading' : requestState === 'success' ? 'status-success' : requestState === 'error' ? 'status-error' : ''}`}
                ></span>
                <span role="status" aria-live="polite">
                  {isLoading
                    ? selectedFiles.length > 0
                      ? 'Reading the selected files and preparing your analysis…'
                      : 'Preparing your issue analysis…'
                    : requestState === 'success'
                    ? 'Analysis returned successfully'
                    : requestState === 'error'
                    ? 'Request failed'
                    : selectedFiles.length > 0
                      ? 'Ready to understand selected code'
                      : 'Upload source files to begin; issue description is optional'}
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
                    <span>Analyzing…</span>
                  </>
                ) : (
                  <>
                    <span>{requestState === 'error' && retryAllowed
                      ? retryAfterSeconds && retryAfterSeconds > 0 ? `Retry in ${retryAfterSeconds}s` : 'Retry analysis'
                      : selectedFiles.length > 0 ? 'Understand this code' : 'Analyze this issue'}</span>
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
