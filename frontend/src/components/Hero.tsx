import React from 'react';
import '../styles/Hero.css';

export const Hero: React.FC = () => {
  const scrollToWorkspace = () => {
    const element = document.getElementById('workspace');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToHowItWorks = () => {
    const element = document.getElementById('how-it-works');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="hero-section" aria-labelledby="hero-headline">
      {/* Restrained CSS Spotlight */}
      <div className="hero-spotlight" aria-hidden="true"></div>

      <div className="hero-container">
        {/* Release / Status Badge */}
        <div className="hero-badge">
          <span className="badge-dot"></span>
          <span className="badge-text">Gemma 4 Powered • Open-Source Onboarding</span>
        </div>

        {/* Primary Headline */}
        <h1 id="hero-headline" className="hero-title">
          Your first open-source contribution <span className="text-gradient">starts here.</span>
        </h1>

        {/* Description */}
        <p className="hero-subtitle">
          FirstPatch AI helps newcomers break down intimidating GitHub issues,
          locate the exact files that need changes, and follow a clear, actionable
          plan to submit their very first pull request with confidence.
        </p>

        {/* Action Buttons */}
        <div className="hero-actions">
          <button 
            className="btn-primary" 
            onClick={scrollToWorkspace}
            id="hero-cta-workspace"
          >
            <span>Try Analysis Workspace</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button 
            className="btn-secondary" 
            onClick={scrollToHowItWorks}
            id="hero-cta-how-it-works"
          >
            <span>How It Works</span>
          </button>
        </div>

        {/* Feature Highlights Banner */}
        <div className="hero-highlights" aria-label="Key highlights">
          <div className="highlight-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            <span>Actionable 5-Part Roadmaps</span>
          </div>
          <div className="highlight-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>Zero Disk Writes & No Code Execution</span>
          </div>
          <div className="highlight-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            <span>12 Programming Languages</span>
          </div>
        </div>
      </div>
    </section>
  );
};
