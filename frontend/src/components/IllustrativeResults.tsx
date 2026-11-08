import React from 'react';
import type { AnalysisResult } from '../types/api';
import { ContributionReadiness } from './ContributionReadiness';
import { GuidedContribution } from './GuidedContribution';
import '../styles/IllustrativeResults.css';

// ─── Props ────────────────────────────────────────────────────────────────────

interface IllustrativeResultsProps {
  /** Live analysis result from the backend, or null when no request has succeeded. */
  result: AnalysisResult | null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const IllustrativeResults: React.FC<IllustrativeResultsProps> = ({ result }) => {
  if (!result) {
    return (
      <section id="illustrative-preview" className="results-section" aria-labelledby="preview-heading">
        <div className="section-container">
          <div className="section-header results-heading">
            <div className="section-badge">Analysis results</div>
            <h2 id="preview-heading" className="section-title">Analysis results</h2>
            <p className="section-description">Code explanations, potential problems, and contribution guidance will appear here after analysis.</p>
          </div>
          <div className="results-empty-state" role="status">
            <div className="empty-state-mark" aria-hidden="true">//</div>
            <div>
              <h3>Your results will appear here</h3>
              <p>Upload selected source files to understand unfamiliar code. Add an optional issue description to focus the investigation.</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const data: AnalysisResult = result;
  const fileExplanations = data.file_explanations ?? [];
  const potentialIssues = data.potential_issues ?? [];
  const missingContext = data.missing_context ?? [];

  return (
    <section
      id="illustrative-preview"
      className="results-section"
      aria-labelledby="preview-heading"
    >
      <div className="section-container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-badge"><span className="badge-live-dot"></span>Live analysis</div>
          <h2 id="preview-heading" className="section-title">
            Analysis results
          </h2>
          <p className="section-description">
            Review the analysis, confirm assumptions against the repository, and adapt the suggested steps before you contribute.
          </p>
        </div>

        <div className="live-result-banner" role="note">
          <div className="disclaimer-body">
            <strong>AI-generated guidance</strong>
            <span>Suggestions may be incomplete or incorrect. Verify file paths and behavior in the repository before you contribute.</span>
          </div>
        </div>

        {data.project_overview && (
          <section className="result-card investigation-overview" aria-labelledby="project-overview-heading">
            <div className="card-header">
              <div className="card-tag tag-violet"><span>Project understanding</span></div>
              <span className="field-type">Selected files only</span>
            </div>
            <div className="card-body">
              <h3 id="project-overview-heading">What this code appears to do</h3>
              <p className="summary-text">{data.project_overview}</p>
              <p className="scope-note">This explanation is based only on the files you uploaded. It does not represent a full-repository analysis.</p>
            </div>
          </section>
        )}

        <section className="result-card file-explanations-card" aria-labelledby="file-explanations-heading">
          <div className="card-header">
            <div className="card-tag tag-blue"><span>File explanations</span></div>
            <span className="field-type">{fileExplanations.length} file{fileExplanations.length === 1 ? '' : 's'} explained</span>
          </div>
          <div className="card-body">
            <h3 id="file-explanations-heading">Understand the supplied files</h3>
            {fileExplanations.length ? (
              <div className="explanation-list">
                {fileExplanations.map((file) => (
                  <article className="explanation-item" key={file.filename}>
                    <h4><code>{file.filename}</code></h4>
                    <p>{file.purpose}</p>
                    {file.important_elements.length > 0 && (
                      <div className="important-elements">
                        <strong>Important functions, classes, or logic</strong>
                        <ul>{file.important_elements.map((item, index) => <li key={`${file.filename}-${index}`}>{item}</li>)}</ul>
                      </div>
                    )}
                    <p className="relationship-note"><strong>Relationship:</strong> {file.relationships}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="empty-state">File-specific explanations were not returned. Review the supplied code directly and use the overview as limited context.</p>
            )}
          </div>
        </section>

        <section className="result-card potential-issues-card" aria-labelledby="potential-issues-heading">
          <div className="card-header">
            <div className="card-tag tag-amber"><span>Potential problem discovery</span></div>
            <span className="field-type">Evidence-led · no confidence scores</span>
          </div>
          <div className="card-body">
            <h3 id="potential-issues-heading">Things to inspect</h3>
            {potentialIssues.length ? (
              <div className="potential-issue-list">
                {potentialIssues.map((issue, index) => (
                  <article className="potential-issue-item" key={`${issue.filename}-${issue.location}-${index}`}>
                    <div className="finding-meta">
                      <span className={`finding-assessment ${issue.assessment}`}>{issue.assessment === 'observed' ? 'Observed behavior' : 'Inferred risk'}</span>
                      {issue.filename && <code>{issue.filename}</code>}
                      <span>{issue.location}</span>
                    </div>
                    <h4>{issue.title}</h4>
                    <p><strong>Evidence:</strong> {issue.evidence}</p>
                    <p><strong>Why it matters:</strong> {issue.why_it_matters}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="empty-state">No specific potential problem was identified in the supplied files. This does not prove the code is defect-free.</p>
            )}
          </div>
        </section>

        <section className="result-card missing-context-card" aria-labelledby="missing-context-heading">
          <div className="card-header">
            <div className="card-tag tag-rose"><span>Evidence and uncertainty</span></div>
          </div>
          <div className="card-body">
            <h3 id="missing-context-heading">Context that could clarify the analysis</h3>
            {missingContext.length ? (
              <ul className="uncertainties-list">{missingContext.map((item, index) => <li key={index}>{item}</li>)}</ul>
            ) : (
              <p className="empty-state">No additional context was requested. Verify the analysis against the rest of the repository and its runtime behavior.</p>
            )}
          </div>
        </section>

        {/* Keep every analysis field visible together; filters previously hid important context. */}
        <div className="cards-grid">

          {/* Card 1: Summary */}
            <div className="result-card card-span-full">
              <div className="card-header">
                <div className="card-tag tag-violet">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  <span>Analysis Summary</span>
                </div>
                <span className="field-type">Type: String</span>
              </div>
              <div className="card-body">
                {data.issue_summary ? (
                  <p className="summary-text">{data.issue_summary}</p>
                ) : (
                  <p className="summary-text empty-state">No summary was provided.</p>
                )}
              </div>
            </div>

          {/* Card 2: Relevant Files */}
            <div className="result-card card-span-full">
              <div className="card-header">
                <div className="card-tag tag-blue">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span>2. Relevant Files</span>
                </div>
                <span className="field-type">
                  {data.relevant_files.length} File{data.relevant_files.length !== 1 ? 's' : ''} Identified
                </span>
              </div>
              <div className="card-body">
                {data.relevant_files.length > 0 ? (
                  <div className="file-items-list">
                    {data.relevant_files.map((rf) => (
                      <div key={rf.filename} className="file-item-card">
                        <div className="file-item-header">
                          <span className="file-code-name">{rf.filename}</span>
                          <span className="file-badge">Relevant</span>
                        </div>
                        <p className="file-item-reason">{rf.reason}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-state">No specific files were identified as relevant.</p>
                )}
              </div>
            </div>

          {/* Card 3: Contribution Plan */}
            <div className="result-card card-half">
              <div className="card-header">
                <div className="card-tag tag-emerald">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 11 12 14 22 4"/>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                  <span>3. Contribution Plan</span>
                </div>
                <span className="field-type">{data.contribution_plan.length} Actionable Steps</span>
              </div>
              <div className="card-body">
                <GuidedContribution steps={data.contribution_plan} />
              </div>
            </div>

          {/* Card 4: Suggested Tests */}
            <div className="result-card card-half">
              <div className="card-header">
                <div className="card-tag tag-amber">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 2v7.31"/><path d="M14 9.3V1.99"/>
                    <path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/>
                  </svg>
                  <span>4. Suggested Tests</span>
                </div>
                <span className="field-type">{data.suggested_tests.length} Test Cases</span>
              </div>
              <div className="card-body">
                <p className="suggested-not-run">Suggestions only. FirstPatch AI has not executed these tests.</p>
                {data.suggested_tests.length > 0 ? (
                  <ul className="tests-list">
                    {data.suggested_tests.map((test, i) => (
                      <li key={i}>{test}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-state">No test suggestions were provided.</p>
                )}
              </div>
            </div>

          {/* Card 5: Uncertainties */}
            <div className="result-card card-span-full">
              <div className="card-header">
                <div className="card-tag tag-rose">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span>5. Uncertainties &amp; Limitations</span>
                </div>
                <span className="field-type">Assumptions to Verify</span>
              </div>
              <div className="card-body">
                {data.uncertainties.length > 0 ? (
                  <ul className="uncertainties-list">
                    {data.uncertainties.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-state">No uncertainties or assumptions were flagged.</p>
                )}
              </div>
            </div>

          <ContributionReadiness result={data} />
        </div>
      </div>
    </section>
  );
};
