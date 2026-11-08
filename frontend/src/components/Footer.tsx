import React from 'react';
import '../styles/Footer.css';

interface FooterProps {
  onNavigate: (destination: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const follow = (event: React.MouseEvent<HTMLAnchorElement>, destination: string) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onNavigate(destination);
  };

  return (
    <footer className="footer-root">
      <div className="footer-container">
        <div className="footer-main">
          <div className="footer-brand-col">
            <a className="footer-brand" href="/" onClick={(event) => follow(event, '/')} aria-label="FirstPatch AI home">
              <span className="logo-symbol-sm" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 17L10 11L4 5" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 19H20" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </span>
              <span className="brand-name">FirstPatch <span className="brand-accent">AI</span></span>
            </a>
            <p className="footer-tagline">A practical starting point for understanding an open-source issue and planning a first contribution.</p>
          </div>

          <div className="footer-links-col">
            <h2 className="footer-heading">Navigate</h2>
            <ul className="footer-links-list">
              <li><a href="/" onClick={(event) => follow(event, '/')}>Home</a></li>
              <li><a href="/#how-it-works" onClick={(event) => follow(event, '/#how-it-works')}>How it works</a></li>
              <li><a href="/#features" onClick={(event) => follow(event, '/#features')}>Capabilities</a></li>
              <li><a href="/analyze" onClick={(event) => follow(event, '/analyze')}>Understand code</a></li>
              <li><a href="/learn" onClick={(event) => follow(event, '/learn')}>Learn Git & GitHub</a></li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h2 className="footer-heading">The workflow</h2>
            <ul className="footer-links-list footer-tech-notes">
              <li><span>Issue summary and relevant files</span></li>
              <li><span>Contribution plan and suggested tests</span></li>
              <li><span>Uncertainties to verify in the repository</span></li>
              <li><span>Uploaded source files are not executed</span></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">FirstPatch AI · Open-source contribution guidance</p>
          <span className="footer-stage-badge">Built for first patches</span>
        </div>
      </div>
    </footer>
  );
};
