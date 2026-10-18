import React from 'react';
import '../styles/Footer.css';

export const Footer: React.FC = () => {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="footer-root">
      <div className="footer-container">
        <div className="footer-main">
          {/* Brand Info */}
          <div className="footer-brand-col">
            <div className="footer-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="logo-symbol-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 17L10 11L4 5" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 19H20" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="brand-name">
                FirstPatch <span className="brand-accent">AI</span>
              </span>
            </div>
            <p className="footer-tagline">
              An intelligent assistant designed to help beginners understand open-source issues, navigate codebases, and prepare their first pull requests with confidence.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="footer-links-col">
            <h4 className="footer-heading">Navigation</h4>
            <ul className="footer-links-list">
              <li><button onClick={() => scrollTo('workspace')}>Analysis Workspace</button></li>
              <li><button onClick={() => scrollTo('illustrative-preview')}>Sample Roadmap</button></li>
              <li><button onClick={() => scrollTo('how-it-works')}>How It Works</button></li>
              <li><button onClick={() => scrollTo('features')}>Core Architecture</button></li>
            </ul>
          </div>

          {/* Safety & Design Notes */}
          <div className="footer-links-col">
            <h4 className="footer-heading">Architecture</h4>
            <ul className="footer-links-list footer-tech-notes">
              <li><span>Powered by Google Gemma 4</span></li>
              <li><span>Official google-genai SDK</span></li>
              <li><span>Zero Disk Writes & UTF-8 Safe</span></li>
              <li><span>React + Vite Frontend Foundation</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p className="footer-copy">
            FirstPatch AI • Open-Source Contribution Onboarding Assistant
          </p>
          <span className="footer-stage-badge">Stage 1 Frontend Prototype</span>
        </div>
      </div>
    </footer>
  );
};
