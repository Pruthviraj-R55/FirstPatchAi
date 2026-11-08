import React from 'react';
import '../styles/Features.css';

export const Features: React.FC = () => {
  return (
    <section id="features" className="features-section" aria-labelledby="features-heading">
      <div className="section-container">
        <div className="section-header">
          <div className="section-badge">What the analysis covers</div>
          <h2 id="features-heading" className="section-title">
            Understand the files before you make a change.
          </h2>
          <p className="section-description">
            Get a plain-language explanation of selected files, evidence-led potential problems, and beginner-friendly investigation steps. Verify the guidance against the project itself.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="bento-grid">
          {/* Card 1: Large Feature (Span 7) */}
          <div className="bento-card bento-span-7">
            <div className="bento-icon-wrapper icon-violet">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h3 className="bento-title">Understand the supplied code</h3>
            <p className="bento-desc">
              Upload source files to learn their apparent purpose, key logic, and how the selected files relate to one another. Add an issue description only when you have a specific problem to investigate.
            </p>
            <div className="bento-code-preview">
              <code>Selected files → Explanation and evidence</code>
            </div>
          </div>

          {/* Card 2: Medium Feature (Span 5) */}
          <div className="bento-card bento-span-5">
            <div className="bento-icon-wrapper icon-blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h3 className="bento-title">Surface potential problems</h3>
            <p className="bento-desc">
              Review suspicious logic and inferred risks with supporting evidence, practical impact, and missing context where available. A hypothesis is not a confirmed bug.
            </p>
            <div className="bento-badge-group">
              <span className="mini-badge">Observed vs inferred</span>
              <span className="mini-badge">Evidence-led</span>
            </div>
          </div>

          {/* Card 3: Medium Feature (Span 5) */}
          <div className="bento-card bento-span-5">
            <div className="bento-icon-wrapper icon-cyan">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6"/>
                <polyline points="8 6 2 12 8 18"/>
              </svg>
            </div>
            <h3 className="bento-title">Keep the scope clear</h3>
            <p className="bento-desc">
              FirstPatch AI explains only the files you provide. If a reported issue needs code that was not uploaded, the analysis calls out that limitation.
            </p>
            <div className="bento-badge-group">
              <span className="mini-badge">Verify against your repository</span>
            </div>
          </div>

          {/* Card 4: Large Feature (Span 7) */}
          <div className="bento-card bento-span-7">
            <div className="bento-icon-wrapper icon-emerald">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <h3 className="bento-title">Plan and test the contribution</h3>
            <p className="bento-desc">
              Get an ordered contribution plan, suggested tests, and uncertainties to investigate. These are guidance only; FirstPatch AI does not modify code or run tests.
            </p>
            <div className="bento-badge-group">
              <span className="mini-badge">Contribution plan</span>
              <span className="mini-badge">Suggested tests</span>
              <span className="mini-badge">Uncertainties</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
