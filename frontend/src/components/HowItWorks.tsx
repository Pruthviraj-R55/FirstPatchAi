import React from 'react';
import '../styles/HowItWorks.css';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: '01',
      title: 'Upload selected source files',
      description: 'Choose the files you want to understand. You can start even when you are unsure what is wrong.',
      details: 'Only uploaded files are analyzed. They are validated in memory and never executed.',
      accent: 'violet'
    },
    {
      number: '02',
      title: 'Add an issue if you have one',
      description: 'Describe a specific symptom as optional context to focus the investigation.',
      details: 'Without an issue, FirstPatch AI focuses on file understanding and evidence-backed potential problems.',
      accent: 'blue'
    },
    {
      number: '03',
      title: 'Review understanding and next steps',
      description: 'Explore file explanations, potential problems, contribution steps, test ideas, and unknowns.',
      details: 'Observed behavior is separated from inferred risk. Suggested tests are not run.',
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
            A focused workflow from selected files to a clearer mental model and a place to begin.
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
            <strong>Built for a focused first patch:</strong> The FastAPI service validates every request and returns a structured plan. Uploaded files are processed in memory and never executed.
          </span>
        </div>
      </div>
    </section>
  );
};
