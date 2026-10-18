import React, { useState, useEffect } from 'react';
import '../styles/Navbar.css';

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className={`navbar-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Brand Logo */}
        <div className="navbar-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="logo-symbol">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 17L10 11L4 5" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 19H20" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="brand-name">
            FirstPatch <span className="brand-accent">AI</span>
          </span>
          <span className="badge-preview">Prototype</span>
        </div>

        {/* Desktop Nav Links */}
        <nav className="navbar-nav" aria-label="Main Navigation">
          <button className="nav-link" onClick={() => scrollToSection('features')}>
            Features
          </button>
          <button className="nav-link" onClick={() => scrollToSection('how-it-works')}>
            How It Works
          </button>
          <button className="nav-link" onClick={() => scrollToSection('illustrative-preview')}>
            Preview
          </button>
        </nav>

        {/* Right CTA */}
        <div className="navbar-actions">
          <button 
            className="btn-get-started" 
            onClick={() => scrollToSection('workspace')}
            aria-label="Scroll to analysis workspace"
          >
            <span>Open Workspace</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Mobile Menu Toggle */}
          <button 
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
          >
            <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`}></span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer" role="dialog" aria-modal="true">
          <button className="mobile-nav-link" onClick={() => scrollToSection('features')}>
            Features
          </button>
          <button className="mobile-nav-link" onClick={() => scrollToSection('how-it-works')}>
            How It Works
          </button>
          <button className="mobile-nav-link" onClick={() => scrollToSection('illustrative-preview')}>
            Preview
          </button>
          <button className="btn-get-started mobile-cta" onClick={() => scrollToSection('workspace')}>
            <span>Open Workspace</span>
          </button>
        </div>
      )}
    </header>
  );
};
