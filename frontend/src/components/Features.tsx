import React from 'react';
import '../styles/Features.css';

export const Features: React.FC = () => {
  return (
    <section id="features" className="features-section" aria-labelledby="features-heading">
      <div className="section-container">
        <div className="section-header">
          <div className="section-badge">Core Architecture</div>
          <h2 id="features-heading" className="section-title">
            Engineered for Beginners & Safety
          </h2>
          <p className="section-description">
            FirstPatch AI combines modern Gen AI reasoning with defensive engineering to keep local environments completely safe.
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
            <h3 className="bento-title">Prompt Injection Defense & Untrusted Data Boundaries</h3>
            <p className="bento-desc">
              All user-submitted issue descriptions and uploaded files are wrapped within strict XML-demarcated untrusted boundaries. The analyzer strictly commands the model never to execute commands or follow instructions embedded inside the codebase.
            </p>
            <div className="bento-code-preview">
              <code>&lt;issue_description&gt; untrusted user content &lt;/issue_description&gt;</code>
            </div>
          </div>

          {/* Card 2: Medium Feature (Span 5) */}
          <div className="bento-card bento-span-5">
            <div className="bento-icon-wrapper icon-blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h3 className="bento-title">Zero Disk Writes</h3>
            <p className="bento-desc">
              Uploaded files are validated and decoded entirely in memory. The system never executes code, writes scripts to disk, or alters repository state.
            </p>
            <div className="bento-badge-group">
              <span className="mini-badge">Max 200 KB</span>
              <span className="mini-badge">12 Extensions</span>
              <span className="mini-badge">UTF-8 Guarded</span>
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
            <h3 className="bento-title">Gemma 4 Reasoning</h3>
            <p className="bento-desc">
              Powered by Google's open-weights Gemma 4 models (e.g., <code>gemma-4-26b-a4b-it</code>), delivering deep code comprehension, structural analysis, and step-by-step guidance.
            </p>
            <div className="bento-badge-group">
              <span className="mini-badge">Official google-genai SDK</span>
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
            <h3 className="bento-title">5-Field Structured Contribution Roadmap</h3>
            <p className="bento-desc">
              Never outputs arbitrary text or fabricated files. Validates strict JSON output with issue summary, file mapping, numbered implementation steps, suggested test cases, and explicit uncertainties.
            </p>
            <div className="bento-badge-group">
              <span className="mini-badge">Strict JSON Schema</span>
              <span className="mini-badge">File Hallucination Prevention</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
