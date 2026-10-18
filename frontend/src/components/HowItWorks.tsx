import React from 'react';
import '../styles/HowItWorks.css';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: '01',
      title: 'Describe the GitHub Issue',
      description: 'Paste any bug report, user issue description, or feature request from an open-source repository.',
      details: 'FirstPatch AI extracts the core problem statement, error traces, and expected behavior.',
      accent: 'violet'
    },
    {
      number: '02',
      title: 'Provide Relevant Source Files',
      description: 'Upload candidate code files from the project repository to provide context for the issue.',
      details: 'Files are validated in-memory under strict 200 KB limits with zero disk writes and no arbitrary execution.',
      accent: 'blue'
    },
    {
      number: '03',
      title: 'Review Structured Contribution Plan',
      description: 'Receive an actionable 5-part roadmap including problem summary, file mapping, steps, and tests.',
      details: 'Gemma models generate verified JSON guidance designed to give beginner contributors total confidence.',
      accent: 'emerald'
    }
  ];

  return (
    <section id="how-it-works" className="how-section" aria-labelledby="how-heading">
      <div className="section-container">
        <div className="section-header">
          <div className="section-badge">Simple 3-Step Flow</div>
          <h2 id="how-heading" className="section-title">
            How FirstPatch AI Works
          </h2>
          <p className="section-description">
            A secure, predictable workflow built to guide new contributors from confusion to their first approved pull request.
          </p>
        </div>

        {/* 3 Step Cards Grid */}
        <div className="steps-grid">
          {steps.map((step) => (
            <div key={step.number} className="step-card">
              <div className="step-top-row">
                <span className={`step-badge step-badge-${step.accent}`}>
                  Step {step.number}
                </span>
                <span className="step-watermark">{step.number}</span>
              </div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.description}</p>
              <div className="step-detail-box">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>{step.details}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Integration Status Clarification */}
        <div className="how-status-callout">
          <span className="status-dot-pulse"></span>
          <span>
            <strong>Architecture Notice:</strong> The Python backend (Streamlit + Gemma 4 via official <code>google-genai</code> SDK) is fully tested. This React frontend represents Stage 1 (visual UI foundation) and is not yet connected to the backend API.
          </span>
        </div>
      </div>
    </section>
  );
};
