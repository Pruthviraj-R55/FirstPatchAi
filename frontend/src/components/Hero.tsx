import React from 'react';
import '../styles/Hero.css';

interface HeroProps {
  onNavigate: (destination: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigate }) => {

  const scrollToHowItWorks = () => {
    const element = document.getElementById('how-it-works');
    if (element) {
      element.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    }
  };

  return (
    <section className="hero-section" aria-labelledby="hero-headline">
      <div className="hero-container">
        {/* Release / Status Badge */}
        <div className="hero-badge">
          <span className="badge-dot"></span>
          <span className="badge-text">A clearer way into unfamiliar code</span>
        </div>

        {/* Primary Headline */}
        <h1 id="hero-headline" className="hero-title">
          Understand unfamiliar code. <span className="text-gradient">Find your starting point.</span>
        </h1>

        {/* Description */}
        <p className="hero-subtitle">
          Upload the files you want to understand. FirstPatch AI explains their purpose, surfaces potential problems, and suggests where to investigate. No issue description required.
        </p>

        {/* Action Buttons */}
        <div className="hero-actions">
          <a
            className="btn-primary"
            href="/analyze"
            onClick={(event) => { event.preventDefault(); onNavigate('/analyze'); }}
            id="hero-cta-workspace"
          >
            <span>Understand selected files</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
          <a
            className="btn-secondary" 
            href="#how-it-works"
            onClick={(event) => { event.preventDefault(); scrollToHowItWorks(); }}
            id="hero-cta-how-it-works"
          >
            <span>See how it works</span>
          </a>
        </div>

        {/* Feature Highlights Banner */}
        <div className="hero-highlights" aria-label="Key highlights">
          <div className="highlight-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a8c0b2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            <span>Plain-language file explanations</span>
          </div>
          <div className="highlight-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d9b18d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>Evidence-backed potential problems</span>
          </div>
          <div className="highlight-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a8c0b2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            <span>Investigation steps and test ideas</span>
          </div>
        </div>
      </div>
    </section>
  );
};
