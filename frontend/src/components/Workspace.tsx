import React, { useState } from 'react';
import '../styles/Workspace.css';

export const Workspace: React.FC = () => {
  const [issueText, setIssueText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Example pre-fill for user demonstration
  const handleLoadSample = () => {
    setIssueText(
      "Fix TypeError when validate_username() receives None or non-string input. " +
      "Currently in username_validator.py, passing None crashes with an unhandled exception " +
      "rather than returning False or raising a descriptive validation error."
    );
    setUploadedFiles(['username_validator.py']);
  };

  const handleClear = () => {
    setIssueText('');
    setUploadedFiles([]);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const names = Array.from(e.dataTransfer.files).map(f => f.name);
      setUploadedFiles(prev => Array.from(new Set([...prev, ...names])));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const names = Array.from(e.target.files).map(f => f.name);
      setUploadedFiles(prev => Array.from(new Set([...prev, ...names])));
    }
  };

  const removeFile = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(f => f !== fileName));
  };

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

        {/* Prototype Warning Banner */}
        <div className="prototype-notice-banner" role="status">
          <div className="notice-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </div>
          <div className="notice-content">
            <strong>Frontend Visual Prototype:</strong> This interface demonstrates the upcoming React client for FirstPatch AI. The live model analyzer and file validation are not connected to this static frontend yet; files and issue text remain local in your browser and are not uploaded anywhere.
          </div>
        </div>

        {/* Workspace Panel */}
        <div className="workspace-card">
          {/* Card Header Toolbar */}
          <div className="workspace-toolbar">
            <div className="toolbar-title">
              <span className="dot dot-violet"></span>
              <span>Issue Context & Source Inspector</span>
            </div>
            <div className="toolbar-actions">
              <button 
                type="button" 
                className="btn-toolbar" 
                onClick={handleLoadSample}
                title="Fill with a realistic open-source bug example"
              >
                <span>Load Sample Issue</span>
              </button>
              {(issueText || uploadedFiles.length > 0) && (
                <button 
                  type="button" 
                  className="btn-toolbar text-danger" 
                  onClick={handleClear}
                >
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          <div className="workspace-body">
            {/* 1. Issue Description Input */}
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
                onChange={(e) => setIssueText(e.target.value)}
              />
            </div>

            {/* 2. File Upload Dropzone */}
            <div className="form-group">
              <div className="label-row">
                <label className="input-label">
                  2. Codebase Files <span className="label-optional">(Optional)</span>
                </label>
                <span className="file-constraints">Max 200 KB combined • 12 supported extensions</span>
              </div>

              <div 
                className={`dropzone-container ${isDragging ? 'dragging' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
              >
                <input
                  type="file"
                  id="file-input"
                  className="hidden-file-input"
                  multiple
                  onChange={handleFileSelect}
                  accept=".py,.js,.ts,.java,.c,.cpp,.md,.txt,.json,.yml,.yaml,.toml"
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
                    <label htmlFor="file-input" className="file-browse-link">
                      Browse files
                    </label>
                    {' '}or drag & drop code files here
                  </span>
                  <span className="dropzone-secondary">
                    Supported: .py, .js, .ts, .java, .c, .cpp, .md, .txt, .json, .yml, .yaml, .toml
                  </span>
                </div>
              </div>

              {/* Uploaded Files Chips */}
              {uploadedFiles.length > 0 && (
                <div className="uploaded-files-list" aria-label="Attached files list">
                  {uploadedFiles.map((filename) => (
                    <div key={filename} className="file-chip">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      <span className="chip-name">{filename}</span>
                      <button 
                        type="button" 
                        className="btn-remove-chip"
                        onClick={() => removeFile(filename)}
                        aria-label={`Remove ${filename}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="workspace-footer">
              <div className="footer-status">
                <span className="status-indicator"></span>
                <span>Ready for analysis • Preview Mode</span>
              </div>

              <button 
                type="button" 
                className="btn-analyze-disabled" 
                disabled
                title="Analysis is not connected to this static frontend prototype"
                aria-disabled="true"
              >
                <span>Analyze Issue (Prototype Preview)</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
